
-- ============ helpers ============
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- first signed-in user can claim admin
create or replace function public.claim_admin_if_none()
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return false; end if;
  if exists (select 1 from public.user_roles where role='admin') then
    return public.has_role(uid,'admin');
  end if;
  insert into public.user_roles(user_id, role) values (uid,'admin') on conflict do nothing;
  return true;
end $$;
grant execute on function public.claim_admin_if_none() to authenticated;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  unit text not null default 'kg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ============ reference tables ============
create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  region text not null default 'other',
  created_at timestamptz not null default now()
);
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  category text not null default 'other',
  created_at timestamptz not null default now()
);
create table public.movement_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  default_instructions text[] not null default '{}',
  default_tips text[] not null default '{}',
  default_mistakes text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.muscle_groups, public.equipment, public.movement_patterns to authenticated;
grant all on public.muscle_groups, public.equipment, public.movement_patterns to service_role;
alter table public.muscle_groups enable row level security;
alter table public.equipment enable row level security;
alter table public.movement_patterns enable row level security;
create policy "read muscles" on public.muscle_groups for select to authenticated using (true);
create policy "read equipment" on public.equipment for select to authenticated using (true);
create policy "read patterns" on public.movement_patterns for select to authenticated using (true);
grant insert, update, delete on public.muscle_groups, public.equipment, public.movement_patterns to authenticated;
create policy "admin muscles" on public.muscle_groups for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin equipment" on public.equipment for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin patterns" on public.movement_patterns for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ exercises ============
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  primary_muscle_id uuid not null references public.muscle_groups(id) on delete restrict,
  equipment_id uuid references public.equipment(id) on delete set null,
  movement_pattern_id uuid references public.movement_patterns(id) on delete set null,
  difficulty smallint not null default 2,
  fatigue_score smallint not null default 5,
  stability_requirement smallint not null default 3,
  video_url text, gif_url text, image_url text,
  instructions text[] not null default '{}',
  tips text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.exercises (primary_muscle_id);
create index on public.exercises (movement_pattern_id);
create trigger exercises_updated before update on public.exercises for each row execute function public.set_updated_at();

create table public.exercise_secondary_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id) on delete cascade,
  primary key (exercise_id, muscle_group_id)
);
create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  media_type text not null default 'image',
  url text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create table public.exercise_alternatives (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  alternative_id uuid not null references public.exercises(id) on delete cascade,
  boost smallint not null default 15,
  reason text,
  created_at timestamptz not null default now(),
  unique (exercise_id, alternative_id)
);

grant select, insert, update, delete on public.exercises, public.exercise_secondary_muscles, public.exercise_media, public.exercise_alternatives to authenticated;
grant all on public.exercises, public.exercise_secondary_muscles, public.exercise_media, public.exercise_alternatives to service_role;
alter table public.exercises enable row level security;
alter table public.exercise_secondary_muscles enable row level security;
alter table public.exercise_media enable row level security;
alter table public.exercise_alternatives enable row level security;
create policy "read exercises" on public.exercises for select to authenticated using (true);
create policy "admin exercises" on public.exercises for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read esm" on public.exercise_secondary_muscles for select to authenticated using (true);
create policy "admin esm" on public.exercise_secondary_muscles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read media" on public.exercise_media for select to authenticated using (true);
create policy "admin media" on public.exercise_media for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read alts" on public.exercise_alternatives for select to authenticated using (true);
create policy "admin alts" on public.exercise_alternatives for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ plans ============
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  description text,
  owner_id uuid references auth.users(id) on delete cascade,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  day_of_week smallint,
  order_index int not null default 0,
  is_rest_day boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid references public.muscle_groups(id) on delete set null,
  order_index int not null default 0,
  target_sets smallint not null default 3,
  target_reps text not null default '8-12',
  rest_seconds int not null default 90,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.workout_exercises (workout_day_id, order_index);
create trigger plans_updated before update on public.workout_plans for each row execute function public.set_updated_at();
create trigger days_updated before update on public.workout_days for each row execute function public.set_updated_at();
create trigger wex_updated before update on public.workout_exercises for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.workout_plans, public.workout_days, public.workout_exercises to authenticated;
grant all on public.workout_plans, public.workout_days, public.workout_exercises to service_role;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;

create policy "read plans" on public.workout_plans for select to authenticated using (owner_id is null or owner_id = auth.uid());
create policy "own plans" on public.workout_plans for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "admin plans" on public.workout_plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.can_read_plan(_plan_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workout_plans p where p.id=_plan_id and (p.owner_id is null or p.owner_id=auth.uid()))
$$;
create or replace function public.can_write_plan(_plan_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workout_plans p where p.id=_plan_id and p.owner_id=auth.uid())
      or public.has_role(auth.uid(),'admin')
$$;
grant execute on function public.can_read_plan(uuid), public.can_write_plan(uuid) to authenticated;

create policy "read days" on public.workout_days for select to authenticated using (public.can_read_plan(plan_id));
create policy "write days" on public.workout_days for all to authenticated using (public.can_write_plan(plan_id)) with check (public.can_write_plan(plan_id));

