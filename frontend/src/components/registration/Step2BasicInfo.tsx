import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import FormField from '../FormField';

interface Step2Props {
  fullName: string;
  email: string;
  onChange: (fullName: string, email: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const Step2BasicInfo: React.FC<Step2Props> = ({
  fullName,
  email,
  onChange,
  onNext,
  onBack,
  isLoading = false
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-navy mb-2">Basic Information</h2>
        <p className="text-gray-600">Tell us who you are</p>
      </div>

      <motion.div variants={itemVariants}>
        <FormField
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => {
            onChange(e.target.value, email);
            if (errors.fullName) setErrors({ ...errors, fullName: '' });
          }}
          error={errors.fullName}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormField
          type="email"
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            onChange(fullName, e.target.value);
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          error={errors.email}
          disabled={isLoading}
        />
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div variants={itemVariants} className="pt-6 flex gap-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className={`
            flex-1 h-14 rounded-xl font-bold text-lg transition-all
            bg-gray-200 hover:bg-gray-300 text-navy
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
          `}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className={`
            flex-1 h-14 rounded-xl font-bold text-lg transition-all
            bg-gold hover:bg-gold/90 text-navy
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
          `}
        >
          {isLoading ? 'Loading...' : 'Next'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step2BasicInfo;
