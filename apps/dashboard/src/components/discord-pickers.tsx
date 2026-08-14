import { inputClass } from "@/lib/ui";
import type { DiscordChannel, DiscordRole } from "@/lib/discord-guild-api";

const activeSummaryClass = "mt-1.5 flex flex-wrap gap-1.5 text-xs";
const chipClass = "rounded-full bg-accent/15 px-2 py-0.5 text-accent";
const emptyChipClass = "text-muted-foreground";

export function ChannelSelect({
  name,
  channels,
  defaultValue,
  emptyLabel = "— nessuno —",
}: {
  name: string;
  channels: DiscordChannel[];
  defaultValue?: string | null;
  emptyLabel?: string;
}) {
  const active = channels.find((channel) => channel.id === defaultValue);
  return (
    <div>
      <select name={name} defaultValue={defaultValue ?? ""} className={inputClass}>
        <option value="">{emptyLabel}</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            #{channel.name}
          </option>
        ))}
      </select>
      <p className={activeSummaryClass}>
        {active ? (
          <span className={chipClass}>#{active.name}</span>
        ) : (
          <span className={emptyChipClass}>Attivo ora: nessuno</span>
        )}
      </p>
    </div>
  );
}

export function RoleSelect({
  name,
  roles,
  defaultValue,
  emptyLabel = "— nessuno —",
}: {
  name: string;
  roles: DiscordRole[];
  defaultValue?: string | null;
  emptyLabel?: string;
}) {
  const active = roles.find((role) => role.id === defaultValue);
  return (
    <div>
      <select name={name} defaultValue={defaultValue ?? ""} className={inputClass}>
        <option value="">{emptyLabel}</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            @{role.name}
          </option>
        ))}
      </select>
      <p className={activeSummaryClass}>
        {active ? <span className={chipClass}>@{active.name}</span> : <span className={emptyChipClass}>Attivo ora: nessuno</span>}
      </p>
    </div>
  );
}

export function RoleMultiSelect({
  name,
  roles,
  defaultValues,
}: {
  name: string;
  roles: DiscordRole[];
  defaultValues: string[];
}) {
  const active = roles.filter((role) => defaultValues.includes(role.id));
  return (
    <div>
      <select name={name} multiple defaultValue={defaultValues} className={`${inputClass} h-32`}>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            @{role.name}
          </option>
        ))}
      </select>
      <p className={activeSummaryClass}>
        {active.length > 0 ? (
          active.map((role) => (
            <span key={role.id} className={chipClass}>
              @{role.name}
            </span>
          ))
        ) : (
          <span className={emptyChipClass}>Attivi ora: nessuno</span>
        )}
      </p>
    </div>
  );
}

export function ChannelMultiSelect({
  name,
  channels,
  defaultValues,
}: {
  name: string;
  channels: DiscordChannel[];
  defaultValues: string[];
}) {
  const active = channels.filter((channel) => defaultValues.includes(channel.id));
  return (
    <div>
      <select name={name} multiple defaultValue={defaultValues} className={`${inputClass} h-32`}>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            #{channel.name}
          </option>
        ))}
      </select>
      <p className={activeSummaryClass}>
        {active.length > 0 ? (
          active.map((channel) => (
            <span key={channel.id} className={chipClass}>
              #{channel.name}
            </span>
          ))
        ) : (
          <span className={emptyChipClass}>Attivi ora: nessuno</span>
        )}
      </p>
    </div>
  );
}
