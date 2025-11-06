"use client";
import React, { useState, createContext, useContext } from "react";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";

interface AuthContextType {
  showSignin: () => void;
  showSignup: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthModal = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalWrapper');
  }
  return context;
};

interface AuthModalWrapperProps {
  children: React.ReactNode;
}

const AuthModalWrapper: React.FC<AuthModalWrapperProps> = ({ children }) => {
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);

  const showSignin = () => {
    setIsShowSignin(true);
  };

  const showSignup = () => {
    setIsShowSignup(true);
  };

  return (
    <AuthContext.Provider value={{ showSignin, showSignup }}>
      {children}
      
      <SignupModal
        isOpen={isShowSignup}
        onClose={() => setIsShowSignup(false)}
        onOpenSignin={() => {
          setIsShowSignup(false);
          setIsShowSignin(true);
        }}
      />
      <SigninModal
        isOpen={isShowSignin}
        onClose={() => setIsShowSignin(false)}
        onOpenSignup={() => {
          setIsShowSignin(false);
          setIsShowSignup(true);
        }}
      />
    </AuthContext.Provider>
  );
};

export default AuthModalWrapper;
