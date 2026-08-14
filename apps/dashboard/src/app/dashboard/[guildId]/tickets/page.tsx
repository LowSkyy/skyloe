import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@skyle/db";
import { updateTicketSettings } from "@/actions/ticket-actions";
import { CHANNEL_TYPE, fetchGuildChannels, fetchGuildRoles } from "@/lib/discord-guild-api";
import { ChannelSelect, RoleMultiSelect } from "@/components/discord-pickers";
import { buttonClass, cardClass, checkboxRowClass, labelClass, sectionDescriptionClass, sectionTitleClass } from "@/lib/ui";

const statusLabel: Record<string, string> = {
  OPEN: "🟢 Aperto",
  CLAIMED: "🟡 Preso in carico",
  CLOSED: "⚪ Chiuso",
};

export default async function TicketsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [config, tickets, channels, roles] = await Promise.all([
    prisma.ticketConfig.findUnique({ where: { guildId } }),
    prisma.ticket.findMany({ where: { guildId }, orderBy: { createdAt: "desc" }, take: 20 }),
    fetchGuildChannels(guildId),
    fetchGuildRoles(guildId),
  ]);
  const categories = channels.filter((c) => c.type === CHANNEL_TYPE.GuildCategory);
  const textChannels = channels.filter((c) => c.type === CHANNEL_TYPE.GuildText);
  const panelChannelName = config?.panelChannelId ? channels.find((c) => c.id === config.panelChannelId)?.name : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={sectionTitleClass}>Ticket</h1>
        <p className={sectionDescriptionClass}>
          Pubblica il pannello con <code>/ticket-panel</code> nel canale che preferisci: qui configuri come vengono creati e gestiti i
          ticket.
        </p>
      </div>

      <div className={`${cardClass} p-6`}>
        <form
          key={config?.updatedAt.getTime() ?? 0}
          action={updateTicketSettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={checkboxRowClass}>
            <input type="checkbox" name="enabled" defaultChecked={config?.enabled ?? false} className="h-4 w-4" />
            Attiva il sistema ticket
          </label>

          <label className={labelClass}>
            Categoria dove creare i canali ticket
            <ChannelSelect name="categoryId" channels={categories} defaultValue={config?.categoryId} />
          </label>

          <label className={labelClass}>
            Ruoli dello staff (ctrl/cmd+click per selezionarne più di uno)
            <RoleMultiSelect name="supportRoleIds" roles={roles} defaultValues={config?.supportRoleIds ?? []} />
          </label>

          <label className={labelClass}>
            Canale transcript (riepilogo alla chiusura, opzionale)
            <ChannelSelect name="transcriptChannelId" channels={textChannels} defaultValue={config?.transcriptChannelId} />
          </label>

          {panelChannelName && <p className="text-xs text-muted-foreground">Pannello attualmente pubblicato in #{panelChannelName}.</p>}

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <h2 className="p-6 pb-0 text-base font-semibold">Ticket recenti</h2>
        {tickets.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nessun ticket ancora aperto.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Aperto da</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium">Creato</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <code>{ticket.openerId}</code>
                  </td>
                  <td className="px-6 py-3">{statusLabel[ticket.status] ?? ticket.status}</td>
                  <td className="px-6 py-3 text-muted-foreground">{ticket.createdAt.toLocaleString("it-IT")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
