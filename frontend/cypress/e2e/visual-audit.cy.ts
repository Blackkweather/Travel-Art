/**
 * Not a test - a contact sheet. It walks the public routes and screenshots
 * each one at several scroll depths so the redesign can be looked at rather
 * than reasoned about. Deleted once the visual pass is signed off.
 */
const ROUTES: Array<[string, string]> = [
  ['home', '/'],
  ['how-it-works', '/how-it-works'],
  ['partners', '/partners'],
  ['top-artists', '/top-artists'],
  ['top-hotels', '/top-hotels'],
  ['experiences', '/experiences'],
  ['login', '/login'],
  ['register', '/register'],
  ['about', '/about'],
]

// Smooth scrolling is set globally in index.html; left on, cy.scrollTo returns
// before the animation lands and the screenshot catches the previous section.
const KILL_SMOOTH = 'html{scroll-behavior:auto !important}'

function shoot(name: string, depths: number[]) {
  cy.document().then((doc) => {
    const style = doc.createElement('style')
    style.innerHTML = KILL_SMOOTH
    doc.head.appendChild(style)
  })
  cy.wait(2200)
  depths.forEach((y, i) => {
    cy.window().then((win) => win.scrollTo(0, y))
    cy.wait(700)
    cy.screenshot(`${name}-${i}`, { capture: 'viewport', overwrite: true })
  })
}

describe('visual audit', () => {
  ROUTES.forEach(([name, path]) => {
    it(`desktop ${name}`, () => {
      cy.viewport(1280, 720)
      cy.visit(path, { failOnStatusCode: false })
      shoot(`desktop-${name}`, [0, 900, 1800, 2700, 3600])
    })
  })

  ;['/', '/top-artists', '/register'].forEach((path, i) => {
    it(`phone ${path}`, () => {
      cy.viewport(390, 844)
      cy.visit(path, { failOnStatusCode: false })
      shoot(`phone-${i}`, [0, 800, 1600])
    })
  })
})
