import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, isSameMonth, isSameDay } from 'date-fns';

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
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={`
            w-full h-12 px-4 rounded-xl border-2 transition-all flex items-center justify-between
            ${error ? 'border-red-400' : 'border-gray-200'}
            ${disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
          `}
        >
          <span className={`${value ? 'text-navy-900' : 'text-gray-500'}`}>{value || placeholder}</span>
          <Calendar className="w-5 h-5 text-gray-500" />
        </button>

        <AnimatePresence>
          {open && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-full bg-white border-2 border-gold rounded-xl shadow-xl"
            >
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
                  className="p-2 rounded-lg hover:bg-gold/10 text-navy-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-semibold text-navy-900">{format(currentMonth, 'MMMM yyyy')}</div>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-2 rounded-lg hover:bg-gold/10 text-navy-900"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
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
                        ${selected ? 'bg-gold text-white font-semibold' : inMonth ? 'text-navy-900' : 'text-gray-400'}
                        hover:bg-gold/10 hover:text-navy-900 transition-colors
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
