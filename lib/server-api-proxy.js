// Server-only transport. The browser never receives internal addresses or secrets.
export function backendApiUrl(env = process.env) {
  const configured =
    env.API_INTERNAL_URL?.trim() ||
    env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://127.0.0.1:4000";
  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["", "/", "/api", "/api/"].includes(url.pathname)
  ) {
    throw new Error(
      "Set API_INTERNAL_URL to the backend HTTP(S) origin or its /api URL, without credentials, query parameters or fragments.",
    );
  }
  return `${url.origin}/api`;
}

const failure = (status, code, message) =>
  Response.json(
    { code, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function proxyApi(request, parts, env = process.env) {
  let base;
  try {
    base = backendApiUrl(env);
  } catch {
    return failure(
      503,
      "API_CONFIGURATION_ERROR",
      "The backend address is not configured correctly. Set API_INTERNAL_URL on the frontend server.",
    );
  }
  if (
    !parts?.length ||
    parts.some(
      (part) =>
        !part || part === "." || part === ".." || /[\\/\u0000]/.test(part),
    )
  ) {
    return failure(400, "API_INVALID_PATH", "Invalid API endpoint.");
  }
  const incoming = new URL(request.url);
  const target = `${base}/${parts.map(encodeURIComponent).join("/")}${incoming.search}`;
  const headers = new Headers();
  for (const name of [
    "accept",
    "content-type",
    "authorization",
    "cookie",
    "origin",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Use the request URL supplied by Next, rather than copying arbitrary client
  // forwarding headers. Configure the actual trusted ingress proxy in production.
  headers.set("x-forwarded-proto", incoming.protocol.slice(0, -1));
  let body;
  if (!["GET", "HEAD"].includes(request.method) && request.body) {
    const reader = request.body.getReader(),
      chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1048576) {
        await reader.cancel();
        return failure(
          413,
          "API_BODY_TOO_LARGE",
          "The request exceeds the API's 1 MiB limit.",
        );
      }
      chunks.push(value);
    }
    body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }
  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(90000)]),
    });
  } catch (error) {
    const timeout = error.name === "TimeoutError";
    return failure(
      timeout ? 504 : 502,
      timeout ? "API_TIMEOUT" : "API_BACKEND_UNAVAILABLE",
      timeout
        ? "The backend request timed out. Check whether your change was saved before retrying."
        : "The backend API could not be reached. Start the backend or check API_INTERNAL_URL on the frontend server.",
    );
  } finally {
    body?.fill(0);
  }
  const type = upstream.headers.get("content-type") || "";
  const json = /\bapplication\/(?:[\w.-]+\+)?json\b/i.test(type);
  const download =
    upstream.ok && /^(?:application\/pdf|text\/csv)\b/i.test(type);
  if (
    upstream.status !== 204 &&
    request.method !== "HEAD" &&
    !json &&
    !download
  ) {
    await upstream.body?.cancel();
    return failure(
      502,
      "API_INVALID_UPSTREAM_RESPONSE",
      "The configured backend did not return an API response. Check API_INTERNAL_URL and that Express is running.",
    );
  }
  const outgoing = new Headers({ "Cache-Control": "no-store" });
  for (const name of [
    "content-type",
    "content-disposition",
    "retry-after",
    "ratelimit",
    "ratelimit-policy",
  ]) {
    const value = upstream.headers.get(name);
    if (value) outgoing.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie())
    outgoing.append("set-cookie", cookie);
  return new Response(
    request.method === "HEAD" || upstream.status === 204 ? null : upstream.body,
    { status: upstream.status, headers: outgoing },
  );
}
