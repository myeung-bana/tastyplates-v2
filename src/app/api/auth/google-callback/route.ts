import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user/userService';
import { HOME, REGISTER, ONBOARDING_ONE } from '@/constants/pages';
import { sessionType } from '@/constants/response';

const userService = new UserService();

/**
 * Helper function to create an HTML response that closes the popup window
 * Used for popup-based OAuth flow
 */
function createPopupCloseResponse(cookies: Array<{ name: string; value: string; maxAge: number }>) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Complete</title>
      <script>
        // This page runs in the popup window
        console.log('OAuth popup callback - closing window');
        
        // Close the popup window
        if (window.opener) {
          window.close();
        } else {
          // If not in popup, redirect to home
          window.location.href = '/';
        }
      </script>
    </head>
    <body>
      <p>Authentication complete. This window will close automatically...</p>
      <script>
        // Fallback: close after 1 second if automatic close doesn't work
        setTimeout(function() {
          if (window.opener) {
            window.close();
          } else {
            window.location.href = '/';
          }
        }, 1000);
      </script>
    </body>
    </html>
  `;
  
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
  
  // Set all cookies
  cookies.forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      maxAge: cookie.maxAge,
      sameSite: 'lax',
    });
  });
  
  return response;
}

/**
 * Helper function to create a popup close response with error
 */
function createPopupErrorResponse(errorMessage: string, request: NextRequest) {
  const cookiesToSet = [
    { name: 'googleError', value: encodeURIComponent(errorMessage), maxAge: 60 },
  ];
  
  const response = createPopupCloseResponse(cookiesToSet);
  response.cookies.delete('google_oauth_redirect');
  response.cookies.delete('auth_type');
  
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Debug: log incoming callback URL and params so we can confirm Google redirected correctly
    console.log('Google callback invoked:', request.url);
    console.log('Google callback search params:', Object.fromEntries(searchParams.entries()));
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      const authType = request.cookies.get('auth_type')?.value || 'login';
      
      const errorMessage = authType === sessionType.signup 
        ? 'Google sign-up was cancelled or failed.'
        : 'Google sign-in was cancelled or failed.';
      
      return createPopupErrorResponse(errorMessage, request);
    }
    
    if (!code) {
      return createPopupErrorResponse('No authorization code received from Google.', request);
    }
    
    // Get stored redirect URL and auth type
    const redirectUrl = request.cookies.get('google_oauth_redirect')?.value || HOME;
    const authType = request.cookies.get('auth_type')?.value || 'login';
    
    console.log('🔍 Callback: Retrieved auth_type from cookie:', authType);
    console.log('🔍 Callback: sessionType.signup value:', sessionType.signup);
    console.log('🔍 Callback: sessionType.login value:', sessionType.login || 'login');
    console.log('🔍 Callback: Is signup flow?', authType === sessionType.signup);
    
    // Exchange authorization code for tokens
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured');
      return createPopupErrorResponse('Google OAuth is not configured.', request);
    }
    
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const callbackUri = `${request.nextUrl.origin}/api/auth/google-callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: callbackUri,
        grant_type: 'authorization_code',
      }),
    });
    console.log('Token exchange status:', tokenResponse.status);
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.log('Token exchange error data:', errorData);
      console.error('Token exchange error:', errorData);
      return createPopupErrorResponse('Failed to authenticate with Google.', request);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token exchange success, tokenData keys:', Object.keys(tokenData));
    const idToken = tokenData.id_token;
    
    if (!idToken) {
      console.error('No ID token in response');
      return createPopupErrorResponse('Failed to get Google ID token.', request);
    }
    
    // Handle based on auth type - IMPORTANT: Check this BEFORE calling handleGoogleOAuth
    if (authType === sessionType.signup) {
      // SIGNUP FLOW - Skip handleGoogleOAuth (user doesn't exist yet)
      // Just decode token and store for frontend GraphQL mutation
      console.log('✅ SIGNUP FLOW DETECTED - Storing ID token for GraphQL registration (not calling handleGoogleOAuth)');
      
      try {
        const idTokenParts = idToken.split('.');
        if (idTokenParts.length !== 3) {
          console.error('Invalid ID token format');
          return createPopupErrorResponse('Invalid Google ID token format.', request);
        }
        
        // Decode base64 URL-safe encoded payload to get user info
        const base64Payload = idTokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        const googleEmail = payload.email;
        const googleName = payload.name || payload.given_name || payload.family_name || '';
        const googlePicture = payload.picture || '';
        
        if (!googleEmail) {
          console.error('No email in ID token payload');
          return createPopupErrorResponse('Failed to extract email from Google account.', request);
        }
        
        console.log('✅ Decoded ID token for signup:', {
          email: googleEmail,
          name: googleName,
          hasPicture: !!googlePicture,
        });
        
        // Store ID token and user info in cookies for frontend GraphQL mutation
        // Frontend will call registerUserWithGoogle mutation
        const cookiesToSet = [
          { name: 'google_oauth_id_token', value: idToken, maxAge: 300 }, // 5 minutes
          { name: 'google_oauth_pending', value: 'signup', maxAge: 300 }, // Flag for signup flow
          { name: 'google_oauth_email', value: googleEmail, maxAge: 300 },
          { name: 'google_oauth_name', value: googleName, maxAge: 300 },
          { name: 'google_oauth_picture', value: googlePicture, maxAge: 300 },
        ];
        
        console.log('✅ Stored ID token for GraphQL registration - closing popup');
        
        const response = createPopupCloseResponse(cookiesToSet);
        response.cookies.delete('google_oauth_redirect');
        response.cookies.delete('auth_type');
        
        return response;
      } catch (error) {
        console.error('Error decoding/storing ID token for signup:', error);
        return createPopupErrorResponse('Failed to process Google account information.', request);
      }
    } else {
      // LOGIN FLOW - Call handleGoogleOAuth to verify user exists and get JWT
      console.log('✅ LOGIN FLOW DETECTED - Calling handleGoogleOAuth to verify user');
      
      let result;
      try {
        result = await userService.googleOAuth(idToken);
        console.log('userService.googleOAuth result:', result);
      } catch (error) {
        console.error('Google OAuth endpoint error:', error);
        return createPopupErrorResponse('Failed to authenticate with Google. Please try again.', request);
      }
      
      // Check for error responses from WordPress endpoint
      const resultAny = result as any;
      if (resultAny?.status && resultAny.status >= 400) {
        const errorMessage = resultAny?.message || 'Google OAuth failed. Please try again.';
        console.error('WordPress OAuth endpoint error:', errorMessage, 'Status:', resultAny.status);
        
        // Special handling for 404 (user not found)
        if (resultAny.status === 404) {
          return createPopupErrorResponse('No account found. Please sign up first.', request);
        }
        
        return createPopupErrorResponse(errorMessage, request);
      }
      
      // For login, create session if user exists
      if (result.token && result.id) {
        // For popup flow: close popup and let parent handle session creation
        console.log('✅ Login successful, closing popup and passing cookies to parent');
        
        const cookiesToSet = [
          { name: 'google_oauth_token', value: result.token, maxAge: 60 },
          { name: 'google_oauth_user_id', value: String(result.id), maxAge: 60 },
          { name: 'google_oauth_email', value: result.user_email || '', maxAge: 60 },
          { name: 'google_oauth_pending', value: 'true', maxAge: 60 },
          { name: 'debug_google_callback', value: JSON.stringify({ step: 'login-success', id: String(result.id) }), maxAge: 30 },
        ];
        
        const response = createPopupCloseResponse(cookiesToSet);
        response.cookies.delete('google_oauth_redirect');
        response.cookies.delete('auth_type');
        
        return response;
      } else {
        // User doesn't exist - close popup with signup prompt
        console.log('❌ Login flow: user does not exist (no token/id in response)');
        return createPopupErrorResponse('No account found. Please sign up first.', request);
      }
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return createPopupErrorResponse('An error occurred during Google authentication.', request);
  }
}

