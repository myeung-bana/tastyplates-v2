import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user/userService';
import { HOME, REGISTER, ONBOARDING_ONE } from '@/constants/pages';
import { sessionType } from '@/constants/response';

const userService = new UserService();

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
      const redirectUrl = request.cookies.get('google_oauth_redirect')?.value || HOME;
      const authType = request.cookies.get('auth_type')?.value || 'login';
      
      // Clean up cookies
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      
      // Add error message based on auth type
      if (authType === sessionType.signup) {
        response.cookies.set('googleError', encodeURIComponent('Google sign-up was cancelled or failed.'), {
          maxAge: 60,
          sameSite: 'lax',
        });
        return response;
      } else {
        response.cookies.set('googleError', encodeURIComponent('Google sign-in was cancelled or failed.'), {
          maxAge: 60,
          sameSite: 'lax',
        });
        return response;
      }
    }
    
    if (!code) {
      return NextResponse.redirect(new URL(HOME, request.url));
    }
    
    // Get stored redirect URL and auth type
    const redirectUrl = request.cookies.get('google_oauth_redirect')?.value || HOME;
    const authType = request.cookies.get('auth_type')?.value || 'login';
    
    // Exchange authorization code for tokens
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured');
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      response.cookies.set('googleError', encodeURIComponent('Google OAuth is not configured.'), {
        maxAge: 60,
        sameSite: 'lax',
      });
      return response;
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
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      response.cookies.set('googleError', encodeURIComponent('Failed to authenticate with Google.'), {
        maxAge: 60,
        sameSite: 'lax',
      });
      return response;
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token exchange success, tokenData keys:', Object.keys(tokenData));
    const idToken = tokenData.id_token;
    
    if (!idToken) {
      console.error('No ID token in response');
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      response.cookies.set('googleError', encodeURIComponent('Failed to get Google ID token.'), {
        maxAge: 60,
        sameSite: 'lax',
      });
      return response;
    }
    
    // Call WordPress OAuth endpoint with ID token
    let result;
    try {
      result = await userService.googleOAuth(idToken);
      // Debug: surface result from WP endpoint
      console.log('userService.googleOAuth result:', result);
    } catch (error) {
      console.error('Google OAuth endpoint error:', error);
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      response.cookies.set('googleError', encodeURIComponent('Failed to authenticate with Google. Please try again.'), {
        maxAge: 60,
        sameSite: 'lax',
      });
      return response;
    }
    
    // Check for error responses from WordPress endpoint
    const resultAny = result as any;
    // 404 (user not found) is expected for signup flows, so we'll handle it in the flow below
    // But 500, 401, 403, etc. are actual errors that should be handled here
    if (resultAny?.status && resultAny.status >= 400 && resultAny.status !== 404) {
      const errorMessage = resultAny?.message || 'Google OAuth failed. Please try again.';
      console.error('WordPress OAuth endpoint error:', errorMessage, 'Status:', resultAny.status);
      
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      response.cookies.set('googleError', encodeURIComponent(errorMessage), {
        maxAge: 60,
        sameSite: 'lax',
      });
      return response;
    }
    
    // Handle 404 (user not found) for login flow - redirect to signup
    if (resultAny?.status === 404 && authType !== sessionType.signup) {
      const response = NextResponse.redirect(new URL(REGISTER, request.url));
      response.cookies.delete('google_oauth_redirect');
      response.cookies.delete('auth_type');
      response.cookies.set('googleError', encodeURIComponent('No account found. Please sign up first.'), {
        maxAge: 60,
        sameSite: 'lax',
      });
      return response;
    }
    
    // Handle based on auth type
    if (authType === sessionType.signup) {
      // For signup, check if user exists
      if (result.token && result.id) {
        // User exists - redirect to login with error
        const response = NextResponse.redirect(new URL(REGISTER, request.url));
        response.cookies.delete('google_oauth_redirect');
        response.cookies.delete('auth_type');
        response.cookies.set('googleError', encodeURIComponent('An account with this Google email already exists. Please sign in instead.'), {
          maxAge: 60,
          sameSite: 'lax',
        });
        return response;
      } else {
        // User doesn't exist - auto-register with minimal data
        try {
          const idTokenParts = idToken.split('.');
          if (idTokenParts.length === 3) {
            // Decode base64 URL-safe encoded payload
            const base64Payload = idTokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            const googleEmail = payload.email;
            const googleName = payload.name || payload.given_name || payload.family_name || '';
            const googlePicture = payload.picture || '';
            
            // Auto-generate username from Google name
            const baseUsername = googleName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'user';
            const randomSuffix = Math.floor(Math.random() * 10000);
            const username = `${baseUsername}${randomSuffix}`;
            
            // Register user with minimal data
            const registrationData = {
              email: googleEmail,
              username: username,
              password: '', // Empty for OAuth users
              googleAuth: true,
              is_google_user: true,
              // Minimal required fields - empty for now, user will fill in onboarding
              birthdate: '',
              gender: '',
              palates: [],
              profileImage: googlePicture || '', // Use Google profile picture if available
              aboutMe: '',
            };
            
            // Register the user
            const registrationResult = await userService.registerUser(registrationData);
            
            // Get user ID from registration result
            const userId = (registrationResult as any)?.id || (registrationResult as any)?.user_id;
            
            if (userId) {
              // Generate JWT token for the newly registered user
              const tokenResult = await userService.generateGoogleUserToken(userId, googleEmail);
              
              if (tokenResult.token && tokenResult.id) {
                // Store registration data in localStorage for onboarding
                const onboardingData = {
                  ...registrationData,
                  id: userId,
                  isPartialRegistration: true, // Flag to indicate user needs to complete profile
                  user_id: userId,
                };
                
                // Store token temporarily in cookies to pass to NextAuth
                const response = NextResponse.redirect(new URL(ONBOARDING_ONE, request.url));
                response.cookies.set('google_oauth_token', tokenResult.token, {
                  maxAge: 60, // Short-lived, just for passing to NextAuth
                  sameSite: 'lax',
                });
                response.cookies.set('google_oauth_user_id', String(tokenResult.id), {
                  maxAge: 60,
                  sameSite: 'lax',
                });
                response.cookies.set('google_oauth_email', tokenResult.user_email || googleEmail, {
                  maxAge: 60,
                  sameSite: 'lax',
                });
                response.cookies.set('google_oauth_pending', 'true', {
                  maxAge: 60,
                  sameSite: 'lax',
                });
                
                // Store onboarding data in a cookie that will be read by client-side
                // We'll use a special cookie that the client can read and store in localStorage
                response.cookies.set('onboarding_data', JSON.stringify(onboardingData), {
                  maxAge: 3600, // 1 hour
                  sameSite: 'lax',
                });
                
                response.cookies.delete('google_oauth_redirect');
                response.cookies.delete('auth_type');

                // Debugging: set a short-lived cookie to indicate callback reached server and succeeded
                response.cookies.set('debug_google_callback', JSON.stringify({ step: 'auto-register-success', id: tokenResult.id ? String(tokenResult.id) : null }), { maxAge: 30, sameSite: 'lax' });
                
                return response;
              }
            }
            
            // If registration or token generation failed, fall back to manual registration
            const fallbackResponse = NextResponse.redirect(new URL(`${REGISTER}?oauth=google`, request.url));
            fallbackResponse.cookies.set('google_oauth_id_token', idToken, {
              maxAge: 3600,
              sameSite: 'lax',
            });
            fallbackResponse.cookies.set('google_oauth_email', googleEmail, {
              maxAge: 3600,
              sameSite: 'lax',
            });
            fallbackResponse.cookies.delete('google_oauth_redirect');
            fallbackResponse.cookies.delete('auth_type');
            return fallbackResponse;
          }
        } catch (error) {
          console.error('Error in auto-registration:', error);
          // Fallback to manual registration on error
          try {
            const idTokenParts = idToken.split('.');
            if (idTokenParts.length === 3) {
              const base64Payload = idTokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
              const googleEmail = payload.email;
              
              const fallbackResponse = NextResponse.redirect(new URL(`${REGISTER}?oauth=google`, request.url));
              fallbackResponse.cookies.set('google_oauth_id_token', idToken, {
                maxAge: 3600,
                sameSite: 'lax',
              });
              fallbackResponse.cookies.set('google_oauth_email', googleEmail, {
                maxAge: 3600,
                sameSite: 'lax',
              });
              fallbackResponse.cookies.delete('google_oauth_redirect');
              fallbackResponse.cookies.delete('auth_type');
              return fallbackResponse;
            }
          } catch (decodeError) {
            console.error('Error decoding ID token in fallback:', decodeError);
          }
        }
        
        // Final fallback redirect
        const response = NextResponse.redirect(new URL(REGISTER, request.url));
        response.cookies.delete('google_oauth_redirect');
        response.cookies.delete('auth_type');
                response.cookies.set('debug_google_callback', JSON.stringify({ step: 'fallback-failed' }), { maxAge: 30, sameSite: 'lax' });
        response.cookies.set('googleError', encodeURIComponent('Failed to process Google account information.'), {
          maxAge: 60,
          sameSite: 'lax',
        });
        return response;
      }
    } else {
      // For login, create session if user exists
      if (result.token && result.id) {
        // Store token temporarily in cookies to pass to NextAuth
        const response = NextResponse.redirect(new URL(redirectUrl, request.url));
        response.cookies.set('google_oauth_token', result.token, {
          maxAge: 60, // Short-lived, just for passing to NextAuth
          sameSite: 'lax',
        });
        response.cookies.set('google_oauth_user_id', String(result.id), {
          maxAge: 60,
          sameSite: 'lax',
        });
        response.cookies.set('google_oauth_email', result.user_email || '', {
          maxAge: 60,
          sameSite: 'lax',
        });
        response.cookies.delete('google_oauth_redirect');
        response.cookies.delete('auth_type');
        response.cookies.set('debug_google_callback', JSON.stringify({ step: 'login-success', id: result.id ? String(result.id) : null }), { maxAge: 30, sameSite: 'lax' });
        
        // The client-side will handle the NextAuth signIn call
        // We'll add a flag to trigger it
        response.cookies.set('google_oauth_pending', 'true', {
          maxAge: 60,
          sameSite: 'lax',
        });
        
        return response;
      } else {
        // User doesn't exist - redirect to signup
        const response = NextResponse.redirect(new URL(REGISTER, request.url));
        response.cookies.delete('google_oauth_redirect');
        response.cookies.delete('auth_type');
        response.cookies.set('googleError', encodeURIComponent('No account found. Please sign up first.'), {
          maxAge: 60,
          sameSite: 'lax',
        });
        return response;
      }
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const redirectUrl = request.cookies.get('google_oauth_redirect')?.value || HOME;
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    response.cookies.delete('google_oauth_redirect');
    response.cookies.delete('auth_type');
    response.cookies.set('googleError', encodeURIComponent('An error occurred during Google authentication.'), {
      maxAge: 60,
      sameSite: 'lax',
    });
    return response;
  }
}

