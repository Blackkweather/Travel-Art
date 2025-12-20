# Artist Multi-Step Registration Form Documentation

## Overview
Complete, production-ready multi-step artist registration form for Club Med Live platform with validation, responsive design, and smooth UX transitions.

## File Structure

```
frontend/src/
├── components/registration/
│   ├── ArtistRegistrationForm.tsx        # Main form component
│   ├── Step1BasicInfo.tsx                # Step 1: Personal information
│   ├── Step2ArtisticCategory.tsx         # Step 2: Artistic categories
│   ├── Step3SubcategorySelection.tsx     # Step 3: Subcategory selection
│   ├── SelectWithSearch.tsx              # Custom dropdown with search
│   ├── RadioGroup.tsx                    # Radio button component
│   ├── CheckboxGroup.tsx                 # Checkbox component
│   ├── StepIndicator.tsx                 # Step progress indicator
│   └── index.ts                          # Component exports
├── pages/
│   └── ArtistRegistrationPage.tsx        # Page wrapper
├── types/
│   └── artistRegistration.ts             # TypeScript types and constants
├── utils/
│   └── registrationValidator.ts          # Validation utilities
└── styles/
    └── registration.css                  # Custom styling
```

## Components

### 1. ArtistRegistrationForm
Main container component managing form state and step transitions.

**Key Features:**
- Three-step form workflow
- Form state persistence
- Smooth transitions between steps
- Summary display on final step

**Props:** None (self-contained)

**State:**
```typescript
{
  step: number;           // Current step (1-3)
  basicInfo: BasicInfo;   // Step 1 data
  artisticCategory: ArtisticCategory;  // Step 2 data
  subcategory: SubcategoryInfo;        // Step 3 data
}
```

### 2. Step1BasicInfo
Collects basic personal and account information.

**Fields:**
- Nom de scène (Stage Name) *
- Date de naissance (Birth Date DD/MM/YYYY) *
- Nom (Last Name) *
- Prénom (First Name) *
- Numéro de téléphone (Phone Number) *
- Adresse email (Email) *
- Mot de passe (Password) * with visibility toggle
- Confirmer le mot de passe (Confirm Password) * with visibility toggle
- Choisir un pays (Country dropdown) *
- Terms agreement checkbox *

**Validation:**
- Email format validation
- Password strength validation (min 8 chars, uppercase, lowercase, number, special)
- Password confirmation match
- Phone format validation
- Date format validation (DD/MM/YYYY)
- All required fields checked

### 3. Step2ArtisticCategory
Selects main artistic category and preferences.

**Sections:**
- Main Category dropdown with search
- Secondary Category dropdown (optional)
- Audience Type checkboxes (Adultes, Familles)
- Languages checkboxes (Français, English, Autre)

**Validation:**
- Main category required
- At least one audience type required
- At least one language required

### 4. Step3SubcategorySelection
Dynamically selects subcategories based on Step 2 selection.

**Dynamic Content:**
Subcategories change based on mainCategory selection:
- **Musique:** Performer, DJ, Solo, Groupe de musique, Univers Artistique
- **Visuel:** Arts & craft with specific domain options
- **Cirque:** Acrobatie, Jonglage, Equilibre, Mât chinois, Aérien / Tissu
- **Magie:** Happening, Spectacle, Close-up, Mentalisme
- **Humour:** Visuel & Mime, Stand-up / One-man
- **Danse:** Salon, Salsa / Bachata, Hip-Hop, Moderne jazz
- **Famille:** Multiple family-specific categories

**Validation:**
- Category type required
- Domain required

### 5. SelectWithSearch
Custom dropdown component with search functionality.

**Props:**
```typescript
{
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

**Features:**
- Real-time search filtering
- Keyboard navigation
- Animated dropdown
- Error state support

### 6. RadioGroup
Custom radio button component group.

**Props:**
```typescript
{
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}
```

### 7. CheckboxGroup
Custom checkbox component group.

**Props:**
```typescript
{
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  layout?: 'vertical' | 'grid';
}
```

### 8. StepIndicator
Progress indicator showing current step and completion status.

**Props:**
```typescript
{
  currentStep: number;
  totalSteps: number;
  steps: string[];
}
```

## Types

### BasicInfo
```typescript
interface BasicInfo {
  stageName: string;
  birthDate: string;          // DD/MM/YYYY format
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  agreeToTerms: boolean;
}
```

### ArtisticCategory
```typescript
interface ArtisticCategory {
  mainCategory: string;
  secondaryCategory?: string;
  audienceType: string[];     // ['Adultes', 'Familles']
  languages: string[];        // ['Français', 'English', 'Autre']
}
```

### SubcategoryInfo
```typescript
interface SubcategoryInfo {
  categoryType: string;
  specificCategory: string;
  domain: string;
}
```

## Validation Utilities

### RegistrationValidator Class

```typescript
// Validate email
RegistrationValidator.validateEmail(email: string): boolean

// Validate phone
RegistrationValidator.validatePhone(phone: string): boolean

// Validate password strength
RegistrationValidator.validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
}

