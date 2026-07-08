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
    <h1 class="text-4xl">
      Pokemon Battle Tool
    </h1>
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger class="bg-blue-400 text-white mx-5">
            Menu
          </NavigationMenuTrigger>
          <NavigationMenuContent class="bg-blue-500 text-white">
            <ul class="grid w-35 gap-3 p-2">
              <li>
                <NavigationMenuLink as-child>
                  <a href="#" class="block hover:bg-blue-400 hover:text-white rounded px-2 py-1 transition-colors">Team</a>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink as-child>
                  <a href="#" class="block hover:bg-blue-400 hover:text-white rounded px-2 py-1 transition-colors">Battle Tool</a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </header>
</template>
