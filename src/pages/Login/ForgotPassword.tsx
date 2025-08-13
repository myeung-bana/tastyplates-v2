"use client";
import { useState } from "react";
import "@/styles/pages/_auth.scss";
import { useRouter } from 'next/navigation';
import Spinner from "@/components/LoadingSpinner";
import { UserService } from "@/services/user/userService";
import { responseStatus } from "@/constants/response";
import { validEmail } from "@/lib/utils";
import { emailRequired, invalidEmailFormat } from "@/constants/messages";

interface ForgotPasswordPageProps {
    onSuccess?: () => void;
}

const userService = new UserService()

const ForgotPasswordPage = ({ onSuccess }: ForgotPasswordPageProps) => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<(typeof responseStatus)[keyof typeof responseStatus] | null>(null);
    const [emailError, setEmailError] = useState<string>("");

    const validateEmail = (email: string) => {
        if (!email) return emailRequired;
        if (!validEmail(email)) return invalidEmailFormat;
        return "";
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setMessage('');
        setEmailError(validateEmail(value));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        const err = validateEmail(email);
        if (err) {
            setIsLoading(false);
            setEmailError(err);
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('url', window.location.origin);

        const res = await userService.sendForgotPasswordEmail(formData);
        if (!res.status) {
            setMessageType(responseStatus.error);
        } else {
            localStorage.setItem('reset-email', email);
            onSuccess?.();
        }

        setMessage(res.message);
        setIsLoading(false);
    }

    return (
        <div className="auth !min-h-[auto]">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <Spinner size={48} className="text-[#E36B00]" />
                </div>
            )}
            <div className="auth__container">
                <div className="auth__card !px-0 !p-5">
                    <h1 className="auth__title">Forgot Password</h1>
                    <div className="border-t border-[#CACACA]">
                        <form className="auth__form px-[2rem] !gap-4" onSubmit={handleSubmit}>
                            <div className="auth__form-group mt-6">
                                <p className="text-sm text-[#31343F]">Enter your email address, and we’ll email you a link to reset your password.</p>
                                <label htmlFor="email" className="auth__label !font-bold pt-2">
                                    Email
                                </label>
                                <div className="auth__input-group">
                                    <input
                                        type="text"
                                        id="email"
                                        className="auth__input !border-[#797979]"
                                        placeholder="Email"
                                        value={email}
                                        onChange={handleEmailChange}
                                    />
                                    {emailError && (
                                        <div className="text-red-600 text-xs mt-2">{emailError}</div>
                                    )}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl hover:bg-[#d36400] transition-all duration-200"
                            >
                                Send Reset Link
                            </button>
                            {message && (
                                <div
                                    className={`mt-4 text-center px-4 py-2 rounded-xl font-medium ${messageType == responseStatus.success
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: message }}
                                />
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;