// Validate birth date (DD/MM/YYYY)
RegistrationValidator.validateBirthDate(dateString: string): {
  isValid: boolean;
  error?: string;
}

// Validate basic info
RegistrationValidator.validateBasicInfo(basicInfo: any): {
  isValid: boolean;
  errors: Record<string, string>;
}

// Validate artistic category
RegistrationValidator.validateArtisticCategory(artisticCategory: any): {
  isValid: boolean;
  errors: Record<string, string>;
}

// Validate subcategory
RegistrationValidator.validateSubcategory(subcategory: any): {
  isValid: boolean;
  errors: Record<string, string>;
}
```

### Helper Functions

```typescript
// Format phone number
formatPhoneNumber(phone: string): string

// Format date for display
formatDate(dateString: string): string

// Calculate age from birth date
calculateAge(dateString: string): number

// Get password strength (0-100)
getPasswordStrength(password: string): number

// Get password strength label
getPasswordStrengthLabel(strength: number): string

// Get password strength color class
getPasswordStrengthColor(strength: number): string
```

## Styling

### Color Palette
- **Gold/Primary:** `#F0B429`
- **Navy/Dark:** `#1a1f3a`
- **Beige/Light:** `#FAF8F5`, `#f5f0e8`
- **Accent/Success:** `#10b981`
- **Accent/Error:** `#ef4444`

### Tailwind Classes Used
- Container: `rounded-3xl`, `shadow-luxury`
- Inputs: `rounded-xl`, height `h-12`
- Buttons: `rounded-xl`, height `h-14`
- Custom containers: `rounded-2xl` for grouped sections

## Usage

### 1. Basic Implementation
```tsx
import { ArtistRegistrationForm } from '@/components/registration';

function MyPage() {
  return <ArtistRegistrationForm />;
}
```

### 2. Route Setup
In `App.tsx`:
```tsx
import ArtistRegistrationPage from '@/pages/ArtistRegistrationPage';

<Route path="/register/artist" element={<ArtistRegistrationPage />} />
```

### 3. Accessing from Registration Page
```tsx
import { ArtistRegistrationForm } from '@/components/registration';

// Replace existing registration flow with:
{role === 'ARTIST' && <ArtistRegistrationForm />}
```

## Form Submission

When user completes all steps, the form submits data to the authentication store:

```typescript
const registrationData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  stageName: string;
  birthDate: string;      // DD/MM/YYYY
  phone: string;
  country: string;
  role: 'ARTIST';
  
  // Artistic information
  mainCategory: string;
  secondaryCategory?: string;
  audienceType: string[];
  languages: string[];
  categoryType: string;
  specificCategory: string;
  domain: string;
};

await registerUser(registrationData);
```

## Data Persistence

Form data persists when navigating between steps. Users can:
- Click "Retour" (Back) button to revisit previous steps
- Edit information from any previous step
- All data remains in state until form is submitted

## Responsive Design

### Breakpoints
- **Mobile:** < 768px (single column, full-width inputs)
- **Tablet:** 768px - 1024px (flexible grid)
- **Desktop:** > 1024px (2-column grid for Step 1)

### Mobile Optimizations
- Single column layout
- Larger touch targets (h-12 for inputs, h-14 for buttons)
- Stack all sections vertically
- Full-width select dropdowns

## Accessibility Features

- Proper label associations
- ARIA attributes for custom components
- Keyboard navigation support
- Focus indicators on all interactive elements
- Error messages with semantic markup
- Color contrast compliance (WCAG AA)

## Error Handling

All validation errors display inline with clear messages:
- Email validation errors
- Password strength requirements
- Date format errors
- Password mismatch errors
- Required field errors

## Performance Optimizations

- Memoized callbacks with `useCallback`
- Lazy validation (on blur/submit)
- Optimized re-renders with state management
- Smooth animations with Framer Motion

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

## Dependencies

- `react` - UI framework
- `react-router-dom` - Routing
- `framer-motion` - Animations
- `react-hot-toast` - Toast notifications
- `lucide-react` - Icons
- `tailwindcss` - Styling

## Future Enhancements

- [ ] Add file upload for profile photo
- [ ] Integration with payment system for premium registration
- [ ] Social login options
- [ ] Email verification step
- [ ] Address autocomplete for country selection
- [ ] Multi-language support (i18n)
- [ ] Progress auto-save
- [ ] Custom category management
- [ ] Video introduction upload for artists
- [ ] Portfolio link integration

## Troubleshooting

### Form not submitting
- Check browser console for errors
- Verify all required fields are filled
- Check that password meets strength requirements
- Verify email format is valid

### Styles not applying
- Ensure `registration.css` is imported in main app
- Check Tailwind CSS is properly configured
- Verify color variables match Tailwind config

### Validation errors not showing
- Check that error state is properly passed to components
- Verify error message strings are not empty
- Ensure form validation runs before submission

## Support

For issues or questions about the registration form:
1. Check this documentation
2. Review component props and types
3. Check browser console for JavaScript errors
4. Verify backend API endpoints are configured correctly
