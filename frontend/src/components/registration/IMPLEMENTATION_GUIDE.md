# Artist Registration Form - Implementation Guide

## Quick Start

### 1. Import and Use the Form

**Option A: As a Standalone Page**
```tsx
// pages/ArtistRegistrationPage.tsx
import React from 'react';
import { ArtistRegistrationForm } from '@/components/registration';

const ArtistRegistrationPage: React.FC = () => {
  return <ArtistRegistrationForm />;
};

export default ArtistRegistrationPage;
```

Then add route in `App.tsx`:
```tsx
import ArtistRegistrationPage from '@/pages/ArtistRegistrationPage';

<Route path="/register/artist" element={<ArtistRegistrationPage />} />
```

**Option B: In Existing Registration Page**
```tsx
// pages/RegisterPage.tsx
import { ArtistRegistrationForm } from '@/components/registration';

const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<'ARTIST' | 'HOTEL' | null>(null);

  if (userType === 'ARTIST') {
    return <ArtistRegistrationForm />;
  }

  // Show user type selector
  return (
    <div>
      <button onClick={() => setUserType('ARTIST')}>
        Register as Artist
      </button>
      <button onClick={() => setUserType('HOTEL')}>
        Register as Hotel
      </button>
    </div>
  );
};

export default RegisterPage;
```

### 2. Import Styles

In your main CSS file or `main.tsx`:
```tsx
import '@/styles/registration.css';
```

Or in your global CSS:
```css
@import '@/styles/registration.css';
```

### 3. Customize Colors (Optional)

Update the color variables in `registration.css`:
```css
:root {
  --color-beige-50: #faf8f5;      /* Light background */
  --color-beige-100: #f5f0e8;     /* Section background */
  --color-gold: #f0b429;          /* Primary button color */
  --color-navy-900: #1a1f3a;      /* Text color */
}
```

Or override in Tailwind config:
```js
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      gold: '#F0B429',
      'navy-900': '#1a1f3a',
      'beige-50': '#faf8f5',
      'beige-100': '#f5f0e8',
    }
  }
}
```

## Integration with Authentication Store

The form expects your `authStore` to have a `register` function:

```typescript
// store/authStore.ts
interface AuthStore {
  register: (data: RegistrationData) => Promise<void>;
}

// The form will call:
await registerUser({
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  stageName: string;
  birthDate: string;      // DD/MM/YYYY
  phone: string;
  country: string;
  role: 'ARTIST';
  mainCategory: string;
  secondaryCategory?: string;
  audienceType: string[];
  languages: string[];
  categoryType: string;
  specificCategory: string;
  domain: string;
});
```

## Customization Examples

### 1. Change Button Colors

Modify in `Step1BasicInfo.tsx`, `Step2ArtisticCategory.tsx`, `Step3SubcategorySelection.tsx`:

```tsx
// Before
className="bg-gold hover:bg-gold/90"

// After (example with custom color)
className="bg-purple-600 hover:bg-purple-700"
```

### 2. Add Additional Fields to Step 1

```tsx
// In Step1BasicInfo.tsx
<motion.div variants={itemVariants}>
  <FormField
    label="Bio / Description"
    placeholder="Tell us about yourself..."
    value={data.bio}
    onChange={(e) => onChange({ ...data, bio: e.target.value })}
    error={errors.bio}
    disabled={isLoading}
  />
</motion.div>
```

Then update type:
```typescript
// In types/artistRegistration.ts
interface BasicInfo {
  // ... existing fields
  bio?: string;
}
```

### 3. Change Steps or Reorder

Remove a step or add a new one by:
1. Create new step component
2. Update `ArtistRegistrationForm.tsx` to include it
3. Update `INITIAL_STATE` with new data shape
4. Add navigation logic in `handleNextStep()`

```tsx
// Add a step
{state.step === 4 && (
  <motion.div key="step-4">
    <Step4NewFeature
      data={state.newData}
      onChange={handleStep4Change}
      onNext={handleNextStep}
      onBack={handlePreviousStep}
      isLoading={isLoading}
    />
  </motion.div>
)}

// Update step count
const stepTitles = [
  'Informations de base',
  'Catégorie artistique',
  'Sous-catégories',
  'Nouvelle Étape'
];
```

### 4. Add More Categories or Options

Update the constants in `types/artistRegistration.ts`:

```typescript
// Add new main category
export const MAIN_CATEGORIES = [
  // ... existing
  { value: 'Théâtre', label: 'Théâtre (Theater)' }
];

// Add subcategories for new category
export const SUBCATEGORY_MAP = {
  // ... existing
  'Théâtre': {
    'Classique': ['Tragédie', 'Comédie'],
    'Moderne': ['Drama', 'Experimental']
  }
};
```

### 5. Customize Validation Rules

Modify `utils/registrationValidator.ts`:

```typescript
// Change password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 10,          // Increase minimum length
  uppercase: true,
  lowercase: true,
  numbers: true,
  special: true,
  noCommonWords: true     // Add new requirement
};

// Add new validation
static validateCustomRule(value: string): boolean {
  return !commonPasswords.includes(value);
}
```

### 6. Add Conditional Fields

```tsx
// In Step2ArtisticCategory.tsx
{data.mainCategory === 'Musique' && (
  <motion.div variants={itemVariants}>
    <FormField
      label="Years of Experience"
      type="number"
      value={data.yearsOfExperience}
      onChange={(e) => onChange({ ...data, yearsOfExperience: e.target.value })}
    />
  </motion.div>
)}
```

### 7. Change Form Layout

