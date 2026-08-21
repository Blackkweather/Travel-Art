/**
 * Finds elements wider than the viewport. A page that scrolls sideways on a
 * phone is the single most common way a responsive layout fails, and it is
 * invisible in a screenshot until content gets clipped. Temporary diagnostic.
 */
const ROUTES = ['/', '/how-it-works', '/partners', '/top-artists', '/top-hotels', '/experiences', '/login', '/register']
const WIDTHS: Array<[string, number, number]> = [
  ['desktop', 1440, 900],
  ['phone', 390, 844],
]

describe('horizontal overflow', () => {
  WIDTHS.forEach(([label, w, h]) => {
    ROUTES.forEach((route) => {
      it(`${label} ${route}`, () => {
        cy.viewport(w, h)
        cy.visit(route, { failOnStatusCode: false })
        cy.wait(2500)
        cy.window().then((win) => {
          const doc = win.document.documentElement
          const over = doc.scrollWidth - doc.clientWidth
          const offenders: string[] = []
          if (over > 1) {
            win.document.querySelectorAll('*').forEach((el) => {
              const r = el.getBoundingClientRect()
              if (r.right > doc.clientWidth + 1 || r.left < -1) {
                const t = el as HTMLElement
                offenders.push(
                  `${t.tagName.toLowerCase()}.${(t.className || '').toString().slice(0, 90)} ` +
                  `[left=${Math.round(r.left)} right=${Math.round(r.right)}]`
                )
              }
            })
          }
          cy.task('log', `\n### ${label} ${route} :: overflow=${over}px\n` +
            offenders.slice(0, 12).join('\n') + (offenders.length > 12 ? `\n...+${offenders.length - 12} more` : ''))
        })
      })
    })
  })
})
