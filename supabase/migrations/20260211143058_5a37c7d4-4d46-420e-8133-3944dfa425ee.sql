
-- Drop and recreate the groups SELECT policy to also allow owners
DROP POLICY "Members can view their groups" ON public.groups;
CREATE POLICY "Members or owner can view groups" ON public.groups FOR SELECT TO authenticated
  USING (public.is_member_of_group(auth.uid(), id) OR owner_id = auth.uid());
