import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@/lib/prisma";
import { updateLoggingSettings } from "@/actions/guild-config-actions";
import { CHANNEL_TYPE, fetchGuildChannels } from "@/lib/discord-guild-api";
import { ChannelSelect } from "@/components/discord-pickers";
import { buttonClass, cardClass, labelClass, sectionDescriptionClass, sectionTitleClass } from "@/lib/ui";

export default async function LoggingSettingsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [config, channels] = await Promise.all([
    prisma.guildConfig.findUnique({ where: { guildId } }),
    fetchGuildChannels(guildId),
  ]);
  const textChannels = channels.filter((c) => c.type === CHANNEL_TYPE.GuildText);

  return (
    <div>
      <h1 className={sectionTitleClass}>Log</h1>
      <p className={sectionDescriptionClass}>Canali dove Skyle invia i log. Lascia su &quot;nessuno&quot; per disattivare un log.</p>

      <div className={`${cardClass} mt-6 p-6`}>
        <form
          key={config?.updatedAt.getTime() ?? 0}
          action={updateLoggingSettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={labelClass}>
            Canale log moderazione
            <ChannelSelect name="modLogChannelId" channels={textChannels} defaultValue={config?.modLogChannelId} />
          </label>

          <label className={labelClass}>
            Canale log automod
            <ChannelSelect name="automodLogChannelId" channels={textChannels} defaultValue={config?.automodLogChannelId} />
          </label>

          <label className={labelClass}>
            Canale log anti-raid
            <ChannelSelect name="antiraidLogChannelId" channels={textChannels} defaultValue={config?.antiraidLogChannelId} />
          </label>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>
    </div>
  );
}
