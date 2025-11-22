# Hardcoded Data Fix Plan
**Date**: 2025-01-22  
**Status**: ⚠️ Action Required

---

## 🎯 FIX PRIORITY

### 🔴 Critical (Before Production)
1. Remove demo credentials from LoginPage
2. Replace mock payment processing
3. Replace mock receipt generation

### 🟡 High Priority
4. Replace LandingPage hardcoded data
5. Replace TravelerExperiencesPage hardcoded data
6. Replace ExperienceDetailsPage hardcoded data

---

## 🔧 FIXES NEEDED

### 1. LoginPage.tsx - Demo Credentials

**Current**:
```typescript
<div className="mt-8 text-center">
  <p className="text-sm text-gray-500">Demo credentials:</p>
  <p>Admin: admin@travelart.test / Password123!</p>
  <p>Artist: artist1@example.com / password123</p>
  <p>Hotel: hotel1@example.com / password123</p>
</div>
```

**Fix**:
```typescript
{import.meta.env.DEV && (
  <div className="mt-8 text-center">
    <p className="text-sm text-gray-500">Demo credentials (Dev Only):</p>
    <p>Admin: admin@travelart.test / Password123!</p>
    <p>Artist: artist1@example.com / password123</p>
    <p>Hotel: hotel1@example.com / password123</p>
  </div>
)}
```

---

### 2. LandingPage.tsx - Replace Hardcoded Data

**Current**: Hardcoded arrays  
**Fix**: Use API calls

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const [artistsRes, hotelsRes] = await Promise.all([
        commonApi.getTopArtists({ limit: 4 }),
        commonApi.getTopHotels({ limit: 4 })
      ])
      setArtists(artistsRes.data?.data || [])
      setHotels(hotelsRes.data?.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  fetchData()
}, [])
```

**Note**: Stories/journal entries need API endpoint created

---

### 3. TravelerExperiencesPage.tsx - Replace Hardcoded Data

**Current**: Hardcoded experiences array  
**Fix**: Use trips API

```typescript
useEffect(() => {
  const fetchExperiences = async () => {
    try {
      const res = await tripsApi.getAll({ status: 'published' })
      setExperiences(res.data?.data || [])
    } catch (error) {
      console.error('Error fetching experiences:', error)
    }
  }
  fetchExperiences()
}, [])
```

---

### 4. ExperienceDetailsPage.tsx - Replace Hardcoded Data

**Current**: Hardcoded experience object  
**Fix**: Use trips API

```typescript
useEffect(() => {
  const fetchExperience = async () => {
    if (!id) return
    try {
      const res = await tripsApi.getById(id)
      setExperience(res.data?.data)
    } catch (error) {
      setError('Experience not found')
    }
  }
  fetchExperience()
}, [id])
```

---

### 5. PaymentPage.tsx - Replace Mock Processing

**Current**: Mock payment functions  
**Fix**: Integrate real payment APIs

**Action Required**:
- Remove `processStripePayment()` mock
- Remove `processPayPalPayment()` mock
- Integrate Stripe server-side API
- Integrate PayPal server-side API
- Call backend payment endpoints

---

### 6. PaymentReceipt.tsx - Replace Mock Receipt

**Current**: Mock receipt  
**Fix**: Generate real receipts

**Action Required**:
- Remove "Mock Receipt" text
- Generate receipts from transaction data
- Use payment provider receipt data

---

## 📊 IMPACT SUMMARY

### Security
- 🔴 Demo credentials exposed
- 🔴 Mock payments not secure

### Functionality
- 🟡 Static data instead of dynamic
- 🟡 No real-time updates
- 🟡 Limited content

### User Experience
- 🟡 Same content always
- 🟡 No personalization
- 🟡 Outdated information

---

## ✅ VALIDATION

After fixes:
- [ ] No credentials visible in production
- [ ] All data comes from APIs
- [ ] Real payment processing works
- [ ] Real receipts generated
- [ ] No mock functions remain

---

**Status**: ⚠️ Fixes Required Before Production

