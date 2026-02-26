
-- 1. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 3. Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 4. Helper function (after group_members exists)
CREATE OR REPLACE FUNCTION public.is_member_of_group(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE user_id = _user_id AND group_id = _group_id);
$$;

-- 5. Groups RLS
CREATE POLICY "Members can view their groups" ON public.groups FOR SELECT TO authenticated USING (public.is_member_of_group(auth.uid(), id));
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can update group" ON public.groups FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner can delete group" ON public.groups FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 6. Group members RLS
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT TO authenticated USING (public.is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can add members" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_group(auth.uid(), group_id) OR NOT EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id));
CREATE POLICY "Members can remove members" ON public.group_members FOR DELETE TO authenticated USING (public.is_member_of_group(auth.uid(), group_id));

-- 7. Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can add expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.is_member_of_group(auth.uid(), group_id));

-- 8. Debts
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view debts" ON public.debts FOR SELECT TO authenticated USING (public.is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can create debts" ON public.debts FOR INSERT TO authenticated WITH CHECK (public.is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Participants can update debts" ON public.debts FOR UPDATE TO authenticated USING (debtor_id = auth.uid() OR creditor_id = auth.uid());
CREATE POLICY "Members can delete debts" ON public.debts FOR DELETE TO authenticated USING (public.is_member_of_group(auth.uid(), group_id));
