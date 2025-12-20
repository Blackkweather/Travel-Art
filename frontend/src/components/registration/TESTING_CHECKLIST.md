# Artist Registration Form - Testing Checklist

## Pre-Launch Testing Checklist

### Step 1: Basic Information

#### Field Validation
- [ ] Stage name (required)
  - [ ] Empty input shows error
  - [ ] Valid input accepted
- [ ] Birth date (required, DD/MM/YYYY)
  - [ ] Invalid format shows error
  - [ ] Valid date accepted
  - [ ] Age validation works (must be 13+)
  - [ ] Future dates rejected
- [ ] Last name (required)
  - [ ] Empty input shows error
  - [ ] Valid input accepted
- [ ] First name (required)
  - [ ] Empty input shows error
  - [ ] Valid input accepted
- [ ] Phone number (required)
  - [ ] Invalid format shows error
  - [ ] Various formats accepted (+33, (0)6, 06, etc.)
  - [ ] Valid input accepted
- [ ] Email (required)
  - [ ] Invalid format shows error (@, domain required)
  - [ ] Valid input accepted
- [ ] Password (required)
  - [ ] Shows strength indicator
  - [ ] Requires 8+ characters
  - [ ] Requires uppercase letter
  - [ ] Requires lowercase letter
  - [ ] Requires number
  - [ ] Requires special character (@$!%*?&)
  - [ ] Visibility toggle works
  - [ ] Eye icon shows/hides password
- [ ] Confirm password (required)
  - [ ] Shows match indicator
  - [ ] Visibility toggle works independently
  - [ ] Match validation works
  - [ ] Mismatch shows error
- [ ] Country dropdown (required)
  - [ ] Opens/closes smoothly
  - [ ] Search filters countries
  - [ ] Can select country
  - [ ] Selected value displays
  - [ ] Dropdown closes after selection
- [ ] Terms checkbox (required)
  - [ ] Unchecked shows error on next
  - [ ] Checked allows progression
  - [ ] Links to terms and privacy open in new tab

#### Form Behavior
- [ ] "Suivant" button disabled until all fields valid
- [ ] "Suivant" button submits when clicked
- [ ] Loading state shows during submission
- [ ] Form scrolls to top after navigation
- [ ] Error messages animate in/out
- [ ] Success colors appear for valid fields

#### Responsive Design
- [ ] Desktop: 2-column layout for inputs
- [ ] Tablet: Single column, proper spacing
- [ ] Mobile: Full-width, stacked layout
- [ ] Touch targets 44x44px minimum
- [ ] No horizontal scroll

### Step 2: Artistic Category

#### Main Category
- [ ] Dropdown opens/closes
- [ ] Search filters categories
- [ ] Selection updates value
- [ ] Error on empty submission
- [ ] All main categories listed:
  - [ ] Musique
  - [ ] Visuel
  - [ ] Arts & craft
  - [ ] Cirque
  - [ ] Magie
  - [ ] Humour
  - [ ] Danse
  - [ ] Famille
  - [ ] Lifestyle

#### Secondary Category
- [ ] Optional (no error if empty)
- [ ] Same categories as main
- [ ] Can differ from main category
- [ ] Can be same as main category
- [ ] Properly filtered on search

#### Audience Type
- [ ] Checkboxes appear
- [ ] Multiple selection allowed
- [ ] "Adultes" checkbox works
- [ ] "Familles" checkbox works
- [ ] Error if none selected
- [ ] Background styling correct

#### Languages
- [ ] Checkboxes appear
- [ ] Multiple selection allowed
- [ ] "Français" checkbox works
- [ ] "English" checkbox works
- [ ] "Autre" checkbox works
- [ ] Error if none selected
- [ ] Background styling correct

#### Navigation
- [ ] "Retour" button goes to Step 1
- [ ] "Suivant" button goes to Step 3
- [ ] Data persists when returning to Step 1
- [ ] Can edit Step 1 and return to Step 2
- [ ] Loading state works

### Step 3: Subcategory Selection

