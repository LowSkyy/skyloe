import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@/lib/prisma";
import { updateAntiraidSettings } from "@/actions/guild-config-actions";
import {
  buttonClass,
  cardClass,
  checkboxRowClass,
  inputClass,
  labelClass,
  sectionDescriptionClass,
  sectionTitleClass,
} from "@/lib/ui";

export default async function AntiraidSettingsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const settings = await prisma.antiraidSettings.findUnique({ where: { guildId } });

  return (
    <div>
      <h1 className={sectionTitleClass}>Anti-raid</h1>
      <p className={sectionDescriptionClass}>Protezione automatica contro ondate di ingressi sospetti.</p>

      <div className={`${cardClass} mt-6 p-6`}>
        <form
          key={settings?.updatedAt.getTime() ?? 0}
          action={updateAntiraidSettings.bind(null, guildId)}
          className="flex flex-col gap-5"
        >
          <label className={checkboxRowClass}>
            <input type="checkbox" name="enabled" defaultChecked={settings?.enabled ?? false} className="h-4 w-4" />
            Attiva anti-raid
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Ingressi che fanno scattare l&apos;allarme
              <input
                type="number"
                name="joinThreshold"
                defaultValue={settings?.joinThreshold ?? 10}
                min={2}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Finestra temporale (secondi)
              <input
                type="number"
                name="joinWindowSeconds"
                defaultValue={settings?.joinWindowSeconds ?? 30}
                min={5}
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Età minima account (minuti)
            <input
              type="number"
              name="minAccountAgeMinutes"
              defaultValue={settings?.minAccountAgeMinutes ?? 30}
              min={0}
              className={inputClass}
            />
            <span className="text-xs text-muted-foreground">
              Account più recenti di così vengono rimossi automaticamente all&apos;ingresso.
            </span>
          </label>

          <label className={labelClass}>
            Azione sugli account sospetti
            <select name="action" defaultValue={settings?.action ?? "KICK"} className={inputClass}>
              <option value="NONE">Nessuna (solo log)</option>
              <option value="KICK">Espelli</option>
              <option value="BAN">Banna</option>
            </select>
          </label>

          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              name="autoLockdown"
              defaultChecked={settings?.autoLockdown ?? true}
              className="h-4 w-4"
            />
            Blocca automaticamente il server quando viene rilevato un raid
          </label>

          <label className={labelClass}>
            Durata del blocco (minuti)
            <input
              type="number"
              name="lockdownMinutes"
              defaultValue={settings?.lockdownMinutes ?? 15}
              min={1}
              className={inputClass}
            />
          </label>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>
    </div>
  );
}
