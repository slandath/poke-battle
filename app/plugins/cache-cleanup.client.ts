import { pokemonCache } from "~/utils/cache";

export default defineNuxtPlugin(() => {
  pokemonCache.cleanup();
});
