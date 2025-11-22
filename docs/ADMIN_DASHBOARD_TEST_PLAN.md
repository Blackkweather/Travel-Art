# Admin Dashboard Test Plan
**Date**: 2025-01-22  
**Status**: ⏳ Ready for Testing

---

## 📋 DASHBOARD PAGES

### Available Pages
1. ✅ `AdminDashboard.tsx` - Main dashboard
2. ✅ `AdminUsers.tsx` - User management
3. ✅ `AdminBookings.tsx` - Booking management
4. ✅ `AdminAnalytics.tsx` - Analytics
5. ✅ `AdminModeration.tsx` - Content moderation
6. ✅ `AdminReferrals.tsx` - Referral management

---

## 🧪 TEST SCENARIOS

### 1. Admin Dashboard (`/dashboard`)

#### Test Cases
- ⏭️ **TC-ADMIN-DASH-001**: Dashboard loads with stats
- ⏭️ **TC-ADMIN-DASH-002**: Total users count displays
- ⏭️ **TC-ADMIN-DASH-003**: Total artists count displays
- ⏭️ **TC-ADMIN-DASH-004**: Total hotels count displays
- ⏭️ **TC-ADMIN-DASH-005**: Total bookings count displays
- ⏭️ **TC-ADMIN-DASH-006**: Revenue displays (if applicable)
- ⏭️ **TC-ADMIN-DASH-007**: Recent activity displays
- ⏭️ **TC-ADMIN-DASH-008**: Top artists list displays
- ⏭️ **TC-ADMIN-DASH-009**: Top hotels list displays
- ⏭️ **TC-ADMIN-DASH-010**: Navigation to sub-pages works

#### Manual Test Steps
1. Login as ADMIN user
2. Navigate to `/dashboard`
3. Verify all stats cards
4. Verify activity feed
5. Test navigation links

---

### 2. Admin Users (`/dashboard/users`)

#### Test Cases
- ⏭️ **TC-ADMIN-USR-001**: Users list loads
- ⏭️ **TC-ADMIN-USR-002**: Filter by role works
- ⏭️ **TC-ADMIN-USR-003**: Search users works
- ⏭️ **TC-ADMIN-USR-004**: Suspend user works
- ⏭️ **TC-ADMIN-USR-005**: Activate user works
- ⏭️ **TC-ADMIN-USR-006**: Pagination works
- ⏭️ **TC-ADMIN-USR-007**: User details display
- ⏭️ **TC-ADMIN-USR-008**: Export users works (if implemented)

#### Manual Test Steps
1. Navigate to `/dashboard/users`
2. Verify users list displays
3. Test role filter
4. Test search functionality
5. Suspend a user
6. Activate a user
7. Test pagination

---

### 3. Admin Bookings (`/dashboard/bookings`)

#### Test Cases
- ⏭️ **TC-ADMIN-BOOK-001**: Bookings list loads
- ⏭️ **TC-ADMIN-BOOK-002**: Filter by status works
- ⏭️ **TC-ADMIN-BOOK-003**: Filter by date works
- ⏭️ **TC-ADMIN-BOOK-004**: Booking details display
- ⏭️ **TC-ADMIN-BOOK-005**: Edit booking works
- ⏭️ **TC-ADMIN-BOOK-006**: Cancel booking works
- ⏭️ **TC-ADMIN-BOOK-007**: Export bookings works (if implemented)

#### Manual Test Steps
1. Navigate to `/dashboard/bookings`
2. Verify bookings list
3. Test filters
4. View booking details
5. Test edit/cancel actions

---

### 4. Admin Analytics (`/dashboard/analytics`)

#### Test Cases
- ⏭️ **TC-ADMIN-ANA-001**: Analytics page loads
- ⏭️ **TC-ADMIN-ANA-002**: Charts display correctly
- ⏭️ **TC-ADMIN-ANA-003**: Date range filter works
- ⏭️ **TC-ADMIN-ANA-004**: Revenue charts display
- ⏭️ **TC-ADMIN-ANA-005**: User growth charts display
- ⏭️ **TC-ADMIN-ANA-006**: Booking trends display
- ⏭️ **TC-ADMIN-ANA-007**: Export analytics works (if implemented)

#### Manual Test Steps
1. Navigate to `/dashboard/analytics`
2. Verify all charts load
3. Test date range filters
4. Verify data accuracy
5. Test export functionality

---

### 5. Admin Moderation (`/dashboard/moderation`)

#### Test Cases
- ⏭️ **TC-ADMIN-MOD-001**: Moderation page loads
- ⏭️ **TC-ADMIN-MOD-002**: Artists tab displays
- ⏭️ **TC-ADMIN-MOD-003**: Hotels tab displays
- ⏭️ **TC-ADMIN-MOD-004**: Approve artist works
- ⏭️ **TC-ADMIN-MOD-005**: Reject artist works
- ⏭️ **TC-ADMIN-MOD-006**: Approve hotel works
- ⏭️ **TC-ADMIN-MOD-007**: Reject hotel works
- ⏭️ **TC-ADMIN-MOD-008**: Export moderation data works

#### Manual Test Steps
1. Navigate to `/dashboard/moderation`
2. Switch between Artists/Hotels tabs
3. Test approve actions
4. Test reject actions
5. Verify status updates

---

### 6. Admin Referrals (`/dashboard/referrals`)

#### Test Cases
- ⏭️ **TC-ADMIN-REF-001**: Referrals page loads
- ⏭️ **TC-ADMIN-REF-002**: Referrals list displays
- ⏭️ **TC-ADMIN-REF-003**: Filter by status works
- ⏭️ **TC-ADMIN-REF-004**: Referral stats display
- ⏭️ **TC-ADMIN-REF-005**: Export referrals works

#### Manual Test Steps
1. Navigate to `/dashboard/referrals`
2. Verify referrals list
3. Test filters
4. Check stats
5. Test export

---

## ✅ VALIDATION CHECKLIST

### Dashboard
- [ ] Loads correctly
- [ ] All stats display
- [ ] Charts render
- [ ] Navigation works
- [ ] Loading states work

### Users
- [ ] List displays
- [ ] Filters work
- [ ] Search works
- [ ] Suspend/activate work
- [ ] Pagination works

### Bookings
- [ ] List displays
- [ ] Filters work
- [ ] Details display
- [ ] Edit/cancel work

### Analytics
- [ ] Charts display
- [ ] Data accurate
- [ ] Filters work
- [ ] Export works

### Moderation
- [ ] Tabs work
- [ ] Approve/reject work
- [ ] Status updates
- [ ] Export works

### Referrals
- [ ] List displays
- [ ] Filters work
- [ ] Stats accurate
- [ ] Export works

---

## 🧪 TEST EXECUTION

### Prerequisites
1. Backend server running
2. Frontend server running
3. ADMIN user account created
4. Test data seeded

### Manual Testing
1. Login as ADMIN user
2. Navigate through each dashboard page
3. Test all interactive elements
4. Verify API calls work
5. Check error handling

### Automated Testing (To Be Created)
```bash
# Create Cypress test file
frontend/cypress/e2e/admin-dashboard.cy.ts
```

---

## 📊 TEST STATUS

- **Total Pages**: 6
- **Test Cases Defined**: 40+
- **Automated Tests**: 0 (to be created)
- **Manual Tests**: Ready to execute

---

**Status**: ⏳ Ready for Manual Testing | 📝 Automated Tests To Be Created

