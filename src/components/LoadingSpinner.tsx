import React from "react";

const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
    size = 20,
    className = "",
}) => (
    <svg
        className={`animate-spin ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ display: "inline-block", verticalAlign: "middle" }}
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
    </svg>
);

export default LoadingSpinner;
