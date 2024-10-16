/*
  Warnings:

  - You are about to drop the column `love` on the `Like` table. All the data in the column will be lost.
  - Added the required column `like` to the `Like` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Like" DROP COLUMN "love",
ADD COLUMN     "like" INTEGER NOT NULL;
