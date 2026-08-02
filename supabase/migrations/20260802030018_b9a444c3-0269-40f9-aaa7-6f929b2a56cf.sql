
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.claim_admin_if_none() from anon, public;
revoke execute on function public.can_read_plan(uuid) from anon, public;
revoke execute on function public.can_write_plan(uuid) from anon, public;
revoke execute on function public.plan_of_day(uuid) from anon, public;
revoke execute on function public.rank_exercise_alternatives(uuid, text[], int) from anon, public;
revoke execute on function public.last_exercise_performance(uuid) from anon, public;
revoke execute on function public.workout_streak() from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.claim_admin_if_none() to authenticated;
grant execute on function public.can_read_plan(uuid) to authenticated;
grant execute on function public.can_write_plan(uuid) to authenticated;
grant execute on function public.plan_of_day(uuid) to authenticated;
grant execute on function public.rank_exercise_alternatives(uuid, text[], int) to authenticated;
grant execute on function public.last_exercise_performance(uuid) to authenticated;
grant execute on function public.workout_streak() to authenticated;
