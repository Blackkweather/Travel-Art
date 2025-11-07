# Test Case Template

Use this template for documenting all test cases.

---

## Test Case Format

| Field | Description | Example |
|-------|-------------|---------|
| **Test ID** | Unique identifier | TC-001 |
| **Test Name** | Descriptive name | User Login with Valid Credentials |
| **Module** | Feature area | Authentication |
| **Objective** | What is being tested | Verify user can login with valid email and password |
| **Preconditions** | Setup required | User account exists (artist1@example.com / password123) |
| **Test Data** | Data needed | Email: artist1@example.com, Password: password123 |
| **Steps** | Detailed steps | 1. Navigate to /login<br>2. Enter email<br>3. Enter password<br>4. Click Sign In |
| **Expected Result** | What should happen | User redirected to /dashboard, welcome message shown |
| **Actual Result** | What happened | [Fill during execution] |
| **Priority** | P1/P2/P3 | P1 |
| **Status** | Pass/Fail/Blocked | [Fill during execution] |
| **Screenshots** | Attach if failed | [Attach] |
| **Notes** | Additional info | [Any notes] |

---

## Sample Test Cases

### TC-001: User Login with Valid Credentials

| Field | Value |
|-------|-------|
| **Test ID** | TC-001 |
| **Test Name** | User Login with Valid Credentials |
| **Module** | Authentication |
| **Objective** | Verify user can login with valid email and password |
| **Preconditions** | User account exists (artist1@example.com / password123) |
| **Test Data** | Email: artist1@example.com, Password: password123 |
| **Steps** | 1. Navigate to /login<br>2. Enter email: artist1@example.com<br>3. Enter password: password123<br>4. Click "Sign In" button |
| **Expected Result** | User redirected to /dashboard, welcome message displayed, user data loaded |
| **Actual Result** | [Fill during execution] |
| **Priority** | P1 (Critical) |
| **Status** | [Pass/Fail/Blocked] |
| **Screenshots** | [Attach if failed] |
| **Notes** | - |

---

### TC-002: User Login with Invalid Credentials

| Field | Value |
|-------|-------|
| **Test ID** | TC-002 |
| **Test Name** | User Login with Invalid Credentials |
| **Module** | Authentication |
| **Objective** | Verify error message shown for invalid credentials |
| **Preconditions** | User is on login page |
| **Test Data** | Email: invalid@example.com, Password: wrongpassword |
| **Steps** | 1. Navigate to /login<br>2. Enter email: invalid@example.com<br>3. Enter password: wrongpassword<br>4. Click "Sign In" button |
| **Expected Result** | Error toast displayed: "Invalid credentials", user remains on login page |
| **Actual Result** | [Fill during execution] |
| **Priority** | P1 (Critical) |
| **Status** | [Pass/Fail/Blocked] |
| **Screenshots** | [Attach if failed] |
| **Notes** | - |

---

### TC-003: ARTIST Role Access Control

| Field | Value |
|-------|-------|
| **Test ID** | TC-003 |
| **Test Name** | ARTIST Role Access Control |
| **Module** | Authorization |
| **Objective** | Verify ARTIST cannot access HOTEL/ADMIN only routes |
| **Preconditions** | User logged in as ARTIST |
| **Test Data** | ARTIST account credentials |
| **Steps** | 1. Login as ARTIST<br>2. Navigate to /dashboard/artists (HOTEL only)<br>3. Navigate to /dashboard/users (ADMIN only) |
| **Expected Result** | Access denied or redirect to appropriate dashboard |
| **Actual Result** | [Fill during execution] |
| **Priority** | P1 (Critical) |
| **Status** | [Pass/Fail/Blocked] |
| **Screenshots** | [Attach if failed] |
| **Notes** | - |

---

## Test Case Categories

### Authentication (AUTH)
- TC-AUTH-001 to TC-AUTH-050

### Booking (BOOK)
- TC-BOOK-001 to TC-BOOK-050

### Payment (PAY)
- TC-PAY-001 to TC-PAY-030

### Profile (PROF)
- TC-PROF-001 to TC-PROF-040

### Admin (ADMIN)
- TC-ADMIN-001 to TC-ADMIN-050

### UI/UX (UI)
- TC-UI-001 to TC-UI-100

### Responsive (RESP)
- TC-RESP-001 to TC-RESP-050

### Accessibility (A11Y)
- TC-A11Y-001 to TC-A11Y-030

### Performance (PERF)
- TC-PERF-001 to TC-PERF-020

### Security (SEC)
- TC-SEC-001 to TC-SEC-030

---

## Test Execution Log

| Date | Test ID | Tester | Status | Notes |
|------|---------|-------|--------|-------|
| 2024-XX-XX | TC-001 | [Name] | Pass | - |
| 2024-XX-XX | TC-002 | [Name] | Pass | - |
| 2024-XX-XX | TC-003 | [Name] | Fail | Bug #123 |

---

**Template Version:** 1.0  
**Last Updated:** 2024

