<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen flex-col text-center bg-gray-300">
    <header class="bg-red-500 p-4">
      <h1 class="text-3xl">
        Pokemon Battle Tool
      </h1>
      <p>Find your opponent's pokemon and view the best type match-ups.</p>
    </header>
    <main class="flex-1 p-4">
      <div>
        <label for="pokemon"> Pokemon Name </label>
      </div>
      <div>
        <input id="pokemon" type="text" class="p-1 border">
      </div>
      <article class="bg-yellow-500 p-4 mt-4">
        <p>Pokemon Name</p>
        <p>Pokemon Generation</p>
        <p>Pokemon Type</p>
        <p>Double Damage</p>
        <p>Half Damage</p>
        <p>Zero Damage</p>
      </article>
    </main>
    <footer class="bg-purple-500 p-4">
      Footer
    </footer>
  </div>
</template>
