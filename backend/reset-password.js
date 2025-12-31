/**
 * Password Reset Script
 * 
 * Run this from the backend directory:
 *   node reset-password.js <email> <new-password>
 * 
 * Example:
 *   node reset-password.js test@test.com newpassword123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    console.log('✅ Password reset successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   New password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node reset-password.js <email> <new-password>');
  console.log('');
  console.log('Example:');
  console.log('  node reset-password.js test@test.com newpassword123');
  process.exit(1);
}

const [email, newPassword] = args;

if (newPassword.length < 8) {
  console.error('❌ Password must be at least 8 characters long.');
  process.exit(1);
}

resetPassword(email, newPassword);

