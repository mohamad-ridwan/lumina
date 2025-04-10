<template>
  <div class="flex flex-col flex-1 bg-white text-[#6b7280] pb-6 px-5">
    <div class="text-sm text-zinc-500 mb-4">
      Search using username or last message.
    </div>
    <div class="flex flex-col items-center justify-center flex-1">
      <div class="text-5xl text-[#6b7280] mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-16 h-16">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-zinc-400">No results</h2>
      <p class="text-zinc-600 mt-2 text-center">
        We couldn't find any matches for your search.
      </p>
    </div>
  </div>
</template>

<script setup>
// No script needed for this static UI
</script>
