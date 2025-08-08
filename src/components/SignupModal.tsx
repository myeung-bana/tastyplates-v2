"use client";
import React, { useState } from "react";
import { FiX, FiStar, FiThumbsUp, FiMessageSquare } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import Image from "next/image";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { restaurants } from "@/data/dummyRestaurants";
import Link from "next/link";
import RegisterPage from "@/pages/Register/Register";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  onOpenSignin?: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  data = [],
  isOpen,
  onClose,
  onOpenSignin,
}) => {
//   const [rating, setRating] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="!max-w-[488px] w-full max-h-[700px] !p-0 !rounded-3xl font-inter relative overflow-y-auto">
        <button className="review-modal__close !top-3 md:!top-5" onClick={onClose}>
          <FiX />
        </button>
        <RegisterPage onOpenSignin={onOpenSignin} />
      </div>
    </div>
  );
};

export default SignupModal;
