import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import SelectWithSearch from './SelectWithSearch';
import CheckboxGroup from './CheckboxGroup';
import RadioGroup from './RadioGroup';
import { ArtisticCategory, SubcategoryInfo, MAIN_CATEGORIES, AUDIENCE_TYPES, LANGUAGES, SUBCATEGORY_MAP } from '@/types/artistRegistration';

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

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!data.mainCategory) newErrors.mainCategory = 'Main category is required';
    if (data.audienceType.length === 0) newErrors.audienceType = 'Select at least one audience type';
    if (!subcategoryData.categoryType) newErrors.categoryType = 'Category type is required';
    if (!subcategoryData.domain) newErrors.domain = 'Domain is required';
    if (specificCategoryOptions.length > 0 && !subcategoryData.specificCategory) {
      newErrors.specificCategory = 'Specific category is required';
    }
    if (data.languages.length === 0) newErrors.languages = 'Select at least one language';

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

      {/* Section 4: Subcategory Selection */}
      {data.mainCategory && (
        <>
          {/* Category Type Selection */}
          <motion.div variants={itemVariants}>
            <SelectWithSearch
              label="Tribu Artistique"
              placeholder="Sélectionner le type de catégorie"
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
                label="Sous-catégorie"
                placeholder="Sélectionner une sous-catégorie"
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

      {/* Section 6: Other Languages Input */}
      {data.languages.includes('Autre') && (
        <motion.div 
          variants={itemVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Autres langues (précisez)
            </label>
            <input
              type="text"
              value={data.otherLanguages || ''}
              onChange={(e) => onChange({ ...data, otherLanguages: e.target.value })}
              placeholder="Ex: Espagnol, Italien, Allemand..."
              disabled={isLoading}
              className={`
                w-full h-12 px-4 rounded-xl border-2 transition-all
                border-gray-200
                ${isLoading ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'bg-white'}
                focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500
                text-gray-900 placeholder:text-gray-400
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
            bg-teal-500 hover:bg-teal-600 text-white
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
