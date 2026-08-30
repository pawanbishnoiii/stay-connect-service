DROP POLICY "Participants can read messages" ON public.messages;
DROP POLICY "Participants can send messages" ON public.messages;
DROP POLICY "Participants can mark messages read" ON public.messages;
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid);

CREATE POLICY "Participants can read messages" ON public.messages
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
      AND (c.student_id = auth.uid() OR c.owner_id = auth.uid())));
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
      AND (c.student_id = auth.uid() OR c.owner_id = auth.uid())));
CREATE POLICY "Participants can mark messages read" ON public.messages
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
      AND (c.student_id = auth.uid() OR c.owner_id = auth.uid())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
      AND (c.student_id = auth.uid() OR c.owner_id = auth.uid())));

REVOKE ALL ON FUNCTION public.bump_conversation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bump_conversation() FROM anon;
REVOKE ALL ON FUNCTION public.bump_conversation() FROM authenticated;