# Travel Art - QA Quick Reference Checklist

**Quick reference for daily QA activities**  
**Based on Comprehensive QA Test Plan v2.0**

---

## 🚀 Pre-Release Checklist

### Critical Path (Must Pass)
- [ ] User can register new account
- [ ] User can login with valid credentials
- [ ] User can logout
- [ ] ARTIST can access dashboard
- [ ] HOTEL can access dashboard
- [ ] ADMIN can access dashboard
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control works
- [ ] No console errors on any page
- [ ] No 404 errors for valid routes

### UI/UX Critical
- [ ] All buttons clickable and responsive
- [ ] Forms submit correctly
- [ ] Error messages display properly
- [ ] Loading states show during API calls
- [ ] Mobile menu works on small screens
- [ ] Navigation works on all pages

### Performance Critical
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3s
- [ ] API response time < 500ms
- [ ] No memory leaks (check DevTools)
- [ ] Images optimized and load properly
- [ ] Bundle size < 500KB initial

### Security Critical
- [ ] Passwords not visible in network requests
- [ ] Tokens stored securely
- [ ] XSS attempts blocked (`<script>` tags not executed)
- [ ] CSRF protection active
- [ ] Rate limiting works (login endpoint)
- [ ] Password hashing verified (bcrypt in database)
- [ ] Session tokens invalidate on logout
- [ ] No secrets in console logs or network tab

---

## 📱 Device Testing Quick Check

### Mobile (375px)
- [ ] Login page works
- [ ] Dashboard accessible
- [ ] Forms usable
- [ ] Buttons tappable
- [ ] Navigation works

### Tablet (768px)
- [ ] Layout adapts
- [ ] Forms usable
- [ ] Navigation visible

### Desktop (1440px)
- [ ] Full layout visible
- [ ] Hover effects work
- [ ] Optimal spacing

---

## 🔍 Daily Smoke Tests

1. **Homepage loads** ✓
2. **Login works** ✓
3. **Dashboard accessible** ✓
4. **No console errors** ✓
5. **Mobile responsive** ✓

---

## 🐛 Common Issues to Check

### UI/UX Issues
- [ ] Login button not working on mobile
- [ ] Form validation errors not showing
- [ ] Button states (hover, active, disabled) not working
- [ ] Images stretched or blurry
- [ ] Color contrast issues (WCAG AA)
- [ ] Animations causing motion sickness

### Functional Issues
- [ ] API errors not handled gracefully
- [ ] Images not loading
- [ ] Navigation broken on mobile
- [ ] Token expiry not handled
- [ ] Role permissions not enforced
- [ ] Empty states not styled
- [ ] Double submit not prevented
- [ ] Form data lost on refresh

### Security Issues
- [ ] XSS vulnerabilities (script tags execute)
- [ ] CSRF tokens missing
- [ ] Rate limiting not working
- [ ] Sensitive data in logs
- [ ] Passwords in plaintext

### Performance Issues
- [ ] Slow page loads (>3s)
- [ ] Memory leaks on navigation
- [ ] Large bundle sizes
- [ ] N+1 database queries
- [ ] Unoptimized images

---

## 📊 Test Coverage Goals

- Authentication: 100%
- Booking Flow: 95%
- Payment Flow: 90%
- Admin Features: 85%
- Public Pages: 80%

---

## 🎯 Priority Levels

- **P1 (Critical):** Blocks release, affects core functionality
- **P2 (High):** Important but workaround exists
- **P3 (Medium):** Nice to have, can be fixed later

---

## 📝 Bug Report Quick Template

```
**Title:** [Brief description]
**Severity:** P1/P2/P3
**Steps:**
1. 
2. 
3. 
**Expected:** 
**Actual:** 
**Screenshot:** [Attach]
```

---

## ✅ Sign-Off Checklist

Before marking as "Ready for Release":
- [ ] All P1 tests pass
- [ ] ≥95% P2 tests pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Mobile tested
- [ ] Cross-browser tested
- [ ] Documentation updated

---

## 🔄 Weekly QA Tasks

### Monday: Security & Performance
- [ ] Run security audit (`npm audit`)
- [ ] Check Lighthouse scores
- [ ] Test rate limiting
- [ ] Verify XSS/CSRF protection
- [ ] Check memory usage

### Tuesday: UI/UX & Accessibility
- [ ] Test all button states
- [ ] Verify color contrast
- [ ] Test keyboard navigation
- [ ] Check responsive breakpoints
- [ ] Verify error messages

### Wednesday: API & Integration
- [ ] Test all API endpoints
- [ ] Verify error handling (4xx/5xx)
- [ ] Test timeout/retry logic
- [ ] Check data sync
- [ ] Verify webhooks (if applicable)

### Thursday: Data & Business Logic
- [ ] Test cross-field validation
- [ ] Test boundary values
- [ ] Verify database constraints
- [ ] Test duplicate prevention
- [ ] Check transaction rollback

### Friday: Cross-Browser & Devices
- [ ] Test Chrome, Safari, Firefox, Edge
- [ ] Test mobile (iOS/Android)
- [ ] Test tablet
- [ ] Test high DPI screens
- [ ] Test PWA features

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (unit + E2E)
- [ ] No linting errors
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Code reviewed

### Security
- [ ] Security audit passed
- [ ] No vulnerabilities
- [ ] XSS/CSRF protection verified
- [ ] Rate limiting active
- [ ] Secrets not exposed

### Performance
- [ ] Lighthouse score ≥90
- [ ] Core Web Vitals met
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] No memory leaks

### Functionality
- [ ] All P1 test cases pass
- [ ] ≥95% P2 test cases pass
- [ ] Critical bugs fixed
- [ ] Smoke tests pass
- [ ] Regression tests pass

### Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Changelog updated
- [ ] Test cases documented

---

**Last Updated:** 2024-12-19  
**Version:** 2.0  
**See `COMPREHENSIVE_QA_TEST_PLAN.md` for complete test cases**

