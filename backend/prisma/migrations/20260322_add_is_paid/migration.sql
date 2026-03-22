-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Expense_isPaid_idx" ON "Expense"("isPaid");
