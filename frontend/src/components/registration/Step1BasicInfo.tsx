import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import FormField from '../FormField';
import SelectWithSearch from './SelectWithSearch';
import DatePicker from './DatePicker';
import { BasicInfo, COUNTRIES, VALIDATION } from '@/types/artistRegistration';

interface Step1Props {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  onNext: () => void;
  isLoading?: boolean;
}

const Step1BasicInfo: React.FC<Step1Props> = ({ data, onChange, onNext, isLoading = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return VALIDATION.email.test(email);
  };

  const validatePassword = (password: string) => {
    return VALIDATION.password.test(password);
  };

  const validatePhone = (phone: string) => {
    return VALIDATION.phone.test(phone);
  };

  const validateDate = (date: string) => {
    return VALIDATION.date.test(date);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    // Check required fields
    if (!data.stageName.trim()) newErrors.stageName = 'Stage name is required';
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.birthDate.trim()) newErrors.birthDate = 'Birth date is required';
    else if (!validateDate(data.birthDate)) newErrors.birthDate = 'Format: DD/MM/YYYY';

    if (!data.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(data.phone)) newErrors.phone = 'Invalid phone number';

    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(data.email)) newErrors.email = 'Invalid email address';

    if (!data.password) newErrors.password = 'Password is required';
    else if (!validatePassword(data.password)) {
      newErrors.password = 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special';
    }

    if (!data.confirmPassword) newErrors.confirmPassword = 'Confirm your password';
    else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!data.country) newErrors.country = 'Country is required';
    if (!data.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const isPasswordStrong = data.password && validatePassword(data.password);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05
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
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Informations de base</h2>
        <p className="text-gray-600">Commencez par nous dire qui vous êtes</p>
      </div>

      {/* Two-column grid for desktop, single for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Name */}
        <motion.div variants={itemVariants}>
          <FormField
            label="Nom de scène"
            placeholder="Your stage name"
            value={data.stageName}
            onChange={(e) => onChange({ ...data, stageName: e.target.value })}
            error={errors.stageName}
            disabled={isLoading}
          />
        </motion.div>

        {/* Birth Date */}
        <motion.div variants={itemVariants}>
          <DatePicker
            label="Date de naissance"
            placeholder="JJ/MM/AAAA"
            value={data.birthDate}
            onChange={(value) => onChange({ ...data, birthDate: value })}
            error={errors.birthDate}
            disabled={isLoading}
          />
        </motion.div>

        {/* Last Name */}
        <motion.div variants={itemVariants}>
          <FormField
            label="Nom"
            placeholder="Your last name"
            value={data.lastName}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            error={errors.lastName}
            disabled={isLoading}
          />
        </motion.div>

        {/* First Name */}
        <motion.div variants={itemVariants}>
          <FormField
            label="Prénom"
            placeholder="Your first name"
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            error={errors.firstName}
            disabled={isLoading}
          />
        </motion.div>

        {/* Phone */}
        <motion.div variants={itemVariants}>
          <FormField
            type="tel"
            label="Numéro de téléphone"
            placeholder="+33 (0)6 00 00 00 00"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            error={errors.phone}
            disabled={isLoading}
          />
        </motion.div>

        {/* Email */}
        <motion.div variants={itemVariants}>
          <FormField
            type="email"
            label="Adresse email"
            placeholder="your@email.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            error={errors.email}
            disabled={isLoading}
          />
        </motion.div>

        {/* Country */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <SelectWithSearch
            label="Choisir un pays"
            placeholder="Sélectionner votre pays"
            options={COUNTRIES.map(country => ({ value: country, label: country }))}
            value={data.country}
            onChange={(value) => onChange({ ...data, country: value })}
            error={errors.country}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* Password */}
        <motion.div variants={itemVariants}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-navy-900">
              Mot de passe <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => onChange({ ...data, password: e.target.value })}
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
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {isPasswordStrong && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 size={16} /> Strong password
              </div>
            )}
            {errors.password && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={16} /> {errors.password}
              </div>
            )}
          </div>
        </motion.div>

        {/* Confirm Password */}
        <motion.div variants={itemVariants}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-navy-900">
              Confirmer le mot de passe <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={data.confirmPassword}
                onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                disabled={isLoading}
                className={`
                  w-full h-12 px-4 pr-12 rounded-xl border-2 transition-all
                  ${errors.confirmPassword ? 'border-red-400' : data.confirmPassword && data.password === data.confirmPassword ? 'border-green-400' : 'border-gray-200'}
                  ${isLoading ? 'bg-gray-50 opacity-60' : 'bg-white'}
                  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {data.confirmPassword && data.password === data.confirmPassword && !errors.confirmPassword && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 size={16} /> Passwords match
              </div>
            )}
            {errors.confirmPassword && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={16} /> {errors.confirmPassword}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Terms Checkbox */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={data.agreeToTerms}
            onChange={(e) => onChange({ ...data, agreeToTerms: e.target.checked })}
            disabled={isLoading}
            className="w-6 h-6 mt-1 rounded-lg border-2 border-gray-300 cursor-pointer accent-gold"
          />
          <span className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="/terms" target="_blank" className="text-gold font-semibold hover:underline">
              Conditions d'utilisation
            </a>{' '}
            et la{' '}
            <a href="/privacy" target="_blank" className="text-gold font-semibold hover:underline">
              Politique de confidentialité
            </a>
          </span>
        </label>
        {errors.agreeToTerms && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {errors.agreeToTerms}
          </motion.p>
        )}
      </motion.div>

      {/* Next Button */}
      <motion.div variants={itemVariants} className="pt-6">
        <button
          onClick={handleNext}
          disabled={isLoading}
          className={`
            w-full h-14 rounded-xl font-bold text-lg transition-all
            bg-gold hover:bg-gold/90 text-navy-900
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
          `}
        >
          {isLoading ? 'Chargement...' : 'Suivant'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step1BasicInfo;