create or replace function public.plan_of_day(_day_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select plan_id from public.workout_days where id=_day_id
$$;
grant execute on function public.plan_of_day(uuid) to authenticated;
create policy "read wex" on public.workout_exercises for select to authenticated using (public.can_read_plan(public.plan_of_day(workout_day_id)));
create policy "write wex" on public.workout_exercises for all to authenticated using (public.can_write_plan(public.plan_of_day(workout_day_id))) with check (public.can_write_plan(public.plan_of_day(workout_day_id)));

-- ============ tracking ============
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  session_date date not null default current_date,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index workout_sessions_user_day_date on public.workout_sessions (user_id, workout_day_id, session_date);
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_number smallint not null default 1,
  weight numeric(6,2),
  reps smallint,
  rir smallint,
  completed boolean not null default true,
  notes text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_number)
);
create index on public.workout_sets (user_id, exercise_id, performed_at desc);
create table public.favorite_exercises (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
create table public.user_equipment (
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  available boolean not null default true,
  primary key (user_id, equipment_id)
);
create table public.session_substitutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  replacement_exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, workout_exercise_id)
);
create trigger sessions_updated before update on public.workout_sessions for each row execute function public.set_updated_at();
create trigger sets_updated before update on public.workout_sets for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.workout_sessions, public.workout_sets, public.favorite_exercises, public.user_equipment, public.session_substitutions to authenticated;
grant all on public.workout_sessions, public.workout_sets, public.favorite_exercises, public.user_equipment, public.session_substitutions to service_role;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.favorite_exercises enable row level security;
alter table public.user_equipment enable row level security;
alter table public.session_substitutions enable row level security;
create policy "own sessions" on public.workout_sessions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own sets" on public.workout_sets for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own favs" on public.favorite_exercises for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own equipment" on public.user_equipment for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own subs" on public.session_substitutions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- ============ seed reference ============
insert into public.muscle_groups (name, slug, region) values
 ('Chest','chest','upper'),('Back','back','upper'),('Lats','lats','upper'),('Upper Back','upper-back','upper'),
 ('Traps','traps','upper'),('Front Delts','front-delts','upper'),('Side Delts','side-delts','upper'),
 ('Rear Delts','rear-delts','upper'),('Biceps','biceps','arms'),('Triceps','triceps','arms'),
 ('Forearms','forearms','arms'),('Quads','quads','lower'),('Hamstrings','hamstrings','lower'),
 ('Glutes','glutes','lower'),('Calves','calves','lower'),('Core','core','core');

insert into public.equipment (name, slug, category) values
 ('Barbell','barbell','free-weight'),('Dumbbell','dumbbell','free-weight'),('EZ Bar','ez-bar','free-weight'),
 ('Kettlebell','kettlebell','free-weight'),('Cable','cable','cable'),('Machine','machine','machine'),
 ('Smith Machine','smith-machine','machine'),('Leg Press','leg-press','machine'),('Hack Squat','hack-squat','machine'),
 ('Bodyweight','bodyweight','bodyweight'),('Pull Up Bar','pull-up-bar','bodyweight'),('Bench','bench','bodyweight'),
 ('Resistance Band','band','band'),('Landmine','landmine','free-weight'),('Stability Ball','stability-ball','bodyweight');

insert into public.movement_patterns (name, slug, default_instructions, default_tips, default_mistakes) values
('Horizontal Push','horizontal-push',
 array['Set up with shoulder blades retracted and feet planted.','Lower the load under control to the mid-chest.','Press back to lockout without flaring the elbows.'],
 array['Keep a slight arch and tight upper back.','Elbows around 45-60 degrees from the torso.'],
 array['Bouncing the weight off the chest.','Flaring elbows straight out to 90 degrees.','Letting the shoulders roll forward at the top.']),
('Vertical Push','vertical-push',
 array['Brace the core and squeeze the glutes.','Press the load overhead in a straight line.','Lock out with biceps near the ears, then lower under control.'],
 array['Don''t lean back excessively - press, don''t bench.','Keep the ribcage down.'],
 array['Overarching the lower back.','Half-repping and never reaching lockout.','Shrugging before the elbows lock.']),
('Chest Fly','chest-fly',
 array['Set a soft, fixed elbow bend.','Open the arms until you feel a stretch across the chest.','Squeeze the chest to bring the handles together.'],
 array['Think about hugging a barrel.','Stretch matters more than load here.'],
 array['Turning it into a press by bending the elbows.','Going too heavy and losing the stretch.']),
('Vertical Pull','vertical-pull',
 array['Grip the bar and depress the shoulder blades first.','Pull the elbows down and back toward the ribs.','Control the eccentric to a full stretch.'],
 array['Lead with the elbows, not the hands.','Pause briefly at the bottom of the pull.'],
 array['Using momentum and leaning back excessively.','Pulling with the arms only.','Cutting the stretch short at the top.']),
('Horizontal Pull','horizontal-pull',
 array['Set a stable torso and brace.','Row toward the lower ribs, driving the elbows back.','Return to a full stretch under control.'],
 array['Squeeze the shoulder blades at the end range.','Keep the neck neutral.'],
 array['Jerking the torso to move the weight.','Shrugging the shoulders up instead of back.']),
('Squat','squat',
 array['Set the feet and brace hard.','Descend with control, knees tracking over the toes.','Drive up through mid-foot to lockout.'],
 array['Depth beats load - hit at least parallel.','Keep the chest proud out of the hole.'],
 array['Knees caving inward.','Rising with the hips first.','Cutting depth as the weight climbs.']),
