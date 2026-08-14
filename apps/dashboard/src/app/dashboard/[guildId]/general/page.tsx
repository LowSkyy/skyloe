import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@/lib/prisma";
import { updateGeneralSettings } from "@/actions/guild-config-actions";
import { buttonClass, cardClass, inputClass, labelClass, sectionDescriptionClass, sectionTitleClass } from "@/lib/ui";

export default async function GeneralSettingsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const { botGuild } = await requireGuildAccess(guildId);

  const config = await prisma.guildConfig.findUnique({ where: { guildId } });

  return (
    <div>
      <h1 className={sectionTitleClass}>Generale</h1>
      <p className={sectionDescriptionClass}>Impostazioni di base per {botGuild.name}.</p>

      <div className={`${cardClass} mt-6 p-6`}>
        <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">ID server</dt>
            <dd className="font-mono">{guildId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Skyle presente dal</dt>
            <dd>{botGuild.addedAt.toLocaleDateString("it-IT")}</dd>
          </div>
        </dl>

        <form
          key={config?.updatedAt.getTime() ?? 0}
          action={updateGeneralSettings.bind(null, guildId)}
          className="flex flex-col gap-4"
        >
          <label className={labelClass}>
            Lingua
            <select name="locale" defaultValue={config?.locale ?? "it"} className={inputClass}>
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </label>

          <button type="submit" className={`${buttonClass()} self-start`}>
            Salva
          </button>
        </form>
      </div>
    </div>
  );
}
