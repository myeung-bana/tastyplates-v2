"use client";
import { useEffect, useState } from "react";
import "@/styles/pages/_auth.scss";
import CustomMultipleSelect from "@/components/ui/Select/CustomMultipleSelect";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Key } from "@react-types/shared";
import { genderOptions, pronounOptions } from "@/constants/formOptions";
import Cookies from "js-cookie";
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import { useSession } from "next-auth/react";
import { useCuisines } from "@/hooks/useCuisines";
import {
  birthdateRequired,
  birthdateLimit,
  genderRequired,
  palateMaxLimit,
  usernameCheckError,
  usernameValidationLimit,
  usernameRequired,
  usernameTooShort,
  usernameTooLong,
  usernameNoSpaces,
  usernameInvalidCharacters,
  usernameCannotStartWithSpecial,
  usernameCannotEndWithSpecial,
  usernameCannotBeAllNumbers,
  usernameNoConsecutiveSpecial,
  palateRequired,
} from "@/constants/messages";
import { ageLimit, palateLimit, userNameMaxLimit, userNameMinLimit } from "@/constants/validation";
import CustomDatePicker from "@/components/common/CustomDatepicker";
import { formatDateForInput, validateUsername } from "@/lib/utils";
import { REGISTRATION_KEY } from "@/constants/session";
import OnboardingStepIndicator from "@/components/onboarding/OnboardingStepIndicator";
import { findCuisineOptionByKey, getCuisineKey } from "@/utils/cuisineUtils";

// Using restaurantUserService for Hasura API calls

interface OnboardingStepOneProps {
  onNext: () => void;
  currentStep: number;
}

