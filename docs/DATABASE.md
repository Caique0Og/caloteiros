# Estrutura do Banco de Dados - MateCash

## Visão Geral

O projeto utiliza 5 tabelas principais: `profiles`, `groups`, `group_members`, `expenses` e `debts`.

---

## Diagrama de Relacionamentos

```
profiles (1) ──── (N) group_members (N) ──── (1) groups
    │                                            │
    │                                            │
    ├──── (N) expenses (N) ──────────────────────┘
    │                                            │
    ├──── (N) debts [creditor] (N) ──────────────┘
    └──── (N) debts [debtor]  (N) ──────────────-┘
```

---

## SQL Completo para Recriar no Supabase

Execute os comandos abaixo **em ordem** no SQL Editor do Supabase.

### 1. Tabela `profiles`

```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);
```

### 2. Trigger para criar perfil automaticamente no signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3. Tabela `groups`

```sql
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update group"
  ON public.groups FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can delete group"
  ON public.groups FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Members or owner can view groups"
  ON public.groups FOR SELECT
  USING (
    is_member_of_group(auth.uid(), id) OR owner_id = auth.uid()
  );
```

### 4. Função auxiliar `is_member_of_group`

```sql
CREATE OR REPLACE FUNCTION public.is_member_of_group(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  );
$$;
```

### 5. Tabela `group_members`

```sql
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (is_member_of_group(auth.uid(), group_id));

CREATE POLICY "Members can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    is_member_of_group(auth.uid(), group_id)
    OR NOT EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id)
  );

CREATE POLICY "Members can remove members"
  ON public.group_members FOR DELETE
  USING (is_member_of_group(auth.uid(), group_id));
```

### 6. Tabela `expenses`

```sql
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id),
  payer_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view expenses"
  ON public.expenses FOR SELECT
  USING (is_member_of_group(auth.uid(), group_id));

CREATE POLICY "Members can add expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (is_member_of_group(auth.uid(), group_id));

CREATE POLICY "Members can delete expenses"
  ON public.expenses FOR DELETE
  USING (is_member_of_group(auth.uid(), group_id));
```

### 7. Tabela `debts`

```sql
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id),
  debtor_id UUID NOT NULL REFERENCES public.profiles(id),
  creditor_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view debts"
  ON public.debts FOR SELECT
  USING (is_member_of_group(auth.uid(), group_id));

CREATE POLICY "Members can create debts"
  ON public.debts FOR INSERT
  WITH CHECK (is_member_of_group(auth.uid(), group_id));

CREATE POLICY "Participants can update debts"
  ON public.debts FOR UPDATE
  USING (debtor_id = auth.uid() OR creditor_id = auth.uid());

CREATE POLICY "Members can delete debts"
  ON public.debts FOR DELETE
  USING (is_member_of_group(auth.uid(), group_id));
```

---

## Ordem de Execução

> ⚠️ **IMPORTANTE**: Execute na seguinte ordem para evitar erros de dependência:
>
> 1. `profiles` (tabela + políticas)
> 2. `handle_new_user` (função + trigger)
> 3. `groups` (tabela + políticas)
> 4. `is_member_of_group` (função)
> 5. `group_members` (tabela + políticas)
> 6. `expenses` (tabela + políticas)
> 7. `debts` (tabela + políticas)
