import React from 'react';

interface EmptyStateProps {
  heading?: string;
  message: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  heading = 'No results found', 
  message,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {heading}
      </h3>
      <p className="text-gray-500">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;

