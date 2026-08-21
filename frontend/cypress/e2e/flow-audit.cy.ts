/**
 * Walks the two registration flows and the dashboards' login gate, capturing
 * each screen. Temporary diagnostic for the redesign pass.
 */
const KILL_SMOOTH = 'html{scroll-behavior:auto !important}'

function prep() {
  cy.document().then((doc) => {
    const style = doc.createElement('style')
    style.innerHTML = KILL_SMOOTH
    doc.head.appendChild(style)
  })
  cy.wait(1800)
}

describe('registration flows', () => {
  it('artist flow', () => {
    cy.viewport(1280, 720)
    cy.visit('/register?role=artist', { failOnStatusCode: false })
    prep()
    cy.screenshot('artist-step0', { capture: 'viewport', overwrite: true })

    // Click through to the artist branch if a role chooser is shown.
    cy.get('body').then(($b) => {
      if ($b.text().includes('Choisissez votre rôle')) {
        cy.contains(/^Artiste$/).click({ force: true })
        cy.wait(1200)
      }
    })
    cy.screenshot('artist-step1', { capture: 'viewport', overwrite: true })
    cy.window().then((w) => w.scrollTo(0, 700))
    cy.wait(500)
    cy.screenshot('artist-step1-lower', { capture: 'viewport', overwrite: true })

    // Empty submit: the error state is what a real user hits first.
    cy.window().then((w) => w.scrollTo(0, 0))
    cy.contains('button', /Suivant/i).click({ force: true })
    cy.wait(800)
    cy.screenshot('artist-step1-errors', { capture: 'viewport', overwrite: true })
    cy.window().then((w) => w.scrollTo(0, 600))
    cy.wait(500)
    cy.screenshot('artist-step1-errors-lower', { capture: 'viewport', overwrite: true })
  })

  it('hotel flow', () => {
    cy.viewport(1280, 720)
    cy.visit('/register?role=hotel', { failOnStatusCode: false })
    prep()
    cy.get('body').then(($b) => {
      if ($b.text().includes('Choisissez votre rôle')) {
        cy.contains(/^Hôtel$/).click({ force: true })
        cy.wait(1200)
      }
    })
    cy.screenshot('hotel-step1', { capture: 'viewport', overwrite: true })
    cy.window().then((w) => w.scrollTo(0, 700))
    cy.wait(500)
    cy.screenshot('hotel-step1-lower', { capture: 'viewport', overwrite: true })
  })

  it('phone artist step 1', () => {
    cy.viewport(390, 844)
    cy.visit('/register?role=artist', { failOnStatusCode: false })
    prep()
    cy.get('body').then(($b) => {
      if ($b.text().includes('Choisissez votre rôle')) {
        cy.contains(/^Artiste$/).click({ force: true })
        cy.wait(1200)
      }
    })
    cy.screenshot('phone-artist-step1', { capture: 'viewport', overwrite: true })
  })
})
