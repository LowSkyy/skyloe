import { signIn } from "@/auth";
import { DiscordIcon } from "@/components/discord-icon";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4">
      <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Skyle</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Accedi con Discord per gestire i tuoi server.</p>
        <form
          action={async () => {
            "use server";
            await signIn("discord", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <DiscordIcon />
            Accedi con Discord
          </button>
        </form>
      </div>
    </div>
  );
}
