-- CreateTable
CREATE TABLE "HotelFavorite" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotelFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelFavorite_hotelId_idx" ON "HotelFavorite"("hotelId");

-- CreateIndex
CREATE INDEX "HotelFavorite_artistId_idx" ON "HotelFavorite"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelFavorite_hotelId_artistId_key" ON "HotelFavorite"("hotelId", "artistId");

-- AddForeignKey
ALTER TABLE "HotelFavorite" ADD CONSTRAINT "HotelFavorite_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelFavorite" ADD CONSTRAINT "HotelFavorite_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