const OnboardingStepOne: React.FC<OnboardingStepOneProps> = ({ onNext, currentStep }) => {
  const { data: session } = useSession();
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [customGender, setCustomGender] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);
  const [genderError, setGenderError] = useState<string | null>(null);
  const [palateError, setPalateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false);

  // Fetch cuisines from API for palate selection
  const { cuisineOptions, loading: cuisinesLoading, error: cuisinesError } = useCuisines();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch user data from API and pre-fill fields
  useEffect(() => {
    const loadUserData = async () => {
      if (!hasMounted || hasLoadedUserData) return;
      
      // First, check localStorage for any existing data
      const storedData = localStorage.getItem(REGISTRATION_KEY);
      const parsedData = storedData ? JSON.parse(storedData) : {};

      // Try to fetch from API if we have a session user ID
      if (session?.user?.id) {
        try {
          const userId = String(session.user.id);
          const response = await restaurantUserService.getUserById(userId);
          
          if (response.success && response.data) {
            const userData = response.data;
            
            // Pre-fill fields from API, but only if not already set in localStorage
            // This allows localStorage to take precedence (for partial saves)
            if (!parsedData.username && userData.username) {
              setName(userData.username);
            } else if (parsedData.username) {
              setName(parsedData.username);
            } else {
              setName(Cookies.get('username') || "");
            }

            if (!parsedData.birthdate && userData.birthdate) {
              setBirthdate(userData.birthdate);
            } else if (parsedData.birthdate) {
              setBirthdate(parsedData.birthdate);
            }

            if (!parsedData.gender && userData.gender) {
              setGender(userData.gender);
            } else if (parsedData.gender) {
              setGender(parsedData.gender);
            }

            if (!parsedData.customGender && userData.custom_gender) {
              setCustomGender(userData.custom_gender);
            } else if (parsedData.customGender) {
              setCustomGender(parsedData.customGender);
            }

            if (!parsedData.pronoun && userData.pronoun) {
              setPronoun(userData.pronoun);
            } else if (parsedData.pronoun) {
              setPronoun(parsedData.pronoun);
            }

            // Handle palates - can be array or string
            // Need to match cuisine names/slugs from API to cuisine option keys
            if (!parsedData.palates && userData.palates) {
              let palatesArray: string[] = [];
              if (Array.isArray(userData.palates)) {
                palatesArray = userData.palates.map((p: any) => {
                  const palateName = typeof p === 'string' ? p : (p?.name || p?.slug || String(p));
                  // Convert to key format using utility function
                  return getCuisineKey(palateName);
                });
              } else if (typeof userData.palates === 'string') {
                palatesArray = userData.palates
                  .split(/[|,]\s*/)
                  .filter((p: string) => p.trim().length > 0)
                  .map((p: string) => getCuisineKey(p.trim()));
              }
              if (palatesArray.length > 0) {
                // Match palates to cuisine option keys when cuisineOptions are available
                if (cuisineOptions.length > 0 && !cuisinesLoading) {
                  const matchedKeys = new Set<Key>();
                  palatesArray.forEach(palateKey => {
                    // Try to find matching key in cuisineOptions
                    const found = findCuisineOptionByKey(cuisineOptions, palateKey);
                    if (found) {
                      matchedKeys.add(found.key);
                    }
                  });
                  if (matchedKeys.size > 0) {
                    setSelectedPalates(matchedKeys);
                  } else {
                    // Fallback: use the keys as-is if no matches found
                    setSelectedPalates(new Set(palatesArray));
                  }
                } else {
                  // If cuisineOptions not loaded yet, set them anyway
                  // They'll be matched when cuisineOptions load
                  setSelectedPalates(new Set(palatesArray));
                }
              }
            } else if (parsedData.palates) {
              const palatesArray = Array.isArray(parsedData.palates) 
                ? parsedData.palates 
                : parsedData.palates.split(",");
              setSelectedPalates(new Set(palatesArray));
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fall back to localStorage/cookies if API fails
          if (parsedData.username) setName(parsedData.username);
          else setName(Cookies.get('username') || "");
          if (parsedData.birthdate) setBirthdate(parsedData.birthdate);
          if (parsedData.gender) setGender(parsedData.gender);
          if (parsedData.customGender) setCustomGender(parsedData.customGender);
          if (parsedData.pronoun) setPronoun(parsedData.pronoun);
          if (parsedData.palates) {
            const palatesArray = Array.isArray(parsedData.palates) 
              ? parsedData.palates 
              : parsedData.palates.split(",");
            setSelectedPalates(new Set(palatesArray));
          }
        }
      } else {
        // No session, use localStorage/cookies only
        if (parsedData.username) setName(parsedData.username);
        else setName(Cookies.get('username') || "");
        if (parsedData.birthdate) setBirthdate(parsedData.birthdate);
        if (parsedData.gender) setGender(parsedData.gender);
        if (parsedData.customGender) setCustomGender(parsedData.customGender);
        if (parsedData.pronoun) setPronoun(parsedData.pronoun);
        if (parsedData.palates) {
          const palatesArray = Array.isArray(parsedData.palates) 
            ? parsedData.palates 
            : parsedData.palates.split(",");
          setSelectedPalates(new Set(palatesArray));
        }
      }
      
      setHasLoadedUserData(true);
    };

    loadUserData();
  }, [hasMounted, session?.user?.id, hasLoadedUserData]);

  // Re-match palates when cuisineOptions become available
  useEffect(() => {
    if (!hasLoadedUserData || cuisinesLoading || cuisineOptions.length === 0) return;
    
    // If we have selected palates but they might not be matched yet
    if (selectedPalates.size > 0 && session?.user?.id) {
      // Try to fetch user data again to get palates and match them
      const matchPalatesFromAPI = async () => {
        try {
          const userId = String(session.user.id);
          const response = await restaurantUserService.getUserById(userId);
          
          if (response.success && response.data && response.data.palates) {
            const userData = response.data;
            let palatesArray: string[] = [];
            
            if (Array.isArray(userData.palates)) {
              palatesArray = userData.palates.map((p: any) => {
                const palateName = typeof p === 'string' ? p : (p?.name || p?.slug || String(p));
                return getCuisineKey(palateName);
              });
            } else if (typeof userData.palates === 'string') {
              palatesArray = userData.palates
                .split(/[|,]\s*/)
                .filter((p: string) => p.trim().length > 0)
                .map((p: string) => getCuisineKey(p.trim()));
            }
            
            if (palatesArray.length > 0) {
              const matchedKeys = new Set<Key>();
              palatesArray.forEach(palateKey => {
                const found = findCuisineOptionByKey(cuisineOptions, palateKey);
                if (found) {
                  matchedKeys.add(found.key);
                }
              });
              if (matchedKeys.size > 0) {
                setSelectedPalates(matchedKeys);
              }
            }
          }
        } catch (error) {
          console.error('Error matching palates:', error);
        }
      };
      
      matchPalatesFromAPI();
    }
  }, [cuisineOptions, cuisinesLoading, hasLoadedUserData, session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get stored data first
      const storedDataStr = localStorage.getItem(REGISTRATION_KEY);
      let existingData = {};
      
      // Safely parse the stored data
      try {
        existingData = storedDataStr ? JSON.parse(storedDataStr) : {};
      } catch {
        existingData = {};
      }

      // Reset errors
      setUsernameError(null);
      setBirthdateError(null);
      setPalateError(null);
      setGenderError(null);

      let formattedBirthdate = "";

      // Username validation using comprehensive policy
      const usernameValidation = validateUsername(name);
      if (!usernameValidation.isValid) {
        // Map error codes to messages
        const errorMessages: Record<string, string> = {
          usernameRequired,
          usernameTooShort,
          usernameTooLong,
          usernameNoSpaces,
          usernameInvalidCharacters,
          usernameCannotStartWithSpecial,
          usernameCannotEndWithSpecial,
          usernameCannotBeAllNumbers,
          usernameNoConsecutiveSpecial,
        };
        setUsernameError(errorMessages[usernameValidation.error || ''] || usernameValidationLimit(userNameMinLimit, userNameMaxLimit));
        setIsLoading(false);
        return;
      }

      // Birthdate validation
      if (!birthdate) {
        setBirthdateError(birthdateRequired);
        setIsLoading(false);
        return;
      }

      // Age validation
      const birth = new Date(birthdate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      const isBirthdayPassed = m > 0 || (m === 0 && today.getDate() >= birth.getDate());
      const actualAge = isBirthdayPassed ? age : age - 1;
      
      if (isNaN(birth.getTime()) || actualAge < ageLimit) {
        setBirthdateError(birthdateLimit(ageLimit));
        setIsLoading(false);
        return;
      }

      if (birthdate) {
        formattedBirthdate = formatDateForInput(birthdate);
      }

      // Gender validation
      if (!gender) {
        setGenderError(genderRequired);
        setIsLoading(false);
        return;
      }

      // Palate validation
      if (selectedPalates.size === 0) {
        setPalateError(palateRequired);
        setIsLoading(false);
        return;
      }
      if (selectedPalates.size > palateLimit) {
        setPalateError(palateMaxLimit(palateLimit));
        setIsLoading(false);
        return;
      }

      try {
        const response = await restaurantUserService.checkUsernameExists(name);
        if (response.exists) {
          setUsernameError(response.message);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameError(usernameCheckError);
        setIsLoading(false);
        return;
      }
      if (!hasMounted) return;

      // Update localStorage with new data while preserving onboarding2 data
      const updatedData = {
        ...existingData,
        username: name,
        birthdate: formattedBirthdate,
        gender,
        customGender: gender === "custom" ? customGender : undefined,
        pronoun: gender === "custom" ? pronoun : undefined,
        palates: Array.from(selectedPalates).join(","),
      };

      // Clean undefined values before storing
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key as keyof typeof updatedData] === undefined) {
          delete updatedData[key as keyof typeof updatedData];
        }
      });

      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(updatedData));
      setIsLoading(false);
      onNext(); // Navigate to next step
      return;
    } catch (error) {
      console.error('Error in form submission:', error);
      setIsLoading(false);
      return;
    }
  };

  const handleGenderChange = (value: string) => {
    console.log('gender reveal', value)
    setGender(value);
    // Reset custom gender fields when switching genders
    if (value !== "custom") {
      setCustomGender("");
      setPronoun("");
    }
  };

  const handlePalateChange = (keys: Set<Key>) => {
    setSelectedPalates(keys);
    setPalateError(null);
  };

  const baseFormFields = [
    {
      label: "Username",
      type: "text",
      placeholder: "Enter Username",
      value: name,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        // Real-time validation as user types
        if (value.trim()) {
          const validation = validateUsername(value);
          if (!validation.isValid && validation.error) {
            const errorMessages: Record<string, string> = {
              usernameTooShort,
              usernameTooLong,
              usernameNoSpaces,
              usernameInvalidCharacters,
              usernameCannotStartWithSpecial,
              usernameCannotEndWithSpecial,
              usernameCannotBeAllNumbers,
              usernameNoConsecutiveSpecial,
            };
            setUsernameError(errorMessages[validation.error] || '');
          } else {
            setUsernameError(null);
          }
        } else {
          setUsernameError(null);
        }
      },
      disabled: isLoading,
      className: "!rounded-[10px] !h-10 md:!h-[48px] font-neusans font-normal placeholder:font-neusans placeholder:font-normal"
    },
    {
      label: "Date of Birth",
      type: "date",
      placeholder: "DD/MM/YYYY",
      value: birthdate,
      onChange: (val: string) => setBirthdate(val),
      disabled: isLoading,
      className: "relative",
    },
    {
      label: "Gender",
      type: "select",
      placeholder: "Select your gender",
      defaultValue: gender || "0",
      className: `auth__input auth__select !h-10 md:!h-[48px] rounded-[10px] focus:!text-[#31343f] font-neusans font-normal ${gender ? '!text-[#31343f]' : '!text-[#797979]'}`,
      value: gender,
      onChange: handleGenderChange,
      items: genderOptions,
      disabled: isLoading,
    },
  ];

  const customGenderFields = gender === "custom" ? [
    {
      label: "",
      type: "text",
      placeholder: "What's your gender?",
      value: customGender,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomGender(e.target.value),
      disabled: isLoading,
      className: "auth__input h-10 md:h-[48px] rounded-[10px] font-neusans font-normal",
    },
    {
      label: "Pronoun",
      type: "select",
      placeholder: "Select your pronoun",
      defaultValue: pronoun || "0",
      className: `auth__input auth__select h-10 md:h-[48px] rounded-[10px] focus:!text-[#31343f] font-neusans font-normal ${pronoun ? '!text-[#31343f]' : '!text-[#797979]'}`,
      value: pronoun,
      onChange: (value: string) => setPronoun(value),
      items: pronounOptions,
      disabled: isLoading,
    },
  ] : [];

  const formFields = [
    ...baseFormFields,
    ...(gender === "custom" ? customGenderFields : []),
    {
      label: "Palate (Select up to 2 palates)",
      type: "multiple-select",
      placeholder: cuisinesLoading ? "Loading cuisines..." : cuisinesError ? "Error loading cuisines" : "Select your palate",
      value: selectedPalates,
      onChange: handlePalateChange,
      items: cuisineOptions,
      disabled: isLoading || cuisinesLoading,
      limitValueLength: 2,
      className: "!h-10 md:!h-[48px] !rounded-[10px] auth__input",
    },
  ];

  return (
    <div className="px-2 pt-8 sm:px-1 h-auto">
      <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
        <h1 className="auth__header text-2xl sm:text-3xl mb-6 font-neusans font-normal">Create Account</h1>
        <OnboardingStepIndicator currentStep={currentStep} totalSteps={2} />
        <div className="auth__card py-4 !rounded-[24px] border border-[#CACACA] w-full sm:!w-[672px] bg-white">
          <p className="text-sm sm:text-base text-[#494D5D] text-center mb-6 px-4 font-neusans font-normal">
            To provide you with the best dining experience, tell us a bit about yourself. This helps us recommend hidden gems and dishes you'll absolutely love.
          </p>
          <form
            className="auth__form max-w-full sm:!max-w-[672px] w-full border-[#CACACA] gap-4 pb-6"
            onSubmit={handleSubmit}
          >
            {formFields.map((field: Record<string, unknown>, index: number) => {
              const isCustomGenderField = gender === "custom" && field.label === "";
              const groupClassName = isCustomGenderField
                ? "auth__form-group w-full shrink-0 -mt-4"
                : "auth__form-group w-full shrink-0";

              return (
                <div key={index} className={groupClassName}>
                  <label htmlFor={String(field.label || "").toLowerCase()} className="font-neusans font-normal text-sm sm:text-base">
                    {String(field.label || "")}
                  </label>
                  <div className={`auth__input-group ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                    {field.type === "date" ? (
                        <CustomDatePicker
                          id={String(field.label || "").toLowerCase()}
                          className={`!w-full text-sm sm:text-base !rounded-[10px] ${!field.value ? '[&::-webkit-datetime-edit]:opacity-0' : ''} ${field.className || ''}`}
                          buttonClassName="!h-10 md:!h-[48px] text-[#31343f] text-xs md:text-base border border-solid !border-[#797979] hover:border-[#31343f] hover:bg-[#F1F1F1] placeholder:text-[#797979]"
                          value={String(field.value || "")}
                          onChange={field.onChange as (val: string) => void}
                          formatValue="MM/dd/yyyy"
                          disabled={Boolean(field.disabled)}
                        />
                    ) : field.type === "select" ? (
                      <select className={`${String(field.className || "")} font-neusans font-normal`} value={String(field.value || "")} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => (field.onChange as (val: string) => void)(e.target.value)} disabled={Boolean(field.disabled)}>
                        <option value="">{String(field.placeholder || "")}</option>
                        {(field.items as Array<Record<string, unknown>> || []).map((option: Record<string, unknown>) => {
                          const optionKey = option?.key || "";
                          const optionValue = option?.value ?? option?.key ?? "";
                          const optionContent = option?.content ?? option?.label ?? "";
                          return (
                            <option key={String(optionKey)} value={String(optionValue)}>{String(optionContent)}</option>
                          );
                        })}
                      </select>
                    ) : field.type === "multiple-select" ? (
                      <CustomMultipleSelect 
                        items={(field.items as Array<{ key: string; label: string; children?: Array<{ key: string; label: string; flag?: string }> }>) || []}
                        value={field.value instanceof Set ? field.value : new Set<Key>()}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(keys: Set<any>) => {
                          if (field.onChange) {
                            (field.onChange as (keys: Set<Key>) => void)(keys);
                          }
                        }}
                        placeholder={String(field.placeholder || "")}
                        className={String(field.className || "")}
                        limitValueLength={field.limitValueLength as number | undefined}
                      />
                    ) : (
                      <input
                        type={String(field.type || "text")}
                        id={String(field.label || "").toLowerCase()}
                        className={`auth__input text-sm sm:text-base font-neusans font-normal placeholder:font-neusans placeholder:font-normal ${String(field.className || '')}`}
                        placeholder={String(field.placeholder || "")}
                        value={String(field.value || "")}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (field.onChange) {
                            // For text inputs, onChange expects the full event object
                            // For other input types, it might expect just the value
                            if (field.type === "text") {
                              (field.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
                            } else {
                              (field.onChange as (val: string) => void)(e.target.value);
                            }
                          }
                        }}
                        disabled={Boolean(field.disabled)}
                      />
                    )}
                  </div>
                  {field.label === "Username" && usernameError && (
                    <div className="text-red-600 text-xs mt-1 font-neusans font-normal">{usernameError}</div>
                  )}
                  {(field.label === "Date of Birth" || field.label === "Birthdate") && birthdateError && (
                    <div className="text-red-600 text-xs mt-1 font-neusans font-normal">{birthdateError}</div>
                  )}
                  {field.label === "Palate (Select up to 2 palates)" && palateError && (
                    <div className="text-red-600 text-xs mt-1 font-neusans font-normal">{palateError}</div>
                  )}
                  {field.label === "Gender" && genderError && (
                    <div className="text-red-600 text-xs mt-1 font-neusans font-normal">{genderError}</div>
                  )}
                </div>
              );
            })}
            <button
              type="submit"
              className={`auth__button !bg-[#E36B00] mt-0 !rounded-[12px] w-fit text-base mx-auto font-neusans font-normal ${isLoading ? 'pointer-events-none' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Next"}
            </button>
          </form>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modal Title
              </ModalHeader>
              <ModalBody>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Nullam pulvinar risus non risus hendrerit venenatis.
                  Pellentesque sit amet hendrerit risus, sed porttitor quam.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Nullam pulvinar risus non risus hendrerit venenatis.
                  Pellentesque sit amet hendrerit risus, sed porttitor quam.
                </p>
                <p>
                  Magna exercitation reprehenderit magna aute tempor cupidatat
                  consequat elit dolor adipisicing. Mollit dolor eiusmod sunt ex
                  incididunt cillum quis. Velit duis sit officia eiusmod Lorem
                  aliqua enim laboris do dolor eiusmod. Et mollit incididunt
                  nisi consectetur esse laborum eiusmod pariatur proident Lorem
                  eiusmod et. Culpa deserunt nostrud ad veniam.
                </p>
              </ModalBody>
              <ModalFooter>
                <button color="danger" onClick={() => setIsOpen(!isOpen)}>
                  Close
                </button>
                <button color="primary" onClick={() => setIsOpen(!isOpen)}>
                  Action
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default OnboardingStepOne;

