export function json(
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const code =
    message === 'UNAUTHORIZED'
      ? 401
      : message === 'FORBIDDEN'
        ? 403
        : message === 'TOO_LARGE'
          ? 413
          : message === 'RATE_LIMIT'
            ? 429
            : message === 'INVALID_INPUT'
              ? 400
              : 503;
  return json({ error: code === 503 ? 'SERVICE_UNAVAILABLE' : message }, code);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const requestUrl = new URL(request.url);
  const host = request.headers.get('host') ?? requestUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':','');
  if (origin !== `${protocol}://${host}` && origin !== process.env.NEXT_PUBLIC_SITE_URL)
    throw new Error('FORBIDDEN');
}
export async function boundedBody(request: Request, max = 16000) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new Error('TOO_LARGE');
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
export async function readJson(
  request: Request,
  max = 16000,
): Promise<unknown> {
  try {
    return JSON.parse(
      new TextDecoder().decode(await boundedBody(request, max)),
    );
  } catch (e) {
    if (e instanceof Error && e.message === 'TOO_LARGE') throw e;
    throw new Error('INVALID_INPUT');
  }
}
export async function device(request: Request) {
  const existing = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('ck-device='))
    ?.slice(10);
  const value =
    existing && /^[0-9a-f-]{36}$/.test(existing)
      ? existing
      : crypto.randomUUID();
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  const hash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  return {
    hash,
    cookie: `ck-device=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
  };
}