('Hip Hinge','hip-hinge',
 array['Set the bar close and brace the lats.','Push the hips back while keeping a neutral spine.','Drive the hips forward to stand tall.'],
 array['Feel the stretch in the hamstrings, not the lower back.','Keep the bar or dumbbells against the legs.'],
 array['Rounding the lower back.','Squatting the movement instead of hinging.','Hyperextending at the top.']),
('Knee Extension','knee-extension',
 array['Align the knee joint with the machine pivot.','Extend the knees fully and pause.','Lower under control without dropping the stack.'],
 array['Pause one second at full extension.','Point the toes slightly to bias the quads.'],
 array['Swinging the weight up with momentum.','Partial reps at the bottom only.']),
('Knee Flexion','knee-flexion',
 array['Set the pad just above the heels.','Curl the heels toward the glutes.','Resist the weight on the way back.'],
 array['Slow the eccentric to 3 seconds.','Keep the hips pinned down.'],
 array['Lifting the hips off the pad.','Rushing the negative.']),
('Lateral Raise','lateral-raise',
 array['Set a slight forward lean with soft elbows.','Raise the arms out to shoulder height.','Lower slowly and stay under tension.'],
 array['Lead with the elbows, not the hands.','Light weight, high control.'],
 array['Using the traps and shrugging.','Swinging the torso for momentum.']),
('Rear Delt','rear-delt',
 array['Set the torso and brace.','Pull or raise the arms out and back.','Squeeze the rear delts, then return under control.'],
 array['Externally rotate slightly at end range.','Keep the reps high and the load honest.'],
 array['Turning it into a row.','Using the lower back to swing.']),
('Shrug','shrug',
 array['Stand tall with the load hanging.','Shrug the shoulders straight up toward the ears.','Pause, then lower to a full stretch.'],
 array['No rolling - straight up and down.','Pause hard at the top.'],
 array['Rolling the shoulders.','Bending the elbows to cheat the load.']),
('Isolation Curl','isolation-curl',
 array['Pin the elbows at the sides.','Curl the load up while keeping the wrists neutral.','Lower under control to a full stretch.'],
 array['Supinate hard at the top.','Don''t let the elbows drift forward.'],
 array['Swinging the torso.','Using the front delts to lift.','Stopping short of full extension.']),
('Hammer Curl','hammer-curl',
 array['Hold a neutral grip with elbows pinned.','Curl up without rotating the wrist.','Lower slowly to full extension.'],
 array['Great for brachialis and forearm thickness.','Keep the tempo strict.'],
 array['Swinging the dumbbells up.','Letting the elbows travel forward.']),
('Isolation Extension','isolation-extension',
 array['Pin the elbows in place.','Extend the elbows to full lockout.','Return under control to a deep stretch.'],
 array['Only the forearms should move.','Pause at lockout for a hard squeeze.'],
 array['Letting the elbows flare and drift.','Using the shoulders and torso to push.']),
('Calf','calf',
 array['Set the balls of the feet on the platform.','Drop the heels for a full stretch.','Press up onto the toes and pause.'],
 array['Pause 1-2 seconds at the top and bottom.','Full range beats heavy partials.'],
 array['Bouncing through reps.','Short range of motion.']),
('Core','core',
 array['Brace the abdominals before moving.','Control the range and breathe.','Return to the start under tension.'],
 array['Quality over reps.','Avoid pulling on the neck.'],
 array['Holding the breath.','Using hip flexors instead of abs.']),
('Carry','carry',
 array['Pick up the load with a braced, neutral spine.','Walk tall with controlled steps.','Set the load down under control.'],
 array['Keep the ribs stacked over the hips.','Grip is usually the limiter.'],
 array['Leaning to one side.','Rushing the steps.']);

