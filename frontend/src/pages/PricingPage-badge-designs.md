# Badge Design Options for "Most Popular"

Here are different design variations you can use. Replace the badge section in PricingPage.tsx with any of these:

## Design 1: Top-Right Corner Badge (Current)
```tsx
{plan.popular && (
  <>
    <div className="absolute -top-3 -right-3 z-20">
      <div className="bg-gold text-navy px-4 py-2 rounded-lg shadow-xl border-2 border-navy/20 flex items-center gap-1.5">
        <Star className="w-4 h-4 fill-current" />
        <span className="text-xs font-bold uppercase tracking-wide">Popular</span>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-gold z-10"></div>
  </>
)}
```

## Design 2: Top-Center Floating Badge
```tsx
{plan.popular && (
  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
    <div className="bg-gradient-to-r from-gold to-gold/90 text-navy px-6 py-2.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-2">
      <Award className="w-5 h-5" />
      <span className="font-bold text-sm">Most Popular</span>
    </div>
  </div>
)}
```

## Design 3: Top-Left Corner Ribbon
```tsx
{plan.popular && (
  <div className="absolute -top-2 -left-2 z-20">
    <div className="relative">
      <div className="bg-gold text-navy px-5 py-2 shadow-xl transform rotate-[-5deg]">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-xs font-bold uppercase">Best Value</span>
        </div>
      </div>
      <div className="absolute -bottom-1 left-0 w-0 h-0 border-r-[8px] border-r-gold/80 border-t-[8px] border-t-transparent"></div>
    </div>
  </div>
)}
```

## Design 4: Side Banner (Left Edge)
```tsx
{plan.popular && (
  <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
    <div className="bg-gold text-navy px-3 py-8 rounded-r-lg shadow-xl border-r-2 border-navy/20">
      <div className="writing-vertical-rl transform rotate-180">
        <span className="text-xs font-bold uppercase tracking-widest">Popular</span>
      </div>
    </div>
  </div>
)}
```

## Design 5: Floating Badge with Pulse Animation
```tsx
{plan.popular && (
  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
    <div className="relative">
      <div className="absolute inset-0 bg-gold rounded-full animate-ping opacity-20"></div>
      <div className="relative bg-gold text-navy px-5 py-2.5 rounded-full shadow-xl border-2 border-white flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span className="font-bold text-sm">Most Popular</span>
      </div>
    </div>
  </div>
)}
```

## Design 6: Diagonal Ribbon (Top-Right)
```tsx
{plan.popular && (
  <div className="absolute top-0 right-0 z-20 overflow-hidden w-24 h-24">
    <div className="absolute top-3 right-3 bg-gold text-navy px-4 py-1 shadow-xl transform rotate-45 translate-x-6 -translate-y-6">
      <span className="text-xs font-bold uppercase tracking-wider">Popular</span>
    </div>
  </div>
)}
```

## Design 7: Minimal Top Border with Badge
```tsx
{plan.popular && (
  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
    <div className="bg-navy text-gold px-4 py-1.5 rounded-full shadow-lg border-2 border-gold">
      <span className="text-xs font-semibold">⭐ Most Popular</span>
    </div>
  </div>
)}
```

## Design 8: Elegant Top Banner
```tsx
{plan.popular && (
  <div className="absolute -top-5 left-0 right-0 z-20">
    <div className="mx-auto w-fit">
      <div className="bg-gradient-to-r from-gold via-gold/95 to-gold text-navy px-8 py-2 rounded-b-2xl shadow-2xl border-b-4 border-navy/30">
        <div className="flex items-center justify-center gap-2">
          <Award className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">MOST POPULAR CHOICE</span>
        </div>
      </div>
    </div>
  </div>
)}
```

