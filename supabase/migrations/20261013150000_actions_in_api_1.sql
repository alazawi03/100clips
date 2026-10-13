-- Business actions move from database functions to the API (server/src). The API checks the caller
-- itself and writes as the service role, in one transaction, with the same row locks. Row-level
-- security, constraints and the small triggers stay here.
--
-- Step 1: the actions behind the endpoints built so far.
--   join_waitlist          -> WaitlistService.join
--   submit_application     -> CreatorProfileService.submit
--   decide_creator         -> AdminService.decide
--   edit_campaign_details  -> CampaignsService.editDetails
--   extend_deadline        -> CampaignsService.extendDeadline
-- The order, money and admin actions and the timed jobs follow as their endpoints are built.

drop function public.join_waitlist(text, text);
drop function public.submit_application(text);
drop function public.decide_creator(uuid, public.creator_status, text);
drop function public.edit_campaign_details(uuid, text, text[], text, text);
drop function public.extend_deadline(uuid, date);
