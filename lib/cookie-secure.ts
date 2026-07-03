/** Cookies secure em produção; use COOKIE_SECURE=false com HTTP (sem domínio/SSL). */
export function shouldUseSecureCookies(): boolean {
  const override = process.env["COOKIE_SECURE"]?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.NODE_ENV === "production";
}
