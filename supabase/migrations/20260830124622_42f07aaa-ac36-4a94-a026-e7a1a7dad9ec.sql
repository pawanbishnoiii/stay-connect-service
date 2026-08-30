ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric,
  ADD COLUMN IF NOT EXISTS push_opted_in boolean NOT NULL DEFAULT false;

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS accepted_terms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_refund_policy boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_confirmed boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS business_profiles_user_id_key ON public.business_profiles (user_id);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS student_typing_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_typing_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_read_at timestamptz;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.push_devices REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;