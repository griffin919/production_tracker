<template>
  <div class="min-h-screen flex flex-col">
    <div
      class="flex justify-between p-4"
      @click="handleHome"
      style="cursor: pointer"
    >
      <div class="flex items-center">
        <span class="pr-2">
          <!-- <img
            class="mx-auto h-12 w-auto"
            src="../assets/images/nsuaborde_logo.png"
            style="width: 3rem; height: 3rem"
            alt="Workflow"
          /> -->

        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-column"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>

        <span class="text-2xl font-bold text-gray-800">PTracker</span>
      </div>
      <div></div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="js">
import { useRouter } from 'vue-router'

const router = useRouter()


const handleHome = () => {
  router.push('/')
}

const handleLogin = () => {
  router.push('/')
}
</script>
