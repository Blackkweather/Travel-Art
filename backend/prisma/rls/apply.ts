/**
 * Apply the RLS role and policies, then set the app role's password.
 *
 * Kept out of prisma/migrations on purpose. A Prisma migration runs on every
 * deploy against every environment; a role with a login password is
 * environment-specific infrastructure, and baking a CREATE ROLE into the
 * migration history means the password either lives in git or the migration
 * fails on a machine that does not have it.
 *
 * Run with:  APP_DB_PASSWORD='<value>' npx tsx prisma/rls/apply.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const NEWLINE = String.fromCharCode(10);

/**
 * Split a SQL file into individual statements.
 *
 * Prisma sends raw SQL through a prepared statement and Postgres rejects
 * multiple commands in one of those, so the file cannot be sent as a batch.
 * Splitting on ';' alone would cut the DO block and both function bodies in
 * half, because those contain semicolons inside $$ dollar quotes - so this
 * tracks dollar-quoting and only breaks on a semicolon outside one. Line
 * comments are consumed whole for the same reason.
 */
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let dollarTag: string | null = null;
  let i = 0;

  const isBlank = (s: string) =>
    s.split(NEWLINE).every((line) => line.trim() === '' || line.trim().startsWith('--'));

  while (i < sql.length) {
    if (!dollarTag && sql.startsWith('--', i)) {
      const nl = sql.indexOf(NEWLINE, i);
      const stop = nl === -1 ? sql.length : nl + 1;
      buf += sql.slice(i, stop);
      i = stop;
      continue;
    }

    if (!dollarTag) {
      const open = /^\$([A-Za-z_]*)\$/.exec(sql.slice(i));
      if (open) {
        dollarTag = open[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    } else if (sql.startsWith(dollarTag, i)) {
      buf += dollarTag;
      i += dollarTag.length;
      dollarTag = null;
      continue;
    }

    const ch = sql[i];
    if (ch === ';' && !dollarTag) {
      const trimmed = buf.trim();
      if (trimmed && !isBlank(trimmed)) out.push(trimmed);
      buf = '';
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }

  const tail = buf.trim();
  if (tail && !isBlank(tail)) out.push(tail);
  return out;
}

async function main() {
  const password = process.env.APP_DB_PASSWORD;
  if (!password || password.length < 20) {
    console.error('Set APP_DB_PASSWORD (20+ characters) before running this.');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, '01_role_and_policies.sql'), 'utf8');
  const statements = splitStatements(sql);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log(`policies applied (${statements.length} statements)`);

  // Set separately so the password never appears in the .sql file, which is in
  // git. Postgres literal escaping is doubling any embedded quote.
  const escaped = password.replace(/'/g, "''");
  await prisma.$executeRawUnsafe(
    `ALTER ROLE travelart_app WITH LOGIN PASSWORD '${escaped}'`
  );
  console.log('app role password set');

  const role: any[] = await prisma.$queryRawUnsafe(
    `SELECT rolname, rolbypassrls, rolcanlogin, rolsuper
       FROM pg_roles WHERE rolname = 'travelart_app'`
  );
  console.log('role:', role[0]);

  const policies: any[] = await prisma.$queryRawUnsafe(
    `SELECT tablename, policyname FROM pg_policies
      WHERE schemaname = 'public' ORDER BY tablename`
  );
  console.log(`policies: ${policies.length}`);
  for (const p of policies) {
    console.log(`  ${String(p.tablename).padEnd(16)} ${p.policyname}`);
  }
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
