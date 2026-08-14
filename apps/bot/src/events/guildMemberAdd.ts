import type { SkyleClient } from "../types";
import { runAntiraid } from "../modules/antiraid";
import { sendWelcomeMessage } from "../modules/welcome";

export function registerGuildMemberAdd(client: SkyleClient) {
  client.on("guildMemberAdd", async (member) => {
    let removed = false;
    try {
      removed = await runAntiraid(member);
    } catch (error) {
      console.error("Errore anti-raid:", error);
    }

    if (removed) return;

    try {
      await sendWelcomeMessage(member);
    } catch (error) {
      console.error("Errore messaggio di benvenuto:", error);
    }
  });
}
