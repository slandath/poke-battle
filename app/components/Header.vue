<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";

const { user, isAuthenticated, isPending, signOut } = useAuth();
</script>

<template>
  <header class="flex items-center justify-between bg-blue-500 p-4 text-gray-100 text-shadow-md">
    <img src="/pokeball.svg" alt="Pokeball" class="h-10 w-10" />
    <div class="flex items-center gap-4">
      <div v-if="!isPending" class="text-sm">
        <NuxtLink
          v-if="!isAuthenticated"
          to="/login"
          class="rounded px-2 py-1 transition-colors hover:bg-blue-400"
        >
          Sign in
        </NuxtLink>
        <div v-else class="flex items-center gap-2">
          <span>{{ user?.name }}</span>
          <button
            type="button"
            class="rounded px-2 py-1 transition-colors hover:cursor-pointer hover:bg-blue-400"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              class="mx-10 bg-blue-400 text-white hover:cursor-pointer"
              aria-label="menu"
            />
            <NavigationMenuContent class="bg-blue-500 text-white">
              <ul class="grid w-35 gap-3 p-2">
                <li>
                  <NavigationMenuLink as-child>
                    <NuxtLink
                      to="/battle"
                      class="block rounded px-2 py-1 transition-colors hover:bg-blue-400 hover:text-white"
                    >
                      Battle
                    </NuxtLink>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink as-child>
                    <NuxtLink
                      to="/"
                      class="block rounded px-2 py-1 transition-colors hover:bg-blue-400 hover:text-white"
                    >
                      Search
                    </NuxtLink>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink as-child>
                    <NuxtLink
                      to="/team"
                      class="block rounded px-2 py-1 transition-colors hover:bg-blue-400 hover:text-white"
                    >
                      Team
                    </NuxtLink>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  </header>
</template>