-- ============ seed exercises ============
insert into public.exercises (name, slug, description, primary_muscle_id, equipment_id, movement_pattern_id, difficulty, fatigue_score, stability_requirement)
select v.name, v.slug, v.descr, m.id, e.id, p.id, v.diff, v.fat, v.stab
from (values
 ('Bench Press','bench-press','chest','barbell','horizontal-push',3,8,4,'The benchmark barbell press for chest, front delts and triceps.'),
 ('Flat Dumbbell Press','flat-dumbbell-press','chest','dumbbell','horizontal-push',3,7,4,'Dumbbell pressing with a deeper stretch and independent arm work.'),
 ('Smith Machine Bench Press','smith-machine-bench-press','chest','smith-machine','horizontal-push',2,6,2,'Fixed-path bench press that removes balance from the equation.'),
 ('Machine Chest Press','machine-chest-press','chest','machine','horizontal-push',1,6,1,'Stable, joint-friendly chest press for volume work.'),
 ('Incline Dumbbell Press','incline-dumbbell-press','chest','dumbbell','horizontal-push',3,7,4,'Incline pressing biased toward the upper chest.'),
 ('Smith Machine Incline Press','smith-machine-incline-press','chest','smith-machine','horizontal-push',2,6,2,'Upper-chest press on a fixed bar path.'),
 ('Push Ups','push-ups','chest','bodyweight','horizontal-push',1,4,3,'Bodyweight horizontal press, scalable anywhere.'),
 ('Weighted Dips','weighted-dips','chest','bodyweight','horizontal-push',4,7,4,'Loaded dips for lower chest and triceps.'),
 ('Dips','dips','chest','bodyweight','horizontal-push',3,6,4,'Bodyweight dips for chest and triceps.'),
 ('Pec Deck Fly','pec-deck-fly','chest','machine','chest-fly',1,4,1,'Machine fly isolating the chest through a fixed arc.'),
 ('Dumbbell Fly','dumbbell-fly','chest','dumbbell','chest-fly',2,5,3,'Free-weight fly with a strong chest stretch.'),
 ('Cable Fly','cable-fly','chest','cable','chest-fly',2,4,2,'Constant-tension fly from the cable stack.'),
 ('Military Press','military-press','front-delts','barbell','vertical-push',4,8,4,'Standing barbell overhead press.'),
 ('Dumbbell Press','dumbbell-shoulder-press','front-delts','dumbbell','vertical-push',3,7,4,'Seated or standing dumbbell overhead press.'),
 ('Machine Shoulder Press','machine-shoulder-press','front-delts','machine','vertical-push',1,5,1,'Guided overhead press for easy progressive overload.'),
 ('Arnold Press','arnold-press','front-delts','dumbbell','vertical-push',3,7,4,'Rotational dumbbell press hitting front and side delts.'),
 ('Landmine Press','landmine-press','front-delts','landmine','vertical-push',2,6,3,'Shoulder-friendly angled press.'),
 ('Pike Push Up','pike-push-up','front-delts','bodyweight','vertical-push',3,5,4,'Bodyweight vertical press variation.'),
 ('Side Lateral Raise','side-lateral-raise','side-delts','dumbbell','lateral-raise',1,3,2,'Classic dumbbell raise for side delt width.'),
 ('Cable Lateral Raise','cable-lateral-raise','side-delts','cable','lateral-raise',2,3,2,'Cable raise with tension through the whole range.'),
 ('Machine Lateral Raise','machine-lateral-raise','side-delts','machine','lateral-raise',1,3,1,'Guided lateral raise, easy to overload.'),
 ('Leaning Cable Raise','leaning-cable-raise','side-delts','cable','lateral-raise',2,3,3,'Leaning away increases the stretch on the side delt.'),
 ('Single Arm Cable Raise','single-arm-cable-raise','side-delts','cable','lateral-raise',2,3,3,'Unilateral cable raise for side delts.'),
 ('Reverse Fly','reverse-fly','rear-delts','dumbbell','rear-delt',1,3,2,'Bent-over dumbbell fly for the rear delts.'),
 ('Face Pull','face-pull','rear-delts','cable','rear-delt',2,3,2,'Rope pull to the face for rear delts and upper back health.'),
 ('Reverse Pec Deck','reverse-pec-deck','rear-delts','machine','rear-delt',1,3,1,'Machine rear delt fly.'),
 ('Band Face Pull','band-face-pull','rear-delts','band','rear-delt',1,2,2,'Band version of the face pull.'),
 ('Cable Reverse Fly','cable-reverse-fly','rear-delts','cable','rear-delt',2,3,2,'Cross-cable rear delt fly.'),
 ('Chest Supported Rear Delt Raise','chest-supported-rear-delt-raise','rear-delts','dumbbell','rear-delt',1,3,1,'Bench-supported raise removing lower back involvement.'),
 ('Shrugs','shrugs','traps','barbell','shrug',1,4,2,'Barbell shrug for upper trap mass.'),
 ('Dumbbell Shrug','dumbbell-shrug','traps','dumbbell','shrug',1,4,2,'Dumbbell shrug with a longer range of motion.'),
 ('Smith Machine Shrug','smith-machine-shrug','traps','smith-machine','shrug',1,4,1,'Fixed-path shrug for heavy loading.'),
 ('Weighted Pull-ups','weighted-pull-ups','lats','pull-up-bar','vertical-pull',5,8,4,'Loaded pull-ups, the strongest vertical pulling stimulus.'),
 ('Pull Ups','pull-ups','lats','pull-up-bar','vertical-pull',4,7,4,'Bodyweight pronated pull-up.'),
 ('Chin Ups','chin-ups','lats','pull-up-bar','vertical-pull',3,7,4,'Supinated pull-up with heavy biceps involvement.'),
 ('Assisted Pull Ups','assisted-pull-ups','lats','machine','vertical-pull',1,5,2,'Machine-assisted pull-up for building up to bodyweight.'),
 ('Lat Pulldown','lat-pulldown','lats','cable','vertical-pull',2,5,2,'Cable pulldown, the workhorse of vertical pulling volume.'),
 ('Reverse Grip Lat Pulldown','reverse-grip-lat-pulldown','lats','cable','vertical-pull',2,5,2,'Supinated pulldown biasing the lower lats and biceps.'),
 ('Neutral Grip Pulldown','neutral-grip-pulldown','lats','cable','vertical-pull',2,5,2,'Neutral-grip pulldown, shoulder friendly.'),
 ('Straight Arm Pulldown','straight-arm-pulldown','lats','cable','vertical-pull',1,3,2,'Lat isolation with the elbows locked.'),
 ('Cable Row','cable-row','back','cable','horizontal-pull',2,6,2,'Seated cable row for mid-back thickness.'),
 ('Chest Supported Row','chest-supported-row','back','machine','horizontal-pull',2,5,1,'Row with the torso braced against a pad.'),
 ('Machine Row','machine-row','back','machine','horizontal-pull',1,5,1,'Guided rowing pattern, easy to progress.'),
 ('T Bar Row','t-bar-row','back','barbell','horizontal-pull',3,7,3,'Heavy landmine-style row.'),
 ('Barbell Row','barbell-row','back','barbell','horizontal-pull',4,8,4,'Bent-over barbell row for total back mass.'),
 ('Single Arm Dumbbell Row','single-arm-dumbbell-row','back','dumbbell','horizontal-pull',2,6,3,'Unilateral row with a big range of motion.'),
 ('Conventional Deadlift','conventional-deadlift','back','barbell','hip-hinge',5,10,5,'Full-body pull off the floor.'),
 ('Romanian Deadlift','romanian-deadlift','hamstrings','barbell','hip-hinge',3,8,4,'Hinge focused on hamstring stretch under load.'),
 ('Stiff Leg Deadlift','stiff-leg-deadlift','hamstrings','barbell','hip-hinge',3,8,4,'Straighter-legged hinge with a deep hamstring stretch.'),
 ('Dumbbell Romanian Deadlift','dumbbell-romanian-deadlift','hamstrings','dumbbell','hip-hinge',2,7,4,'Dumbbell hinge, easier on the lower back.'),
 ('Good Morning','good-morning','hamstrings','barbell','hip-hinge',4,7,4,'Barbell hinge loaded on the upper back.'),
 ('Hip Thrust','hip-thrust','glutes','barbell','hip-hinge',2,6,2,'Glute-dominant hip extension.'),
 ('Back Extension','back-extension','hamstrings','bodyweight','hip-hinge',1,4,2,'Hyperextension bench work for the posterior chain.'),
 ('Squat','squat','quads','barbell','squat',4,9,4,'Back squat, the primary lower body strength lift.'),
 ('Front Squat','front-squat','quads','barbell','squat',4,8,4,'Front-loaded squat with a more upright torso.'),
 ('Sumo Squat','sumo-squat','quads','dumbbell','squat',2,6,3,'Wide-stance squat hitting adductors and glutes.'),
 ('Hack Squat','hack-squat','quads','hack-squat','squat',3,7,1,'Machine squat with a fixed path and huge quad tension.'),
 ('Leg Press','leg-press','quads','leg-press','squat',2,7,1,'High-load quad and glute press.'),
 ('Goblet Squat','goblet-squat','quads','dumbbell','squat',1,5,3,'Front-loaded squat with a single dumbbell.'),
 ('Bulgarian Split Squat','bulgarian-split-squat','quads','dumbbell','squat',3,7,5,'Rear-foot-elevated single leg squat.'),
 ('Sissy Squat','sissy-squat','quads','bodyweight','squat',3,5,4,'Knee-dominant bodyweight squat for the quads.'),
 ('Spanish Squat','spanish-squat','quads','band','squat',2,4,3,'Band-resisted squat that keeps the shins vertical.'),
 ('Leg Extension','leg-extension','quads','machine','knee-extension',1,4,1,'Direct quad isolation.'),
 ('Leg Curl','leg-curl','hamstrings','machine','knee-flexion',1,4,1,'Direct hamstring isolation.'),
 ('Seated Leg Curl','seated-leg-curl','hamstrings','machine','knee-flexion',1,4,1,'Seated curl with the hamstrings in a lengthened position.'),
 ('Nordic Curl','nordic-curl','hamstrings','bodyweight','knee-flexion',5,6,4,'Brutal eccentric hamstring curl.'),
 ('Glute Ham Raise','glute-ham-raise','hamstrings','machine','knee-flexion',4,6,3,'Posterior chain curl on the GHD.'),
 ('Stability Ball Curl','stability-ball-curl','hamstrings','stability-ball','knee-flexion',2,4,4,'Bodyweight hamstring curl on a ball.'),
 ('Calf Raise','calf-raise','calves','bodyweight','calf',1,3,2,'Basic calf raise, loadable anywhere.'),
 ('Standing Calf Raise','standing-calf-raise','calves','machine','calf',1,3,2,'Standing machine raise for the gastrocnemius.'),
 ('Seated Calf Raise','seated-calf-raise','calves','machine','calf',1,3,1,'Bent-knee raise biasing the soleus.'),
 ('Leg Press Calf Raise','leg-press-calf-raise','calves','leg-press','calf',1,3,1,'Calf raise performed on the leg press platform.'),
 ('Smith Machine Calf Raise','smith-machine-calf-raise','calves','smith-machine','calf',1,3,2,'Heavy standing raise on a fixed bar.'),
 ('Single Leg Calf Raise','single-leg-calf-raise','calves','bodyweight','calf',1,3,3,'Unilateral calf raise for balance and full range.'),
 ('Barbell Curl','barbell-curl','biceps','barbell','isolation-curl',1,4,3,'Straight bar curl for overall biceps mass.'),
 ('EZ Bar Curl','ez-bar-curl','biceps','ez-bar','isolation-curl',1,4,3,'Wrist-friendly barbell curl.'),
 ('Dumbbell Curl','dumbbell-curl','biceps','dumbbell','isolation-curl',1,4,3,'Supinating dumbbell curl.'),
 ('Cable Curl','cable-curl','biceps','cable','isolation-curl',1,4,2,'Constant tension biceps curl.'),
 ('Preacher Curl','preacher-curl','biceps','ez-bar','isolation-curl',1,4,1,'Curl with the arm braced on a preacher pad.'),
 ('Machine Curl','machine-curl','biceps','machine','isolation-curl',1,3,1,'Guided biceps curl.'),
 ('Hammer Curl','hammer-curl','biceps','dumbbell','hammer-curl',1,4,3,'Neutral grip curl for brachialis and forearms.'),
 ('Rope Hammer Curl','rope-hammer-curl','biceps','cable','hammer-curl',1,3,2,'Rope curl with a neutral grip.'),
 ('Cross Body Hammer Curl','cross-body-hammer-curl','biceps','dumbbell','hammer-curl',1,3,3,'Hammer curl across the torso.'),
 ('Cable Hammer Curl','cable-hammer-curl','biceps','cable','hammer-curl',1,3,2,'Cable neutral grip curl.'),
 ('Machine Neutral Curl','machine-neutral-curl','biceps','machine','hammer-curl',1,3,1,'Machine curl with neutral handles.'),
 ('V-Bar Overhead Extension','v-bar-overhead-extension','triceps','cable','isolation-extension',2,5,2,'Overhead cable extension for the long head.'),
 ('V-Bar Pushdown','v-bar-pushdown','triceps','cable','isolation-extension',1,4,2,'Cable pushdown with a V handle.'),
 ('Rope Pushdown','rope-pushdown','triceps','cable','isolation-extension',1,4,2,'Rope pushdown with a spread at lockout.'),
 ('Straight Bar Pushdown','straight-bar-pushdown','triceps','cable','isolation-extension',1,4,2,'Pushdown with a straight bar attachment.'),
 ('Cross Cable Triceps Extension','cross-cable-triceps-extension','triceps','cable','isolation-extension',2,4,2,'Bilateral cross-body cable extension.'),
 ('Resistance Band Pushdown','resistance-band-pushdown','triceps','band','isolation-extension',1,3,2,'Band pushdown for home or travel.'),
 ('Assisted Dip','assisted-dip','triceps','machine','isolation-extension',1,4,2,'Machine assisted dip biased to triceps.'),
 ('Skull Crusher','skull-crusher','triceps','ez-bar','isolation-extension',2,5,3,'Lying EZ bar extension.')
) as v(name, slug, mg, eq, mp, diff, fat, stab, descr)
join public.muscle_groups m on m.slug=v.mg
join public.equipment e on e.slug=v.eq
join public.movement_patterns p on p.slug=v.mp;

