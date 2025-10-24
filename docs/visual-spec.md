# Travel Art - Visual Design Specification

## Brand Colors

### Primary Palette
- **Navy**: `#0B1F3F` - Primary text, buttons, navbar background
- **Gold**: `#C9A63C` - Accents, highlights, icons, primary accent
- **Cream**: `#F9F8F3` - Page background, card backgrounds

### Supporting Colors
- **Navy Light**: `#1a2f5f` - Hover states
- **Gold Light**: `#b8942a` - Hover states
- **Gray**: `#666666` - Secondary text
- **Light Gray**: `#e5e5e5` - Borders, dividers

## Typography

### Font Families
- **Headings**: Playfair Display (serif)
- **Body Text**: Inter (sans-serif)

### Font Sizes
- **H1**: 3rem (48px) - Page titles
- **H2**: 2.25rem (36px) - Section titles
- **H3**: 1.875rem (30px) - Subsection titles
- **H4**: 1.5rem (24px) - Card titles
- **H5**: 1.25rem (20px) - Small headings
- **H6**: 1.125rem (18px) - Labels
- **Body**: 1rem (16px) - Default text
- **Small**: 0.875rem (14px) - Captions, metadata

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing System

### Base Unit: 8px

- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)
- **3xl**: 64px (4rem)
- **4xl**: 96px (6rem)

### Component Spacing
- **Card Padding**: 24px (1.5rem)
- **Section Padding**: 80px (5rem)
- **Container Max Width**: 1200px
- **Container Padding**: 20px (1.25rem)

## Component Specifications

### Buttons

#### Primary Button
- **Background**: Navy (#0B1F3F)
- **Text**: White
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Font Weight**: 600
- **Hover**: Darker navy (#1a2f5f) + 2px lift
- **Shadow**: Medium shadow on hover

#### Secondary Button
- **Background**: Transparent
- **Text**: Navy (#0B1F3F)
- **Border**: 2px solid navy
- **Padding**: 10px 22px
- **Border Radius**: 8px
- **Font Weight**: 600
- **Hover**: Navy background + white text

#### Gold Button
- **Background**: Gold (#C9A63C)
- **Text**: Navy (#0B1F3F)
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Font Weight**: 600
- **Hover**: Darker gold (#b8942a)

### Cards

#### Standard Card
- **Background**: White
- **Border**: 1px solid light gray (#e5e5e5)
- **Border Radius**: 12px
- **Padding**: 24px
- **Shadow**: Soft shadow
- **Hover**: Medium shadow + 4px lift

#### Luxury Card
- **Background**: White
- **Border**: 1px solid light gray
- **Border Radius**: 16px
- **Padding**: 32px
- **Shadow**: Large shadow
- **Top Border**: 4px gold gradient
- **Hover**: Large shadow + 6px lift

### Forms

#### Input Fields
- **Background**: White
- **Border**: 2px solid light gray
- **Border Radius**: 8px
- **Padding**: 12px 16px
- **Font Size**: 16px
- **Focus**: Gold border + gold glow
- **Placeholder**: Gray text

#### Labels
- **Font Weight**: 600
- **Color**: Navy
- **Margin Bottom**: 8px

### Navigation

#### Navbar
- **Height**: 64px
- **Background**: Navy (#0B1F3F)
- **Text**: White
- **Padding**: 0 24px
- **Shadow**: Medium shadow

#### Sidebar
- **Width**: 256px
- **Background**: White
- **Border**: Right border light gray
- **Padding**: 24px
- **Shadow**: Medium shadow

### Icons

#### Compass Icon (Brand)
- **Size**: 32px (navbar), 64px (hero)
- **Background**: Gold circle
- **Emoji**: 🧭
- **Color**: Navy text

#### Status Icons
- **Size**: 20px
- **Colors**: 
  - Success: Green
  - Warning: Gold
  - Error: Red
  - Info: Navy

## Layout Grid

### Container
- **Max Width**: 1200px
- **Centered**: Auto margins
- **Padding**: 20px (mobile), 24px (tablet), 32px (desktop)

### Grid System
- **Columns**: 12
- **Gutters**: 24px
- **Breakpoints**:
  - Mobile: 1 column
  - Tablet: 2-3 columns
  - Desktop: 3-4 columns

## Visual Effects

### Gold Underline
- **Position**: Below headings
- **Width**: 60px (default), 100% (hover)
- **Height**: 2px
- **Color**: Gold (#C9A63C)
- **Transition**: 0.3s ease

### Shadows
- **Soft**: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)
- **Medium**: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)
- **Large**: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)

### Animations
- **Fade In**: 0.6s ease-in-out
- **Slide Up**: 0.6s ease-out
- **Hover Lift**: 0.3s ease
- **Compass Spin**: 2s linear infinite

## Responsive Design

### Breakpoints
- **Mobile**: ≤640px
- **Tablet**: 641-1024px
- **Desktop**: ≥1025px

### Mobile Adaptations
- **Typography**: Reduce heading sizes by 25%
- **Spacing**: Reduce padding by 33%
- **Cards**: Full width, stacked
- **Navigation**: Collapsible hamburger menu
- **Buttons**: Full width on mobile

### Tablet Adaptations
- **Grid**: 2-3 columns
- **Cards**: Medium padding
- **Navigation**: Horizontal layout
- **Forms**: Side-by-side fields

### Desktop Adaptations
- **Grid**: 3-4 columns
- **Cards**: Full padding
- **Navigation**: Full horizontal
- **Forms**: Multi-column layouts

## Accessibility

### Color Contrast
- **Navy on White**: 12.63:1 (AAA)
- **Gold on Navy**: 4.5:1 (AA)
- **Gray on White**: 4.5:1 (AA)

### Focus States
- **Outline**: 2px gold outline
- **Focus Ring**: Gold glow effect
- **Tab Order**: Logical sequence

### Screen Reader Support
- **Alt Text**: Descriptive for all images
- **ARIA Labels**: For interactive elements
- **Semantic HTML**: Proper heading hierarchy

## Brand Assets

### Logo
- **Primary**: Compass icon + "Travel Art" text
- **Icon Only**: Compass in gold circle
- **Text Only**: "Travel Art" in navy

### Favicon
- **Format**: SVG
- **Design**: Compass icon
- **Sizes**: 16x16, 32x32, 180x180

### Social Media
- **Profile Image**: Compass icon
- **Cover Image**: Hero section background
- **Colors**: Navy and gold palette

## Implementation Notes

### CSS Variables
```css
:root {
  --primary-navy: #0B1F3F;
  --gold-accent: #C9A63C;
  --cream-bg: #F9F8F3;
  --text-dark: #1a1a1a;
  --text-light: #666666;
  --border-light: #e5e5e5;
}
```

### Tailwind Classes
- Use custom color classes: `bg-navy`, `text-gold`, `bg-cream`
- Implement custom spacing: `p-6`, `mb-8`, `gap-4`
- Apply custom shadows: `shadow-soft`, `shadow-medium`, `shadow-large`

### Component Props
- Pass color variants as props
- Use size variants for responsive design
- Implement hover states with CSS transitions
- Add loading states with skeleton components



