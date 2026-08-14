import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@skyle/db";
import { updateGiveawaySettings } from "@/actions/giveaway-actions";
import { CHANNEL_TYPE, fetchGuildChannels } from "@/lib/discord-guild-api";
import { ChannelSelect } from "@/components/discord-pickers";
import { buttonClass, cardClass, labelClass, sectionDescriptionClass, sectionTitleClass } from "@/lib/ui";

export default async function GiveawaysPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [config, giveaways, channels] = await Promise.all([
    prisma.giveawayConfig.findUnique({ where: { guildId } }),
    prisma.giveaway.findMany({ where: { guildId }, orderBy: { createdAt: "desc" }, take: 20 }),
    fetchGuildChannels(guildId),
  ]);
  const textChannels = channels.filter((c) => c.type === CHANNEL_TYPE.GuildText);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={sectionTitleClass}>Giveaway</h1>
        <p className={sectionDescriptionClass}>
          Avviali con <code>/giveaway start</code> su Discord: chi reagisce con 🎉 partecipa. Qui trovi lo storico.
        </p>
      </div>

      <div className={`${cardClass} p-6`}>
        <form
          key={config?.updatedAt.getTime() ?? 0}
          action={updateGiveawaySettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={labelClass}>
            Canale predefinito (usato se non ne specifichi uno nel comando)
            <ChannelSelect name="defaultChannelId" channels={textChannels} defaultValue={config?.defaultChannelId} />
          </label>
          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <h2 className="p-6 pb-0 text-base font-semibold">Giveaway recenti</h2>
        {giveaways.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nessun giveaway ancora avviato.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Premio</th>
                <th className="px-6 py-3 font-medium">Vincitori</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium">Termina</th>
              </tr>
            </thead>
            <tbody>
              {giveaways.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">{g.prize}</td>
                  <td className="px-6 py-3">{g.winnerCount}</td>
                  <td className="px-6 py-3">{g.ended ? "⚪ Concluso" : "🟢 In corso"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{g.endsAt.toLocaleString("it-IT")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
