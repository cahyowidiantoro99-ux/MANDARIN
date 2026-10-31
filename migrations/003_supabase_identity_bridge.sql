-- Apply once through the trusted Supabase migration connection, after provisioning
-- the isolated schema and backend role. The backend cannot modify this function.
BEGIN;
CREATE OR REPLACE FUNCTION ecb_mandarin.request_user_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog
AS $$ SELECT auth.uid() $$;
REVOKE ALL ON FUNCTION ecb_mandarin.request_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ecb_mandarin.request_user_id() TO authenticated,ecb_mandarin_app;
COMMIT;
