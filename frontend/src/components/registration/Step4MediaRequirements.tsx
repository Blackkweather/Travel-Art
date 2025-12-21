import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import FormField from '../FormField';
import { MediaRequirements } from '@/types/artistRegistration';
import { AlertCircle, Link as LinkIcon, Image as ImageIcon, Guitar as GuitarIcon, Instagram, Facebook, Youtube } from 'lucide-react';

interface Step4Props {
  data: MediaRequirements;
  onChange: (data: MediaRequirements) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const Step4MediaRequirements: React.FC<Step4Props> = ({ data, onChange, onNext, onBack, isLoading = false }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (!data.profileImageUrl) newErrors.profileImageUrl = 'Photo de profil obligatoire';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const instrumentsText = useMemo(() => (data.travelInstruments || []).join('\n'), [data.travelInstruments]);
  const linksText = useMemo(() => (data.performanceLinks || []).join('\n'), [data.performanceLinks]);

  const handleInstrumentsChange = (value: string) => {
    const items = value
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean);
    onChange({ ...data, travelInstruments: items });
  };

  const handleLinksChange = (value: string) => {
    const items = value
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean);
    onChange({ ...data, performanceLinks: items });
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
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Instruments & Liens</h2>
        <p className="text-gray-600">Indiquez vos instruments et vos liens de performance</p>
      </div>

      <motion.div variants={itemVariants} className="space-y-4">
        <FormField
          label="Photo de profil (URL)"
          placeholder="https://..."
          value={data.profileImageUrl}
          onChange={(e) => onChange({ ...data, profileImageUrl: (e.target as HTMLInputElement).value })}
          error={errors.profileImageUrl}
          icon={<ImageIcon className="w-5 h-5" />}
          disabled={isLoading}
        />
        {errors.profileImageUrl && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {errors.profileImageUrl}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <label className="form-input-label flex items-center gap-2">
          <GuitarIcon className="w-4 h-4" />
          Instruments avec lesquels je voyage
        </label>
        <textarea
          className="form-input h-32 resize-y"
          placeholder="Listez vos instruments (un par ligne ou séparés par des virgules)"
          value={instrumentsText}
          onChange={(e) => handleInstrumentsChange((e.target as HTMLTextAreaElement).value)}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <label className="form-input-label flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Liens de performance
        </label>
        <textarea
          className="form-input h-32 resize-y"
          placeholder="Ajoutez des liens de performances (un par ligne ou séparés par des virgules)"
          value={linksText}
          onChange={(e) => handleLinksChange((e.target as HTMLTextAreaElement).value)}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Instagram"
          placeholder="https://instagram.com/..."
          value={data.instagram || ''}
          onChange={(e) => onChange({ ...data, instagram: (e.target as HTMLInputElement).value })}
          icon={<Instagram className="w-5 h-5" />}
          disabled={isLoading}
        />
        <FormField
          label="Facebook"
          placeholder="https://facebook.com/..."
          value={data.facebook || ''}
          onChange={(e) => onChange({ ...data, facebook: (e.target as HTMLInputElement).value })}
          icon={<Facebook className="w-5 h-5" />}
          disabled={isLoading}
        />
        <FormField
          label="YouTube"
          placeholder="https://youtube.com/..."
          value={data.youtube || ''}
          onChange={(e) => onChange({ ...data, youtube: (e.target as HTMLInputElement).value })}
          icon={<Youtube className="w-5 h-5" />}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-3 pt-4">
        {Object.keys(errors).length > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Veuillez corriger les erreurs avant de continuer</span>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-4 pt-2">
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

export default Step4MediaRequirements;
