import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@skyle/db";
import { updateLevelSettings, updateWelcomeSettings } from "@/actions/community-actions";
import { CHANNEL_TYPE, fetchGuildChannels, fetchGuildRoles } from "@/lib/discord-guild-api";
import { ChannelSelect } from "@/components/discord-pickers";
import {
  buttonClass,
  cardClass,
  checkboxRowClass,
  inputClass,
  labelClass,
  sectionDescriptionClass,
  sectionTitleClass,
} from "@/lib/ui";

export default async function CommunityPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [levelConfig, welcomeConfig, reactionRoles, channels, roles] = await Promise.all([
    prisma.levelConfig.findUnique({ where: { guildId } }),
    prisma.welcomeConfig.findUnique({ where: { guildId } }),
    prisma.reactionRoleConfig.findMany({ where: { guildId }, orderBy: { createdAt: "desc" }, take: 20 }),
    fetchGuildChannels(guildId),
    fetchGuildRoles(guildId),
  ]);
  const textChannels = channels.filter((c) => c.type === CHANNEL_TYPE.GuildText);
  const channelName = (id: string) => channels.find((c) => c.id === id)?.name ?? id;
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={sectionTitleClass}>Community</h1>
        <p className={sectionDescriptionClass}>Livelli, messaggi di benvenuto/addio e reaction roles.</p>
      </div>

      <div className={`${cardClass} p-6`}>
        <h2 className="mb-1 text-base font-semibold">Livelli / XP</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Gli utenti guadagnano esperienza scrivendo messaggi. Usa <code>/rank</code> e <code>/leaderboard</code> su Discord.
        </p>
        <form
          key={levelConfig?.updatedAt.getTime() ?? 0}
          action={updateLevelSettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={checkboxRowClass}>
            <input type="checkbox" name="enabled" defaultChecked={levelConfig?.enabled ?? false} className="h-4 w-4" />
            Attiva i livelli
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              XP per messaggio
              <input type="number" name="xpPerMessage" defaultValue={levelConfig?.xpPerMessage ?? 15} min={1} className={inputClass} />
            </label>
            <label className={labelClass}>
              Cooldown (secondi)
              <input
                type="number"
                name="xpCooldownSeconds"
                defaultValue={levelConfig?.xpCooldownSeconds ?? 60}
                min={0}
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Canale annunci level-up (vuoto = nel canale del messaggio)
            <ChannelSelect name="levelUpChannelId" channels={textChannels} defaultValue={levelConfig?.levelUpChannelId} />
          </label>

          <label className={checkboxRowClass}>
            <input type="checkbox" name="announceLevelUp" defaultChecked={levelConfig?.announceLevelUp ?? true} className="h-4 w-4" />
            Annuncia quando qualcuno sale di livello
          </label>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>

      <div className={`${cardClass} p-6`}>
        <h2 className="mb-1 text-base font-semibold">Benvenuto e addio</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Variabili disponibili nei messaggi: <code>{"{user}"}</code>, <code>{"{username}"}</code>, <code>{"{server}"}</code>,{" "}
          <code>{"{membercount}"}</code>.
        </p>
        <form
          key={welcomeConfig?.updatedAt.getTime() ?? 0}
          action={updateWelcomeSettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={checkboxRowClass}>
            <input type="checkbox" name="enabled" defaultChecked={welcomeConfig?.enabled ?? false} className="h-4 w-4" />
            Attiva il messaggio di benvenuto
          </label>
          <label className={labelClass}>
            Canale di benvenuto
            <ChannelSelect name="channelId" channels={textChannels} defaultValue={welcomeConfig?.channelId} />
          </label>
          <label className={labelClass}>
            Messaggio di benvenuto
            <textarea
              name="messageTemplate"
              defaultValue={welcomeConfig?.messageTemplate ?? "Benvenuto/a {user} su {server}! 🎉"}
              rows={2}
              className={inputClass}
            />
          </label>

          <label className={checkboxRowClass}>
            <input type="checkbox" name="dmEnabled" defaultChecked={welcomeConfig?.dmEnabled ?? false} className="h-4 w-4" />
            Manda anche un messaggio privato
          </label>
          <label className={labelClass}>
            Testo del messaggio privato
            <textarea name="dmTemplate" defaultValue={welcomeConfig?.dmTemplate ?? ""} rows={2} className={inputClass} />
          </label>

          <hr className="border-border" />

          <label className={checkboxRowClass}>
            <input type="checkbox" name="leaveEnabled" defaultChecked={welcomeConfig?.leaveEnabled ?? false} className="h-4 w-4" />
            Attiva il messaggio di addio
          </label>
          <label className={labelClass}>
            Canale di addio
            <ChannelSelect name="leaveChannelId" channels={textChannels} defaultValue={welcomeConfig?.leaveChannelId} />
          </label>
          <label className={labelClass}>
            Messaggio di addio
            <textarea
              name="leaveTemplate"
              defaultValue={welcomeConfig?.leaveTemplate ?? "{user} ha lasciato il server."}
              rows={2}
              className={inputClass}
            />
          </label>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>

      <div className={`${cardClass} p-6`}>
        <h2 className="mb-1 text-base font-semibold">Reaction roles</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Si configurano su Discord con <code>/reactionrole add</code> e <code>/reactionrole remove</code>. Qui trovi quelli attivi.
        </p>
        {reactionRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun reaction role configurato.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {reactionRoles.map((rr) => (
              <li key={rr.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>
                  Messaggio <code>{rr.messageId}</code> in #{channelName(rr.channelId)}
                </span>
                <span>
                  {rr.emoji} → @{roleName(rr.roleId)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
