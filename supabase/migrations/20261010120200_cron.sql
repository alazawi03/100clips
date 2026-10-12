-- The jobs nobody presses a button for. pg_cron runs them as the database owner.

create extension if not exists pg_cron;

-- Offers past 96 hours: expired, brand refunded.
select cron.schedule('expire-offers', '*/10 * * * *', 'select public.expire_offers()');
-- Clips not reviewed within 7 days: approved, creator paid.
select cron.schedule('auto-approve-orders', '15 * * * *', 'select public.auto_approve_orders()');
-- "The deadline passed without the clip" for brands (Bahrain midnight is 21:00 UTC).
select cron.schedule('deadlines-passed', '5 21 * * *', 'select public.mark_deadlines_passed()');
