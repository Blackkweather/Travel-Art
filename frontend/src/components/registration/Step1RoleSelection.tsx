import React from 'react';
import { motion } from 'framer-motion';
import { User, Building, CheckCircle2 } from 'lucide-react';

interface Step1Props {
  role: 'ARTIST' | 'HOTEL';
  onChange: (role: 'ARTIST' | 'HOTEL') => void;
  onNext: () => void;
  isLoading?: boolean;
}

const Step1RoleSelection: React.FC<Step1Props> = ({ role, onChange, onNext, isLoading = false }) => {
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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-navy mb-2">Choisissez votre rôle</h2>
        <p className="text-gray-600">Êtes-vous un artiste ou un hôtel&nbsp;?</p>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Artist Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('ARTIST')}
          disabled={isLoading}
          className={`
            relative p-8 rounded-2xl border-2 transition-all duration-300
            ${role === 'ARTIST'
              ? 'border-gold bg-gold/5 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center mx-auto
                transition-colors
                ${role === 'ARTIST' ? 'bg-gold/20' : 'bg-gray-100'}
              `}
            >
              <User className={`w-8 h-8 ${role === 'ARTIST' ? 'text-gold' : 'text-gray-400'}`} />
            </motion.div>
            <div>
              <h3 className={`text-xl font-semibold ${role === 'ARTIST' ? 'text-gold' : 'text-navy'}`}>
                Artiste
              </h3>
              <p className="text-sm text-gray-600 mt-1">Interpréter & créer</p>
            </div>
          </div>
          {role === 'ARTIST' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 w-6 h-6 bg-gold rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </motion.button>

        {/* Hotel Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('HOTEL')}
          disabled={isLoading}
          className={`
            relative p-8 rounded-2xl border-2 transition-all duration-300
            ${role === 'HOTEL'
              ? 'border-gold bg-gold/5 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center mx-auto
                transition-colors
                ${role === 'HOTEL' ? 'bg-gold/20' : 'bg-gray-100'}
              `}
            >
              <Building className={`w-8 h-8 ${role === 'HOTEL' ? 'text-gold' : 'text-gray-400'}`} />
            </motion.div>
            <div>
              <h3 className={`text-xl font-semibold ${role === 'HOTEL' ? 'text-gold' : 'text-navy'}`}>
                Hôtel
              </h3>
              <p className="text-sm text-gray-600 mt-1">Accueillir & divertir</p>
            </div>
          </div>
          {role === 'HOTEL' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 w-6 h-6 bg-gold rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </motion.button>
      </motion.div>

      {/* Next Button */}
      <motion.div variants={itemVariants} className="pt-6">
        <button
          onClick={onNext}
          disabled={isLoading}
          className={`
            w-full h-14 rounded-xl font-bold text-lg transition-all
            bg-gold hover:bg-gold/90 text-navy
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

export default Step1RoleSelection;
