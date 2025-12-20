import React from 'react';
import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                flex-1 h-2 rounded-full transition-colors
                ${index + 1 <= currentStep ? 'bg-gold' : 'bg-gray-200'}
              `}
            />
            {index < totalSteps - 1 && <div className="w-2" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              text-sm font-medium flex flex-col items-center gap-1
              ${index + 1 <= currentStep ? 'text-gold' : 'text-gray-500'}
            `}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                transition-colors
                ${index + 1 <= currentStep ? 'bg-gold text-white' : 'bg-gray-200 text-gray-500'}
              `}
            >
              {index + 1 < currentStep ? '✓' : index + 1}
            </div>
            <span className="text-xs">{step}</span>
          </motion.div>
        ))}
      </div>

      {/* Step Counter */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Étape <span className="font-bold text-navy-900">{currentStep}</span> sur{' '}
          <span className="font-bold text-navy-900">{totalSteps}</span>
        </p>
      </div>
    </div>
  );
};

export default StepIndicator;
