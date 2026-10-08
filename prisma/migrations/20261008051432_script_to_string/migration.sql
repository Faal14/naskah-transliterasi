-- Cast enum "Script" ke text tanpa kehilangan data
ALTER TABLE "Manuscript" 
  ALTER COLUMN "script" TYPE TEXT USING "script"::TEXT;

-- Drop enum lama
DROP TYPE IF EXISTS "Script";