CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  student_unread integer NOT NULL DEFAULT 0,
  owner_unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, owner_id, listing_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = student_id OR auth.uid() = owner_id);
CREATE POLICY "Users can start conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id OR auth.uid() = owner_id);
CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = student_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = owner_id);

CREATE TRIGGER conversations_updated BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  media_url text,
  media_type text NOT NULL DEFAULT 'text',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation AND (c.student_id = auth.uid() OR c.owner_id = auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated, service_role;

CREATE POLICY "Participants can read messages" ON public.messages
  FOR SELECT TO authenticated USING (public.is_conversation_participant(conversation_id));
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.is_conversation_participant(conversation_id));
CREATE POLICY "Participants can mark messages read" ON public.messages
  FOR UPDATE TO authenticated USING (public.is_conversation_participant(conversation_id))
  WITH CHECK (public.is_conversation_participant(conversation_id));

CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations c SET
    last_message = COALESCE(NEW.body, CASE WHEN NEW.media_type = 'text' THEN '' ELSE '📎 ' || NEW.media_type END),
    last_message_at = NEW.created_at,
    student_unread = CASE WHEN NEW.sender_id = c.owner_id THEN c.student_unread + 1 ELSE c.student_unread END,
    owner_unread = CASE WHEN NEW.sender_id = c.student_id THEN c.owner_unread + 1 ELSE c.owner_unread END
  WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER messages_bump_conversation AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;