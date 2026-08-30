import { supabase } from "@/integrations/supabase/client";

export type ConversationRow = {
  id: string;
  student_id: string;
  owner_id: string;
  listing_id: string | null;
  last_message: string | null;
  last_message_at: string;
  student_unread: number;
  owner_unread: number;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  media_type: string;
  is_read: boolean;
  created_at: string;
};

export type ConversationView = ConversationRow & {
  peerId: string;
  peerName: string;
  peerAvatar: string | null;
  listingTitle: string | null;
  unread: number;
};

export async function fetchConversations(userId: string): Promise<ConversationView[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`student_id.eq.${userId},owner_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as ConversationRow[];
  if (rows.length === 0) return [];

  const peerIds = [...new Set(rows.map((r) => (r.student_id === userId ? r.owner_id : r.student_id)))];
  const listingIds = [...new Set(rows.map((r) => r.listing_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", peerIds),
    listingIds.length
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lmap = new Map((listings ?? []).map((l) => [l.id, l.title]));

  return rows.map((r) => {
    const peerId = r.student_id === userId ? r.owner_id : r.student_id;
    const p = pmap.get(peerId);
    return {
      ...r,
      peerId,
      peerName: p?.full_name || "LocalSpot user",
      peerAvatar: p?.avatar_url ?? null,
      listingTitle: r.listing_id ? (lmap.get(r.listing_id) ?? null) : null,
      unread: r.student_id === userId ? r.student_unread : r.owner_unread,
    };
  });
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
    media_type: "text",
  });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string, userId: string) {
  const { data } = await supabase
    .from("conversations")
    .select("student_id, owner_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data) return;
  const patch = data.student_id === userId ? { student_unread: 0 } : { owner_unread: 0 };
  await supabase.from("conversations").update(patch).eq("id", conversationId);
}

/** Find or create a conversation between the signed-in student and a listing owner. */
export async function startConversation(params: {
  studentId: string;
  ownerId: string;
  listingId?: string | null;
}): Promise<string> {
  const { studentId, ownerId, listingId } = params;
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("student_id", studentId)
    .eq("owner_id", ownerId)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ student_id: studentId, owner_id: ownerId, listing_id: listingId ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
