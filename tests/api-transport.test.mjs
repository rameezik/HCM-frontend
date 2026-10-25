import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { backendApiUrl, proxyApi } from "../lib/server-api-proxy.js";
import { readApiResponse } from "../lib/api.js";

// Protocol-only fixtures exercise failure/cookie/download transport. Business
// workflows are tested separately against actual Express and isolated MongoDB.
async function protocolServer(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("backend configuration supports runtime origin, /api and legacy public alias without duplicate /api", () => {
  assert.equal(backendApiUrl({}), "http://127.0.0.1:4000/api");
  assert.equal(
    backendApiUrl({ API_INTERNAL_URL: "http://localhost:4000/api/" }),
    "http://localhost:4000/api",
  );
  assert.equal(
    backendApiUrl({ NEXT_PUBLIC_API_URL: "http://localhost:4000/api" }),
    "http://localhost:4000/api",
  );
  assert.equal(
    backendApiUrl({
      API_INTERNAL_URL: "https://backend.example.test",
      NEXT_PUBLIC_API_URL: "http://localhost:4000/api",
    }),
    "https://backend.example.test/api",
  );
  for (const value of [
    "file:///tmp/api",
    "https://user:secret@example.test",
    "https://example.test/other",
    "https://example.test?token=secret",
  ]) {
    assert.throws(() => backendApiUrl({ API_INTERNAL_URL: value }));
  }
});

test("real HTTP transport preserves method, JSON, query, authentication cookies and multiple session cookies", async (t) => {
  let received;
  const origin = await protocolServer(t, async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    received = { method: req.method, url: req.url, headers: req.headers, body };
    res.writeHead(201, {
      "Content-Type": "application/json",
      "Set-Cookie": [
        "hcm_session=transport-only; HttpOnly; SameSite=Lax; Path=/",
        "transport_extra=1; Path=/",
      ],
    });
    res.end(JSON.stringify({ protocol: "received" }));
  });
  const response = await proxyApi(
    new Request("http://frontend.example.test/api/auth/register?check=one", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "hcm_session=transport-only",
        Origin: "http://frontend.example.test",
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify({ transport: true }),
    }),
    ["auth", "register"],
    { API_INTERNAL_URL: `${origin}/api` },
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await readApiResponse(response), { protocol: "received" });
  assert.equal(received.url, "/api/auth/register?check=one");
  assert.equal(received.method, "POST");
  assert.equal(received.body, '{"transport":true}');
  assert.equal(received.headers.cookie, "hcm_session=transport-only");
  assert.equal(received.headers.origin, "http://frontend.example.test");
  assert.equal(received.headers["x-forwarded-proto"], "http");
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.match(response.headers.getSetCookie()[0], /HttpOnly/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("normal JSON session401 retains authentication semantics", async (t) => {
  const origin = await protocolServer(t, (req, res) => {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end('{"message":"Sign in to continue."}');
  });
  const response = await proxyApi(
    new Request("http://frontend.example.test/api/auth/me"),
    ["auth", "me"],
    { API_INTERNAL_URL: origin },
  );
  await assert.rejects(
    readApiResponse(response),
    (error) => error.status === 401 && error.message === "Sign in to continue.",
  );
});

test("CSV and PDF download bytes and filenames survive the same-origin proxy", async (t) => {
  const origin = await protocolServer(t, (req, res) => {
    const csv = req.url.endsWith("/export");
    res.writeHead(200, {
      "Content-Type": csv ? "text/csv; charset=utf-8" : "application/pdf",
      "Content-Disposition": csv
        ? "attachment; filename=employees.csv"
        : "attachment; filename=payslip.pdf",
    });
    res.end(csv ? "transport-header\n" : "%PDF-transport-fixture");
  });
  for (const [parts, expected] of [
    [["employees", "export"], "transport-header\n"],
    [["payroll", "id", "payslip", "employee"], "%PDF-transport-fixture"],
  ]) {
    const response = await proxyApi(
      new Request(`http://frontend.example.test/api/${parts.join("/")}`),
      parts,
      { API_INTERNAL_URL: origin },
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-disposition"), /attachment/);
    assert.equal(await response.text(), expected);
  }
});

test("real connection refusal and non-JSON upstream failures return explicit JSON diagnostics", async (t) => {
  const temporary = createServer();
  await new Promise((resolve) => temporary.listen(0, "127.0.0.1", resolve));
  const closedPort = temporary.address().port;
  await new Promise((resolve) => temporary.close(resolve));
  const unavailable = await proxyApi(
    new Request("http://frontend.example.test/api/auth/me"),
    ["auth", "me"],
    { API_INTERNAL_URL: `http://127.0.0.1:${closedPort}` },
  );
  assert.equal(unavailable.status, 502);
  assert.equal((await unavailable.json()).code, "API_BACKEND_UNAVAILABLE");
  const origin = await protocolServer(t, (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html>Wrong deployment target</html>");
  });
  const wrongTarget = await proxyApi(
    new Request("http://frontend.example.test/api/auth/me"),
    ["auth", "me"],
    { API_INTERNAL_URL: origin },
  );
  assert.equal(wrongTarget.status, 502);
  assert.equal(
    (await wrongTarget.json()).code,
    "API_INVALID_UPSTREAM_RESPONSE",
  );
  const badConfig = await proxyApi(
    new Request("http://frontend.example.test/api/auth/me"),
    ["auth", "me"],
    { API_INTERNAL_URL: "https://user:secret@example.test" },
  );
  assert.equal(badConfig.status, 503);
  assert.equal((await badConfig.text()).includes("secret"), false);
});

test("proxy rejects traversal and oversized requests before backend access", async () => {
  const invalid = await proxyApi(
    new Request("http://frontend.example.test/api/invalid"),
    ["..", "auth"],
    {},
  );
  assert.equal(invalid.status, 400);
  const oversized = await proxyApi(
    new Request("http://frontend.example.test/api/oversized", {
      method: "POST",
      body: "x".repeat(1048577),
    }),
    ["oversized"],
    {},
  );
  assert.equal(oversized.status, 413);
});

test("client rejects malformed/non-JSON successes and distinguishes structured API errors", async () => {
  await assert.rejects(
    readApiResponse(
      new Response("<html>not API</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    ),
    (error) => error.status === 502 && error.code === "API_INVALID_RESPONSE",
  );
  await assert.rejects(
    readApiResponse(
      new Response("{broken", {
        headers: { "Content-Type": "application/json" },
      }),
    ),
    (error) => error.status === 502 && error.code === "API_INVALID_RESPONSE",
  );
  await assert.rejects(
    readApiResponse(
      Response.json(
        {
          message: "Configure the optional feature.",
          code: "AI_NOT_CONFIGURED",
          details: "not an array",
        },
        { status: 503 },
      ),
    ),
    (error) => error.status === 503 && error.code === "AI_NOT_CONFIGURED",
  );
  assert.equal(
    await readApiResponse(new Response(null, { status: 204 })),
    null,
  );
});

test("private employee JPEGs pass only through authenticated photo paths, with no caching or SVG passthrough", async (t) => {
  const bytes = Buffer.from([255, 216, 255, 224, 0, 2, 255, 217]);
  const origin = await protocolServer(t, (req, res) => {
    res.writeHead(200, {
      "Content-Type": req.url.includes("svg=1")
        ? "image/svg+xml"
        : "image/jpeg",
    });
    res.end(bytes);
  });
  const parts = ["employees", "a".repeat(24), "photo"];
  const image = await proxyApi(
    new Request("http://frontend.example.test/api/" + parts.join("/"), {
      headers: { Cookie: "hcm_session=transport-only" },
    }),
    parts,
    { API_INTERNAL_URL: origin },
  );
  assert.equal(image.status, 200);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
  assert.equal(image.headers.get("cache-control"), "no-store");
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
  const wrongPath = await proxyApi(
    new Request("http://frontend.example.test/api/employees/image"),
    ["employees", "image"],
    { API_INTERNAL_URL: origin },
  );
  assert.equal(wrongPath.status, 502);
  const svg = await proxyApi(
    new Request(
      "http://frontend.example.test/api/" + parts.join("/") + "?svg=1",
    ),
    parts,
    { API_INTERNAL_URL: origin },
  );
  assert.equal(svg.status, 502);
});
