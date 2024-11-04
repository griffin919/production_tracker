<template>
  <div>
    <div
      class="flex justify-between items-center px-6 py-4 bg-white shadow-md"
      @click="handleHome"
      style="cursor: pointer"
    >
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-column"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
        <span class="text-2xl text-brand-color-500">PTracker</span>
      </div>
      <div class="flex items-center">
        <Icon name="lucide:clipboard-pen" class="h-6 w-6 text-gray-800" @click.stop="navigateToEntry" />
        <Icon name="lucide:settings" class="h-6 w-6 text-gray-800 px-6" @click.stop="handleConfigure" />
        <Icon v-if="isAdmin" name="lucide:shield" class="h-6 w-6 text-gray-800" @click.stop="navigateToAdmin" />
        <Icon name="lucide:log-out" class="h-6 w-6 text-gray-800 ml-6" @click.stop="handleLogout" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const toast = useToast()
const isAdmin = ref(false)

// Handle client-side localStorage operations
onMounted(() => {
  const userPin = localStorage.getItem('user_pin')
  isAdmin.value = userPin === '1090'
})

const handleLogout = () => {
  localStorage.removeItem('user_pin')
  router.push('/')
  
  const toast = useToast()
  toast.add({
    title: 'Success',
    description: 'Successfully logged out',
    color: 'green'
  })
}

const handleConfigure = () => {
  router.push('/setup')
}

const navigateToEntry = () => {
  router.push('/entry')
}

const navigateToAdmin = () => {
  router.push('/records')
}

const handleHome = () => {
  router.push('/')
}
</script>