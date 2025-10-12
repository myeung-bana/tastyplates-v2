"use client";
import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import "@/styles/pages/_auth.scss";
import { RESET_EMAIL_KEY } from "@/constants/session";

interface ForgotPassowordModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

const ForgotPassLinkModal: React.FC<ForgotPassowordModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [email, setEmail] = useState("xxx@gmail.com");

    useEffect(() => {
        const savedEmail = localStorage.getItem(RESET_EMAIL_KEY);
        if (savedEmail) {
            setEmail(savedEmail);
            localStorage.removeItem(RESET_EMAIL_KEY);
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div className="review-modal-overlay">
            <div className="!max-w-[488px] w-full !max-h-[auto] !p-0 !rounded-3xl font-neusans relative overflow-y-auto">
                <button className="review-modal__close !top-5" onClick={onClose}>
                    <FiX />
                </button>
                <div className="auth !min-h-[auto]">
                    <div className="auth__container">
                        <div className="auth__card !px-0 !py-6">
                            <h1 className="auth__title font-neusans">Link Sent</h1>
                            <div className="border-t border-[#CACACA]">
                                <div className="auth__form-group px-[2rem] mt-6">
                                    <p className="text-sm text-[#31343F] font-neusans">A link to reset your password has been sent to {email}</p>
                                    <button
                                        type="button"
                                        className="auth__button !bg-[#E36B00] !mt-5 !rounded-xl hover:bg-[#d36400] transition-all duration-200 font-neusans"
                                        onClick={onClose}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassLinkModal;
