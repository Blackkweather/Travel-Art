import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SelectWithSearch from './SelectWithSearch';
import CheckboxGroup from './CheckboxGroup';
import { ArtisticCategory, MAIN_CATEGORIES, AUDIENCE_TYPES, LANGUAGES } from '@/types/artistRegistration';

interface Step2Props {
  data: ArtisticCategory;
  onChange: (data: ArtisticCategory) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const Step2ArtisticCategory: React.FC<Step2Props> = ({ data, onChange, onNext, onBack, isLoading = false }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!data.mainCategory) newErrors.mainCategory = 'Main category is required';
    if (data.audienceType.length === 0) newErrors.audienceType = 'Select at least one audience type';
    if (data.languages.length === 0) newErrors.languages = 'Select at least one language';

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
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Catégorie artistique</h2>
        <p className="text-gray-600">Décrivez votre domaine artistique</p>
      </div>

      {/* Section 1: Main Category */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-navy-900 mb-4">
            Choisissez votre catégorie principale
          </h3>
          <SelectWithSearch
            placeholder="Tribu Artistique"
            options={MAIN_CATEGORIES}
            value={data.mainCategory}
            onChange={(value) => onChange({ ...data, mainCategory: value })}
            error={errors.mainCategory}
            required
            disabled={isLoading}
          />
        </div>
      </motion.div>

      {/* Section 2: Secondary Category */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-navy-900 mb-4">
            Précisez un autre domaine si vous en avez un
          </h3>
          <SelectWithSearch
            placeholder="Tribu Artistique (optionnel)"
            options={MAIN_CATEGORIES}
            value={data.secondaryCategory || ''}
            onChange={(value) => onChange({ ...data, secondaryCategory: value || undefined })}
            disabled={isLoading}
          />
        </div>
      </motion.div>

      {/* Section 3: Audience Type */}
      <motion.div variants={itemVariants}>
        <CheckboxGroup
          name="audienceType"
          label="Type de public"
          options={AUDIENCE_TYPES}
          values={data.audienceType}
          onChange={(values) => onChange({ ...data, audienceType: values })}
          required
          error={errors.audienceType}
          disabled={isLoading}
          layout="grid"
        />
      </motion.div>

      {/* Section 4: Languages */}
      <motion.div variants={itemVariants}>
        <CheckboxGroup
          name="languages"
          label="Langues parlées"
          options={LANGUAGES}
          values={data.languages}
          onChange={(values) => onChange({ ...data, languages: values })}
          required
          error={errors.languages}
          disabled={isLoading}
          layout="grid"
        />
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div variants={itemVariants} className="pt-6 flex gap-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className={`
            flex-1 h-14 rounded-xl font-bold text-lg transition-all
            bg-gray-200 hover:bg-gray-300 text-navy-900
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
          `}
        >
          Retour
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className={`
            flex-1 h-14 rounded-xl font-bold text-lg transition-all
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

export default Step2ArtisticCategory;
