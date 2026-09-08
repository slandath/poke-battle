<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
</script>

<template>
  <header class="flex justify-between bg-blue-500 p-4 text-gray-100 text-shadow-md">
    <img src="/pokeball.svg" alt="Pokeball" class="h-10 w-10" />
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
  </header>
</template>
