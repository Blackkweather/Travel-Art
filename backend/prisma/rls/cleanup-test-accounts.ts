/**
 * Remove the synthetic accounts left behind by end-to-end test runs.
 *
 * Matched on the exact patterns the test scripts generate, so this cannot touch
 * a real applicant: `applicant.<timestamp>@example.com`,
 * `demo.artist.<timestamp>@example.com` and `weak.<timestamp>@example.com`.
 * Anything else — including every seeded demo account — is left alone.
 *
 * Run with: npx tsx prisma/rls/cleanup-test-accounts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Anchored, and requiring the numeric timestamp the scripts append, so a real
// person who happens to be called "applicant" is not caught by it.
const TEST_PATTERNS = [
  /^applicant\.\d+@example\.com$/,
  /^demo\.artist\.\d+@example\.com$/,
  /^weak\.\d+@example\.com$/,
  // Manual QA runs. `.test` is a reserved TLD, so these cannot be real
  // addresses, and the `qa-` prefix keeps admin@travelart.test out of it.
  /^qa-[a-z0-9-]+@travelart\.test$/,
];

async function main() {
  const candidates = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@example.com' } },
        { email: { endsWith: '@travelart.test' } },
      ],
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const doomed = candidates.filter((u) =>
    TEST_PATTERNS.some((p) => p.test(u.email))
  );

  if (doomed.length === 0) {
    console.log('nothing to remove');
    return;
  }

  console.log(`removing ${doomed.length} test account(s):`);
  for (const u of doomed.slice(0, 8)) console.log(`  ${u.email}`);
  if (doomed.length > 8) console.log(`  ... and ${doomed.length - 8} more`);

  // Artist/hotel profiles cascade from the user, so deleting the user is enough.
  const result = await prisma.user.deleteMany({
    where: { id: { in: doomed.map((u) => u.id) } },
  });
  console.log(`\ndeleted ${result.count}`);

  const stillPending = await prisma.user.count({
    where: { approvalStatus: 'PENDING', role: { in: ['ARTIST', 'HOTEL'] } },
  });
  console.log(`pending applications remaining: ${stillPending}`);
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