-- secondary muscles derived from movement pattern
insert into public.exercise_secondary_muscles (exercise_id, muscle_group_id)
select distinct ex.id, m.id
from public.exercises ex
join public.movement_patterns p on p.id = ex.movement_pattern_id
join (values
 ('horizontal-push','front-delts'),('horizontal-push','triceps'),
 ('vertical-push','triceps'),('vertical-push','traps'),
 ('chest-fly','front-delts'),
 ('vertical-pull','biceps'),('vertical-pull','rear-delts'),('vertical-pull','forearms'),
 ('horizontal-pull','biceps'),('horizontal-pull','rear-delts'),('horizontal-pull','traps'),
 ('hip-hinge','glutes'),('hip-hinge','hamstrings'),('hip-hinge','back'),('hip-hinge','forearms'),
 ('squat','glutes'),('squat','hamstrings'),('squat','core'),
 ('knee-flexion','glutes'),('knee-flexion','calves'),
 ('lateral-raise','traps'),('rear-delt','traps'),('rear-delt','upper-back'),
 ('shrug','forearms'),
 ('isolation-curl','forearms'),('hammer-curl','forearms')
) as r(pattern, muscle) on r.pattern = p.slug
join public.muscle_groups m on m.slug = r.muscle
where m.id <> ex.primary_muscle_id;

