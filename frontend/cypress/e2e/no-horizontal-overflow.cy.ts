/**
 * A page that scrolls sideways on a phone is the most common way a responsive
 * layout fails, and it is invisible in review until content gets clipped. This
 * asserts it cannot happen, and names the offending elements when it does.
 */
const ROUTES = [
  '/',
  '/how-it-works',
  '/partners',
  '/top-artists',
  '/top-hotels',
  '/experiences',
  '/login',
  '/register',
]

const WIDTHS: Array<[string, number, number]> = [
  ['desktop', 1440, 900],
  ['phone', 390, 844],
]

describe('no horizontal overflow', () => {
  WIDTHS.forEach(([label, w, h]) => {
    ROUTES.forEach((route) => {
      it(`${label} ${route}`, () => {
        cy.viewport(w, h)
        cy.visit(route, { failOnStatusCode: false })
        // Heroes load imagery and run entrance animations; measuring before
        // they settle reports overflow that is not really there.
        cy.wait(2500)

        cy.window().then((win) => {
          const doc = win.document.documentElement
          const over = doc.scrollWidth - doc.clientWidth
          if (over > 1) {
            const offenders: string[] = []
            win.document.querySelectorAll('*').forEach((el) => {
              const r = el.getBoundingClientRect()
              if (r.right > doc.clientWidth + 1 || r.left < -1) {
                const t = el as HTMLElement
                offenders.push(
                  `${t.tagName.toLowerCase()}.${String(t.className).slice(0, 80)} ` +
                  `[left=${Math.round(r.left)} right=${Math.round(r.right)}]`
                )
              }
            })
            throw new Error(
              `${route} at ${w}px overflows by ${over}px. Widest elements:\n` +
              offenders.slice(0, 8).join('\n')
            )
          }
        })
      })
    })
  })
})
