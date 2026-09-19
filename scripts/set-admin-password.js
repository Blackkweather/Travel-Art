/**
 * Set an administrator's password.
 *
 * This exists because there is currently no way back into an admin account.
 * The seed generates a random password and prints it once; if that scrollback
 * is gone, so is the account - there is no admin-facing reset flow, and the
 * only route back in is direct database access. That is a real operational
 * gap, not just an inconvenience: the same thing on the production database
 * would lock you out of your own platform.
 *
 * Usage, from the repository root:
 *
 *   node scripts/set-admin-password.js
 *   node scripts/set-admin-password.js "SomePassword1!"
 *   node scripts/set-admin-password.js "SomePassword1!" admin@travelart.test
 *
 * The password must satisfy the same policy the API enforces on registration
 * and reset: at least 8 characters with a lower-case letter, an upper-case
 * letter, a digit and a special character. There is no point setting one here
 * that the application itself would refuse.
 */
const path = require('path');

const BACKEND = path.join(__dirname, '..', 'backend');
require(path.join(BACKEND, 'node_modules', 'dotenv')).config({
  path: path.join(BACKEND, '.env'),
});

const { PrismaClient } = require(path.join(BACKEND, 'node_modules', '@prisma', 'client'));
const bcrypt = require(path.join(BACKEND, 'node_modules', 'bcryptjs'));

const password = process.argv[2] || 'AdminAudit!2026';
const email = process.argv[3] || 'admin@travelart.test';

const RULES = [
  [/.{8,}/, 'at least 8 characters'],
  [/[a-z]/, 'a lower-case letter'],
  [/[A-Z]/, 'an upper-case letter'],
  [/[0-9]/, 'a digit'],
  [/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/, 'a special character'],
];

(async () => {
  const missing = RULES.filter(([re]) => !re.test(password)).map(([, what]) => what);
  if (missing.length) {
    console.error('That password would be refused by the API. It still needs: ' + missing.join(', '));
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, isActive: true, approvalStatus: true },
    });

    if (!user) {
      console.error('No account found for ' + email + '.');
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
      });
      if (admins.length) {
        console.error('Administrators on this database: ' + admins.map((a) => a.email).join(', '));
      }
      process.exit(1);
    }

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        // An administrator who cannot sign in because of the admission gate or
        // a suspension is not recovered by a new password alone.
        isActive: true,
        approvalStatus: 'APPROVED',
        emailVerified: true,
        // Anything issued before now stops working, which is the right
        // behaviour for a credential that has just been rotated.
        sessionsValidFrom: new Date(),
      },
    });

    console.log('');
    console.log('  Password set for ' + email + ' (role ' + user.role + ').');
    console.log('  Password: ' + password);
    console.log('');
    console.log('  Sign in at http://localhost:4000/login');
    console.log('  Change it once you are done - this password is written in plain text above.');
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  console.error('Failed: ' + error.message);
  process.exit(1);
});
