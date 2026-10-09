import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Search, AlertCircle } from 'lucide-react';
import { t } from '@/i18n'

interface SelectWithSearchProps {
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const SelectWithSearch: React.FC<SelectWithSearchProps> = ({
  label,
  placeholder = t('Sélectionner une option'),
  options,
  value,
  onChange,
  error,
  required = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="form-label flex items-center gap-2">
          <span>{label}</span>
          {required && <span className="text-gold -ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <motion.button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full h-12 px-4 rounded-card border-2 transition-all
            flex items-center justify-between text-left
            ${disabled ? 'bg-surface cursor-not-allowed opacity-60' : 'bg-surface-raised hover:border-gold'}
            ${error ? 'border-[var(--state-critical-line)]' : isOpen ? 'border-gold' : 'border-line'}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className={selectedOption ? 'text-navy-900 font-medium' : 'text-content-secondary'}>
            {selectedOption?.label || placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} className="text-gold" />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface-raised border-2 border-gold rounded-card shadow-lg z-50"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-line">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-secondary" />
                <input
                  type="text"
                  placeholder={t('Rechercher…')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-card focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    whileHover={{ backgroundColor: '#FAF8F5' }}
                    className={`
                      w-full text-left px-4 py-3 transition-colors
                      ${value === option.value ? 'bg-gold/10 border-l-4 border-gold font-medium text-navy-900' : 'text-content-secondary'}
                    `}
                  >
                    {option.label}
                  </motion.button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-content-secondary">
                  {t('Aucune option trouvée')}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="field-error"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default SelectWithSearch;
