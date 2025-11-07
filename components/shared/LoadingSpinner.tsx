import React from 'react';
import { Wallet } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const logoSize = {
    sm: 20,
    md: 40,
    lg: 56,
  };

  const barWidth = {
    sm: 'w-32',
    md: 'w-64',
    lg: 'w-80',
  };

  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      {/* Logo */}
      <div className="mb-6">
        <Wallet className="text-blue-600 dark:text-blue-400 mx-auto" size={logoSize[size]} />
      </div>
      
      {/* Text */}
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 tracking-wide mb-6">
        IntelliBudget
      </p>
      
      {/* Progress Bar */}
      <div className={`${barWidth[size]} h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative`}>
        <div 
          className="h-full bg-blue-600 rounded-full relative"
          style={{
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              width: '50%',
              height: '100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'skewX(-20deg)',
            }}
          ></div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-200%) skewX(-20deg);
          }
          100% {
            transform: translateX(400%) skewX(-20deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

