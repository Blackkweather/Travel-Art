# Role Functionality Guide - What Each Role Can Do

**Date**: ${new Date().toISOString().split('T')[0]}  
**Purpose**: Comprehensive guide explaining what each user role (ARTIST, HOTEL, ADMIN) can do in their dashboard

---

## 🎭 ARTIST ROLE - Complete Feature List

### Dashboard Overview (`/dashboard`)

**What Artists See:**
1. **Welcome Message** - Personalized greeting
2. **Statistics Cards** (4 key metrics):
   - 📅 **Total Bookings** - All bookings received
   - 🏨 **Hotels Worked With** - Unique hotels collaborated with
   - ⭐ **Hotel Rating** - Average rating from hotels
   - 📋 **Active Bookings** - Current PENDING or CONFIRMED bookings

3. **Recent Bookings Section**:
   - List of last 5 bookings
   - Hotel name and location
   - Performance spot
   - Booking date
   - Status (pending, confirmed, completed, cancelled, rejected)
   - Empty state if no bookings

4. **Quick Actions**:
   - **Update Availability** → Links to Profile page to manage calendar
   - **Performance Gallery** → Links to Profile page to upload media

---

### 1. My Profile (`/dashboard/profile`)

**What Artists Can Do:**
- ✅ View their artist profile information
- ✅ Edit profile details:
  - Name, discipline, bio
  - Location (city, country)
  - Contact information
  - Social media links
  - Specialties/tags
- ✅ Upload images/videos/portfolio
- ✅ Manage availability calendar:
  - Set available dates
  - Block unavailable dates
  - View booking conflicts
- ✅ Update membership status visibility
- ✅ View public profile preview

**Key Features:**
- Profile completeness indicator
- Media gallery management
- Availability calendar management
- Public profile link sharing

---

### 2. My Bookings (`/dashboard/bookings`)

**What Artists Can Do:**
- ✅ View all their bookings
- ✅ Filter bookings by status:
  - All
  - Pending
  - Confirmed
  - Completed
  - Cancelled
  - Rejected
- ✅ See booking details:
  - Hotel name and location
  - Performance spot/venue
  - Start and end dates
  - Booking duration
  - Status
  - Credits used
  - Notes
- ✅ Take actions on bookings:
  - Accept/Confirm bookings
  - Reject bookings
  - View booking details
- ✅ Sort bookings by date
- ✅ Empty state message if no bookings

**Booking Statuses:**
- **PENDING** - Waiting for artist confirmation
- **CONFIRMED** - Artist accepted the booking
- **COMPLETED** - Booking finished successfully
- **CANCELLED** - Booking cancelled by either party
- **REJECTED** - Artist declined the booking

---

### 3. Membership (`/dashboard/membership`)

**What Artists Can Do:**
- ✅ View current membership status:
  - INACTIVE (Free tier)
  - ACTIVE (Professional or Enterprise)
- ✅ See membership details:
  - Membership type
  - Member since date
  - Referral code
  - Total bookings count
- ✅ Upgrade membership:
  - **PROFESSIONAL** - Paid tier with more features
  - **ENTERPRISE** - Premium tier with all features
- ✅ Purchase membership via payment gateway
- ✅ View membership benefits comparison

**Membership Benefits:**
- INACTIVE: Basic profile, limited bookings
- PROFESSIONAL: Enhanced features, priority in search
- ENTERPRISE: All features, premium placement, unlimited bookings

---

### 4. Referrals (`/dashboard/referrals`)

**What Artists Can Do:**
- ✅ View their unique referral code
- ✅ Generate referral link (format: `https://www.travel-arts.com/ref/{CODE}`)
- ✅ Copy referral link to clipboard
- ✅ View referral statistics:
  - Total referrals
  - Active referrals (membership ACTIVE)
  - Pending referrals (not yet activated)
  - Total credits earned
  - Loyalty points
- ✅ See list of referred users:
  - Name and email
  - Discipline
  - Joined date
  - Status (active/pending)
  - Credits earned per referral
- ✅ Track referral performance

**How Referrals Work:**
1. Artist shares referral link/code
2. New artist registers using referral code
3. Referring artist earns loyalty points/credits
4. Credits are shown in dashboard

---

### Additional Artist Features:

- ✅ **Public Profile** - Viewable at `/artist/:id`
- ✅ **Booking Notifications** - Receive updates on booking status changes
- ✅ **Search Visibility** - Profile appears in hotel artist searches
- ✅ **Rating System** - Can receive ratings from hotels after bookings

