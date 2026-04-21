/*
  Warnings:

  - A unique constraint covering the columns `[storeId,name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_name_key" ON "Product"("storeId", "name");

-- CreateIndex
CREATE INDEX "Transaction_storeId_createdAt_idx" ON "Transaction"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionItem_variantId_createdAt_idx" ON "TransactionItem"("variantId", "createdAt");
