-- CreateTable
CREATE TABLE IF NOT EXISTS "exercise_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "exercise_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exercise_attempts_userId_idx" ON "exercise_attempts"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exercise_attempts_exerciseId_idx" ON "exercise_attempts"("exerciseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exercise_attempts_passed_idx" ON "exercise_attempts"("passed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exercise_completions_userId_idx" ON "exercise_completions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exercise_completions_exerciseId_idx" ON "exercise_completions"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "exercise_completions_userId_exerciseId_key" ON "exercise_completions"("userId", "exerciseId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_attempts_userId_fkey') THEN
    ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_attempts_exerciseId_fkey') THEN
    ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_completions_userId_fkey') THEN
    ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_completions_exerciseId_fkey') THEN
    ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
