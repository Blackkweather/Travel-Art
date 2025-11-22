# Artist Dashboard Test Plan
**Date**: 2025-01-22  
**Status**: ⏳ Ready for Testing

---

## 📋 DASHBOARD PAGES

### Available Pages
1. ✅ `ArtistDashboard.tsx` - Main dashboard
2. ✅ `ArtistProfile.tsx` - Profile management
3. ✅ `ArtistBookings.tsx` - Booking management
4. ✅ `ArtistMembership.tsx` - Membership management
5. ✅ `ArtistReferrals.tsx` - Referral program

---

## 🧪 TEST SCENARIOS

### 1. Artist Dashboard (`/dashboard`)

#### Test Cases
- ⏭️ **TC-ART-DASH-001**: Dashboard loads with user stats
- ⏭️ **TC-ART-DASH-002**: Displays total bookings count
- ⏭️ **TC-ART-DASH-003**: Displays hotels worked with count
- ⏭️ **TC-ART-DASH-004**: Displays average rating
- ⏭️ **TC-ART-DASH-005**: Shows recent bookings list
- ⏭️ **TC-ART-DASH-006**: Loading state displays correctly
- ⏭️ **TC-ART-DASH-007**: Error state handles gracefully
- ⏭️ **TC-ART-DASH-008**: Navigation to profile works
- ⏭️ **TC-ART-DASH-009**: Navigation to bookings works

#### Manual Test Steps
1. Login as ARTIST user
2. Navigate to `/dashboard`
3. Verify stats cards display
4. Verify recent bookings list
5. Test navigation links

---

### 2. Artist Profile (`/dashboard/profile`)

#### Test Cases
- ⏭️ **TC-ART-PROF-001**: Profile page loads with current data
- ⏭️ **TC-ART-PROF-002**: Edit mode toggles correctly
- ⏭️ **TC-ART-PROF-003**: Profile fields are editable
- ⏭️ **TC-ART-PROF-004**: Save updates profile successfully
- ⏭️ **TC-ART-PROF-005**: Cancel discards changes
- ⏭️ **TC-ART-PROF-006**: Image upload works (if implemented)
- ⏭️ **TC-ART-PROF-007**: Validation errors display
- ⏭️ **TC-ART-PROF-008**: Loading state during save

#### Manual Test Steps
1. Navigate to `/dashboard/profile`
2. Click "Edit" button
3. Modify profile fields
4. Click "Save"
5. Verify changes persist
6. Test validation

---

### 3. Artist Bookings (`/dashboard/bookings`)

#### Test Cases
- ⏭️ **TC-ART-BOOK-001**: Bookings list loads
- ⏭️ **TC-ART-BOOK-002**: Filter by status works
- ⏭️ **TC-ART-BOOK-003**: Accept booking works
- ⏭️ **TC-ART-BOOK-004**: Reject booking works
- ⏭️ **TC-ART-BOOK-005**: Booking details display correctly
- ⏭️ **TC-ART-BOOK-006**: Empty state displays when no bookings
- ⏭️ **TC-ART-BOOK-007**: Loading state displays
- ⏭️ **TC-ART-BOOK-008**: Error handling works

#### Manual Test Steps
1. Navigate to `/dashboard/bookings`
2. Verify bookings list displays
3. Test status filters
4. Accept a pending booking
5. Reject a pending booking
6. Verify status updates

---

### 4. Artist Membership (`/dashboard/membership`)

#### Test Cases
- ⏭️ **TC-ART-MEM-001**: Membership status displays
- ⏭️ **TC-ART-MEM-002**: Upgrade membership works
- ⏭️ **TC-ART-MEM-003**: Payment flow works
- ⏭️ **TC-ART-MEM-004**: Membership benefits display
- ⏭️ **TC-ART-MEM-005**: Referral code displays
- ⏭️ **TC-ART-MEM-006**: Membership history shows

#### Manual Test Steps
1. Navigate to `/dashboard/membership`
2. Verify current membership status
3. Test upgrade flow (if applicable)
4. Verify referral code display
5. Check membership benefits

---

### 5. Artist Referrals (`/dashboard/referrals`)

#### Test Cases
- ⏭️ **TC-ART-REF-001**: Referral code displays
- ⏭️ **TC-ART-REF-002**: Referral link displays
- ⏭️ **TC-ART-REF-003**: Copy referral link works
- ⏭️ **TC-ART-REF-004**: Referrals list displays
- ⏭️ **TC-ART-REF-005**: Referral stats display
- ⏭️ **TC-ART-REF-006**: Create referral invitation works
- ⏭️ **TC-ART-REF-007**: Referral rewards display

#### Manual Test Steps
1. Navigate to `/dashboard/referrals`
2. Verify referral code and link display
3. Test copy to clipboard
4. Verify referrals list
5. Test creating new referral
6. Check stats and rewards

---

## ✅ VALIDATION CHECKLIST

### Dashboard
- [ ] Loads correctly
- [ ] Stats display accurately
- [ ] Navigation works
- [ ] Loading states work
- [ ] Error handling works

### Profile
- [ ] Displays current data
- [ ] Edit mode works
- [ ] Save updates work
- [ ] Validation works
- [ ] Image upload (if applicable)

### Bookings
- [ ] List displays correctly
- [ ] Filters work
- [ ] Accept/reject work
- [ ] Status updates
- [ ] Empty states work

### Membership
- [ ] Status displays
- [ ] Upgrade flow works
- [ ] Payment integration
- [ ] Benefits display

### Referrals
- [ ] Code displays
- [ ] Link works
- [ ] Copy works
- [ ] List displays
- [ ] Stats accurate

---

## 🧪 TEST EXECUTION

### Prerequisites
1. Backend server running
2. Frontend server running
3. ARTIST user account created
4. Test data seeded

### Manual Testing
1. Login as ARTIST user
2. Navigate through each dashboard page
3. Test all interactive elements
4. Verify API calls work
5. Check error handling

### Automated Testing (To Be Created)
```bash
# Create Cypress test file
frontend/cypress/e2e/artist-dashboard.cy.ts
```

---

## 📊 TEST STATUS

- **Total Pages**: 5
- **Test Cases Defined**: 35+
- **Automated Tests**: 0 (to be created)
- **Manual Tests**: Ready to execute

---

**Status**: ⏳ Ready for Manual Testing | 📝 Automated Tests To Be Created

