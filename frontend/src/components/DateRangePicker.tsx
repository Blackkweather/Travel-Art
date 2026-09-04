import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS_FR_FULL, WEEKDAYS_FR } from '@/utils/frenchDates';
import { format, parse, startOfMonth, startOfWeek, addDays, addMonths, isSameMonth, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { t } from '@/i18n'

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minDate?: string;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(startDate ? startOfMonth(parse(startDate, 'yyyy-MM-dd', new Date())) : startOfMonth(new Date()));
  const [selectingStart, setSelectingStart] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const minDateObj = minDate ? parse(minDate, 'yyyy-MM-dd', new Date()) : startOfDay(new Date());
  const startDateObj = startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : null;
  const endDateObj = endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const days = [];
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  for (let d = 0; d < 42; d++) {
    days.push(addDays(start, d));
  }

  const selectDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (selectingStart) {
      onStartDateChange(dateStr);
      if (endDateObj && isAfter(date, endDateObj)) {
        onEndDateChange('');
      }
      setSelectingStart(false);
    } else {
      if (startDateObj && isBefore(date, startDateObj)) {
        onStartDateChange(dateStr);
        onEndDateChange('');
        setSelectingStart(false);
      } else {
        onEndDateChange(dateStr);
        setOpen(false);
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!startDateObj || !endDateObj) return false;
    return (isAfter(date, startDateObj) || isSameDay(date, startDateObj)) &&
           (isBefore(date, endDateObj) || isSameDay(date, endDateObj));
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, minDateObj);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="form-label">{t('Date de début')}</label>
          <button
            type="button"
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
            className={`form-input cursor-pointer flex w-full items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={startDate ? 'text-navy' : 'text-content-secondary'}>
              {startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : t('Choisir la date de début')}
            </span>
            <Calendar className="w-4 h-4 text-content-secondary" />
          </button>
        </div>
        <div className="flex-1">
          <label className="form-label">{t('Date de fin')}</label>
          <button
            type="button"
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
            className={`form-input cursor-pointer flex w-full items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={endDate ? 'text-navy' : 'text-content-secondary'}>
              {endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : t('Choisir la date de fin')}
            </span>
            <Calendar className="w-4 h-4 text-content-secondary" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 bg-surface-raised rounded-card shadow-xl border border-line p-4 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 hover:bg-surface-sunken rounded-card transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-content-secondary" />
              </button>
              <h3 className="font-semibold text-content">
                {MONTHS_FR_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 hover:bg-surface-sunken rounded-card transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-content-secondary" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS_FR.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-content-secondary py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const inMonth = isSameMonth(day, currentMonth);
                const isStart = startDateObj && isSameDay(day, startDateObj);
                const isEnd = endDateObj && isSameDay(day, endDateObj);
                const inRange = isDateInRange(day);
                const disabled = isDateDisabled(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => !disabled && selectDate(day)}
                    disabled={disabled}
                    className={`
                      h-10 rounded-card text-sm transition-colors
                      ${!inMonth ? 'text-content-secondary' : ''}
                      ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gold/10 cursor-pointer'}
                      ${isStart || isEnd
                        ? 'bg-gold text-off-black font-semibold'
                        : inRange
                        ? 'bg-gold/20 text-navy'
                        : inMonth
                        ? 'text-content'
                        : 'text-content-secondary'}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
              <div className="text-xs text-content-secondary">
                {selectingStart ? t('Sélectionnez la date de début') : t('Sélectionnez la date de fin')}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-content-secondary hover:text-content transition-colors"
              >
                {t('Fermer')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;

