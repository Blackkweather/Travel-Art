import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import SelectWithSearch from './SelectWithSearch';
import RadioGroup from './RadioGroup';
import { SubcategoryInfo, SUBCATEGORY_MAP } from '@/types/artistRegistration';

interface Step3Props {
  mainCategory: string;
  data: SubcategoryInfo;
  onChange: (data: SubcategoryInfo) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const Step3SubcategorySelection: React.FC<Step3Props> = ({
  mainCategory,
  data,
  onChange,
  onNext,
  onBack,
  isLoading = false
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available category types for the selected main category
  const categoryTypeOptions = useMemo(() => {
    const categoryMap = SUBCATEGORY_MAP[mainCategory];
    if (!categoryMap) return [];
    return Object.keys(categoryMap).map(key => ({
      value: key,
      label: key
    }));
  }, [mainCategory]);

  // Get available specific categories based on selected category type
  const specificCategoryOptions = useMemo(() => {
    const categoryMap = SUBCATEGORY_MAP[mainCategory];
    if (!categoryMap || !data.categoryType) return [];
    const specificCategories = categoryMap[data.categoryType] || [];
    return specificCategories.map(cat => ({
      value: cat,
      label: cat
    }));
  }, [mainCategory, data.categoryType]);

  // Get domain options based on specific category
  const domainOptions = useMemo(() => {
    // For most categories, the specific category IS the domain option
    // This mapping handles cases where domain options differ from specific categories
    const domainMap: Record<string, string[]> = {
      // Music domains (based on category type)
      'Performer': ['Saxophone', 'Chant', 'Flûte', 'Piano', 'Guitare', 'Basse', 'Contrebasse', 'Violon', 'Trompette', 'Batterie', 'Harmonica'],
      'DJ': ['DJ & Saxophone', 'DJ Live'],
      'Solo': ['Chant', 'Guitare - voix', 'Piano-voix'],
      'Groupe de musique': ['Duo', 'Trio', 'Quartet', 'Quintet'],
      'Univers Artistique': ['Arts & craft', 'Cirque', 'Magie', 'Humour', 'Danse'],

      // Visual/Circus/Magic/Humor/Dance domains
      'Arts & craft': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques'],
      'Visuel': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques'],
      'Cirque': ['Acrobatie', 'Jonglage', 'Equilibre', 'Mât chinois', 'Aérien / Tissu'],
      'Magie': ['Happening / Close-up', 'Spectacle / Close-up', 'Spectacle', 'Mentalisme'],
      'Humour': ['Visuel & Mime', 'Stand-up / One-man'],
      'Danse': ['Salon', 'Salsa / Bachata', 'Hip-Hop', 'Moderne jazz'],

      // Family domains
      'Magie pour enfants': ['Spectacle', 'Close-up', 'Initiation'],
      'Sculpture de bulles': ['Spectacle', 'Happening'],
      'Conte': ['Conte', 'Poésie'],
      'Chant': ['Atelier éveil musical', 'Mini-concert enfants'],
      'Arts & craft Famille': ['Arts plastiques', 'Dessin', 'Ateliers parents-enfants']
    };

    // First try specific category, then fallback to category type
    const domains = domainMap[data.specificCategory] || domainMap[data.categoryType] || [];
    return domains.map(domain => ({
      value: domain,
      label: domain
    }));
  }, [data.categoryType, data.specificCategory]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!data.categoryType) newErrors.categoryType = 'Le type de catégorie est obligatoire';
    if (!data.domain) newErrors.domain = 'Le domaine est obligatoire';

    // Only require specific category if options are available
    if (specificCategoryOptions.length > 0 && !data.specificCategory) {
      newErrors.specificCategory = 'La sous-catégorie est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  // Reset domain when category type changes
  const handleCategoryTypeChange = (value: string) => {
    onChange({
      ...data,
      categoryType: value,
      specificCategory: '',
      domain: ''
    });
  };

  // Reset domain when specific category changes
  const handleSpecificCategoryChange = (value: string) => {
    onChange({
      ...data,
      specificCategory: value,
      domain: ''
    });
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
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Sous-catégories</h2>
        <p className="text-gray-600">
          Spécifiez votre domaine pour <span className="font-semibold">{mainCategory}</span>
        </p>
      </div>

      {/* Category Type Selection */}
      <motion.div variants={itemVariants}>
        <SelectWithSearch
          label="Tribu Artistique"
          placeholder="Sélectionner le type de catégorie"
          options={categoryTypeOptions}
          value={data.categoryType}
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
            value={data.specificCategory}
            onChange={handleSpecificCategoryChange}
            error={errors.specificCategory}
            required={specificCategoryOptions.length > 0}
            disabled={isLoading || !data.categoryType}
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
            value={data.domain}
            onChange={(value) => onChange({ ...data, domain: value })}
            error={errors.domain}
            required
            disabled={isLoading || !data.categoryType}
          />
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
            bg-gold hover:bg-gold/90 text-navy-900
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
          `}
        >
          {isLoading ? 'Chargement...' : 'Terminer'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step3SubcategorySelection;
