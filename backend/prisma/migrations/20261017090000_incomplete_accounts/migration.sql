-- An account opened with Google before its profile exists. It may sign in,
-- but only to finish the profile; submitting it moves the account to PENDING.
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'INCOMPLETE' BEFORE 'PENDING';
