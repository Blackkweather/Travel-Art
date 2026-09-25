import { RefObject, useEffect } from 'react'

/**
 * Bring the first validation error into view after a failed submit.
 *
 * The artist steps validate only on submit, and the button sits below a
 * two-column grid: on a laptop the first error lands roughly 700px above the
 * fold, so pressing "Suivant" on an empty form looked like it did nothing at
 * all. The messages were there and correctly worded - nobody could see them.
 *
 * It keys on an attempt counter, not on the errors object: errors also change
 * when a field is corrected, and scrolling the page while someone is typing is
 * worse than the bug this fixes.
 *
 * Focus follows the scroll onto the field itself rather than the message about
 * it, so a keyboard or screen-reader user lands somewhere they can type. The
 * message is already role="alert", so it is announced either way.
 */
export default function useRevealFirstError(
  attempt: number,
  containerRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (attempt === 0) return

    const container = containerRef.current
    const alert = container?.querySelector<HTMLElement>('[role="alert"]')
    if (!alert) return

    alert.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Walk up from the message until an ancestor also holds a control - that is
    // the field this error belongs to, without depending on any class name.
    let node: HTMLElement | null = alert
    while (node && node !== container) {
      node = node.parentElement
      const field = node?.querySelector<HTMLElement>('input, select, textarea')
      if (field) {
        field.focus({ preventScroll: true })
        return
      }
    }
  }, [attempt, containerRef])
}