---

## 🏨 HOTEL ROLE - Complete Feature List

### Dashboard Overview (`/dashboard`)

**What Hotels See:**
1. **Welcome Message** - Personalized greeting
2. **Statistics Cards** (4 key metrics):
   - 📅 **Active Bookings** - Current bookings (PENDING/CONFIRMED)
   - 💳 **Available Credits** - Credits available for bookings
   - 👥 **Artists Booked** - Unique artists booked
   - 📍 **Performance Spots** - Number of venues/spots configured

3. **Upcoming Performances Section**:
   - List of next 5 scheduled performances
   - Artist name and discipline
   - Performance spot
   - Date and time
   - Status (pending/confirmed)
   - Empty state if none scheduled

4. **Performance Spots Section**:
   - All configured performance venues
   - Spot name, type, capacity
   - Description
   - Images
   - Empty state if none configured

5. **Favorite Artists Section** (if any):
   - Quick access to saved favorite artists
   - Artist name, discipline, rating
   - Link to artist profile

6. **Quick Actions**:
   - **Browse Artists** → Find and book artists
   - **Manage Credits** → Purchase more credits

---

### 1. Hotel Profile (`/dashboard/profile`)

**What Hotels Can Do:**
- ✅ View hotel profile information
- ✅ Edit profile details:
  - Hotel name
  - Description
  - Location (city, country, coordinates)
  - Contact information
  - Representative name
- ✅ Manage performance spots:
  - Add new performance venues
  - Edit spot details (name, type, capacity, description)
  - Upload spot images
  - Remove spots
- ✅ Upload hotel images:
  - Main images
  - Spot-specific images
- ✅ Update contact information
- ✅ View public profile preview

**Performance Spot Types:**
- Rooftop Terrace
- Jazz Lounge
- Grand Ballroom
- Beach Club
- Garden Terrace
- Pool Deck
- Wine Cellar
- Custom venues

---

### 2. Browse Artists (`/dashboard/artists`)

**What Hotels Can Do:**
- ✅ Search and filter artists:
  - By discipline (Pianist, DJ, Saxophonist, etc.)
  - By location
  - By date availability
  - By rating
- ✅ View artist cards with:
  - Name and photo
  - Discipline
  - Location
  - Rating
  - Number of bookings
  - Rating badges (Top 10%, Excellent, etc.)
  - Availability status
- ✅ View artist profiles
- ✅ Book artists:
  - Select artist
  - Choose dates
  - Select performance spot
  - Confirm booking (uses credits)
- ✅ Add artists to favorites
- ✅ Remove artists from favorites
- ✅ Sort artists (by rating, bookings, date)

**Booking Flow:**
1. Browse/search artists
2. View artist profile
3. Check availability
4. Create booking request
5. Credits are used when booking is confirmed
6. Artist receives booking notification

---

### 3. Bookings (`/dashboard/bookings`)

**What Hotels Can Do:**
- ✅ View all hotel bookings
- ✅ Filter bookings by status:
  - All
  - Pending
  - Confirmed
  - Completed
  - Cancelled
  - Rejected
- ✅ See booking details:
  - Artist name and discipline
  - Performance spot
  - Start and end dates
  - Duration
  - Status
  - Credits used
  - Notes
- ✅ Take actions on bookings:
  - Confirm bookings
  - Cancel bookings
  - View booking details
  - Rate artists after completion
- ✅ Sort bookings by date
- ✅ Empty state message if no bookings

---

### 4. Credits (`/dashboard/credits`)

**What Hotels Can Do:**
- ✅ View credit balance:
  - Available credits
  - Total credits purchased
  - Used credits
- ✅ Purchase credit packages:
  - View available packages
  - Select package
  - Choose payment method (Card, PayPal)
  - Complete purchase
- ✅ View transaction history:
  - Credit purchases
  - Booking fees
  - Transaction dates
  - Amounts
- ✅ See credit usage statistics:
  - Total spent
  - Total bookings made
  - Average credits per booking
- ✅ Empty state if no credits

**Credit System:**
- Credits are required to book artists
- 1 credit = 1 booking (typically)
- Credits can be purchased in packages
- Credits don't expire
- Credits are deducted when booking is confirmed

---

### Additional Hotel Features:

