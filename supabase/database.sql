-- Orbit Share database setup
-- Run this file against a fresh Supabase project database.
-- It combines all migrations in chronological order.

-- ============================================================ 
-- Source: 20260704174100_c61c87ed-5986-4358-ab0a-6733c864b644.sql
-- ============================================================ 


-- ============ ENUMS ============
CREATE TYPE public.group_role AS ENUM ('owner', 'co_manager', 'member');
CREATE TYPE public.member_status AS ENUM ('pending', 'active', 'removed', 'left');
CREATE TYPE public.payment_status AS ENUM ('submitted', 'approved', 'rejected');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Orbit Member',
  email TEXT,
  avatar_gradient TEXT NOT NULL DEFAULT 'from-cyan to-violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ GROUPS ============
CREATE TABLE public.groups (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  icon TEXT NOT NULL DEFAULT 'Boxes',
  gradient TEXT NOT NULL DEFAULT 'from-cyan to-violet',
  monthly_total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  renewal_date DATE,
  due_date DATE,
  max_seats INTEGER NOT NULL DEFAULT 6,
  split_method TEXT NOT NULL DEFAULT 'Equal split among all members',
  status TEXT NOT NULL DEFAULT 'Active',
  payment_instructions TEXT,
  bkash TEXT,
  nagad TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- ============ GROUP MEMBERS ============
CREATE TABLE public.group_members (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.group_role NOT NULL DEFAULT 'member',
  status public.member_status NOT NULL DEFAULT 'active',
  monthly_share NUMERIC NOT NULL DEFAULT 0,
  months_paid INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  orbit_points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  method TEXT,
  transaction_id TEXT,
  note TEXT,
  status public.payment_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============ ACTIVITY ============
CREATE TABLE public.activity (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.is_group_member(_group UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group AND user_id = _user AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_manager(_group UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group AND user_id = _user
      AND status = 'active' AND role IN ('owner', 'co_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_group(_other UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members m1
    JOIN public.group_members m2 ON m1.group_id = m2.group_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = _other
  );
$$;

-- ============ PROFILES POLICIES ============
CREATE POLICY "Read own or co-member profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_group(id));
CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============ GROUPS POLICIES ============
CREATE POLICY "Members read groups" ON public.groups
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_group_member(id, auth.uid()));
CREATE POLICY "Owner creates group" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Managers update group" ON public.groups
  FOR UPDATE TO authenticated
  USING (public.is_group_manager(id, auth.uid()))
  WITH CHECK (public.is_group_manager(id, auth.uid()));
CREATE POLICY "Owner deletes group" ON public.groups
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ============ GROUP MEMBERS POLICIES ============
CREATE POLICY "Read members of my groups" ON public.group_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Self join or manager adds" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_group_manager(group_id, auth.uid()));
CREATE POLICY "Manager or self updates member" ON public.group_members
  FOR UPDATE TO authenticated
  USING (public.is_group_manager(group_id, auth.uid()) OR user_id = auth.uid())
  WITH CHECK (public.is_group_manager(group_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Manager or self removes member" ON public.group_members
  FOR DELETE TO authenticated
  USING (public.is_group_manager(group_id, auth.uid()) OR user_id = auth.uid());

-- ============ PAYMENTS POLICIES ============
CREATE POLICY "Read own or managed payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_manager(group_id, auth.uid()));
CREATE POLICY "Submit own payment" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Manager reviews payment" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_group_manager(group_id, auth.uid()))
  WITH CHECK (public.is_group_manager(group_id, auth.uid()));

-- ============ ACTIVITY POLICIES ============
CREATE POLICY "Managers read activity" ON public.activity
  FOR SELECT TO authenticated
  USING (public.is_group_manager(group_id, auth.uid()));
CREATE POLICY "Members write activity" ON public.activity
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()));

-- ============ AUTO-ADD OWNER AS MEMBER ============
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status, monthly_share)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active', 0)
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_add_owner_as_member
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- ============ UPDATED_AT ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================ 
-- Source: 20260704174137_8826b72f-8a85-4f66-829b-56a7fda51aed.sql
-- ============================================================ 


REVOKE EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_manager(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.shares_group(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_owner_as_member() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_manager(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_group(UUID) TO authenticated;

-- ============================================================ 
-- Source: 20260704174204_eed8e314-ea0a-4b6b-a6fe-518a22686636.sql
-- ============================================================ 


REVOKE EXECUTE ON FUNCTION public.add_owner_as_member() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;

-- ============================================================ 
-- Source: 20260704175818_c09256e8-a445-4704-b3a2-2a1422259376.sql
-- ============================================================ 

-- Invite codes for groups
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code text;
UPDATE public.groups SET invite_code = public.gen_invite_code() WHERE invite_code IS NULL;
ALTER TABLE public.groups ALTER COLUMN invite_code SET DEFAULT public.gen_invite_code();
ALTER TABLE public.groups ALTER COLUMN invite_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS groups_invite_code_key ON public.groups(invite_code);

-- Payment handle fields on profiles (used by Settings)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bkash text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nagad text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank text;

-- Preview a group before joining (bypasses member-only RLS, returns safe columns only)
CREATE OR REPLACE FUNCTION public.group_preview_by_code(_code text)
RETURNS TABLE(
  id uuid, name text, category text, icon text, gradient text,
  monthly_total numeric, currency text, max_seats int, member_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.category, g.icon, g.gradient, g.monthly_total, g.currency, g.max_seats,
    (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id AND m.status = 'active')
  FROM public.groups g
  WHERE g.invite_code = upper(_code);
$$;
GRANT EXECUTE ON FUNCTION public.group_preview_by_code(text) TO authenticated;

-- Join a group via invite code
CREATE OR REPLACE FUNCTION public.join_group_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.groups;
  active_count int;
  share numeric;
  me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO g FROM public.groups WHERE invite_code = upper(_code);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = g.id AND user_id = me AND status = 'active'
  ) THEN
    RETURN g.id;
  END IF;

  SELECT count(*) INTO active_count
  FROM public.group_members
  WHERE group_id = g.id AND status = 'active';

  IF active_count >= g.max_seats THEN
    RAISE EXCEPTION 'This group is full';
  END IF;

  share := round(g.monthly_total / GREATEST(g.max_seats, 1));

  INSERT INTO public.group_members (group_id, user_id, role, status, monthly_share)
  VALUES (g.id, me, 'member', 'active', share)
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'active';

  INSERT INTO public.activity (group_id, user_id, type, text)
  VALUES (g.id, me, 'member_joined', 'Joined the group');

  RETURN g.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

-- ============================================================ 
-- Source: 20260704175846_4b5ef501-2cd1-4673-b776-c4b9133b674b.sql
-- ============================================================ 

CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

REVOKE EXECUTE ON FUNCTION public.group_preview_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_group_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.group_preview_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

-- ============================================================ 
-- Source: 20260704181237_adfad099-a1c9-4b55-907e-5cdfe93b1036.sql
-- ============================================================ 

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS review_note text;

-- ============================================================ 
-- Source: 20260713094738_4fb8eb7e-6752-4181-b7f6-cccf2081e78a.sql
-- ============================================================ 

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'member',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Managers can create notifications for members of groups they manage;
-- users can also create notifications for themselves.
CREATE POLICY "Managers or self can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (group_id IS NOT NULL AND public.is_group_manager(group_id, auth.uid()))
  );

