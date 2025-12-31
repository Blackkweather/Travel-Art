import React from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2 } from 'lucide-react';
import { BasicInfo, ArtisticCategory, SubcategoryInfo } from '@/types/artistRegistration';

interface Step3Props {
  basicInfo: BasicInfo;
  artisticCategory: ArtisticCategory;
  subcategory: SubcategoryInfo;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const Step3Confirmation: React.FC<Step3Props> = ({
  basicInfo,
  artisticCategory,
  subcategory,
  onEdit,
  onSubmit,
  isLoading = false
}) => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseigné';
    // Assuming format is DD/MM/YYYY
    return dateString;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Confirmation</h2>
        <p className="text-gray-600">Vérifiez vos informations avant de finaliser votre inscription</p>
      </div>

      {/* Basic Info Section */}
      <motion.div variants={itemVariants} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-navy-900">Informations personnelles</h3>
          <button
            onClick={() => onEdit(1)}
            disabled={isLoading}
            className="flex items-center gap-2 text-teal-500 hover:text-teal-600 font-medium transition-colors disabled:opacity-50"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nom de scène</p>
            <p className="text-gray-900 font-medium">{basicInfo.stageName || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Prénom</p>
            <p className="text-gray-900 font-medium">{basicInfo.firstName || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Nom</p>
            <p className="text-gray-900 font-medium">{basicInfo.lastName || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Date de naissance</p>
            <p className="text-gray-900 font-medium">{formatDate(basicInfo.birthDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="text-gray-900 font-medium">{basicInfo.email || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Téléphone</p>
            <p className="text-gray-900 font-medium">{basicInfo.phone || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Pays</p>
            <p className="text-gray-900 font-medium">{basicInfo.country || 'Non renseigné'}</p>
          </div>
        </div>
      </motion.div>

      {/* Artistic Category Section */}
      <motion.div variants={itemVariants} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-navy-900">Catégorie artistique</h3>
          <button
            onClick={() => onEdit(2)}
            disabled={isLoading}
            className="flex items-center gap-2 text-teal-500 hover:text-teal-600 font-medium transition-colors disabled:opacity-50"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Catégorie principale</p>
            <p className="text-gray-900 font-medium">{artisticCategory.mainCategory || 'Non renseigné'}</p>
          </div>
          {artisticCategory.secondaryCategory && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Catégorie secondaire</p>
              <p className="text-gray-900 font-medium">{artisticCategory.secondaryCategory}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Type de public</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {artisticCategory.audienceType.length > 0 ? (
                artisticCategory.audienceType.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">Non renseigné</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tribu Artistique</p>
            <p className="text-gray-900 font-medium">{subcategory.categoryType || 'Non renseigné'}</p>
          </div>
          {subcategory.specificCategory && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Sous-catégorie</p>
              <p className="text-gray-900 font-medium">{subcategory.specificCategory}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Domaine</p>
            <p className="text-gray-900 font-medium">{subcategory.domain || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Langues parlées</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {artisticCategory.languages.length > 0 ? (
                artisticCategory.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">Non renseigné</p>
              )}
            </div>
          </div>
          {artisticCategory.otherLanguages && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Autres langues</p>
              <p className="text-gray-900 font-medium">{artisticCategory.otherLanguages}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Terms Confirmation */}
      <motion.div variants={itemVariants} className="flex items-start gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
        <Check className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          J'ai lu et j'accepte les{' '}
          <a href="/terms" className="text-teal-600 hover:underline font-medium">
            conditions générales d'utilisation
          </a>{' '}
          et la{' '}
          <a href="/privacy" className="text-teal-600 hover:underline font-medium">
            politique de confidentialité
          </a>
        </p>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div variants={itemVariants} className="pt-6 flex gap-4">
        <button
          onClick={() => onEdit(2)}
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
          onClick={onSubmit}
          disabled={isLoading || !basicInfo.agreeToTerms}
          className={`
            flex-1 h-14 rounded-xl font-bold text-lg transition-all
            bg-teal-500 hover:bg-teal-600 text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl hover:scale-[1.02]
            flex items-center justify-center gap-2
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Inscription en cours...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Confirmer l'inscription</span>
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Step3Confirmation;


