-- ============================================================
-- ফলাফল (মার্কশিট) সিস্টেম — Supabase → SQL Editor → New query → পুরোটা পেস্ট করে RUN
-- (আগের supabase_setup.sql চালানো থাকলে শুধু এই ফাইলটাই চালালে হবে। আবার চালালেও ক্ষতি নেই।)
-- ============================================================
create table if not exists public.results (
  id bigint generated always as identity primary key,
  year text not null,
  class text not null,
  section text not null default 'A',
  roll int not null,
  name text not null,
  scholar_no text,
  dob date,
  father text,
  mother text,
  gender text,
  community text,
  photo_url text,
  marks jsonb not null default '[]'::jsonb,
  attend jsonb not null default '{}'::jsonb,
  rank int,
  published boolean not null default false,
  created_by uuid default auth.uid(),
  updated_at timestamptz default now(),
  unique (year, class, section, roll)
);
alter table public.results enable row level security;

drop policy if exists "results read"   on public.results;
drop policy if exists "results insert" on public.results;
drop policy if exists "results update" on public.results;
drop policy if exists "results delete" on public.results;
-- শিক্ষক/অ্যাডমিন দেখবেন; অভিভাবক সরাসরি টেবিল পড়তে পারবেন না (নিচের get_result ফাংশন দিয়ে শুধু নিজের সন্তানেরটা)
create policy "results read"   on public.results for select to authenticated using (public.is_staff());
create policy "results insert" on public.results for insert to authenticated with check (public.is_staff() and (published = false or public.is_admin()));
-- প্রকাশের (চূড়ান্ত জমার) পর শিক্ষক আর বদলাতে পারবেন না; শুধু অ্যাডমিন পারবেন
create policy "results update" on public.results for update to authenticated using (public.is_admin() or (public.is_staff() and published = false)) with check (public.is_staff());
create policy "results delete" on public.results for delete to authenticated using (public.is_admin() or (public.is_staff() and published = false));

grant select, insert, update, delete on public.results to authenticated;

-- অভিভাবকের খোঁজা: বছর + শ্রেণি + রোল + জন্ম তারিখ মিললে তবেই একজনের ফলাফল ফেরত দেয়
create or replace function public.get_result(p_year text, p_class text, p_roll int, p_dob date)
returns json language sql security definer set search_path = public stable as $$
  select row_to_json(r) from (
    select year, class, section, roll, name, scholar_no, dob, father, mother, gender, community, photo_url, marks, attend, rank
    from public.results
    where published and year = p_year and class = p_class and roll = p_roll and dob = p_dob
    order by section limit 1) r
$$;

create or replace function public.result_years() returns json
language sql security definer set search_path = public stable as $$
  select coalesce(json_agg(distinct year), '[]'::json) from public.results where published
$$;

grant execute on function public.get_result(text, text, int, date) to anon, authenticated;
grant execute on function public.result_years() to anon, authenticated;
