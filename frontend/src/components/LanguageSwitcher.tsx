import { useEffect, useRef, useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { LOCALES, useI18n } from '@/i18n'

/**
 * Language switcher.
 *
 * A pair of codes rather than a flag: flags name countries, not languages, and
 * French is not the flag of one country to the people using this. The current
 * language is always visible, so nobody has to open the menu to find out which
 * one they are in.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  if (compact) {
    // Inline row, for the mobile menu where a popover has nowhere to go.
    return (
      <div className="flex items-center gap-2">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            aria-current={l.code === locale}
            className={`px-3 py-1.5 text-sm font-medium rounded-card border transition-colors ${
              l.code === locale
                ? 'border-gold text-gold bg-gold/10'
                : 'border-line text-content-secondary hover:border-gold hover:text-gold'
            }`}
          >
            {l.short}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Langue : ${active.label}`}
        className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-content hover:text-gold transition-colors"
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        {active.short}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 min-w-[10rem] bg-surface-raised border border-line rounded-card shadow-xl py-1 z-50"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === locale}
                onClick={() => {
                  setLocale(l.code)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-content hover:bg-surface-sunken transition-colors"
              >
                <span>{l.label}</span>
                {l.code === locale && (
                  <Check className="w-4 h-4 text-gold" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