-- curated alternative boosts
insert into public.exercise_alternatives (exercise_id, alternative_id, boost, reason)
select a.id, b.id, v.boost, v.reason
from (values
 ('bench-press','flat-dumbbell-press',20,'Coach-picked direct swap'),
 ('bench-press','smith-machine-bench-press',15,'Coach-picked direct swap'),
 ('bench-press','machine-chest-press',12,'Coach-picked direct swap'),
 ('lat-pulldown','pull-ups',20,'Coach-picked direct swap'),
 ('lat-pulldown','assisted-pull-ups',15,'Coach-picked direct swap'),
 ('lat-pulldown','neutral-grip-pulldown',15,'Coach-picked direct swap'),
 ('cable-row','chest-supported-row',20,'Coach-picked direct swap'),
 ('cable-row','machine-row',15,'Coach-picked direct swap'),
 ('cable-row','t-bar-row',12,'Coach-picked direct swap'),
 ('squat','front-squat',18,'Coach-picked direct swap'),
 ('squat','hack-squat',16,'Coach-picked direct swap'),
 ('squat','leg-press',14,'Coach-picked direct swap'),
 ('romanian-deadlift','stiff-leg-deadlift',20,'Coach-picked direct swap'),
 ('romanian-deadlift','dumbbell-romanian-deadlift',18,'Coach-picked direct swap'),
 ('romanian-deadlift','good-morning',12,'Coach-picked direct swap'),
 ('dumbbell-shoulder-press','machine-shoulder-press',18,'Coach-picked direct swap'),
 ('military-press','dumbbell-shoulder-press',20,'Coach-picked direct swap'),
 ('side-lateral-raise','cable-lateral-raise',20,'Coach-picked direct swap'),
 ('side-lateral-raise','machine-lateral-raise',16,'Coach-picked direct swap'),
 ('face-pull','reverse-pec-deck',20,'Coach-picked direct swap'),
 ('face-pull','cable-reverse-fly',15,'Coach-picked direct swap'),
 ('barbell-curl','ez-bar-curl',20,'Coach-picked direct swap'),
 ('barbell-curl','dumbbell-curl',16,'Coach-picked direct swap'),
 ('hammer-curl','rope-hammer-curl',20,'Coach-picked direct swap'),
 ('hammer-curl','cross-body-hammer-curl',16,'Coach-picked direct swap'),
 ('v-bar-pushdown','rope-pushdown',20,'Coach-picked direct swap'),
 ('leg-extension','sissy-squat',15,'Coach-picked direct swap'),
 ('leg-extension','hack-squat',12,'Coach-picked direct swap'),
 ('leg-curl','nordic-curl',15,'Coach-picked direct swap'),
 ('leg-curl','seated-leg-curl',20,'Coach-picked direct swap'),
 ('calf-raise','standing-calf-raise',20,'Coach-picked direct swap'),
 ('calf-raise','seated-calf-raise',16,'Coach-picked direct swap')
) as v(a_slug, b_slug, boost, reason)
join public.exercises a on a.slug=v.a_slug
join public.exercises b on b.slug=v.b_slug;

