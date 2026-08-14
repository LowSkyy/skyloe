import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@/lib/prisma";
import { updateAutomodSettings } from "@/actions/guild-config-actions";
import { CHANNEL_TYPE, fetchGuildChannels, fetchGuildRoles } from "@/lib/discord-guild-api";
import { ChannelMultiSelect, RoleMultiSelect } from "@/components/discord-pickers";
import {
  buttonClass,
  cardClass,
  checkboxRowClass,
  inputClass,
  labelClass,
  sectionDescriptionClass,
  sectionTitleClass,
} from "@/lib/ui";

export default async function AutomodSettingsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [rule, roles, channels] = await Promise.all([
    prisma.automodRule.findUnique({ where: { guildId } }),
    fetchGuildRoles(guildId),
    fetchGuildChannels(guildId),
  ]);
  const textChannels = channels.filter((c) => c.type === CHANNEL_TYPE.GuildText);

  return (
    <div>
      <h1 className={sectionTitleClass}>Automod</h1>
      <p className={sectionDescriptionClass}>Filtri automatici sui messaggi del server.</p>

      <div className={`${cardClass} mt-6 p-6`}>
        <form
          key={rule?.updatedAt.getTime() ?? 0}
          action={updateAutomodSettings.bind(null, guildId)}
          className="flex flex-col gap-5"
        >
          <label className={checkboxRowClass}>
            <input type="checkbox" name="enabled" defaultChecked={rule?.enabled ?? false} className="h-4 w-4" />
            Attiva automod
          </label>

          <label className={labelClass}>
            Parole vietate (separate da virgola)
            <textarea
              name="bannedWords"
              defaultValue={rule?.bannedWords.join(", ") ?? ""}
              rows={3}
              placeholder="parola1, parola2"
              className={inputClass}
            />
          </label>

          <label className={checkboxRowClass}>
            <input type="checkbox" name="blockInvites" defaultChecked={rule?.blockInvites ?? false} className="h-4 w-4" />
            Blocca inviti Discord non autorizzati
          </label>

          <label className={labelClass}>
            Codici invito consentiti (es. server partner)
            <input
              name="allowedInviteCodes"
              defaultValue={rule?.allowedInviteCodes.join(", ") ?? ""}
              placeholder="abc123, xyz789"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-3 gap-4">
            <label className={labelClass}>
              Menzioni massime
              <input
                type="number"
                name="maxMentions"
                defaultValue={rule?.maxMentions ?? 5}
                min={1}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              % maiuscole massima
              <input
                type="number"
                name="maxCapsPercent"
                defaultValue={rule?.maxCapsPercent ?? 70}
                min={1}
                max={100}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Lunghezza minima per il controllo
              <input
                type="number"
                name="minLengthForCaps"
                defaultValue={rule?.minLengthForCaps ?? 10}
                min={1}
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Azione quando viene rilevata una violazione
            <select name="action" defaultValue={rule?.action ?? "DELETE"} className={inputClass}>
              <option value="DELETE">Elimina solo il messaggio</option>
              <option value="WARN">Elimina e avverti l&apos;utente</option>
              <option value="TIMEOUT">Elimina e silenzia l&apos;utente</option>
            </select>
          </label>

          <label className={labelClass}>
            Durata timeout (minuti, se l&apos;azione è &quot;silenzia&quot;)
            <input
              type="number"
              name="timeoutMinutes"
              defaultValue={rule?.timeoutMinutes ?? 10}
              min={1}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Ruoli esentati (ctrl/cmd+click per selezionarne più di uno)
              <RoleMultiSelect name="exemptRoleIds" roles={roles} defaultValues={rule?.exemptRoleIds ?? []} />
            </label>
            <label className={labelClass}>
              Canali esentati (ctrl/cmd+click per selezionarne più di uno)
              <ChannelMultiSelect name="exemptChannelIds" channels={textChannels} defaultValues={rule?.exemptChannelIds ?? []} />
            </label>
          </div>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>
    </div>
  );
}
