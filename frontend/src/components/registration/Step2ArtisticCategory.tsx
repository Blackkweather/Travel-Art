import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SelectWithSearch from './SelectWithSearch';
import CheckboxGroup from './CheckboxGroup';
import RadioGroup from './RadioGroup';
import { ArtisticCategory, SubcategoryInfo, MAIN_CATEGORIES, AUDIENCE_TYPES, LANGUAGES, SUBCATEGORY_MAP } from '@/types/artistRegistration';
import useRevealFirstError from '@/hooks/useRevealFirstError';
import { t } from '@/i18n'

interface Step2Props {
  data: ArtisticCategory;
  subcategoryData: SubcategoryInfo;
  onChange: (data: ArtisticCategory) => void;
  onSubcategoryChange: (data: SubcategoryInfo) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const Step2ArtisticCategory: React.FC<Step2Props> = ({ 
  data, 
  subcategoryData, 
  onChange, 
  onSubcategoryChange, 
  onNext, 
  onBack, 
  isLoading = false 
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedAttempt, setFailedAttempt] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useRevealFirstError(failedAttempt, formRef);

  // Get available category types for the selected main category
  const categoryTypeOptions = useMemo(() => {
    const categoryMap = SUBCATEGORY_MAP[data.mainCategory];
    if (!categoryMap) return [];
    return Object.keys(categoryMap).map(key => ({
      value: key,
      label: key
    }));
  }, [data.mainCategory]);

  // Get available specific categories based on selected category type
  const specificCategoryOptions = useMemo(() => {
    const categoryMap = SUBCATEGORY_MAP[data.mainCategory];
    if (!categoryMap || !subcategoryData.categoryType) return [];
    const specificCategories = categoryMap[subcategoryData.categoryType] || [];
    return specificCategories.map(cat => ({
      value: cat,
      label: cat
    }));
  }, [data.mainCategory, subcategoryData.categoryType]);

  // Get domain options based on specific category
  const domainOptions = useMemo(() => {
    const domainMap: Record<string, string[]> = {
      'Performer': ['Saxophone', 'Chant', 'Flûte', 'Piano', 'Guitare', 'Basse', 'Contrebasse', 'Violon', 'Trompette', 'Batterie', 'Harmonica'],
      'DJ': ['DJ & Saxophone', 'DJ Live'],
      'Solo': ['Chant', 'Guitare - voix', 'Piano-voix'],
      'Groupe de musique': ['Duo', 'Trio', 'Quartet', 'Quintet'],
      'Univers Artistique': ['Arts & craft', 'Cirque', 'Magie', 'Humour', 'Danse'],
      'Arts & craft': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques'],
      'Visuel': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques'],
      'Cirque': ['Acrobatie', 'Jonglage', 'Equilibre', 'Mât chinois', 'Aérien / Tissu'],
      'Magie': ['Happening / Close-up', 'Spectacle / Close-up', 'Spectacle', 'Mentalisme'],
      'Humour': ['Visuel & Mime', 'Stand-up / One-man'],
      'Danse': ['Salon', 'Salsa / Bachata', 'Hip-Hop', 'Moderne jazz'],
      'Magie pour enfants': ['Spectacle', 'Close-up', 'Initiation'],
      'Sculpture de bulles': ['Spectacle', 'Happening'],
      'Conte': ['Conte', 'Poésie'],
      'Chant': ['Atelier éveil musical', 'Mini-concert enfants'],
      'Arts & craft Famille': ['Arts plastiques', 'Dessin', 'Ateliers parents-enfants']
    };

    const domains = domainMap[subcategoryData.specificCategory] || domainMap[subcategoryData.categoryType] || [];
    return domains.map(domain => ({
      value: domain,
      label: domain
    }));
  }, [subcategoryData.categoryType, subcategoryData.specificCategory]);

  const collectErrors = () => {
    const newErrors: Record<string, string> = {};

    if (!data.mainCategory) newErrors.mainCategory = t('Choisissez une catégorie principale');
    if (data.audienceType.length === 0) newErrors.audienceType = t('Sélectionnez au moins un type de public');
    if (!subcategoryData.categoryType) newErrors.categoryType = t('Choisissez un type de catégorie');
    if (!subcategoryData.domain) newErrors.domain = 'Choisissez un domaine';
    if (specificCategoryOptions.length > 0 && !subcategoryData.specificCategory) {
      newErrors.specificCategory = t('Choisissez une catégorie précise');
    }
    if (data.languages.length === 0) newErrors.languages = t('Sélectionnez au moins une langue');

    return newErrors;
  };

  const validateStep = () => {
    const newErrors = collectErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset domain when category type changes
  const handleCategoryTypeChange = (value: string) => {
    onSubcategoryChange({
      ...subcategoryData,
      categoryType: value,
      specificCategory: '',
      domain: ''
    });
  };

  // Reset domain when specific category changes
  const handleSpecificCategoryChange = (value: string) => {
    onSubcategoryChange({
      ...subcategoryData,
      specificCategory: value,
      domain: ''
    });
  };

  useEffect(() => {
    setErrors((prev) => {
      const shown = Object.keys(prev);
      if (shown.length === 0) return prev;
      const live = collectErrors();
      const next: Record<string, string> = {};
      for (const key of shown) if (live[key]) next[key] = prev[key];
      return Object.keys(next).length === shown.length ? prev : next;
    });
    // Never adds a message, only drops ones already on screen, so nothing new
    // appears while someone is still filling the step in.
  }, [data, subcategoryData]);

  const handleNext = () => {
    if (validateStep()) {
      onNext();
      return;
    }
    // Counts the attempt rather than watching `errors`, so the page only
    // moves when someone presses the button - never while they type.
    setFailedAttempt((n) => n + 1);
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
      ref={formRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-navy-900 mb-2">{t('Catégorie artistique')}</h2>
        <p className="text-content-secondary">{t('Décrivez votre domaine artistique')}</p>
      </div>

      {/* Section 1: Main Category */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-navy-900 mb-4">
            {t('Choisissez votre catégorie principale')}
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
            {t('Précisez un autre domaine si vous en avez un')}
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
          label={t('Type de public')}
          options={AUDIENCE_TYPES}
          values={data.audienceType}
          onChange={(values) => onChange({ ...data, audienceType: values })}
          required
          error={errors.audienceType}
          disabled={isLoading}
          layout="grid"
        />
      </motion.div>

      {/* Section 4: Subcategory Selection */}
      {data.mainCategory && (
        <>
          {/* Category Type Selection */}
          <motion.div variants={itemVariants}>
            <SelectWithSearch
              label="Tribu Artistique"
              placeholder={t('Sélectionner le type de catégorie')}
              options={categoryTypeOptions}
              value={subcategoryData.categoryType}
              onChange={handleCategoryTypeChange}
              error={errors.categoryType}
              required
              disabled={isLoading}
            />
          </motion.div>

          {/* Specific Category Selection (if options available) */}
          {specificCategoryOptions.length > 0 && (
            <motion.div variants={itemVariants}>
              <SelectWithSearch
                label={t('Sous-catégorie')}
                placeholder={t('Sélectionner une sous-catégorie')}
                options={specificCategoryOptions}
                value={subcategoryData.specificCategory}
                onChange={handleSpecificCategoryChange}
                error={errors.specificCategory}
                required={specificCategoryOptions.length > 0}
                disabled={isLoading || !subcategoryData.categoryType}
              />
            </motion.div>
          )}

          {/* Domain Selection */}
          {domainOptions.length > 0 && (
            <motion.div variants={itemVariants}>
              <RadioGroup
                name="domain"
                label="Domaine"
                options={domainOptions}
                value={subcategoryData.domain}
                onChange={(value) => onSubcategoryChange({ ...subcategoryData, domain: value })}
                error={errors.domain}
                required
                disabled={isLoading || !subcategoryData.categoryType}
              />
            </motion.div>
          )}
        </>
      )}

      {/* Section 5: Languages */}
      <motion.div variants={itemVariants}>
        <CheckboxGroup
          name="languages"
          label={t('Langues parlées')}
          options={LANGUAGES}
          values={data.languages}
          onChange={(values) => onChange({ ...data, languages: values })}
          required
          error={errors.languages}
          disabled={isLoading}
          layout="grid"
        />
      </motion.div>

      {/* Section 6: Other Languages Input */}
      {data.languages.includes('Autre') && (
        <motion.div 
          variants={itemVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-content">
              {t('Autres langues (précisez)')}
            </label>
            <input
              type="text"
              value={data.otherLanguages || ''}
              onChange={(e) => onChange({ ...data, otherLanguages: e.target.value })}
              placeholder="Ex: Espagnol, Italien, Allemand..."
              disabled={isLoading}
              className={`
                w-full h-12 px-4 rounded-card border-2 transition-all
                border-line
                ${isLoading ? 'bg-surface opacity-60 cursor-not-allowed' : 'bg-surface-raised'}
                focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
                text-content placeholder:text-content-secondary
              `}
            />
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <motion.div variants={itemVariants} className="pt-6 flex gap-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="btn-outline btn-lg flex-1"
        >
          {t('Retour')}
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="btn-gold btn-lg flex-1 btn-arrow"
        >
          {isLoading ? 'Chargement...' : 'Suivant'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step2ArtisticCategory;
