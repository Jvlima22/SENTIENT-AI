export function safeReturnTo(value, fallback = "/") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\\\r\n]/.test(value) ? value : fallback;
}
// Navegadores embutidos (Instagram, Facebook, TikTok): o Google recusa login neles.
export function isInAppBrowser() {
  return typeof navigator !== "undefined" && /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance/i.test(navigator.userAgent || "");
}
export function rememberAuthReturn(value) { sessionStorage.setItem("sentient.authReturn", safeReturnTo(value, "/conta")); }
export function consumeAuthReturn(fallback) {
  const value = sessionStorage.getItem("sentient.authReturn");
  sessionStorage.removeItem("sentient.authReturn");
  return safeReturnTo(value, fallback);
}
