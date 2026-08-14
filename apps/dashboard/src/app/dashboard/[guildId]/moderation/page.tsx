import { requireGuildAccess } from "@/lib/require-guild-access";
import { prisma } from "@/lib/prisma";
import { cardClass, sectionDescriptionClass, sectionTitleClass } from "@/lib/ui";

const typeLabel: Record<string, string> = {
  BAN: "🔨 Ban",
  KICK: "👢 Kick",
  TIMEOUT: "⏱️ Timeout",
  WARN: "⚠️ Warn",
  UNBAN: "✅ Unban",
  UNTIMEOUT: "✅ Rimosso timeout",
};

export default async function ModerationPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const cases = await prisma.moderationCase.findMany({
    where: { guildId },
    orderBy: { caseNumber: "desc" },
    take: 25,
  });

  return (
    <div>
      <h1 className={sectionTitleClass}>Moderazione</h1>
      <p className={sectionDescriptionClass}>
        Le azioni di moderazione si eseguono con i comandi <code>/ban</code>, <code>/kick</code>, <code>/timeout</code>,{" "}
        <code>/warn</code> e <code>/purge</code> su Discord. Qui trovi lo storico dei casi. Configura il canale di log
        nella sezione &quot;Log&quot;.
      </p>

      <div className={`${cardClass} mt-6 overflow-hidden`}>
        {cases.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nessun caso di moderazione ancora registrato.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Caso</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Utente</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">#{c.caseNumber}</td>
                  <td className="px-4 py-3">{typeLabel[c.type] ?? c.type}</td>
                  <td className="px-4 py-3">{c.targetTag}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.createdAt.toLocaleDateString("it-IT")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
