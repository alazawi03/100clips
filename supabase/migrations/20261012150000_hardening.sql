-- From the Supabase advisors after the first deploy.

-- The business constants get a fixed search path like every other function.
alter function private.fee_rate() set search_path = '';
alter function private.offer_window() set search_path = '';
alter function private.auto_approve_after() set search_path = '';
alter function private.is_active_market(text) set search_path = '';

-- Admins reading a chat or its messages check for a report on it, on every row.
create index reports_conversation_id_idx on public.reports (conversation_id) where conversation_id is not null;
