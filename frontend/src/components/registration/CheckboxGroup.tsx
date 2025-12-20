import React from 'react';
import { motion } from 'framer-motion';

interface CheckboxProps {
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string, checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  value,
  label,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <motion.label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer mb-4 last:mb-0 group"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange(value, e.target.checked)}
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
            w-6 h-6 rounded-lg border-2 flex items-center justify-center
            transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-gold'}
          `}
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.div>
      </div>
      <span className={`text-base font-medium ${checked ? 'text-navy-900' : 'text-gray-700'}`}>
        {label}
      </span>
    </motion.label>
  );
};

interface CheckboxGroupProps {
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  layout?: 'vertical' | 'grid';
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  label,
  options,
  values,
  onChange,
  required = false,
  error,
  disabled = false,
  layout = 'vertical'
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...values, value]);
    } else {
      onChange(values.filter(v => v !== value));
    }
  };

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

        <div className={layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
          {options.map((option, index) => (
            <Checkbox
              key={option.value}
              id={`${name}-${index}`}
              name={name}
              value={option.value}
              label={option.label}
              checked={values.includes(option.value)}
              onChange={handleChange}
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

export default CheckboxGroup;
