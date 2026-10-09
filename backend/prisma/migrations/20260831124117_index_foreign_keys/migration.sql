-- DropIndex
DROP INDEX "users_approvalStatus_createdAt_idx";

-- CreateIndex
CREATE INDEX "admin_logs_actorUserId_idx" ON "admin_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "artist_availability_artistId_idx" ON "artist_availability"("artistId");

-- CreateIndex
CREATE INDEX "availabilities_hotelId_idx" ON "availabilities"("hotelId");

-- CreateIndex
CREATE INDEX "credit_ledger_paymentId_idx" ON "credit_ledger"("paymentId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "payments_membershipId_idx" ON "payments"("membershipId");

-- CreateIndex
CREATE INDEX "payments_packageId_idx" ON "payments"("packageId");

-- CreateIndex
CREATE INDEX "ratings_hotelId_idx" ON "ratings"("hotelId");

-- CreateIndex
CREATE INDEX "trips_artistId_idx" ON "trips"("artistId");

-- CreateIndex
CREATE INDEX "trips_hotelId_idx" ON "trips"("hotelId");