-- ============ seed plan ============
insert into public.workout_plans (name, slug, description, is_default, owner_id)
values ('6-Day Split','six-day-split','Back/Biceps, Chest/Shoulders, Legs/Triceps twice per week.', true, null);

insert into public.workout_days (plan_id, name, day_of_week, order_index)
select p.id, v.name, v.dow, v.dow
from public.workout_plans p,
(values ('Back & Biceps',1),('Chest & Shoulders',2),('Legs & Triceps',3),('Back & Biceps',4),('Chest & Shoulders',5),('Legs & Triceps',6)) as v(name,dow)
where p.slug='six-day-split';

insert into public.workout_exercises (workout_day_id, exercise_id, muscle_group_id, order_index, target_sets, target_reps, rest_seconds)
select d.id, ex.id, ex.primary_muscle_id, v.ord, v.sets, v.reps, v.rest
from (values
 (1,'weighted-pull-ups',1,4,'5-8',180),(1,'lat-pulldown',2,4,'8-12',90),(1,'reverse-grip-lat-pulldown',3,3,'10-12',90),
 (1,'cable-row',4,4,'8-12',90),(1,'single-arm-dumbbell-row',5,3,'10-12',90),(1,'conventional-deadlift',6,3,'4-6',180),
 (1,'barbell-curl',7,3,'8-12',60),(1,'dumbbell-curl',8,3,'10-12',60),(1,'hammer-curl',9,3,'10-12',60),
 (2,'bench-press',1,4,'6-10',180),(2,'incline-dumbbell-press',2,4,'8-12',120),(2,'pec-deck-fly',3,3,'12-15',60),
 (2,'weighted-dips',4,3,'8-12',120),(2,'side-lateral-raise',5,4,'12-15',60),(2,'dumbbell-shoulder-press',6,3,'8-12',120),
 (2,'reverse-fly',7,3,'12-15',60),(2,'shrugs',8,3,'10-15',60),
 (3,'squat',1,4,'6-10',180),(3,'romanian-deadlift',2,3,'8-12',150),(3,'leg-press',3,3,'10-15',120),
 (3,'leg-extension',4,3,'12-15',60),(3,'calf-raise',5,4,'12-20',60),(3,'v-bar-overhead-extension',6,3,'10-12',60),
 (3,'v-bar-pushdown',7,3,'10-15',60),
 (4,'lat-pulldown',1,4,'8-12',90),(4,'reverse-grip-lat-pulldown',2,3,'10-12',90),(4,'cable-row',3,4,'8-12',90),
 (4,'single-arm-dumbbell-row',4,3,'10-12',90),(4,'preacher-curl',5,3,'8-12',60),(4,'hammer-curl',6,3,'10-12',60),
 (4,'dumbbell-curl',7,3,'10-12',60),
 (5,'flat-dumbbell-press',1,4,'8-12',120),(5,'smith-machine-incline-press',2,3,'8-12',120),(5,'dips',3,3,'8-12',90),
 (5,'dumbbell-fly',4,3,'12-15',60),(5,'military-press',5,4,'6-10',150),(5,'cable-lateral-raise',6,4,'12-15',60),
 (5,'face-pull',7,3,'15-20',60),(5,'shrugs',8,3,'10-15',60),
 (6,'front-squat',1,4,'6-10',180),(6,'sumo-squat',2,3,'10-12',120),(6,'leg-curl',3,3,'10-15',60),
 (6,'calf-raise',4,4,'12-20',60),(6,'cross-cable-triceps-extension',5,3,'10-15',60),(6,'rope-pushdown',6,3,'10-15',60)
) as v(dow, slug, ord, sets, reps, rest)
join public.workout_days d on d.day_of_week = v.dow
join public.workout_plans p on p.id = d.plan_id and p.slug='six-day-split'
join public.exercises ex on ex.slug = v.slug;

