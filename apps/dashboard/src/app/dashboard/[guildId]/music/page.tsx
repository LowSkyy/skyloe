import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@skyle/db";
import { updateMusicSettings } from "@/actions/music-actions";
import { CHANNEL_TYPE, fetchGuildChannels, fetchGuildRoles } from "@/lib/discord-guild-api";
import { ChannelSelect, RoleMultiSelect } from "@/components/discord-pickers";
import { buttonClass, cardClass, checkboxRowClass, inputClass, labelClass, sectionDescriptionClass, sectionTitleClass } from "@/lib/ui";

export default async function MusicPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [settings, channels, roles] = await Promise.all([
    prisma.musicSettings.findUnique({ where: { guildId } }),
    fetchGuildChannels(guildId),
    fetchGuildRoles(guildId),
  ]);
  const voiceChannels = channels.filter((c) => c.type === CHANNEL_TYPE.GuildVoice);

  return (
    <div>
      <h1 className={sectionTitleClass}>Musica</h1>
      <p className={sectionDescriptionClass}>
        Riproduzione con <code>/play</code> (ricerca, link YouTube o Spotify), <code>/queue</code>, <code>/skip</code> e gli altri
        comandi su Discord. Qui configuri chi può controllarla e come si comporta.
      </p>

      <div className={`${cardClass} mt-6 p-6`}>
        <form
          key={settings?.updatedAt.getTime() ?? 0}
          action={updateMusicSettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={labelClass}>
            Ruoli DJ (possono usare skip/stop/pause/volume — nessuno selezionato = aperto a tutti; ctrl/cmd+click per
            selezionarne più di uno)
            <RoleMultiSelect name="djRoleIds" roles={roles} defaultValues={settings?.djRoleIds ?? []} />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Volume predefinito (%)
              <input
                type="number"
                name="defaultVolume"
                defaultValue={settings?.defaultVolume ?? 80}
                min={0}
                max={100}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Coda massima (brani)
              <input
                type="number"
                name="maxQueueSize"
                defaultValue={settings?.maxQueueSize ?? 200}
                min={1}
                className={inputClass}
              />
            </label>
          </div>

          <label className={checkboxRowClass}>
            <input type="checkbox" name="stay247" defaultChecked={settings?.stay247 ?? false} className="h-4 w-4" />
            Modalità 24/7 (Skyle resta in vocale anche a coda vuota)
          </label>

          <label className={labelClass}>
            Canale vocale per la modalità 24/7 (facoltativo, promemoria)
            <ChannelSelect name="stay247ChannelId" channels={voiceChannels} defaultValue={settings?.stay247ChannelId} />
          </label>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>
    </div>
  );
}
