import React from 'react';
import { motion } from 'framer-motion';

interface RadioButtonProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  name,
  value,
  label,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <motion.label
      className="flex items-center gap-3 cursor-pointer mb-4 last:mb-0 group"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
    >
      <div className="relative">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          disabled={disabled}
          className="sr-only"
        />
        <motion.div
          initial={false}
          animate={{
            backgroundColor: checked ? '#F0B429' : '#FFF',
            borderColor: checked ? '#F0B429' : '#E5E7EB',
            scale: checked ? 1 : 1
          }}
          transition={{ duration: 0.2 }}
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-gold'}
          `}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 bg-white rounded-full"
            />
          )}
        </motion.div>
      </div>
      <span className={`text-base font-medium ${checked ? 'text-navy-900' : 'text-gray-700'}`}>
        {label}
      </span>
    </motion.label>
  );
};

interface RadioGroupProps {
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  required = false,
  error,
  disabled = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-beige-50 rounded-2xl p-6 border-2 border-beige-100">
        {label && (
          <label className="block text-lg font-semibold text-navy-900 mb-4">
            {label}
            {required && <span className="text-gold ml-2">*</span>}
          </label>
        )}

        <div className="space-y-3">
          {options.map((option) => (
            <RadioButton
              key={option.value}
              name={name}
              value={option.value}
              label={option.label}
              checked={value === option.value}
              onChange={onChange}
              disabled={disabled}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default RadioGroup;
