"use client";
import React, { useState } from "react";
import { FiX, FiStar, FiThumbsUp, FiMessageSquare } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import Image from "next/image";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { restaurants } from "@/data/dummyRestaurants";
import Link from "next/link";
import LoginPage from "@/pages/Login/Login";

interface SigninModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  onOpenSignup?: () => void;
}

const SigninModal: React.FC<SigninModalProps> = ({
  data = [],
  isOpen,
  onClose,
  onOpenSignup,
}) => {
//   const [rating, setRating] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="!max-w-[488px] w-full max-h-[700px] !p-0 !rounded-3xl font-inter relative overflow-y-auto">
        <button className="review-modal__close !top-6" onClick={onClose}>
          <FiX />
        </button>
        <LoginPage onOpenSignup={onOpenSignup} />
      </div>
    </div>
  );
};

export default SigninModal;
