import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, steps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-10">
      {/* Animated Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold via-gold/90 to-gold rounded-full shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      {/* Step Labels with Enhanced Animations */}
      <div className="flex justify-between relative">
        {/* Connection Lines */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold to-gold/50"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = index + 1 < currentStep;
          const isCurrent = index + 1 === currentStep;
          const isUpcoming = index + 1 > currentStep;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: isCurrent ? 1.1 : 1 
              }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 300
              }}
              className="flex flex-col items-center gap-2 flex-1"
            >
              {/* Step Circle */}
              <motion.div
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300 shadow-lg
                  ${isCompleted 
                    ? 'bg-gold text-white' 
                    : isCurrent 
                    ? 'bg-gold text-white ring-4 ring-gold/30' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="number"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-base"
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Pulse Animation for Current Step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gold"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Step Label */}
              <motion.span
                className={`
                  text-xs md:text-sm font-medium text-center max-w-[120px] leading-tight
                  transition-colors duration-300
                  ${isCompleted || isCurrent 
                    ? 'text-gold font-semibold' 
                    : 'text-gray-500'
                  }
                `}
                animate={{
                  fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500
                }}
              >
                {step}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Step Counter with Animation */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-8"
      >
        <p className="text-sm text-gray-600">
          Step{' '}
          <motion.span
            key={currentStep}
            initial={{ scale: 1.5, color: '#C9A63C' }}
            animate={{ scale: 1, color: '#0B1F3F' }}
            transition={{ duration: 0.3 }}
            className="font-bold text-navy"
          >
            {currentStep}
          </motion.span>
          {' '}of{' '}
          <span className="font-bold text-navy">{totalSteps}</span>
        </p>
      </motion.div>
    </div>
  );
};

export default StepIndicator;
