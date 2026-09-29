// Origem da entrada (link do Reel /c/:palavra). Guardada na sessão até a pessoa criar conta e abrir a comunidade.
const KEY = "jotadev.campaign";

export function saveCampaign(campaign) {
  try { sessionStorage.setItem(KEY, JSON.stringify(campaign)); } catch { /* sem armazenamento: a entrada conta como direta */ }
}

export function readCampaign() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function clearCampaign() {
  try { sessionStorage.removeItem(KEY); } catch { /* sem armazenamento */ }
}