#### Dynamic Content (Musique)
- [ ] Selecting "Musique" in Step 2 shows:
  - [ ] Category Type dropdown with: Performer, DJ, Solo, Groupe de musique, Univers Artistique
  - [ ] Selecting "Performer" shows domain options: Saxophone, Chant, Flûte, etc.
  - [ ] Selecting "DJ" shows: DJ & Saxophone, DJ Live
  - [ ] Selecting "Solo" shows: Chant, Guitare - voix, Piano-voix
  - [ ] Selecting "Groupe de musique" shows: Duo, Trio, Quartet, Quintet
  - [ ] Selecting "Univers Artistique" shows: Arts & craft, Cirque, Magie, Humour, Danse

#### Dynamic Content (Visuel)
- [ ] Selecting "Visuel" shows:
  - [ ] Category Type: Arts & craft
  - [ ] Domain options: Street-art, Design, Dessin, Sculpture, Peinture, Photographie, Arts plastiques

#### Dynamic Content (Cirque)
- [ ] Selecting "Cirque" shows:
  - [ ] Category Type: Cirque
  - [ ] Domain options: Acrobatie, Jonglage, Equilibre, Mât chinois, Aérien / Tissu

#### Dynamic Content (Magie)
- [ ] Selecting "Magie" shows:
  - [ ] Category Type: Magie
  - [ ] Domain options: Happening / Close-up, Spectacle / Close-up, Spectacle, Mentalisme

#### Dynamic Content (Humour)
- [ ] Selecting "Humour" shows:
  - [ ] Category Type: Humour
  - [ ] Domain options: Visuel & Mime, Stand-up / One-man

#### Dynamic Content (Danse)
- [ ] Selecting "Danse" shows:
  - [ ] Category Type: Danse
  - [ ] Domain options: Salon, Salsa / Bachata, Hip-Hop, Moderne jazz

#### Dynamic Content (Famille)
- [ ] Selecting "Famille" shows multiple family categories
- [ ] "Magie pour enfants" options: Spectacle, Close-up, Initiation
- [ ] "Sculpture de bulles" options: Spectacle, Happening
- [ ] "Conte" options: Conte, Poésie
- [ ] "Chant" options: Atelier éveil musical, Mini-concert enfants
- [ ] "Arts & craft Famille" options: Arts plastiques, Dessin, Ateliers parents-enfants

#### Radio Button Selection
- [ ] Only one domain can be selected
- [ ] Selected option highlights with gold
- [ ] Radio button shows checkmark when selected
- [ ] Clicking deselected option changes selection
- [ ] Error on empty submission

#### Navigation
- [ ] "Retour" goes to Step 2
- [ ] "Terminer" submits form
- [ ] Data persists when going back
- [ ] Step indicator shows completion
- [ ] Summary displays correctly

### Summary Section (Step 3)

- [ ] Shows Stage Name
- [ ] Shows Main Category
- [ ] Shows Domain
- [ ] Shows Languages
- [ ] Formatting is correct
- [ ] Updates when selections change

### Form Submission

#### Success Case
- [ ] All fields filled correctly
- [ ] Form submitted successfully
- [ ] Success toast shown
- [ ] Redirects to dashboard
- [ ] Correct user data stored

#### Error Handling
- [ ] Invalid email shows error
- [ ] Weak password shows error
- [ ] Missing required fields show errors
- [ ] Server error displays in toast
- [ ] Form doesn't clear on error
- [ ] Can retry submission

### UI/UX

