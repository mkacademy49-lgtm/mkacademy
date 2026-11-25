-- ============================================================
-- M K Academy: লগইন সিস্টেম ও ডাটাবেস
-- Supabase → SQL Editor → New query → এই পুরো ফাইল পেস্ট করে RUN
-- ============================================================

-- ১) ব্যবহারকারীর প্রোফাইল (অ্যাডমিন / শিক্ষক)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'teacher' check (role in ('admin','teacher')),
  active boolean not null default false
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin')
$$;

-- ২) ওয়েবসাইটের কনটেন্ট টেবিল
create table if not exists public.gallery (
  id bigint generated always as identity primary key,
  url text not null,
  path text,
  caption text,
  category text default 'event',
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.notices (
  id bigint generated always as identity primary key,
  text text not null,
  is_new boolean default true,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.slides (
  id bigint generated always as identity primary key,
  url text not null,
  path text,
  caption text,
  sort numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.staff (
  id bigint generated always as identity primary key,
  kind text default 'teacher',
  name text default '',
  role_title text default '',
  qualification text default '',
  photo_url text,
  photo_path text,
  sort numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.settings (
  key text primary key,
  value text
);

create table if not exists public.admissions (
  id bigint generated always as identity primary key,
  app_no text unique,
  student_name text,
  class_applied text,
  mobile text,
  data jsonb,
  docs jsonb,
  created_at timestamptz default now()
);

-- ৩) নিরাপত্তা নিয়ম (RLS)
alter table public.profiles   enable row level security;
alter table public.gallery    enable row level security;
alter table public.notices    enable row level security;
alter table public.slides     enable row level security;
alter table public.staff      enable row level security;
alter table public.settings   enable row level security;
alter table public.admissions enable row level security;

-- profiles: নিজেরটা দেখা যাবে, অ্যাডমিন সব দেখবে ও বদলাবে
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- gallery ও notices: সবাই দেখবে; সক্রিয় শিক্ষক/অ্যাডমিন যোগ করবে; নিজেরটা বা (অ্যাডমিন) সব মুছবে
drop policy if exists "gallery read" on public.gallery;
create policy "gallery read" on public.gallery for select using (true);
drop policy if exists "gallery insert" on public.gallery;
create policy "gallery insert" on public.gallery for insert to authenticated
  with check (public.is_staff() and created_by = auth.uid());
drop policy if exists "gallery delete" on public.gallery;
create policy "gallery delete" on public.gallery for delete to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = auth.uid()));
drop policy if exists "gallery update" on public.gallery;
create policy "gallery update" on public.gallery for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notices read" on public.notices;
create policy "notices read" on public.notices for select using (true);
drop policy if exists "notices insert" on public.notices;
create policy "notices insert" on public.notices for insert to authenticated
  with check (public.is_staff() and created_by = auth.uid());
drop policy if exists "notices delete" on public.notices;
create policy "notices delete" on public.notices for delete to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = auth.uid()));

-- slides, staff, settings: সবাই দেখবে, শুধু অ্যাডমিন বদলাবে
drop policy if exists "slides read" on public.slides;
create policy "slides read" on public.slides for select using (true);
drop policy if exists "slides admin" on public.slides;
create policy "slides admin" on public.slides for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "staff read" on public.staff;
create policy "staff read" on public.staff for select using (true);
drop policy if exists "staff admin" on public.staff;
create policy "staff admin" on public.staff for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);
drop policy if exists "settings admin" on public.settings;
create policy "settings admin" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- admissions: যে কেউ আবেদন জমা দিতে পারবে, কিন্তু দেখতে/মুছতে পারবে শুধু অ্যাডমিন
drop policy if exists "admissions insert" on public.admissions;
create policy "admissions insert" on public.admissions for insert to anon, authenticated
  with check (true);
drop policy if exists "admissions admin read" on public.admissions;
create policy "admissions admin read" on public.admissions for select to authenticated
  using (public.is_admin());
drop policy if exists "admissions admin delete" on public.admissions;
create policy "admissions admin delete" on public.admissions for delete to authenticated
  using (public.is_admin());

