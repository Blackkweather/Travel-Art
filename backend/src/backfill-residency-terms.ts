/**
 * Backfill `includes` and `schedule` on residency rows that have neither.
 *
 * The full seed writes these, but running the full seed against a database
 * that already holds real bookings is not something anyone should do to fix
 * two empty columns: it rewrites users and regenerates the admin and demo
 * passwords. This touches those two columns, on residencies where they are
 * currently empty, and nothing else - no users, no bookings, no credits, and
 * not even the other trip fields.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   npx tsx src/backfill-residency-terms.ts            # report only
 *   npx tsx src/backfill-residency-terms.ts --apply    # write
 *
 * Re-running it is harmless: a row that already has both columns is skipped,
 * so it can be run again after a partial failure.
 */
import { prisma } from './db';
import { RESORTS, type SeedResort } from './seedResorts';
import { residencyIncludes, residencySchedule, type ResidencyType } from './seed';

const APPLY = process.argv.includes('--apply');

const RESIDENCY_TYPES: ResidencyType[] = ['residency', 'intimate', 'rooftop', 'workshop'];

/** Same title the seed writes, which is what links a row back to its resort. */
const byTitle = new Map<string, { resort: SeedResort; fallbackType: ResidencyType }>();
RESORTS.forEach((resort, index) => {
  byTitle.set(`Résidence — ${resort.city}`, {
    resort,
    fallbackType: RESIDENCY_TYPES[index % RESIDENCY_TYPES.length],
  });
});

/** Empty means null, an empty string, or a JSON array with nothing in it. */
function isEmpty(value: string | null): boolean {
  if (!value || !value.trim()) return true;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length === 0 : !parsed;
  } catch {
    return true;
  }
}

async function main() {
  const trips = await prisma.trip.findMany({
    select: { id: true, title: true, type: true, includes: true, schedule: true },
  });

  const todo = trips.filter((t) => isEmpty(t.includes) || isEmpty(t.schedule));
  const unmatched: string[] = [];
  let written = 0;

  console.log(`${trips.length} residencies in this database`);
  console.log(`${trips.length - todo.length} already carry their terms`);
  console.log(`${todo.length} to fill\n`);

  for (const trip of todo) {
    const entry = byTitle.get(trip.title);
    if (!entry) {
      unmatched.push(trip.title);
      continue;
    }

    // The row's own stored type wins: it is what the detail page already
    // renders against, and the seed's index-based cycle would disagree with it
    // on a database whose resorts were created in a different order.
    const type = (RESIDENCY_TYPES as string[]).includes(trip.type ?? '')
      ? (trip.type as ResidencyType)
      : entry.fallbackType;

    const includes = JSON.stringify(residencyIncludes(entry.resort, type));
    const schedule = JSON.stringify(residencySchedule(entry.resort, type));

    if (APPLY) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { includes, schedule },
      });
      written++;
    }
    console.log(
      `${APPLY ? 'wrote ' : 'would '} ${trip.title.padEnd(34)} ${type.padEnd(10)}` +
        ` ${JSON.parse(includes).length} inclusions, ${JSON.parse(schedule).length} jours`
    );
  }

  if (unmatched.length) {
    console.log(`\n${unmatched.length} residencies had no matching resort and were left alone:`);
    unmatched.forEach((t) => console.log(`   ${t}`));
  }

  console.log(
    APPLY
      ? `\nDone. ${written} residencies updated. Nothing else was touched.`
      : `\nDry run - nothing was written. Re-run with --apply to write.`
  );
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
