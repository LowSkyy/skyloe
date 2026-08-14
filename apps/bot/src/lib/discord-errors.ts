import { DiscordAPIError } from "discord.js";

/** Traduce gli errori più comuni dell'API Discord in un messaggio comprensibile per un moderatore. */
export function describeDiscordError(error: unknown): string {
  if (error instanceof DiscordAPIError) {
    switch (error.code) {
      case 50013:
        return "Permessi mancanti su Discord: il ruolo di Skyle non ha il permesso necessario, oppure è posizionato più in basso del ruolo dell'utente coinvolto. Controlla Impostazioni server → Ruoli.";
      case 50001:
        return "Skyle non ha accesso a questo canale o risorsa.";
      case 10007:
      case 10013:
        return "Utente non trovato in questo server.";
      case 10008:
        return "Messaggio non trovato (potrebbe essere già stato eliminato).";
      default:
        return `Errore Discord (codice ${error.code}): ${error.message}`;
    }
  }
  return "Si è verificato un errore imprevisto.";
}
