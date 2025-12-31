import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, isSameMonth, isSameDay, getYear, getMonth, setYear, setMonth } from 'date-fns';

// French month names fallback
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_FR_FULL = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, placeholder = 'JJ/MM/AAAA', error, disabled }) => {
  const parsed = useMemo(() => {
    const p = parse(value, 'dd/MM/yyyy', new Date());
    return isValid(p) ? p : new Date(1990, 0, 1);
  }, [value]);

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(parsed));
  const [open, setOpen] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync calendar view when value changes
  useEffect(() => {
    if (value) {
      const parsed = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        setCurrentMonth(startOfMonth(parsed));
      }
    }
  }, [value]);

  // Sync input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Format input as user types (DD/MM/YYYY)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;
    
    // Handle backspace - allow deleting slashes
    if (inputVal.length < inputValue.length) {
      // User is deleting, allow it
      setInputValue(inputVal);
      onChange(inputVal);
      return;
    }
    
    let newValue = inputVal.replace(/\D/g, ''); // Remove non-digits
    
    // Format as DD/MM/YYYY
    if (newValue.length <= 2) {
      newValue = newValue;
    } else if (newValue.length <= 4) {
      newValue = newValue.slice(0, 2) + '/' + newValue.slice(2);
    } else {
      newValue = newValue.slice(0, 2) + '/' + newValue.slice(2, 4) + '/' + newValue.slice(4, 8);
    }
    
    setInputValue(newValue);
    
    // If valid date format, update the value and sync calendar
    if (newValue.length === 10) {
      const parsed = parse(newValue, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        onChange(newValue);
        setCurrentMonth(startOfMonth(parsed));
      } else {
        // Invalid date but keep the format
        onChange(newValue);
      }
    } else if (newValue.length < 10) {
      // Allow partial input
      onChange(newValue);
    }
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfMonth(currentMonth);
    const grid: Date[] = [];
    for (let d = 0; d < 42; d++) {
      grid.push(addDays(start, d));
    }
    return grid;
  }, [currentMonth]);

  const selectDate = (date: Date) => {
    const selected = format(date, 'dd/MM/yyyy');
    onChange(selected);
    setOpen(false);
  };

  return (
    <div className="w-full space-y-2" ref={ref}>
      {label && (
        <motion.label initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-input-label flex items-center gap-2">
          <span>{label}</span>
        </motion.label>
      )}

      <div className="relative">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => !disabled && setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={10}
            className={`
              w-full h-12 px-4 pr-12 rounded-xl border-2 transition-all
              ${error ? 'border-red-400' : 'border-gray-200'}
              ${disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
              ${inputValue ? 'text-gray-900' : 'text-gray-500'}
            `}
          />
          <button
            type="button"
            onClick={() => !disabled && setOpen((o) => !o)}
            disabled={disabled}
            className="absolute right-3 text-gold hover:text-gold/80 transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {open && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-full bg-white border-2 border-gold rounded-xl shadow-xl"
            >
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
                    className="p-2 rounded-lg hover:bg-gold/10 text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMonthPicker(!showMonthPicker);
                        setShowYearPicker(false);
                      }}
                      className="px-3 py-1 rounded-lg hover:bg-gold/10 text-sm font-semibold text-gray-900 transition-colors flex items-center gap-1"
                    >
                      {MONTHS_FR_FULL[getMonth(currentMonth)]}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowYearPicker(!showYearPicker);
                        setShowMonthPicker(false);
                      }}
                      className="px-3 py-1 rounded-lg hover:bg-gold/10 text-sm font-semibold text-gray-900 transition-colors flex items-center gap-1"
                    >
                      {format(currentMonth, 'yyyy')}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                    className="p-2 rounded-lg hover:bg-gold/10 text-gray-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Month Picker */}
                <AnimatePresence>
                  {showMonthPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-3 gap-2 mt-2"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthDate = new Date(currentMonth.getFullYear(), i, 1);
                        const monthName = MONTHS_FR[i];
                        const isSelected = getMonth(currentMonth) === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setCurrentMonth(setMonth(currentMonth, i));
                              setShowMonthPicker(false);
                            }}
                            className={`
                              py-2 px-3 rounded-lg text-sm font-medium transition-colors
                              ${isSelected ? 'bg-gold text-white' : 'bg-gray-100 text-gray-700 hover:bg-gold/20'}
                            `}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Year Picker */}
                <AnimatePresence>
                  {showYearPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto"
                    >
                      {Array.from({ length: 80 }, (_, i) => {
                        const year = new Date().getFullYear() - 70 + i; // Show 70 years before to 10 years after (for birth dates)
                        const isSelected = getYear(currentMonth) === year;
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setCurrentMonth(setYear(currentMonth, year));
                              setShowYearPicker(false);
                            }}
                            className={`
                              py-2 px-3 rounded-lg text-sm font-medium transition-colors
                              ${isSelected ? 'bg-gold text-white' : 'bg-gray-100 text-gray-700 hover:bg-gold/20'}
                            `}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-7 gap-1 px-3 pt-3 text-xs font-medium text-gray-500">
                <div className="text-center">L</div>
                <div className="text-center">M</div>
                <div className="text-center">M</div>
                <div className="text-center">J</div>
                <div className="text-center">V</div>
                <div className="text-center">S</div>
                <div className="text-center">D</div>
              </div>

              <div className="grid grid-cols-7 gap-1 p-3">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, currentMonth);
                  const selected = value && isValid(parse(value, 'dd/MM/yyyy', new Date())) && isSameDay(day, parse(value, 'dd/MM/yyyy', new Date()));
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={`
                        h-10 rounded-lg text-sm
                        ${selected ? 'bg-gold text-white font-semibold' : inMonth ? 'text-gray-900' : 'text-gray-400'}
                        hover:bg-gold/10 hover:text-gray-900 transition-colors
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm text-red-600">
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default DatePicker;