-- ============ replacement engine ============
create or replace function public.rank_exercise_alternatives(
  _exercise_id uuid,
  _equipment_slugs text[] default null,
  _limit int default 5
)
returns table (
  id uuid, name text, slug text, similarity int, reason text,
  primary_muscle text, equipment text, movement_pattern text,
  difficulty smallint, fatigue_score smallint, gif_url text, image_url text
)
language sql stable security definer set search_path = public as $$
with src as (
  select e.*, eq.category as eq_category
  from public.exercises e left join public.equipment eq on eq.id = e.equipment_id
  where e.id = _exercise_id
),
src_sec as (select muscle_group_id from public.exercise_secondary_muscles where exercise_id = _exercise_id),
cand as (
  select c.*, eq.category as eq_category, eq.name as eq_name, eq.slug as eq_slug,
         mg.name as pm_name, mp.name as mp_name, mp.id as mp_id,
         (select count(*) from public.exercise_secondary_muscles s
            where s.exercise_id = c.id and s.muscle_group_id in (select muscle_group_id from src_sec)) as sec_overlap
  from public.exercises c
  left join public.equipment eq on eq.id = c.equipment_id
  join public.muscle_groups mg on mg.id = c.primary_muscle_id
  left join public.movement_patterns mp on mp.id = c.movement_pattern_id
  where c.is_active and c.id <> _exercise_id
    and (_equipment_slugs is null or eq.slug = any(_equipment_slugs))
),
scored as (
  select cand.*, s.id as src_id,
    (cand.movement_pattern_id is not distinct from s.movement_pattern_id) as same_pattern,
    (cand.primary_muscle_id = s.primary_muscle_id) as same_primary,
    (cand.eq_category is not distinct from s.eq_category) as same_eq_cat,
    (cand.equipment_id is not distinct from s.equipment_id) as same_eq,
    coalesce(ea.boost,0) as boost,
    ea.reason as curated_reason,
    cand.sec_overlap::numeric / greatest((select count(*) from src_sec),1) as sec_ratio,
    s.difficulty as s_diff, s.fatigue_score as s_fat, s.stability_requirement as s_stab
  from cand cross join src s
  left join public.exercise_alternatives ea on ea.exercise_id = s.id and ea.alternative_id = cand.id
)
select
  id, name, slug,
  least(99, greatest(1, round(
      (case when same_pattern then 38 else 0 end)
    + (case when same_primary then 24 else 0 end)
    + (10 * sec_ratio)
    + (case when same_eq_cat then 8 else 0 end)
    + (case when same_eq then 2 else 0 end)
    + (5 * (1 - abs(difficulty - s_diff)::numeric / 4))
    + (5 * (1 - abs(fatigue_score - s_fat)::numeric / 9))
    + (5 * (1 - abs(stability_requirement - s_stab)::numeric / 4))
    + boost
  )))::int as similarity,
  nullif(concat_ws(' ',
    case when same_pattern then 'Same movement pattern.' end,
    case when same_primary then 'Same primary muscle.' else 'Different primary muscle.' end,
    case when sec_ratio >= 0.5 then 'Overlapping secondary muscles.' end,
    case when same_eq then 'Same equipment.' when same_eq_cat then 'Same equipment category.' else 'Different equipment.' end,
    case when abs(difficulty - s_diff) <= 1 then 'Similar difficulty.' end,
    case when abs(fatigue_score - s_fat) <= 2 then 'Similar fatigue cost.' end,
    curated_reason
  ), '') as reason,
  pm_name, eq_name, mp_name, difficulty, fatigue_score, gif_url, image_url
from scored
order by similarity desc, same_pattern desc, name
limit greatest(_limit, 1);
$$;
grant execute on function public.rank_exercise_alternatives(uuid, text[], int) to authenticated;

-- progressive overload / previous performance helper
create or replace function public.last_exercise_performance(_exercise_id uuid)
returns table (session_date date, set_number smallint, weight numeric, reps smallint, rir smallint)
language sql stable security definer set search_path = public as $$
  with last_session as (
    select ws.id, ws.session_date
    from public.workout_sets s
    join public.workout_sessions ws on ws.id = s.session_id
    where s.user_id = auth.uid() and s.exercise_id = _exercise_id and s.completed
    order by ws.session_date desc, s.performed_at desc
    limit 1
  )
  select ls.session_date, s.set_number, s.weight, s.reps, s.rir
  from public.workout_sets s join last_session ls on ls.id = s.session_id
  where s.exercise_id = _exercise_id and s.user_id = auth.uid()
  order by s.set_number;
$$;
grant execute on function public.last_exercise_performance(uuid) to authenticated;

create or replace function public.workout_streak()
returns int language sql stable security definer set search_path = public as $$
  with days as (
    select distinct session_date from public.workout_sessions
    where user_id = auth.uid() and completed_at is not null
  ), grouped as (
    select session_date, session_date - (row_number() over (order by session_date))::int as grp
    from days
  ), runs as (
    select grp, count(*) as len, max(session_date) as last_day from grouped group by grp
  )
  select coalesce((select len from runs where last_day >= current_date - 1 order by last_day desc limit 1), 0)::int;
$$;
grant execute on function public.workout_streak() to authenticated;
