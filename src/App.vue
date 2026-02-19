<script setup lang="ts">
import { ref, onMounted } from 'vue';

const username = ref<string | null>(null);
const isLoggedIn = ref(false);

onMounted(async () => {
  const res = await fetch('/api/check-auth-status');
  const data = await res.json();
  if (data.loggedIn) {
    isLoggedIn.value = true;
    username.value = data.username;
  }
});
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Main Navigation / Header -->
    <header class="navbar bg-base-100 shadow-lg px-4 md:px-8">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl font-bold text-pokemon-blue" href="/">Poké Dash</a>
      </div>
      <div class="flex-none gap-2">
        <ul class="menu menu-horizontal px-1 hidden md:flex">
          <li><a href="/">Rankings</a></li>
          <li v-if="isLoggedIn"><a href="/me">My Profile</a></li>
        </ul>
        
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-primary" v-if="!isLoggedIn">
            <a href="/login.html">Login</a>
          </label>
          <div v-else class="flex items-center gap-4">
            <span class="font-medium hidden sm:inline">{{ username }}</span>
            <div class="avatar placeholder" @click="">
              <div class="bg-neutral text-neutral-content rounded-full w-10">
                <span>{{ username?.[0].toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="p-4 md:p-8 max-w-7xl mx-auto">
      <div class="alert alert-info shadow-lg mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>UI Revamp in progress! We are moving to a unified Tailwind system.</span>
      </div>

      <!-- This is where the specific page content will be injected -->
      <slot>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Placeholder for Rankings -->
          <div class="card bg-base-100 shadow-xl overflow-hidden">
            <div class="card-body">
              <h2 class="card-title">Top Pokémon</h2>
              <p>Loading ranking data...</p>
            </div>
          </div>
        </div>
      </slot>
    </main>
  </div>
</template>

<style>
/* App-wide styles */
</style>
