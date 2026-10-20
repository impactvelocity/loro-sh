-- Keys are kept in full now, so the admin can show one again. The hash
-- stays for lookups. Keys made before this have no secret to show.
ALTER TABLE api_keys ADD COLUMN secret TEXT;
