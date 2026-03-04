-- CreateTable
CREATE TABLE "_PostToStaff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToStaff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PostToStaff_B_index" ON "_PostToStaff"("B");

-- AddForeignKey
ALTER TABLE "_PostToStaff" ADD CONSTRAINT "_PostToStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToStaff" ADD CONSTRAINT "_PostToStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
