"use client";
import React, { FormEvent, useEffect, useState } from "react";
import "@/styles/pages/_settings.scss";
import CustomSelect from "@/components/ui/Select/Select";
import { languageOptions } from "@/constants/formOptions";
import { useSession } from "next-auth/react";
import { UserService } from "@/services/user/userService";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { birthdateLimit, birthdateRequired, confirmPasswordRequired, currentPasswordError, emailOccurredError, emailRequired, invalidEmailFormat, passwordLimit, passwordsNotMatch, saveSettingsFailed } from "@/constants/messages";
import { ageLimit, minimumPassword } from "@/constants/validation";
import toast from "react-hot-toast";
import { emailExistCode, sessionProvider as provider, responseStatusCode as code } from "@/constants/response";
import CustomDatePicker from "../CustomDatepicker";
import { formatDateForInput, validEmail } from "@/lib/utils";

enum Field {
    None = "",
    Birthdate = "birthdate",
    Email = "email",
    Language = "language",
    Password = "password",
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Format as M/D/YYYY for display
  return date.toLocaleDateString('en-US');
};

const userService = new UserService()

const Settings = (props: any) => {
  const { data: session, status, update } = useSession(); // Add status from useSession
  const [userData, setUserData] = useState<any>(null);
  const [isPersonalInfoLoading, setIsPersonalInfoLoading] = useState(true);
  const [setting, setSetting] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [editable, setEditable] = useState<Field>(Field.None);
  const [passwordFields, setPasswordFields] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [birthdateError, setBirthdateError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isGoogleAuth = session?.user?.provider === provider.google;

  const validateBirthdate = (birthdate: string) => {
    if (!birthdate) return birthdateRequired;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (isNaN(birth.getTime()) || age < ageLimit) {
      return birthdateLimit(ageLimit);
    }
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return emailRequired;
    if (!validEmail(email)) return invalidEmailFormat;
    return "";
  };

  const validatePasswords = () => {
    let errors = { current: "", new: "", confirm: "" };
    if (editable === Field.Password) {
      // Current password: no frontend validation, backend only
      // New password: must be at least 5 characters
      if (!passwordFields.new || passwordFields.new.length < minimumPassword) {
        errors.new = passwordLimit(minimumPassword, "New password");
      }
      if (!passwordFields.confirm) {
        errors.confirm = confirmPasswordRequired;
      }
      if (
        passwordFields.new &&
        passwordFields.confirm &&
        passwordFields.new !== passwordFields.confirm
      ) {
        errors.confirm = passwordsNotMatch;
      }
    }
    setPasswordErrors(errors);
    return errors;
  };

  const validateCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await userService.validatePassword(password, session?.accessToken);
      return response.valid && response.status === code.success;
    } catch (error) {
      return false;
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate fields
    let hasError = false;

    // Birthdate validation
    if (editable === Field.Birthdate) {
      const err = validateBirthdate(setting.birthdate);
      setBirthdateError(err);
      if (err) hasError = true;
    } else {
      setBirthdateError("");
    }

    // Email validation
    if (editable === Field.Email) {
      const err = validateEmail(setting.email);
      setEmailError(err);
      if (err) hasError = true;
    } else {
      setEmailError("");
    }

    // Password validation with current password check
    if (editable === Field.Password) {
      const errors = validatePasswords();
      if (errors.current || errors.new || errors.confirm) hasError = true;

      // Validate current password with backend
      if (!hasError) {
        const isValidPassword = await validateCurrentPassword(passwordFields.current);
        if (!isValidPassword) {
          setPasswordErrors(prev => ({
            ...prev,
            current: currentPasswordError
          }));
          hasError = true;
        }
      }
    } else {
      setPasswordErrors({ current: "", new: "", confirm: "" });
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      if (!session?.user?.userId || !session?.accessToken) {
        throw new Error('User session not found');
      }

      const updateData: any = {};

      // Add fields based on what's being edited
      if (editable === Field.Birthdate) {
        updateData.birthdate = setting.birthdate;
      }
      if (editable === Field.Email) {
        updateData.email = setting.email;
      }
      if (editable === Field.Language) {
        updateData.language = setting.language;
      }
      if (editable === Field.Password) {
        updateData.password = passwordFields.new;
      }

      const response = await userService.updateUserFields(
        updateData,
        session.accessToken
      );

      if (response?.code == emailExistCode) {
        setEmailError(response?.message || emailOccurredError);
        setIsLoading(false);
        return;
      }

      if (response?.data?.status == code.unauthorized || response?.data?.status == code.forbidden) {
        setIsLoading(false);
        return;
      }

      // Update local cache
      const localKey = `userData_${session.user.email}`;
      const cachedData = JSON.parse(localStorage.getItem(localKey) || '{}');
      localStorage.setItem(localKey, JSON.stringify({
        ...cachedData,
        ...updateData,
      }));

      await update({
        ...session,
        user: {
          ...session.user,
          ...(!isGoogleAuth && updateData.email && { email: updateData.email }),
          language: updateData.language,
          birthdate: updateData.birthdate,
        }
      });

      setIsSubmitted(true);
      setEditable(Field.None);
      setPasswordFields({ current: "", new: "", confirm: "" });

      // Refetch user data to update the display
      fetchUserData();

    } catch (err) {
      toast.error(saveSettingsFailed + (err instanceof Error ? ` ${err.message}` : ""));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    // Don't fetch if session is still loading
    if (status === "loading") return;

    if (session?.user?.email && session?.accessToken) {
      setIsPersonalInfoLoading(true);
      const localKey = `userData_${session.user.email}`;
      const cached = typeof window !== "undefined" ? localStorage.getItem(localKey) : null;

      if (cached) {
        const parsedData = JSON.parse(cached);
        setUserData(parsedData);
        setSetting((prev: any) => ({
          ...prev,
          email: parsedData.email || parsedData.user_email || "",
          language: parsedData.language || "en",
          birthdate: formatDateForInput(parsedData.birthdate)
        }));
        setIsPersonalInfoLoading(false);
        return;
      }

      try {
        const data = await userService.getCurrentUser(
          session.accessToken as string
        );

        setUserData(data);
        // Initialize setting with formatted date
        setSetting((prev: any) => ({
          ...prev,
          email: data.user_email || "",
          language: data.language || "en",
          birthdate: formatDateForInput(data.birthdate as string)
        }));
        if (typeof window !== "undefined") {
          localStorage.setItem(localKey, JSON.stringify(data));
        }
      } catch {
        setUserData(null);
      } finally {
        setIsPersonalInfoLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [session?.user?.email, session?.accessToken, status]); // Add status dependency

  const toggleCurrentPassword = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <>
      <div className="font-inter w-full max-w-[39rem] mx-auto px-4 sm:px-0">
        {/* Overlay when modal is open */}
        {isSubmitted && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-[1000]"></div>
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[1010]">
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
                {/* Exit button */}
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-orange-600 transition-colors text-2xl"
                  onClick={() => setIsSubmitted(false)}
                  aria-label="Close"
                  tabIndex={0}
                >
                  &times;
                </button>
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                      <circle cx="28" cy="28" r="28" fill="#FFF3E6" />
                      <path
                        d="M18 29.5L25 36.5L38 23.5"
                        stroke="#E36B00"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-orange-700 mb-2">
                    Settings Saved!
                  </h2>
                  <p className="mb-6 text-center text-gray-700">
                    Your settings have been successfully saved.
                  </p>
                  <button
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow transition"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
            {/* Animation */}
            <style jsx>{`
              .animate-fade-in {
                animation: fadeInScale 0.3s cubic-bezier(.4,2,.6,1) both;
              }
              @keyframes fadeInScale {
                0% { opacity: 0; transform: scale(0.95);}
                100% { opacity: 1; transform: scale(1);}
              }
            `}</style>
          </>
        )}
        <div className="flex flex-col justify-center items-center py-6 sm:py-10 relative z-50">
          <h1 className="text-[#31343F] text-xl sm:text-2xl font-medium">
            Personal Info
          </h1>
          <form className="settings__form w-full pt-6 sm:pt-8" onSubmit={handleSave}>
            <div className="settings__form-group">
              <label className={`settings__label ${editable != Field.None ? "settings__label__disabled" : ""}`}>
                Username
              </label>
              <div className={`settings__input-group ${editable != Field.None ? "settings__input-group__disabled" : ""}`}>
                {isPersonalInfoLoading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-32"></div>
                ) : (
                  userData?.display_name || ""
                )
                }
              </div>
            </div>

            <div className="settings__form-group">
              <label
                className={`settings__label ${editable != Field.None && editable != Field.Birthdate
                  ? "settings__label__disabled"
                  : ""
                  }`}
              >
                Birthdate
              </label>
              <div className={`settings__input-group ${editable != Field.None && editable != Field.Birthdate
                ? "settings__input-group__disabled"
                : ""
                }`}
              >
                {isPersonalInfoLoading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-32"></div>
                ) : editable == Field.Birthdate ? (
                  <CustomDatePicker
                    className={`!w-full text-sm sm:text-base !rounded-[10px] min-h-[48px] ${!setting.birthdate ? '[&::-webkit-datetime-edit]:opacity-0' : ''}`}
                    value={setting.birthdate}
                    onChange={(val) => setSetting({ ...setting, birthdate: val })}
                    formatValue="MM/dd/yyyy"
                    disabled={isLoading}
                  />
                ) : userData?.birthdate ? (
                  formatDateForDisplay(userData.birthdate)
                ) : (
                  ""
                )}
              </div>
              {birthdateError && editable === Field.Birthdate && (
                <div className="text-xs text-red-600 mt-1">{birthdateError}</div>
              )}
              {editable !== Field.Birthdate ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != Field.None
                    ? "settings__input-group__disabled"
                    : "!text-[#494D5D]"
                    }`}
                  onClick={() => setEditable(Field.Birthdate)}
                  disabled={editable !== Field.None}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5 !text-[#494D5D]"
                    onClick={() => setEditable(Field.None)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings__button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save and Continue"}
                  </button>
                </>
              )}
            </div>
            <div className="settings__form-group">
              <label
                className={`settings__label ${editable != Field.None && editable != Field.Email
                  ? "settings__label__disabled"
                  : ""
                  } ${isGoogleAuth ? "opacity-50" : ""}`}
              >
                Email
              </label>
              <div
                className={`settings__input-group ${editable != Field.None && editable != Field.Email
                  ? "settings__input-group__disabled"
                  : ""
                  } ${isGoogleAuth ? "opacity-50" : ""}`}
              >
                {isPersonalInfoLoading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-48"></div>
                ) : editable == Field.Email ? (
                  <input
                    type="text"
                    name="email"
                    className="settings__input min-h-[48px]"
                    value={setting.email}
                    onChange={(e) => setSetting({ ...setting, email: e.target.value })}
                    disabled={isLoading}
                  />
                ) : (
                  userData?.email || userData?.user_email || ""
                )}
              </div>
              {emailError && editable === Field.Email && (
                <div className="text-xs text-red-600 mt-1">{emailError}</div>
              )}
              {!isGoogleAuth ? (
                editable !== Field.Email ? (
                  <button
                    type="button"
                    className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != Field.None ? "settings__input-group__disabled" : "!text-[#494D5D]"
                      }`}
                    onClick={() => setEditable(Field.Email)}
                    disabled={editable !== Field.None}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="absolute top-0 right-0 underline font-semibold leading-5 !text-[#494D5D]"
                      onClick={() => setEditable(Field.None)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="settings__button"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save and Continue"}
                    </button>
                  </>
                )
              ) : (
                editable !== Field.Email ? (
                  <button
                    type="button"
                    className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != Field.None || isGoogleAuth
                      ? "settings__input-group__disabled opacity-50"
                      : "!text-[#494D5D]"
                      }`}
                    onClick={() => setEditable(Field.Email)}
                    disabled={editable !== Field.None || isGoogleAuth}
                  >
                    Edit
                  </button>
                ) : null
              )}
            </div>
            <div className="settings__form-group">
              <label
                className={`settings__label ${editable != Field.None && editable != Field.Language
                  ? "settings__label__disabled"
                  : ""
                  }`}
              >
                Language
              </label>
              <div
                className={`settings__input-group ${editable != Field.None && editable != Field.Language
                  ? "settings__input-group__disabled"
                  : ""
                  }`}
              >
                {isPersonalInfoLoading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-32"></div>
                ) : editable == Field.Language ? (
                  <CustomSelect
                    value={setting.language}
                    onChange={(val: string) =>
                      setSetting({ ...setting, language: val })
                    }
                    items={languageOptions.map((opt) => ({
                      key: opt.value,
                      label: opt.label,
                    }))}
                    placeholder="Language"
                    className="settings__input min-h-[48px]"
                    selectClassName="!px-2 !py-2"
                    disabled={isLoading}
                  />
                ) : (
                  // Show updated language label after save
                  setting.language
                    ? (languageOptions.find(opt => opt.value === setting.language)?.label || "English")
                    : "English"
                )}
              </div>
              {editable !== Field.Language ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable != Field.None
                    ? "settings__input-group__disabled"
                    : "!text-[#494D5D]"
                    }`}
                  onClick={() => setEditable(Field.Language)}
                  disabled={editable !== Field.None}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5 !text-[#494D5D]"
                    onClick={() => setEditable(Field.None)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings__button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save and Continue"}
                  </button>
                </>
              )}
            </div>
            <hr className="border-t border-[#CACACA] w-full mt-6 sm:mt-8" />
            
            <h1 className="text-[#31343F] text-xl sm:text-2xl font-medium text-center mt-6 sm:mt-8">
              Security
            </h1>

            {/* Password section */}
            <div className="settings__form-group mt-4 sm:mt-6">
              <label
                className={`settings__label text-gray-400 mb-2 ${isGoogleAuth ? "opacity-50" : ""
                  } ${editable != Field.None && editable != Field.Password
                    ? "settings__label__disabled"
                    : ""
                  }`}
              >
                Password
              </label>
              <div
                className={
                  `settings__input-group ${editable != Field.None && editable != Field.Password
                    ? "settings__input-group__disabled"
                    : ""
                  } flex flex-col gap-2 ${isGoogleAuth ? "opacity-50" : ""}`
                }
              >
                {editable == Field.Password ? (
                  <>
                    <div className="relative">
                      <label className="text-[#494D5D] mb-1 block font-semibold text-sm">Current Password</label>
                      <div className="auth__input-group relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          className="settings__input min-h-[48px] !rounded-[10px] !border-[#797979] !border-[1px]"
                          placeholder=""
                          value={passwordFields.current}
                          onChange={(e) =>
                            setPasswordFields({ ...passwordFields, current: e.target.value })
                          }
                          disabled={isPersonalInfoLoading || isLoading}
                        />
                        {showCurrentPassword ? (
                          <FiEye onClick={toggleCurrentPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#31343F]" />
                        ) : (
                          <FiEyeOff onClick={toggleCurrentPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#31343F]" />
                        )}
                      </div>
                      {passwordErrors.current && (
                        <div className="text-xs text-red-600 mt-1">{passwordErrors.current}</div>
                      )}
                    </div>

                    <div className="relative mt-4">
                      <label className="text-[#494D5D] mb-1 block font-semibold text-sm">New Password</label>
                      <div className="auth__input-group relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          className="settings__input min-h-[48px] !rounded-[10px] !border-[#797979] !border-[1px]"
                          placeholder=""
                          value={passwordFields.new}
                          onChange={(e) =>
                            setPasswordFields({ ...passwordFields, new: e.target.value })
                          }
                          disabled={isPersonalInfoLoading || isLoading}
                        />
                        {showNewPassword ? (
                          <FiEye onClick={toggleNewPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#31343F]" />
                        ) : (
                          <FiEyeOff onClick={toggleNewPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#31343F]" />
                        )}
                      </div>
                      {passwordErrors.new && (
                        <div className="text-xs text-red-600 mt-1">{passwordErrors.new}</div>
                      )}
                    </div>

                    <div className="relative mt-4">
                      <label className="text-[#494D5D] mb-1 block font-semibold text-sm">Confirm Password</label>
                      <div className="auth__input-group relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          className="settings__input min-h-[48px] !rounded-[10px] !border-[#797979] !border-[1px]"
                          placeholder=""
                          value={passwordFields.confirm}
                          onChange={(e) =>
                            setPasswordFields({ ...passwordFields, confirm: e.target.value })
                          }
                          disabled={isPersonalInfoLoading || isLoading}
                        />
                        {showConfirmPassword ? (
                          <FiEye onClick={toggleConfirmPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#31343F]" />
                        ) : (
                          <FiEyeOff onClick={toggleConfirmPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#31343F]" />
                        )}
                      </div>
                      {passwordErrors.confirm && (
                        <div className="text-xs text-red-600 mt-1">{passwordErrors.confirm}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </div>
              {editable !== Field.Password ? (
                <button
                  type="button"
                  className={`absolute top-0 right-0 underline font-semibold leading-5 ${editable !== Field.None || isGoogleAuth ? "settings__input-group__disabled" : "!text-[#494D5D]"}`}
                  onClick={() => setEditable(Field.Password)}
                  disabled={editable !== Field.None || isGoogleAuth}
                >
                  Update
                </button>
              ) : !isGoogleAuth ? (  // Only show Cancel/Save buttons if not Google auth
                <>
                  <button
                    type="button"
                    className="absolute top-0 right-0 underline font-semibold leading-5 !text-[#494D5D]"
                    onClick={() => setEditable(Field.None)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings__button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save and Continue"}
                  </button>
                </>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Settings;
