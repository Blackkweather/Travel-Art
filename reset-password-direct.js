/**
 * Direct Password Reset Script (Using Supabase MCP)
 * 
 * This script resets passwords directly via the database.
 * Run this in Node.js or use the MCP tools.
 */

// This is a helper script - you can use it with the MCP Supabase tools
// Or run it directly if you have database access

console.log(`
Password Reset Options:
=======================

Option 1: Use the Forgot Password Flow (Recommended)
----------------------------------------------------
1. Go to: http://localhost:3000/forgot-password
2. Enter the user's email
3. In development mode, check the browser console for the reset link
4. Or check the backend console for the reset token
5. Use the reset link to set a new password

Option 2: Use the API Directly
------------------------------
POST http://localhost:4000/api/auth/forgot-password
Body: { "email": "user@example.com" }

In development, the response will include:
- resetLink: The full URL to reset password
- token: The JWT token for reset

Then POST http://localhost:4000/api/auth/reset-password
Body: { "token": "<token-from-above>", "password": "newpassword123" }

Option 3: Use the reset-password.js script
------------------------------------------
node reset-password.js <email> <new-password>

Example:
node reset-password.js test@test.com newpassword123
`);

