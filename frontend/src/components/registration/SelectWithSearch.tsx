import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

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
  placeholder = 'Sélectionner une option',
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
        <label className="block text-sm font-medium text-navy-900">
          {label}
          {required && <span className="text-gold ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <motion.button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full h-12 px-4 rounded-xl border-2 transition-all
            flex items-center justify-between text-left
            ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white hover:border-gold'}
            ${error ? 'border-red-400' : isOpen ? 'border-gold' : 'border-gray-200'}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className={selectedOption ? 'text-navy-900 font-medium' : 'text-gray-400'}>
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
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gold rounded-xl shadow-lg z-50"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
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
                      ${value === option.value ? 'bg-gold/10 border-l-4 border-gold font-medium text-navy-900' : 'text-gray-700'}
                    `}
                  >
                    {option.label}
                  </motion.button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  Aucune option trouvée
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
            className="mt-2 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default SelectWithSearch;
