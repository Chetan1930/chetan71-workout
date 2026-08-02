-- Restrict first-admin self-claim to a specific account instead of first-signup-wins.
-- Previously ANY authenticated user could win admin by being the first to call this
-- RPC, which is a privilege-escalation race condition in production.
create or replace function public.claim_admin_if_none()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  caller_email text;
begin
  if uid is null then return false; end if;

  if exists (select 1 from public.user_roles where role = 'admin') then
    return public.has_role(uid, 'admin');
  end if;

  select email into caller_email from auth.users where id = uid;

  if caller_email is distinct from 'sdechetan@gmail.com' then
    return false;
  end if;

  insert into public.user_roles (user_id, role) values (uid, 'admin') on conflict do nothing;
  return true;
end $$;
