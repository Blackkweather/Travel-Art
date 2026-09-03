import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import FormField from '../FormField';
import SelectWithSearch from './SelectWithSearch';
import DatePicker from './DatePicker';
import { BasicInfo, COUNTRIES, VALIDATION } from '@/types/artistRegistration';
import useRevealFirstError from '@/hooks/useRevealFirstError';
import { t } from '@/i18n'

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
  const [failedAttempt, setFailedAttempt] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useRevealFirstError(failedAttempt, formRef);

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
    if (!data.stageName.trim()) newErrors.stageName = t('Indiquez votre nom de scène');
    if (!data.firstName.trim()) newErrors.firstName = t('Indiquez votre prénom');
    if (!data.lastName.trim()) newErrors.lastName = 'Indiquez votre nom';
    if (!data.birthDate.trim()) newErrors.birthDate = 'Indiquez votre date de naissance';
    else if (!validateDate(data.birthDate)) newErrors.birthDate = 'Format attendu : JJ/MM/AAAA';

    if (!data.phone.trim()) newErrors.phone = t('Indiquez votre numéro de téléphone');
    else if (!validatePhone(data.phone)) newErrors.phone = t('Numéro de téléphone invalide');

    if (!data.email.trim()) newErrors.email = 'Indiquez votre adresse e-mail';
    else if (!validateEmail(data.email)) newErrors.email = 'Adresse e-mail invalide';

    if (!data.password) newErrors.password = 'Choisissez un mot de passe';
    else if (!validatePassword(data.password)) {
      newErrors.password = t('8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial');
    }

    if (!data.confirmPassword) newErrors.confirmPassword = 'Confirmez votre mot de passe';
    else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Les deux mots de passe ne correspondent pas';
    }

    if (!data.country) newErrors.country = t('Sélectionnez votre pays');
    if (!data.agreeToTerms) newErrors.agreeToTerms = 'Vous devez accepter les conditions pour continuer';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Applies a change and retires the message for the field it belongs to. */
  const update = (patch: Partial<BasicInfo>) => {
    onChange({ ...data, ...patch });
    setErrors((prev) => {
      const stale = Object.keys(patch).filter((key) => prev[key]);
      if (stale.length === 0) return prev;
      const next = { ...prev };
      for (const key of stale) delete next[key];
      return next;
    });
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
      return;
    }
    // Counts the attempt rather than watching `errors`, so the page only
    // moves when someone presses the button - never while they type.
    setFailedAttempt((n) => n + 1);
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
      ref={formRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-navy-900 mb-2">{t('Informations de base')}</h2>
        <p className="text-content-secondary">{t('Commencez par nous dire qui vous êtes')}</p>
      </div>

      {/* Two-column grid for desktop, single for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Name */}
        <motion.div variants={itemVariants}>
          <FormField
            label={t('Nom de scène')}
            placeholder={t('Votre nom de scène')}
            value={data.stageName}
            onChange={(e) => update({ stageName: e.target.value })}
            error={errors.stageName}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* Birth Date */}
        <motion.div variants={itemVariants}>
          <DatePicker
            label={t('Date de naissance')}
            placeholder="JJ/MM/AAAA"
            value={data.birthDate}
            onChange={(value) => update({ birthDate: value })}
            error={errors.birthDate}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* Last Name */}
        <motion.div variants={itemVariants}>
          <FormField
            label="Nom"
            placeholder={t('Votre nom')}
            value={data.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
            error={errors.lastName}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* First Name */}
        <motion.div variants={itemVariants}>
          <FormField
            label={t('Prénom')}
            placeholder={t('Votre prénom')}
            value={data.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            error={errors.firstName}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* Phone */}
        <motion.div variants={itemVariants}>
          <FormField
            type="tel"
            label={t('Numéro de téléphone')}
            placeholder="+33 (0)6 00 00 00 00"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            error={errors.phone}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* Email */}
        <motion.div variants={itemVariants}>
          <FormField
            type="email"
            label="Adresse e-mail"
            placeholder={t('vous@exemple.com')}
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            error={errors.email}
            required
            disabled={isLoading}
          />
        </motion.div>

        {/* Country */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <SelectWithSearch
            label={t('Choisir un pays')}
            placeholder={t('Sélectionner votre pays')}
            options={COUNTRIES.map(country => ({ value: country, label: country }))}
            value={data.country}
            onChange={(value) => update({ country: value })}
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
                onChange={(e) => update({ password: e.target.value, confirmPassword: data.confirmPassword })}
                placeholder={t('8 caractères minimum, avec majuscule, chiffre et caractère spécial')}
                disabled={isLoading}
                className={`
                  w-full h-12 px-4 pr-12 rounded-card border-2 transition-all
                  ${errors.password ? 'border-[var(--state-critical-line)]' : isPasswordStrong ? 'border-[var(--state-positive-line)]' : 'border-line'}
                  ${isLoading ? 'bg-surface opacity-60' : 'bg-surface-raised'}
                  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-content-secondary hover:text-gold"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {isPasswordStrong && (
              <div className="flex items-center gap-2 text-[var(--state-positive)] text-sm">
                <CheckCircle2 size={16} /> Mot de passe robuste
              </div>
            )}
            {errors.password && (
              <div className="field-error" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errors.password}</span>
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
                onChange={(e) => update({ confirmPassword: e.target.value })}
                placeholder={t('Confirmez votre mot de passe')}
                disabled={isLoading}
                className={`
                  w-full h-12 px-4 pr-12 rounded-card border-2 transition-all
                  ${errors.confirmPassword ? 'border-[var(--state-critical-line)]' : data.confirmPassword && data.password === data.confirmPassword ? 'border-[var(--state-positive-line)]' : 'border-line'}
                  ${isLoading ? 'bg-surface opacity-60' : 'bg-surface-raised'}
                  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-content-secondary hover:text-gold"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {data.confirmPassword && data.password === data.confirmPassword && !errors.confirmPassword && (
              <div className="flex items-center gap-2 text-[var(--state-positive)] text-sm">
                <CheckCircle2 size={16} /> Les mots de passe correspondent
              </div>
            )}
            {errors.confirmPassword && (
              <div className="field-error" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errors.confirmPassword}</span>
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
            onChange={(e) => update({ agreeToTerms: e.target.checked })}
            disabled={isLoading}
            className="w-6 h-6 mt-1 rounded-card border-2 border-line-strong cursor-pointer accent-gold"
          />
          <span className="text-sm text-content-secondary">
            J’accepte les{' '}
            <a href="/terms" target="_blank" className="text-gold font-semibold hover:underline">
              {t('Conditions d’utilisation')}
            </a>{' '}
            et la{' '}
            <a href="/privacy" target="_blank" className="text-gold font-semibold hover:underline">
              {t('Politique de confidentialité')}
            </a>
          </span>
        </label>
        {errors.agreeToTerms && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="field-error mt-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errors.agreeToTerms}</span>
          </motion.p>
        )}
      </motion.div>

      {/* Next Button */}
      <motion.div variants={itemVariants} className="pt-6">
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="btn-gold btn-lg w-full"
        >
          {isLoading ? 'Chargement...' : 'Suivant'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step1BasicInfo;
