-- Nothing in the client ever called claim_admin_if_none(), so the "first
-- signed-in user" bootstrap path was dead code and no account actually had
-- the admin role. Replace it with a trigger that grants admin automatically
-- to sdechetan@gmail.com and any of its +tag aliases (e.g.
-- sdechetan+3321@gmail.com), on signup and retroactively for existing users.
create or replace function public.grant_admin_by_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email ~* '^sdechetan(\+[^@]*)?@gmail\.com$' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists grant_admin_by_email_trigger on auth.users;
create trigger grant_admin_by_email_trigger
after insert on auth.users
for each row execute function public.grant_admin_by_email();

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users
where email ~* '^sdechetan(\+[^@]*)?@gmail\.com$'
on conflict do nothing;

-- keep the legacy bootstrap RPC's email rule consistent with the trigger above
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

  if caller_email is null or caller_email !~* '^sdechetan(\+[^@]*)?@gmail\.com$' then
    return false;
  end if;

  insert into public.user_roles (user_id, role) values (uid, 'admin') on conflict do nothing;
  return true;
end $$;
