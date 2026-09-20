<script setup lang="ts">
import type { Message } from "#shared/types/message";
import { authClient } from "~/utils/auth-client";

useHead({ title: "Sign in - Pokemon Tools" });

const { isAuthenticated } = useAuth();

watch(
  isAuthenticated,
  (signedIn) => {
    if (signedIn) void navigateTo("/");
  },
  { immediate: true },
);

const mode = ref<"signin" | "signup">("signin");
const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const message = ref<Message | null>(null);

async function handleEmail() {
  if (!email.value.trim() || !password.value) return;
  loading.value = true;
  message.value = null;
  try {
    if (mode.value === "signup") {
      const { error } = await authClient.signUp.email({
        name: name.value.trim() || email.value.split("@")[0] || "Trainer",
        email: email.value.trim(),
        password: password.value,
        callbackURL: "/",
      });
      if (error) {
        message.value = { success: false, title: error.message || "Sign up failed" };
        return;
      }
    } else {
      const { error } = await authClient.signIn.email({
        email: email.value.trim(),
        password: password.value,
        callbackURL: "/",
      });
      if (error) {
        message.value = { success: false, title: error.message || "Sign in failed" };
        return;
      }
    }
    await navigateTo("/");
  } catch (err) {
    message.value = {
      success: false,
      title: err instanceof Error ? err.message : "Authentication failed",
    };
  } finally {
    loading.value = false;
  }
}

async function handleGitHub() {
  loading.value = true;
  message.value = null;
  try {
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
    if (error) {
      message.value = { success: false, title: error.message || "GitHub sign in failed" };
      loading.value = false;
      return;
    }
  } catch (err) {
    message.value = {
      success: false,
      title: err instanceof Error ? err.message : "GitHub sign in failed",
    };
    loading.value = false;
  }
}
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">{{ mode === "signin" ? "Sign in" : "Sign up" }}</h1>
    <main class="flex-1 p-4">
      <div class="mx-auto w-full max-w-xs space-y-4">
        <MessageWrapper
          v-if="message && !message.success"
          :message="message"
          variant="destructive"
          show-description
          class="bg-red-200"
        />
        <Button
          class="w-full bg-blue-500 hover:cursor-pointer"
          :disabled="loading"
          @click="handleGitHub"
        >
          Continue with GitHub
        </Button>
        <p class="text-center text-sm text-gray-500">or</p>
        <form class="space-y-3" @submit.prevent="handleEmail">
          <div v-if="mode === 'signup'" class="space-y-1">
            <Label for="name">Name</Label>
            <Input id="name" v-model="name" type="text" name="name" placeholder="Trainer name" />
          </div>
          <div class="space-y-1">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" name="email" placeholder="Email" />
          </div>
          <div class="space-y-1">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              name="password"
              placeholder="Password"
            />
          </div>
          <Button type="submit" class="w-full bg-blue-500 hover:cursor-pointer" :disabled="loading">
            {{ mode === "signin" ? "Sign in" : "Create account" }}
          </Button>
        </form>
        <button
          type="button"
          class="w-full text-sm text-blue-600 hover:cursor-pointer hover:underline"
          @click="mode = mode === 'signin' ? 'signup' : 'signin'"
        >
          {{ mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in" }}
        </button>
      </div>
    </main>
  </div>
</template>
