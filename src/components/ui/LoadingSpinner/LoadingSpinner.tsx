import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = "Loading...", 
  className = "flex justify-center text-center mt-6 min-h-[40px]" 
}) => {
  return (
    <div className={className}>
      <svg
        className="w-5 h-5 text-gray-500 animate-spin mr-2"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray="164"
          strokeDashoffset="40"
        />
      </svg>
      <span className="text-gray-500 text-sm">{text}</span>
    </div>
  );
};

export default LoadingSpinner;
