import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands";

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    throw new Error("DISCORD_TOKEN e DISCORD_CLIENT_ID sono obbligatori in apps/bot/.env");
  }

  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    console.log(`Registrati ${body.length} comandi sul server di test ${guildId} (disponibili subito).`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(`Registrati ${body.length} comandi globalmente (possono richiedere fino a un'ora per propagarsi).`);
  }
}

main().catch((error) => {
  console.error("Registrazione comandi fallita:", error);
  process.exit(1);
});
