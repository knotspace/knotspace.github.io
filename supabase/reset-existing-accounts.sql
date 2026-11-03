-- ⚠️ DESTRUCTIVE: delete every existing KNOT Auth account.
-- Run ONLY after the username-auth Edge Function has been deployed and tested.
-- Back up data first. Foreign-key ON DELETE rules determine whether related
-- profile, learning, favorites, submissions and role rows are also removed.
begin;
delete from auth.users;
commit;
