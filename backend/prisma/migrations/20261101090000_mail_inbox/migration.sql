-- The shared inbox: the business's own mail, read and answered from the admin
-- console (see services/mail.ts). Additive only - three new tables and their
-- enums; nothing existing is altered.

-- CreateEnum
CREATE TYPE "MailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('RECEIVED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED');

-- CreateTable
CREATE TABLE "mail_threads" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "counterpart" TEXT NOT NULL,
    "counterpartName" TEXT,
    "mailbox" TEXT NOT NULL,
    "snippet" TEXT NOT NULL DEFAULT '',
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "direction" "MailDirection" NOT NULL,
    "status" "MailStatus" NOT NULL,
    "resendId" TEXT,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "to" TEXT[],
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replyTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "text" TEXT,
    "html" TEXT,
    "snippet" TEXT NOT NULL DEFAULT '',
    "sentById" TEXT,
    "error" TEXT,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_attachments" (
    "id" TEXT NOT NULL,
    "mailMessageId" TEXT NOT NULL,
    "resendId" TEXT,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "contentId" TEXT,
    "inline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mail_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_threads_archivedAt_lastInboundAt_idx" ON "mail_threads"("archivedAt", "lastInboundAt");

-- CreateIndex
CREATE INDEX "mail_threads_lastOutboundAt_idx" ON "mail_threads"("lastOutboundAt");

-- CreateIndex
CREATE INDEX "mail_threads_counterpart_idx" ON "mail_threads"("counterpart");

-- CreateIndex
CREATE UNIQUE INDEX "mail_messages_resendId_key" ON "mail_messages"("resendId");

-- CreateIndex
CREATE INDEX "mail_messages_threadId_sentAt_idx" ON "mail_messages"("threadId", "sentAt");

-- CreateIndex
CREATE INDEX "mail_messages_messageId_idx" ON "mail_messages"("messageId");

-- CreateIndex
CREATE INDEX "mail_messages_sentById_idx" ON "mail_messages"("sentById");

-- CreateIndex
CREATE INDEX "mail_attachments_mailMessageId_idx" ON "mail_attachments"("mailMessageId");

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "mail_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_mailMessageId_fkey" FOREIGN KEY ("mailMessageId") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The API connects as travelart_app (prisma/rls/01_role_and_policies.sql).
-- Its ALTER DEFAULT PRIVILEGES already covers new tables where it was run by
-- the same owner; granting here as well makes the inbox reachable on every
-- environment without depending on that, and does nothing where the role does
-- not exist (local development without RLS). Same reasoning as
-- 20261009090000_grant_app_role_new_tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'travelart_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      "mail_threads", "mail_messages", "mail_attachments"
      TO travelart_app;
  END IF;
END
$$;