- ✅ **Booking Calendar** - Visual calendar of all bookings
- ✅ **Artist Favorites** - Save favorite artists for quick access
- ✅ **Rating Artists** - Rate artists after completed bookings
- ✅ **Booking Management** - Full control over hotel bookings
- ✅ **Performance Spot Management** - Configure multiple venues

---

## 👑 ADMIN ROLE - Complete Feature List

### Dashboard Overview (`/dashboard`)

**What Admins See:**
1. **Platform Statistics** (4 key metrics):
   - 👥 **Total Users** - All registered users
   - 🏨 **Active Hotels** - Number of hotel accounts
   - 🎭 **Registered Artists** - Number of artist accounts
   - 📅 **Total Bookings** - All bookings ever created

2. **Recent Activity Feed**:
   - Booking status changes
   - Payment transactions
   - Platform updates
   - User actions
   - Real-time activity stream
   - Lifetime revenue display

3. **Top Performing Artists**:
   - Top 4 artists by bookings
   - Artist name and specialty
   - Booking count
   - Average rating

4. **Most Active Hotels**:
   - Top 4 hotels by bookings
   - Hotel name and location
   - Booking count
   - Featured performance spot

5. **Quick Actions**:
   - **User Management** → Manage all users
   - **Platform Analytics** → Detailed analytics
   - **Content Moderation** → Review content

6. **Additional Tools**:
   - **Referral Tracking** → Monitor referral program

---

### 1. Users (`/dashboard/users`)

**What Admins Can Do:**
- ✅ View all platform users:
  - Artists
  - Hotels
  - Admins
- ✅ Filter users by:
  - Role (ARTIST, HOTEL, ADMIN)
  - Status (active, suspended)
  - Registration date
  - Location
- ✅ Search users by:
  - Name
  - Email
  - User ID
- ✅ View user details:
  - Profile information
  - Account status
  - Registration date
  - Bookings count
  - Activity history
- ✅ Manage users:
  - **Suspend** users (temporary ban)
  - **Activate** suspended users
  - **Delete** users (permanent removal)
  - **Verify** accounts
- ✅ View user activity logs
- ✅ Export user data

**User Statuses:**
- **Active** - User can access platform
- **Suspended** - User temporarily banned
- **Inactive** - User hasn't logged in recently

---

### 2. Bookings (`/dashboard/bookings`)

**What Admins Can Do:**
- ✅ View all platform bookings
- ✅ Filter bookings by:
  - Status (all, pending, confirmed, completed, cancelled, rejected)
  - Date range
  - Hotel
  - Artist
- ✅ Search bookings by:
  - Booking ID
  - Hotel name
  - Artist name
- ✅ View booking details:
  - Complete booking information
  - Hotel details
  - Artist details
  - Dates and duration
  - Credits used
  - Transaction history
- ✅ Manage bookings:
  - **Confirm** bookings manually
  - **Cancel** bookings
  - **Refund** credits if needed
  - **View** all related data
- ✅ Export booking data
- ✅ View booking statistics

---

### 3. Analytics (`/dashboard/analytics`)

**What Admins Can Do:**
- ✅ View platform-wide statistics:
  - Total users
  - Total bookings
  - Total revenue
  - Active users
- ✅ View trends and charts:
  - **Booking Trends** - Bookings over time (monthly)
  - **Revenue Trends** - Revenue over time (monthly)
  - **User Growth** - New users over time
  - **Artist Growth** - New artists over time
  - **Hotel Growth** - New hotels over time
- ✅ View performance metrics:
  - Top performing artists
  - Most active hotels
  - Popular performance spots
  - Booking success rates
- ✅ Export analytics data
- ✅ View time-range comparisons
- ✅ Download reports

**Analytics Features:**
- Interactive charts and graphs
- Date range filters
- Export to CSV/PDF
- Comparative analysis
- Performance metrics

---

### 4. Moderation (`/dashboard/moderation`)

**What Admins Can Do:**
- ✅ Review user-generated content:
  - Artist profiles
  - Hotel profiles
  - Performance media
  - Reviews and ratings
- ✅ Moderate content:
  - **Approve** content
  - **Reject** inappropriate content
  - **Flag** for review
  - **Edit** content if needed
- ✅ Handle reports:
  - User reports
  - Spam reports
  - Inappropriate content reports
  - Abuse reports
- ✅ View moderation queue
- ✅ Review pending content
- ✅ Block inappropriate users

