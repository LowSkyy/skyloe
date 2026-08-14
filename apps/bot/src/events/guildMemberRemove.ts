import type { SkyleClient } from "../types";
import { sendLeaveMessage } from "../modules/welcome";

export function registerGuildMemberRemove(client: SkyleClient) {
  client.on("guildMemberRemove", async (member) => {
    try {
      await sendLeaveMessage(member);
    } catch (error) {
      console.error("Errore messaggio di addio:", error);
    }
  });
}