Update grid in `ArtistRegistrationForm.tsx`:

```tsx
// Before: 2-column on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// After: 3-column on desktop
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

## Advanced Customization

### 1. Custom SelectWithSearch Styling

```tsx
// Override in custom CSS
.registration-select {
  /* Your custom styles */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.registration-select:focus {
  border-color: #667eea;
}
```

### 2. Add Form Analytics

```tsx
// In ArtistRegistrationForm.tsx
const handleNextStep = () => {
  // Track step completion
  gtag.event('registration_step_completed', {
    step: state.step,
    timestamp: new Date().toISOString()
  });

  if (state.step < 3) {
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  }
};
```

### 3. Add Progressive Data Save

```tsx
// Auto-save to localStorage
useEffect(() => {
  localStorage.setItem('artistRegistrationDraft', JSON.stringify(state));
}, [state]);

// Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('artistRegistrationDraft');
  if (saved) {
    setState(JSON.parse(saved));
  }
}, []);
```

### 4. Add Captcha Verification

```tsx
// In Step1BasicInfo.tsx
import ReCAPTCHA from "react-google-recaptcha";

<ReCAPTCHA
  sitekey="YOUR_RECAPTCHA_KEY"
  onChange={(value) => setCaptchaToken(value)}
/>

// In form submission
const handleNext = () => {
  if (!captchaToken) {
    setErrors({ ...errors, captcha: 'Please verify you are human' });
    return;
  }
  // ... proceed with validation
};
```

## Testing

### Unit Tests Example

```typescript
// __tests__/registrationValidator.test.ts
import { RegistrationValidator } from '@/utils/registrationValidator';

describe('RegistrationValidator', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(RegistrationValidator.validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(RegistrationValidator.validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      const result = RegistrationValidator.validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
    });

    it('should reject weak password', () => {
      const result = RegistrationValidator.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

### E2E Tests Example (Cypress)

```typescript
// cypress/e2e/artist-registration.cy.ts
describe('Artist Registration Form', () => {
  beforeEach(() => {
    cy.visit('/register/artist');
  });

  describe('Step 1: Basic Info', () => {
    it('should fill basic information', () => {
      cy.get('input[placeholder="Your stage name"]')
        .type('Artist Name');
      
      cy.get('input[placeholder="JJ/MM/AAAA"]')
        .type('15/06/1990');

      cy.get('input[placeholder="Your last name"]')
        .type('LastName');

      cy.get('input[placeholder="Your first name"]')
        .type('FirstName');

      cy.get('input[placeholder*="email"]')
        .type('artist@example.com');

      cy.get('input[type="password"]:first')
        .type('StrongPass123!');

      cy.get('input[type="password"]:last')
        .type('StrongPass123!');

      cy.get('button:contains("Suivant")').click();
    });

    it('should show validation errors', () => {
      cy.get('button:contains("Suivant")').click();
      
      cy.get('[role="alert"]').should('contain', 'required');
    });
  });

  describe('Step 2: Artistic Category', () => {
    beforeEach(() => {
      // Complete Step 1 first
      cy.completeStep1();
    });

    it('should select main category', () => {
      cy.get('[placeholder*="Tribu Artistique"]').first().click();
      cy.get('[role="option"]:contains("Musique")').click();
    });

    it('should select audience type', () => {
      cy.get('input[name="audienceType"]').first().click();
    });
  });
});
```

## Performance Tips

1. **Lazy load validation**
   ```tsx
   // Only validate on blur/submit, not on every keystroke
   onChange={(e) => onChange({ ...data, field: e.target.value })}
   onBlur={() => validateField(data.field)}
   ```

2. **Memoize expensive operations**
   ```tsx
   const categoryTypeOptions = useMemo(() => {
     // Calculate options once
     return getCategoryTypeOptions(mainCategory);
   }, [mainCategory]);
   ```

3. **Debounce search input**
   ```tsx
   const [searchTerm, setSearchTerm] = useState('');
   const debouncedSearch = useMemo(
     () => debounce((term: string) => filterOptions(term), 300),
     []
   );
   ```

## Migration from Existing Registration

If you have an existing registration form:

1. **Identify which fields to keep**
   - Basic info fields: email, password, name, phone, etc.
   - Remove duplicate fields
   - Map existing data structure

2. **Update API endpoint**
   - Ensure backend accepts new data structure
   - Add artistic category fields to database schema
   - Create migration if needed

3. **Test thoroughly**
   - Test all validation paths
   - Test form submission
   - Test data persistence
   - Test on mobile devices

## Troubleshooting Common Issues

### Q: Form doesn't submit after clicking "Terminer"
**A:** Check that:
1. All required fields in Step 3 are filled
2. `authStore.register()` is properly imported
3. Backend endpoint is configured correctly
4. Check browser console for errors

### Q: Validation messages don't appear
**A:** Ensure:
1. Error state is being set in component
2. Error prop is passed to FormField/RadioGroup/CheckboxGroup
3. CSS for error messages is imported

### Q: Styling looks different on mobile
**A:** Verify:
1. Tailwind responsive classes are correct (`md:`, `lg:`)
2. Touch-friendly sizes are applied (`h-12`, `h-14`)
3. `registration.css` is imported
4. No hardcoded widths on mobile

### Q: Password visibility toggle not working
**A:** Check:
1. Component is imported from `registration` folder
2. `showPasswordToggle` prop is `true`
3. Eye icon is rendering

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

## Support & Feedback

For issues, questions, or feedback:
1. Check DOCUMENTATION.md
2. Review component source code
3. Check browser console for errors
4. Review validation utility functions
