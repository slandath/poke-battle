import { getAuth } from "../../utils/auth";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";

export default defineEventHandler((event) => {
  try {
    const auth = getAuth();
    return auth.handler(toWebRequest(event));
  } catch (err: unknown) {
    return rethrowHttpOrUnavailable(err);
  }
});
