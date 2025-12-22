"use client";
import React from "react";

interface OnboardingStepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const stepLabels = {
  1: "Basic Information",
  2: "Set Up Profile",
};

const OnboardingStepIndicator: React.FC<OnboardingStepIndicatorProps> = ({
  currentStep,
  totalSteps = 2,
}) => {
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      {/* Step Circles and Connector */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    isActive
                      ? "bg-[#ff7c0a] border-[#ff7c0a]"
                      : isCompleted
                      ? "bg-[#ff7c0a] border-[#ff7c0a]"
                      : "bg-white border-[#CACACA]"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.6667 5L7.50004 14.1667L3.33337 10"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? "text-white" : "text-[#797979]"
                      }`}
                    >
                      {stepNumber}
                    </span>
                  )}
                </div>
                {/* Step Label */}
                <span
                  className={`text-xs mt-2 text-center font-neusans ${
                    isActive
                      ? "text-[#ff7c0a] font-normal"
                      : isCompleted
                      ? "text-[#ff7c0a] font-normal"
                      : "text-[#797979] font-normal"
                  }`}
                >
                  {stepLabels[stepNumber as keyof typeof stepLabels]}
                </span>
              </div>
              {/* Connector Line */}
              {stepNumber < totalSteps && (
                <div
                  className={`h-0.5 w-12 transition-all duration-200 ${
                    isCompleted ? "bg-[#ff7c0a]" : "bg-[#CACACA]"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingStepIndicator;

