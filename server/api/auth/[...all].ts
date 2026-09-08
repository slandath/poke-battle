import { getAuth } from "../../utils/auth";

export default defineEventHandler((event) => {
  const auth = getAuth();
  if (!auth) throw createError({ statusCode: 500, message: "Auth not initialized" });
  // better-auth expects web Request
  return auth.handler(toWebRequest(event));
});