#### Visual Design
- [ ] Gold color (#F0B429) used consistently
- [ ] Navy text (#1a1f3a) readable
- [ ] Beige backgrounds (#FAF8F5) subtle
- [ ] Rounded corners (12-24px) applied correctly
- [ ] Shadows appropriate (shadow-luxury)
- [ ] White space/padding consistent

#### Animations
- [ ] Step transitions smooth
- [ ] Error messages slide down
- [ ] Checkboxes/radios animate
- [ ] Button hover effects work
- [ ] Progress bar updates smoothly
- [ ] Dropdown opens/closes animated

#### Accessibility
- [ ] Tab navigation works
- [ ] All inputs have labels
- [ ] Focus indicators visible
- [ ] Color not only indication
- [ ] Error messages associated with inputs
- [ ] Placeholder text not used as label
- [ ] Required fields marked with *

#### Mobile Experience
- [ ] Touch targets 44x44px+
- [ ] Keyboard not covered by form
- [ ] Date picker works on mobile
- [ ] Dropdown scrollable
- [ ] Forms fill to edge appropriately
- [ ] Landscape orientation works

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance

- [ ] Form loads quickly
- [ ] No console errors
- [ ] No console warnings
- [ ] Images optimized
- [ ] Animations smooth (60fps)
- [ ] No memory leaks

### Security

- [ ] Password sent encrypted
- [ ] No sensitive data in console
- [ ] CSRF protection if needed
- [ ] Input sanitization working
- [ ] Password strength validation working
- [ ] Age validation enforced

### Data Validation

#### Before Submit
- [ ] All required fields checked
- [ ] Format validations pass
- [ ] Business logic validations pass
- [ ] Cross-field validations work

#### After Submit
- [ ] Backend validation passes
- [ ] Data stored correctly
- [ ] No duplicate accounts
- [ ] Data visible in user profile

### Integration Tests

- [ ] Form integrates with auth store
- [ ] Registration API endpoint works
- [ ] Redirects to correct dashboard
- [ ] User data synced properly
- [ ] Navigation works after registration
- [ ] Logout/login with new account works

### Edge Cases

- [ ] Special characters in names handled
- [ ] Long names don't break layout
- [ ] Multiple spaces in inputs trimmed
- [ ] Copy/paste works
- [ ] Auto-fill works
- [ ] Rapid form submission prevented
- [ ] Back button doesn't resubmit

### Localization (if applicable)

- [ ] French labels correct
- [ ] French error messages clear
- [ ] Category names translated
- [ ] Date format DD/MM/YYYY
- [ ] Phone format for France
- [ ] Email validation international

## Test Scenarios

### Scenario 1: Happy Path
1. Fill all Step 1 fields correctly
2. Progress to Step 2
3. Select categories and preferences
4. Progress to Step 3
5. Select domain
6. Submit form
7. Verify success and redirect

### Scenario 2: Validation Errors
1. Try to submit empty form
2. Verify error messages
3. Fix one field at a time
4. Verify field clears error
5. Complete form successfully

### Scenario 3: Navigation
1. Fill Step 1
2. Go to Step 2
3. Go back to Step 1
4. Verify data persists
5. Go forward to Step 2
6. Go forward to Step 3
7. Go back to Step 2
8. Go back to Step 1
9. Modify fields
10. Progress to Step 3
11. Submit

### Scenario 4: Password Strength
1. Enter weak password
2. Verify strength indicator
3. Add uppercase letter
4. Verify strength updates
5. Add number
6. Verify strength updates
7. Add special character
8. Verify strength updates
9. Verify toggle functionality

### Scenario 5: Category Selection
1. Select "Musique"
2. Select "Performer"
3. Verify instruments appear
4. Change to "DJ"
5. Verify DJ options appear
6. Go back to Step 2
7. Change category to "Danse"
8. Go to Step 3
9. Verify dance options appear

## Performance Targets

- [ ] Form loads in < 2 seconds
- [ ] Form interactive in < 3 seconds
- [ ] Step transition < 500ms
- [ ] Input response < 100ms
- [ ] Form submission < 5 seconds
- [ ] Mobile performance good (90+ Lighthouse)

## Sign-off

- [ ] QA Lead: _________________ Date: _______
- [ ] Product Manager: __________ Date: _______
- [ ] Development Lead: _________ Date: _______

## Notes

```
[Add any issues found, blockers, or notes here]
```

## Bug Tracking

When issues are found:
1. Create issue in bug tracker
2. Reference this checklist item
3. Link to specific step/field
4. Include browser/device info
5. Add screenshots if visual
6. Assign to developer
7. Update status when fixed

## Post-Launch Monitoring

- [ ] Monitor error logs
- [ ] Track form completion rate
- [ ] Monitor abandonment rate by step
- [ ] Track validation error frequency
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Check for browser-specific issues
