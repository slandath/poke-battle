<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
</script>

<template>
  <header class="bg-blue-500 p-4 text-gray-100 text-shadow-md flex justify-between">
    <img src="/pokeball.svg" alt="Pokeball" class="h-10 w-10">
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger class="bg-blue-400 text-white mx-10 hover:cursor-pointer" aria-label="menu" />
          <NavigationMenuContent class="bg-blue-500 text-white">
            <ul class="grid w-35 gap-3 p-2">
              <li>
                <NavigationMenuLink as-child>
                  <RouterLink to="/battle" class="block hover:bg-blue-400 hover:text-white rounded px-2 py-1 transition-colors">
                    Battle
                  </RouterLink>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink as-child>
                  <RouterLink to="/" class="block hover:bg-blue-400 hover:text-white rounded px-2 py-1 transition-colors">
                    Search
                  </RouterLink>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink as-child>
                  <RouterLink to="/team" class="block hover:bg-blue-400 hover:text-white rounded px-2 py-1 transition-colors">
                    Team
                  </RouterLink>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </header>
</template>
