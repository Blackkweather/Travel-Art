import { useEffect } from 'react'
import { t, useI18n } from '@/i18n'

/**
 * The first thing a keyboard user reaches on any page.
 *
 * It used to point at `#main-content`, an id no page in this app ever sets, so
 * activating it did nothing - and its label was in English on a French-first
 * site. Rather than add that id to the nine components that render a <main>,
 * the link resolves the landmark when it is activated: whichever page is on
 * screen, the first <main> (or failing that the first heading) is the target.
 */
export default function SkipToContent() {
  /* The label was a literal, so it stayed in French when the rest of the site
     switched to English - the very first thing a keyboard user reaches, and
     the one string on the page that never translated. Reading the locale here
     also rebuilds the link when it changes. */
  const { locale } = useI18n()

  useEffect(() => {
    const skipLink = document.createElement('a')
    skipLink.href = '#contenu'
    skipLink.textContent = t('Aller au contenu principal')
    skipLink.className =
      'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 ' +
      'focus:inline-flex focus:items-center focus:min-h-[44px] focus:px-4 focus:py-2 ' +
      'focus:bg-navy focus:text-white focus:rounded-card'

    const skip = (event: MouseEvent | KeyboardEvent) => {
      const target = document.querySelector<HTMLElement>('main') ||
        document.querySelector<HTMLElement>('h1')
      if (!target) return
      event.preventDefault()

      /* A <main> is not focusable by default, so focus would stay on the link
         and the next Tab would carry on through the navigation - the exact
         thing the user asked to skip. tabIndex -1 makes it a focus target
         without adding it to the tab order. */
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    skipLink.addEventListener('click', skip)

    if (document.body) {
      document.body.insertBefore(skipLink, document.body.firstChild)
    }

    return () => {
      skipLink.removeEventListener('click', skip)
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink)
      }
    }
  }, [locale])

  return null
}
