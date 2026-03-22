-- CreateTable: ExpenseCategory join table
CREATE TABLE "ExpenseCategory" (
    "expenseId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("expenseId","categoryId")
);

-- CreateIndex
CREATE INDEX "ExpenseCategory_categoryId_idx" ON "ExpenseCategory"("categoryId");

-- Migrate existing data: copy categoryId relations to join table
INSERT INTO "ExpenseCategory" ("expenseId", "categoryId")
SELECT "id", "categoryId" FROM "Expense" WHERE "categoryId" IS NOT NULL;

-- AddColumn: supportAmount
ALTER TABLE "Expense" ADD COLUMN "supportAmount" DECIMAL(12,2);

-- DropIndex: old categoryId index
DROP INDEX IF EXISTS "Expense_categoryId_idx";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_categoryId_fkey";

-- AlterTable: remove old categoryId column
ALTER TABLE "Expense" DROP COLUMN "categoryId";

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
