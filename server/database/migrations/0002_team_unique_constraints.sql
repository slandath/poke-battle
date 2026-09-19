DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'team_user_id_unique'
  ) THEN
    ALTER TABLE "team" ADD CONSTRAINT "team_user_id_unique" UNIQUE ("user_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'team_pokemon_team_id_name_unique'
  ) THEN
    ALTER TABLE "team_pokemon" ADD CONSTRAINT "team_pokemon_team_id_name_unique" UNIQUE ("team_id", "name");
  END IF;
END $$;
