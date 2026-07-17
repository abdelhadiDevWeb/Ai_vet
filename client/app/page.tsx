import { Chat } from "../components/chat/Chat";
import { SiteHeader } from "../components/SiteHeader";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/20">
      <SiteHeader />

      <main className="flex min-h-0 flex-1 flex-col">
        <Chat />
      </main>
    </div>
  );
}