-- ৪) ছবি ও ডকুমেন্ট রাখার স্টোরেজ
insert into storage.buckets (id, name, public) values ('site', 'site', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('docs', 'docs', false)
on conflict (id) do nothing;

drop policy if exists "site staff upload" on storage.objects;
create policy "site staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'site' and public.is_staff());
drop policy if exists "site staff delete" on storage.objects;
create policy "site staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'site' and public.is_staff() and (owner = auth.uid() or public.is_admin()));

drop policy if exists "docs anyone upload" on storage.objects;
create policy "docs anyone upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'docs');
drop policy if exists "docs admin read" on storage.objects;
create policy "docs admin read" on storage.objects for select to authenticated
  using (bucket_id = 'docs' and public.is_admin());
drop policy if exists "docs admin delete" on storage.objects;
create policy "docs admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'docs' and public.is_admin());

-- ৫) এখনকার ছবি/তথ্য ডাটাবেসে তুলে রাখা (যাতে অ্যাডমিন প্যানেল থেকে বদলানো ও মোছা যায়)
insert into public.gallery (url, caption, category, created_at) values
 ('images/slide1.jpg','প্রসপেক্টাস ও ভর্তি','banner', now() - interval '12 minutes'),
 ('images/slide2.jpg','এম.কে. অ্যাকাডেমী','banner', now() - interval '11 minutes'),
 ('images/slide3.jpg','আমাদের শিক্ষকবৃন্দ','banner', now() - interval '10 minutes'),
 ('images/g1.jpg','শিক্ষক দিবস উদযাপন','event', now() - interval '9 minutes'),
 ('images/g2.jpg','শিক্ষক দিবস উদযাপন','event', now() - interval '8 minutes'),
 ('images/g3.jpg','শিক্ষক দিবস উদযাপন','event', now() - interval '7 minutes'),
 ('images/g4.jpg','শিক্ষক দিবস উদযাপন','event', now() - interval '6 minutes'),
 ('images/g5.jpg','ম্যাথ কম্পিটিশনের উপহার','compete', now() - interval '5 minutes'),
 ('images/g6.jpg','শিক্ষক দিবস উদযাপন','event', now() - interval '4 minutes'),
 ('images/g7.jpg','আমাদের শিক্ষার্থীরা','students', now() - interval '3 minutes'),
 ('images/g8.jpg','অ্যাবাকাস প্রতিযোগিতায় সাফল্য','compete', now() - interval '2 minutes'),
 ('images/g9.jpg','ম্যাথ কম্পিটিশনের উপহার','compete', now() - interval '1 minutes');

insert into public.slides (url, caption, sort) values
 ('images/slide1.jpg','প্রসপেক্টাস',1),
 ('images/slide2.jpg','এম.কে. অ্যাকাডেমী',2),
 ('images/slide3.jpg','শিক্ষকবৃন্দ',3);

insert into public.staff (kind, name, role_title, qualification, photo_url, sort) values
 ('leader','মোঃ খাবিরুদ্দিন সেখ','পরিচালক','','images/lead1.jpg',1),
 ('leader','মোঃ ফজলুল হক (বাবু)','প্রধান শিক্ষক','B-Tech','images/lead2.jpg',2),
 ('teacher','','','','images/t1.jpg',11),
 ('teacher','','','','images/t2.jpg',12),
 ('teacher','','','','images/t3.jpg',13),
 ('teacher','','','','images/t4.jpg',14),
 ('teacher','','','','images/t5.jpg',15),
 ('teacher','','','','images/t6.jpg',16),
 ('teacher','','','','images/t7.jpg',17),
 ('teacher','','','','images/t8.jpg',18),
 ('teacher','','','','images/t9.jpg',19),
 ('teacher','','','','images/t10.jpg',20),
 ('teacher','','','','images/t11.jpg',21),
 ('teacher','','','','images/t12.jpg',22),
 ('teacher','','','','images/t13.jpg',23),
 ('teacher','','','','images/t14.jpg',24);

insert into public.notices (text, is_new, created_at) values
 ('নতুন শিক্ষাবর্ষের অনলাইন ভর্তি শুরু হয়েছে।', true, now() - interval '3 minutes'),
 ('ভর্তির জন্য শিক্ষার্থীর জন্মসনদ ও অভিভাবকের মোবাইল নম্বর প্রস্তুত রাখুন।', false, now() - interval '2 minutes'),
 ('আবেদন জমা দেওয়ার পর প্রিন্ট কপি স্কুলে জমা দিতে হবে।', false, now() - interval '1 minutes');

-- ============================================================
-- এরপর (আপনার ইমেইল বসিয়ে) অ্যাডমিন বানাতে এই লাইনটি আলাদা করে RUN করুন:
--
-- update public.profiles set role = 'admin', active = true where email = 'আপনার-ইমেইল@gmail.com';
-- ============================================================
