import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Messages — LocalSpot" },
      { name: "description", content: "Chat with owners and service providers" },
      { property: "og:title", content: "Messages — LocalSpot" },
      { property: "og:description", content: "Chat with owners and service providers" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <p className="mt-2 text-sm text-muted-foreground">Chat with owners and service providers</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
