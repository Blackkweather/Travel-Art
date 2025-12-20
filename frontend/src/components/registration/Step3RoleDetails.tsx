import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import FormField from '../FormField';
import SelectWithSearch from './SelectWithSearch';
import { COUNTRIES } from '@/types/artistRegistration';

interface Step3Props {
  role: 'ARTIST' | 'HOTEL';
  phone: string;
  country: string;
  password: string;
  confirmPassword: string;
  additionalData?: Record<string, any>;
  onChange: (data: {
    phone: string;
    country: string;
    password: string;
    confirmPassword: string;
    additionalData?: Record<string, any>;
  }) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const Step3RoleDetails: React.FC<Step3Props> = ({
  role,
  phone,
  country,
  password,
  confirmPassword,
  additionalData,
  onChange,
  onBack,
  onSubmit,
  isLoading = false
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePhone = (phoneValue: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phoneValue.replace(/\s/g, ''));
  };

  const validatePassword = (passwordValue: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(passwordValue);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!country) {
      newErrors.country = 'Country is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateStep()) {
      onSubmit();
    }
  };

  const isPasswordStrong = password && validatePassword(password);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08
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
        <h2 className="text-3xl font-bold text-navy mb-2">
          {role === 'ARTIST' ? 'Artist Details' : 'Hotel Details'}
        </h2>
        <p className="text-gray-600">Complete your profile information</p>
      </div>

      <motion.div variants={itemVariants}>
        <FormField
          type="tel"
          label="Phone Number"
          placeholder="+33 (0)6 00 00 00 00"
          value={phone}
          onChange={(e) => {
            onChange({ phone: e.target.value, country, password, confirmPassword, additionalData });
            if (errors.phone) setErrors({ ...errors, phone: '' });
          }}
          error={errors.phone}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SelectWithSearch
          label="Country"
          placeholder="Select your country"
          options={COUNTRIES.map(c => ({ value: c, label: c }))}
          value={country}
          onChange={(value) => {
            onChange({ phone, country: value, password, confirmPassword, additionalData });
            if (errors.country) setErrors({ ...errors, country: '' });
          }}
          error={errors.country}
          required
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-navy">
            Password <span className="text-gold">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                onChange({ phone, country, password: e.target.value, confirmPassword, additionalData });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="Min 8 chars, uppercase, number, special"
              disabled={isLoading}
              className={`
                w-full h-12 px-4 pr-12 rounded-xl border-2 transition-all
                ${errors.password ? 'border-red-400' : isPasswordStrong ? 'border-green-400' : 'border-gray-200'}
                ${isLoading ? 'bg-gray-50 opacity-60' : 'bg-white'}
                focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold"
            >
              {showPassword ? '👁‍🗨' : '👁'}
            </button>
          </div>
          {isPasswordStrong && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              ✓ Strong password
            </div>
          )}
          {errors.password && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} /> {errors.password}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-navy">
            Confirm Password <span className="text-gold">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                onChange({ phone, country, password, confirmPassword: e.target.value, additionalData });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="Confirm your password"
              disabled={isLoading}
              className={`
                w-full h-12 px-4 pr-12 rounded-xl border-2 transition-all
                ${errors.confirmPassword ? 'border-red-400' : confirmPassword && password === confirmPassword ? 'border-green-400' : 'border-gray-200'}
                ${isLoading ? 'bg-gray-50 opacity-60' : 'bg-white'}
                focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold"
            >
              {showConfirmPassword ? '👁‍🗨' : '👁'}
            </button>
          </div>
          {confirmPassword && password === confirmPassword && !errors.confirmPassword && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              ✓ Passwords match
            </div>
          )}
          {errors.confirmPassword && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} /> {errors.confirmPassword}
            </div>
          )}
        </div>
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
          onClick={handleSubmit}
          disabled={isLoading}
          className={`
            flex-1 h-14 rounded-xl font-bold text-lg transition-all
            bg-gold hover:bg-gold/90 text-navy
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
          `}
        >
          {isLoading ? 'Creating Account...' : 'Complete'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step3RoleDetails;
