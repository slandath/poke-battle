import { authClient } from "~/utils/auth-client";

export function useAuth() {
  const session = authClient.useSession();
  const user = computed(() => session.value.data?.user ?? null);
  const isAuthenticated = computed(() => !!user.value);
  const isPending = computed(() => session.value.isPending);

  return {
    session,
    user,
    isAuthenticated,
    isPending,
    signIn: authClient.signIn,
    signUp: authClient.signUp,
    async signOut() {
      await authClient.signOut();
      await navigateTo("/");
    },
  };
}
