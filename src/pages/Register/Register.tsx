"use client";
import { useState, useEffect, Suspense } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "@/styles/pages/_auth.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { UserService } from '@/services/user/userService';
import Spinner from "@/components/common/LoadingSpinner";
import Cookies from "js-cookie";
import { removeAllCookies } from "@/utils/removeAllCookies";
import { minimumPassword } from "@/constants/validation";
import { emailOccurredError, emailRequired, invalidEmailFormat, passwordLimit, passwordsNotMatch, unexpectedError } from "@/constants/messages";
import { responseStatusCode as code, sessionType } from "@/constants/response";
import { validEmail } from "@/lib/utils";
import { HOME, ONBOARDING_ONE } from "@/constants/pages";
import { REGISTRATION_KEY } from "@/constants/session";
import { IRegisterData } from "@/interfaces/user/user";
import { signIn } from "next-auth/react";

// Note: Type definitions for Google Identity Services are in Login.tsx to avoid duplicate declarations

interface RegisterPageProps {
  onOpenSignin?: () => void;
}

const userService = new UserService()

// Component that uses useSearchParams - must be wrapped in Suspense
const RegisterContent: React.FC<RegisterPageProps> = ({ onOpenSignin }) => {
  const searchParams = useSearchParams();
  const isOAuthFlow = searchParams?.get('oauth') === 'google';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [showContinueModal, setShowContinueModal] = useState(false);

  useEffect(() => {
    const registrationData = localStorage.getItem(REGISTRATION_KEY);
    if (registrationData && JSON.parse(registrationData).isPartialRegistration) {
      setShowContinueModal(true);
    }

    const googleError = Cookies.get('googleError');
    if (googleError) {
      try {
        setError(decodeURIComponent(googleError));
      } catch {
        setError('An error occurred during authentication.');
      }
      removeAllCookies();
    }

    // Handle OAuth flow - extract email from Google ID token
    if (isOAuthFlow) {
      const idToken = Cookies.get('google_oauth_id_token');
      const accessToken = Cookies.get('google_oauth_access_token');
      
      if (idToken) {
        try {
          // Decode ID token to get email (JWT payload is base64 encoded)
          const parts = idToken.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]));
            const googleEmail = payload.email;
            const googleName = payload.name;
            
            if (googleEmail) {
              setEmail(googleEmail);
              // For OAuth users, we'll skip password requirement
              // Password will be empty and handled during registration
            }
          }
        } catch (error) {
          console.error('Error decoding Google ID token:', error);
          setError('Failed to process Google account information. Please try again.');
        }
      } else if (!accessToken) {
        // No OAuth tokens found - might be a direct access
        setError('OAuth session expired. Please try signing up with Google again.');
      }
    }
  }, [router, isOAuthFlow]);

  const checkEmailExists = async (email: string) => {
    const checkEmail = await userService.checkEmailExists(email);
    if (checkEmail.status == code.badRequest) {
      setError(String(checkEmail.message || ""));
      return false;
    }

    if (checkEmail.exists) {
      setError(String(checkEmail.message || ""));
      return false;
    }

    return true;
  }

  const validatePasswords = () => {
    let isValid = true;
    setEmailError("")
    setPasswordError("");
    setConfirmPasswordError("");

    if (password.length < minimumPassword) {
      setPasswordError(passwordLimit(minimumPassword));
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(passwordsNotMatch);
      isValid = false;
    }
    return isValid;
  };

  const validateEmail = (email: string) => {
    if (!email) return emailRequired;
    if (!validEmail(email)) return invalidEmailFormat;
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    localStorage.removeItem(REGISTRATION_KEY);

    const err = validateEmail(email);
    if (err) {
      setIsLoading(false);
      setEmailError(err);
      return;
    }

    // For OAuth flow, skip password validation (password will be empty)
    // For manual registration, validate passwords
    if (!isOAuthFlow) {
      if (!validatePasswords()) {
        setIsLoading(false);
        return;
      }
    }

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (!emailExists) {
        setIsLoading(false);
        return;
      }

      // Prepare registration data
      const registrationData: any = {
        email,
        password: isOAuthFlow ? '' : password, // Empty password for OAuth users
        googleAuth: isOAuthFlow,
        is_google_user: isOAuthFlow ? true : undefined, // Mark as Google user for WordPress
      };
      
      // Store OAuth tokens for linking after registration
      if (isOAuthFlow) {
        const accessToken = Cookies.get('google_oauth_access_token');
        const idToken = Cookies.get('google_oauth_id_token');
        if (accessToken && idToken) {
          registrationData.googleOAuthToken = accessToken;
          registrationData.googleIdToken = idToken;
          // Store redirect URL if available
          const redirectUrl = Cookies.get('google_oauth_redirect');
          if (redirectUrl) {
            registrationData.oauthRedirectUrl = redirectUrl;
          }
        }
      }
      
      // Save registration data to localStorage
      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrationData));
      router.push(ONBOARDING_ONE);
    } catch {
      setError(emailOccurredError);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  /**
   * Generate a secure random password for OAuth users
   * This password is auto-generated and never used by the user (they authenticate via Google)
   */
  const generateRandomPassword = (): string => {
    // Generate a secure random password: 24 characters with letters, numbers, and special chars
    const length = 24;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, x => charset[x % charset.length]).join('');
  };

  const handleGoogleRestRegistration = async () => {
    try {
      setIsLoading(true);

      // Get ID token and user info from cookies
      const idToken = Cookies.get('google_oauth_id_token');
      const googleEmail = Cookies.get('google_oauth_email');
      const googleName = Cookies.get('google_oauth_name');
      const googlePicture = Cookies.get('google_oauth_picture');

      if (!idToken || !googleEmail) {
        setError('Google authentication information not found. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('Registering user via REST API using Google OAuth data...');

      // Derive a username from email (backend will enforce uniqueness)
      let baseUsername = googleEmail.split('@')[0] || 'user';
      baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '');
      if (!baseUsername) {
        baseUsername = `user${Date.now()}`;
      }

      // Generate random password for OAuth user (required field, but user never uses it)
      const oauthPassword = generateRandomPassword();

      // Prepare registration payload for REST API - MINIMAL FORMAT
      // Essential fields: email, username, password (random for OAuth), is_google_user
      // Profile fields (profileImage, aboutMe, palates) can be added later via profile update
      const registrationPayload: Partial<IRegisterData> = {
        email: googleEmail,
        username: baseUsername,
        password: oauthPassword, // Random password for OAuth users (user authenticates via Google)
        is_google_user: true, // Explicitly mark as Google OAuth user - backend uses this to differentiate
        // Removed: profileImage, aboutMe, palates, googleToken, googleAuth
        // These are optional and can be added later via profile update
      };

      // Create user via REST /wp-json/wp/v2/api/users
      const registrationResult = await userService.registerUser(registrationPayload);
      const createdUser: any = registrationResult;

      const userId = createdUser?.id || createdUser?.ID;
      const username = createdUser?.username || baseUsername;
      console.log(userId, username);

      if (!userId) {
        console.error('Google REST registration: user created but ID not found in response', createdUser);
        setError('User created but ID not found. Please try signing in manually.');
        setIsLoading(false);
        // Clean up cookies
        Cookies.remove('google_oauth_id_token');
        Cookies.remove('google_oauth_email');
        Cookies.remove('google_oauth_name');
        Cookies.remove('google_oauth_picture');
        Cookies.remove('google_oauth_pending');
        return;
      }

      // Generate JWT token for this Google user using existing endpoint
      const tokenResponse = await userService.generateGoogleUserToken(userId, googleEmail);

      if (!tokenResponse || !tokenResponse.token) {
        console.error('Google REST registration: token generation failed', tokenResponse);
        setError('User created but token generation failed. Please try signing in manually.');
        setIsLoading(false);
        // Clean up cookies
        Cookies.remove('google_oauth_id_token');
        Cookies.remove('google_oauth_email');
        Cookies.remove('google_oauth_name');
        Cookies.remove('google_oauth_picture');
        Cookies.remove('google_oauth_pending');
        return;
      }

      console.log('Google REST registration successful:', {
        userId,
        hasToken: !!tokenResponse.token,
      });

      // Store registration data for onboarding - MINIMAL FORMAT
      // Only essential fields for onboarding continuation
      // Profile fields (birthdate, gender, palates, profileImage, aboutMe) can be filled during onboarding
      const onboardingData = {
        email: googleEmail,
        username,
        password: '', // OAuth users don't have passwords
        googleAuth: true,
        is_google_user: true,
        id: userId,
        isPartialRegistration: true,
        user_id: userId,
        // Removed: birthdate, gender, palates, profileImage, aboutMe
        // These can be filled during onboarding steps
      };

      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(onboardingData));

      // Set NextAuth session cookies
      Cookies.set('google_oauth_token', tokenResponse.token as string, { expires: 1 / 24, sameSite: 'lax' });
      Cookies.set('google_oauth_user_id', String(userId), { expires: 1 / 24, sameSite: 'lax' });
      Cookies.set('google_oauth_email', googleEmail, { expires: 1 / 24, sameSite: 'lax' });
      Cookies.set('google_oauth_pending', 'true', { expires: 1 / 24, sameSite: 'lax' });

      // Clean up OAuth cookies from popup
      Cookies.remove('google_oauth_id_token');
      Cookies.remove('google_oauth_name');
      Cookies.remove('google_oauth_picture');

      // Complete NextAuth session using credentials provider (oauth_token path)
      await signIn('credentials', {
        email: googleEmail,
        password: 'oauth_token',
        redirect: false,
      });

      console.log('Registration successful, redirecting to onboarding...');
      router.push(ONBOARDING_ONE);
    } catch (error: any) {
      console.error('Google REST registration error:', error);

      let errorMessage = 'An error occurred during registration.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('Registration error details (REST):', {
        message: errorMessage,
        error,
      });

      setError(errorMessage);
      setIsLoading(false);

      // Clean up cookies
      Cookies.remove('google_oauth_id_token');
      Cookies.remove('google_oauth_email');
      Cookies.remove('google_oauth_name');
      Cookies.remove('google_oauth_picture');
      Cookies.remove('google_oauth_pending');
    }
  };

  const signUpWithGoogle = async () => {
    try {
      setError("");
      setIsLoading(true);
      localStorage.removeItem(REGISTRATION_KEY);
      
      // Remove only old OAuth-related cookies (don't use removeAllCookies to preserve session)
      Cookies.remove('google_oauth_token');
      Cookies.remove('google_oauth_user_id');
      Cookies.remove('google_oauth_email');
      Cookies.remove('google_oauth_pending');
      Cookies.remove('googleError');
      Cookies.remove('onboarding_data');
      Cookies.remove('google_oauth_redirect');
      Cookies.remove('auth_type');
      
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        setError('Google OAuth is not configured.');
        setIsLoading(false);
        return;
      }
      
      // Store auth type for callback
      const redirectUri = `${window.location.origin}/api/auth/google-callback`;
      Cookies.set('google_oauth_redirect', window.location.origin, { expires: 1 / 24, sameSite: 'lax' });
      Cookies.set('auth_type', sessionType.signup, { expires: 1 / 24, sameSite: 'lax' });
      
      console.log('🔍 Register: Set auth_type cookie to:', sessionType.signup);
      
      // Build Google OAuth2 authorization URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(googleClientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      // Open Google OAuth in popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Google Sign Up',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      
      if (!popup) {
        setError('Please allow popups for this site to use Google Sign-Up.');
        setIsLoading(false);
        return;
      }
      
      // Monitor for authentication completion by polling cookies
      // This avoids COOP errors from checking popup.closed across different origins
      let popupCheckCount = 0;
      const maxChecks = 600; // 5 minutes at 500ms intervals
      
      const checkPopup = setInterval(() => {
        popupCheckCount++;
        
        // Check if authentication succeeded by looking for cookies
        const hasPendingAuth = Cookies.get('google_oauth_pending');
        const hasError = Cookies.get('googleError');
        
        if (hasError) {
          clearInterval(checkPopup);
          try {
            setError(decodeURIComponent(hasError));
          } catch {
            setError('An error occurred during authentication.');
          }
          Cookies.remove('googleError');
          setIsLoading(false);
          // Popup will close itself via callback route HTML
        } else if (hasPendingAuth === 'signup') {
          clearInterval(checkPopup);
          // OAuth completed - register user via REST API
          console.log('Google OAuth completed, registering user via REST API...');
          handleGoogleRestRegistration();
        } else if (popupCheckCount >= maxChecks) {
          // Timeout after 5 minutes
          clearInterval(checkPopup);
          setError('Google sign-up timed out. Please try again.');
          setIsLoading(false);
          // Popup will close itself via callback route HTML
        }
      }, 500);
      
    } catch (error) {
      console.error('Google sign-up error:', error);
      setError(unexpectedError);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth flex flex-col justify-center items-start">
      {isOAuthFlow && (
        <div className="w-full mb-4 px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 font-neusans">
            <p className="font-medium mb-1">Completing Google Sign-Up</p>
            <p>Please complete your profile information below to finish registration.</p>
          </div>
        </div>
      )}
      {showContinueModal ? (
        <div className="auth__container !max-w-[488px] w-full">
          <div className="auth__card !py-8 !rounded-3xl">
            <h1 className="auth__title !text-xl !font-normal text-center mb-4 font-neusans">
              Continue Registration
            </h1>
            <div className="text-center px-4">
              <p className="text-gray-700 mb-8 font-neusans">
                You have an unfinished changes. Would you like to continue where you left off?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => router.push(ONBOARDING_ONE)}
                  className="bg-[#E36B00] hover:bg-[#d36400] text-white px-6 py-2 rounded-xl text-sm font-neusans"
                >
                  Continue Registration
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(REGISTRATION_KEY);
                    setShowContinueModal(false);
                  }}
                  className="text-gray-700 hover:text-gray-900 underline text-sm font-neusans"
                >
                  Start New Registration
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={e => {
                    e.preventDefault();
                    if (onOpenSignin) onOpenSignin();
                  }}
                  className="text-sm text-[#494D5D] hover:text-[#31343F] underline font-normal font-neusans"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <Spinner size={48} className="text-[#E36B00]" />
            </div>
          )}
          <div className="auth__container !max-w-[488px] w-full overflow-y-auto md:overflow-visible">
            <h1 className="auth__title !text-sm md:!text-xl md:!leading-[30px] !font-normal py-3.5 md:py-4 !mb-0 font-neusans">Sign up</h1>
            <hr className="border-t border-[#CACACA]" />
            <div className="auth__card !px-4 md:!px-8 !pt-0 !pb-4 md:!pb-6 !rounded-none">
              <form className="auth__form !gap-3 md:!gap-4 overflow-y-auto" onSubmit={handleSubmit}>
                <div className="auth__form-group mt-6">
                  <label htmlFor="email" className="auth__label font-neusans">
                    Email
                  </label>
                  <div className="auth__input-group">
                    <input
                      type="text"
                      id="email"
                      className="auth__input font-neusans"
                      placeholder="Email"
                      autoComplete="off"
                      value={email}
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      onChange={(e) => {
                        const value = e.target.value
                        setEmail(value)
                        setEmailError(!validEmail(value) ? validateEmail(value) : "")
                      }}
                      readOnly={isOAuthFlow} // For OAuth flow, email is pre-filled and read-only
                    />
                  </div>
                  {emailError && (
                    <div className="text-red-600 text-xs font-neusans">{emailError}</div>
                  )}
                </div>
                {!isOAuthFlow && (
                  <>
                    <div className="auth__form-group">
                      <label htmlFor="password" className="auth__label font-neusans">
                        Password
                      </label>
                      <div className="auth__input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          className="auth__input font-neusans"
                          placeholder="Password"
                          autoComplete="off"
                          value={password}
                          onFocus={(e) => e.target.removeAttribute('readonly')}
                          onChange={(e) => {
                            const value = e.target.value
                            setPassword(value)
                            if (value == confirmPassword) { setConfirmPasswordError("") }
                            if (value.length >= minimumPassword) { setPasswordError("") }
                            if (value.length < minimumPassword) setPasswordError(passwordLimit(minimumPassword));
                          }}
                          readOnly // prevent autofill until focus
                        />
                        {showPassword ? (
                          <FiEye onClick={toggleShowPassword} className="auth__input-icon" />
                        ) : (
                          <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon" />
                        )}
                      </div>
                      {passwordError && (
                        <div className="text-red-600 text-xs font-neusans">{passwordError}</div>
                      )}
                    </div>
                    <div className="auth__form-group">
                      <label htmlFor="confirmPassword" className="auth__label font-neusans">
                        Confirm Password
                      </label>
                      <div className="auth__input-group">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          className="auth__input font-neusans"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => {
                            const value = e.target.value
                            setConfirmPassword(value)
                            if (password == value) { setConfirmPasswordError("") }
                            if (password != value) { setConfirmPasswordError(passwordsNotMatch) }
                          }}
                        />
                        {showConfirmPassword ? (
                          <FiEye onClick={toggleShowConfirmPassword} className="auth__input-icon" />
                        ) : (
                          <FiEyeOff onClick={toggleShowConfirmPassword} className="auth__input-icon" />
                        )}
                      </div>
                      {confirmPasswordError && (
                        <div className="text-red-600 text-xs font-neusans">{confirmPasswordError}</div>
                      )}
                    </div>
                  </>
                )}
                <p className="auth__terms font-neusans">By signing up, I agree to TastyPlate's <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/listing-guidelines" target="_blank" rel="noopener noreferrer">Listing Guidelines</a></p>

                <button
                  disabled={isLoading}
                  type="submit"
                  className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl hover:bg-[#d36400] transition-all duration-200 font-neusans"
                >
                  Continue
                </button>
                <div className="text-sm font-normal flex flex-row flex-nowrap items-center gap-2 font-neusans">
                  <hr className="w-full border-t border-[#494D5D]" />
                  or
                  <hr className="w-full border-t border-[#494D5D]" />
                </div>

                <button
                  disabled={isLoading}
                  type="button"
                  onClick={signUpWithGoogle}
                  className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center transition-all duration-200 hover:!bg-gray-50 hover:!shadow-md hover:!border-gray-400 active:!bg-gray-100 font-neusans"
                >
                  <FcGoogle className="h-5 w-5 object-contain mr-2" />
                  <span className="font-normal font-neusans">Continue with Google</span>
                </button>
              </form>
              {error && (
                <div
                  className={`mt-4 mx-10 text-center px-4 py-2 rounded-xl font-normal bg-red-100 text-red-700 font-neusans`}
                  dangerouslySetInnerHTML={{ __html: error }}
                />
              )}
            </div>
            <hr className="border-t border-[#CACACA]" />
            <p className="auth__footer font-neusans">
                Already have an account?{" "}
                <a
                  className="auth__link font-neusans"
                  onClick={e => {
                    e.preventDefault();
                    if (onOpenSignin) onOpenSignin();
                  }}
                >
                  Log in
                </a>
              </p>
          </div>
        </>
      )}
    </div>
  );
};

const RegisterPage: React.FC<RegisterPageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner /></div>}>
      <RegisterContent {...props} />
    </Suspense>
  );
};

export default RegisterPage;
