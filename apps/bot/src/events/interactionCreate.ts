import type { SkyleClient } from "../types";
import { describeDiscordError } from "../lib/discord-errors";
import { openTicket, closeTicket } from "../modules/tickets";

export function registerInteractionCreate(client: SkyleClient) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId === "ticket:open") {
          await openTicket(interaction);
        } else if (interaction.customId === "ticket:close") {
          await closeTicket(interaction);
        }
      }
    } catch (error) {
      const label = interaction.isChatInputCommand() ? interaction.commandName : "componente";
      console.error(`Errore nell'interazione (${label}):`, error);
      const payload = { content: describeDiscordError(error), ephemeral: true } as const;
      if (interaction.isRepliable() && (interaction.replied || interaction.deferred)) {
        await interaction.followUp(payload).catch(() => null);
      } else if (interaction.isRepliable()) {
        await interaction.reply(payload).catch(() => null);
      }
    }
  });
}
