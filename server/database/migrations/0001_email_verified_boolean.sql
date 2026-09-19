DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
      AND column_name = 'email_verified'
      AND data_type LIKE 'timestamp%'
  ) THEN
    ALTER TABLE "user" ALTER COLUMN "email_verified" DROP DEFAULT;
    ALTER TABLE "user" ALTER COLUMN "email_verified" DROP NOT NULL;
    ALTER TABLE "user" ALTER COLUMN "email_verified" TYPE boolean USING ("email_verified" IS NOT NULL);
    ALTER TABLE "user" ALTER COLUMN "email_verified" SET DEFAULT false;
    ALTER TABLE "user" ALTER COLUMN "email_verified" SET NOT NULL;
  END IF;
END $$;
