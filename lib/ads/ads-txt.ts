/**
 * El contenido de ads.txt. Formato (Google): `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
 * — sólo `pub-` y los 16 dígitos, sin el `ca-` del cliente.
 * `ADS_TXT_EXTRA` suma otras redes: una línea por renglón o separadas por `;`.
 */
export function textoAdsTxt(
  cliente = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '',
  extra = process.env.ADS_TXT_EXTRA ?? '',
): string {
  const lineas = ['# Brote — vendedores autorizados de publicidad (IAB ads.txt).'];
  const pub = /pub-\d{16}/.exec(cliente)?.[0];
  if (pub) lineas.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  else lineas.push('# Todavía no hay un publisher id de AdSense configurado.');
  for (const l of extra.split(/\r?\n|;/)) {
    const t = l.trim();
    // Una línea válida: dominio, id, DIRECT|RESELLER[, id de certificación]
    if (/^[a-z0-9.-]+\.[a-z]{2,},\s*[\w-]+,\s*(DIRECT|RESELLER)(,\s*[\w-]+)?$/i.test(t)) lineas.push(t);
  }
  return lineas.join('\n') + '\n';
}
