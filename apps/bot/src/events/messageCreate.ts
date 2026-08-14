import type { SkyleClient } from "../types";
import { runAutomod } from "../modules/automod";
import { runLeveling } from "../modules/leveling";

export function registerMessageCreate(client: SkyleClient) {
  client.on("messageCreate", async (message) => {
    let deleted = false;
    try {
      deleted = await runAutomod(message);
    } catch (error) {
      console.error("Errore automod:", error);
    }

    if (deleted) return;

    try {
      await runLeveling(message);
    } catch (error) {
      console.error("Errore leveling:", error);
    }
  });
}
