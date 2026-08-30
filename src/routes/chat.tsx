import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendMessage,
  type MessageRow,
} from "@/lib/chat";
import { StackedList } from "@/components/ui/stacked-list";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  validateSearch: (s: Record<string, unknown>) => ({
    c: typeof s["c"] === "string" ? s["c"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Messages — Chat with Owners | LocalSpot" },
      {
        name: "description",
        content: "Chat directly with property owners and service providers — no commission, no middleman.",
      },
      { property: "og:title", content: "Messages — LocalSpot" },
      {
        property: "og:description",
        content: "Direct chat between students and local owners and service providers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function ChatPage() {
  const { user, loading } = useAuth();
  const { c } = useSearch({ from: "/chat" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const conversations = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
  });

  const active = useMemo(
    () => (conversations.data ?? []).find((x) => x.id === c) ?? null,
    [conversations.data, c],
  );

  // realtime: refresh threads + open conversation on any new message
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["conversations", user.id] });
        void qc.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-xl font-bold">Sign in to chat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Message owners and service providers directly from LocalSpot.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const items = (conversations.data ?? []).map((cv) => ({
    id: cv.id,
    title: cv.peerName,
    subtitle: cv.last_message || cv.listingTitle || "Say hello 👋",
    meta: timeAgo(cv.last_message_at),
    avatar: cv.peerAvatar,
    badge: cv.unread,
  }));

  return (
    <div className="mx-auto max-w-6xl px-0 py-0 sm:px-4 sm:py-5">
      <div className="grid h-[calc(100dvh-8.5rem)] overflow-hidden rounded-none border-border bg-card sm:h-[74vh] sm:rounded-2xl sm:border lg:grid-cols-[330px_1fr]">
        {/* Threads */}
        <div className={cn("flex flex-col border-r border-border", c && "hidden lg:flex")}>
          <div className="flex items-center justify-between px-4 py-3.5">
            <h1 className="text-lg font-bold tracking-tight">Messages</h1>
            <span className="text-xs text-muted-foreground">{items.length} chats</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {conversations.isPending ? (
              <div className="space-y-2 px-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (
              <StackedList
                items={items}
                activeId={c}
                onSelect={(id) => void navigate({ to: "/chat", search: { c: id } })}
                emptyLabel="No conversations yet. Open a listing and tap “Chat with owner”."
              />
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("flex min-h-0 flex-col", !c && "hidden lg:flex")}>
          {active ? (
            <Thread
              conversationId={active.id}
              userId={user.id}
              peerName={active.peerName}
              peerAvatar={active.peerAvatar}
              subtitle={active.listingTitle}
              onBack={() => void navigate({ to: "/chat", search: { c: "" } })}
            />
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Thread({
  conversationId,
  userId,
  peerName,
  peerAvatar,
  subtitle,
  onBack,
}: {
  conversationId: string;
  userId: string;
  peerName: string;
  peerAvatar: string | null;
  subtitle: string | null;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isPending } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  useEffect(() => {
    void markConversationRead(conversationId, userId).then(() =>
      qc.invalidateQueries({ queryKey: ["conversations", userId] }),
    );
  }, [conversationId, userId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.length]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    await sendMessage(conversationId, userId, body);
    await qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    await qc.invalidateQueries({ queryKey: ["conversations", userId] });
  }

  const messages: MessageRow[] = data ?? [];

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-3 py-3">
        <button type="button" onClick={onBack} className="lg:hidden" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {peerAvatar ? (
          <img src={peerAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {peerName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{peerName}</span>
          {subtitle ? (
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 px-3 py-4">
        {isPending ? (
          <p className="text-center text-xs text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            No messages yet — send the first one.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-card text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-right text-[10px]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}
