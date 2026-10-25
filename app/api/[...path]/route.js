import { proxyApi } from "@/lib/server-api-proxy";
export const maxDuration = 90;

async function handle(request, context) {
  const { path } = await context.params;
  return proxyApi(request, path);
}

export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as PUT,
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
};