**Content Types Reviewed:**
- Profile images
- Performance videos
- Hotel images
- Bio descriptions
- Reviews
- Ratings

---

### 5. Referrals (`/dashboard/referrals`) - Admin View

**What Admins Can Do:**
- ✅ View platform-wide referral statistics:
  - Total referrals made
  - Successful referrals
  - Total credits awarded
  - Average referrals per artist
- ✅ View top referrers:
  - Artists with most referrals
  - Credits earned
  - Success rates
- ✅ Monitor referral program performance
- ✅ Export referral data
- ✅ View referral trends

---

### Additional Admin Features:

- ✅ **Platform Control** - Full access to all features
- ✅ **Data Export** - Export any data in CSV/PDF format
- ✅ **System Monitoring** - Monitor platform health
- ✅ **Revenue Tracking** - Track all payments and revenue
- ✅ **Activity Logs** - View all platform activity
- ✅ **Content Management** - Approve/reject all content
- ✅ **User Support** - Handle support requests
- ✅ **Platform Settings** - Configure platform settings

---

## 🔐 Permission Summary

### ARTIST Permissions:
- ✅ View own profile and bookings
- ✅ Edit own profile
- ✅ Manage own availability
- ✅ Accept/reject bookings
- ✅ Purchase membership
- ✅ Generate referral links
- ✅ View own referrals
- ❌ Cannot book artists (that's for hotels)
- ❌ Cannot view other artists' private data
- ❌ Cannot manage platform settings

### HOTEL Permissions:
- ✅ View own hotel profile
- ✅ Edit own hotel profile
- ✅ Browse all artists (public profiles)
- ✅ Create bookings (with credits)
- ✅ Manage own bookings
- ✅ Purchase credits
- ✅ Manage performance spots
- ✅ Add artists to favorites
- ✅ Rate artists after bookings
- ❌ Cannot edit artist profiles
- ❌ Cannot view other hotels' private data
- ❌ Cannot manage platform settings

### ADMIN Permissions:
- ✅ **FULL ACCESS** to all features
- ✅ View all users, bookings, transactions
- ✅ Manage any user account
- ✅ Moderate all content
- ✅ View all analytics
- ✅ Export all data
- ✅ Manage platform settings
- ✅ Handle support requests
- ✅ System administration

---

## 📊 Role Comparison Matrix

| Feature | ARTIST | HOTEL | ADMIN |
|---------|--------|-------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ |
| Browse Artists | ❌ | ✅ | ✅ |
| Create Bookings | ❌ | ✅ | ✅ |
| View Own Bookings | ✅ | ✅ | ✅ |
| Manage All Bookings | ❌ | ❌ | ✅ |
| Purchase Credits | ❌ | ✅ | ✅ |
| Purchase Membership | ✅ | ❌ | ✅ |
| Generate Referrals | ✅ | ❌ | ✅ |
| Manage Performance Spots | ❌ | ✅ | ✅ |
| Rate Users | ❌ | ✅ (Artists) | ✅ |
| View Analytics | ❌ | ❌ | ✅ |
| Moderate Content | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Export Data | ❌ | ❌ | ✅ |

---

## 🎯 Quick Reference - What Can Each Role Do?

### 🎭 **ARTIST** Can:
1. ✅ Manage profile and portfolio
2. ✅ Set availability calendar
3. ✅ Accept/reject booking requests
4. ✅ View booking history
5. ✅ Purchase membership (Professional/Enterprise)
6. ✅ Generate referral links
7. ✅ Track referral rewards
8. ✅ Upload performance media
9. ✅ View ratings from hotels

### 🏨 **HOTEL** Can:
1. ✅ Manage hotel profile
2. ✅ Configure performance spots
3. ✅ Browse and search artists
4. ✅ Book artists (using credits)
5. ✅ Manage bookings
6. ✅ Purchase credits
7. ✅ View upcoming performances
8. ✅ Save favorite artists
9. ✅ Rate artists after bookings

### 👑 **ADMIN** Can:
1. ✅ View all platform data
2. ✅ Manage all users
3. ✅ Moderate all content
4. ✅ View analytics and reports
5. ✅ Export data
6. ✅ Manage bookings
7. ✅ Handle support requests
8. ✅ Monitor platform activity
9. ✅ Configure platform settings

---

**Document Generated**: ${new Date().toISOString()}

