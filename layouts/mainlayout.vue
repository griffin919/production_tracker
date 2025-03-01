<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar Navigation -->
    <aside class="fixed inset-y-0 left-0 bg-brand-color w-64 shadow-lg hidden lg:block">
      <div class="flex items-center justify-center h-16 border-b border-brand-color-700">
        <span class="text-white text-2xl font-semibold">PTracker</span>
      </div>
      <nav class="mt-5">
        <ul class="space-y-2 px-2">
          <li>
            <NuxtLink to="/entry" class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md">
              <Home class="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/records" class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md">
              <ClipboardList class="h-5 w-5 mr-3" />
              <span>Production Records</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/rawmaterials" class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md">
              <Package class="h-5 w-5 mr-3" />
              <span>Materials Inventory</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/setup" class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md">
              <Settings class="h-5 w-5 mr-3" />
              <span>Setup</span>
            </NuxtLink>
          </li>
          <li>
            <button 
              @click="logout" 
              class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md w-full text-left"
            >
              <LogOut class="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Mobile Header -->
    <div class="lg:hidden bg-brand-color text-white p-4 flex items-center justify-between">
      <div class="flex items-center">
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="mr-2">
          <Menu class="h-6 w-6" />
        </button>
        <span class="text-xl font-semibold">PTracker</span>
      </div>
      <button @click="logout">
        <LogOut class="h-5 w-5" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <div 
      v-if="mobileMenuOpen" 
      class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="mobileMenuOpen = false"
    >
      <div 
        class="bg-brand-color w-64 h-full p-4" 
        @click.stop
      >
        <div class="flex justify-between items-center mb-5">
          <h2 class="text-white text-xl font-semibold">Menu</h2>
          <button @click="mobileMenuOpen = false" class="text-white">
            <X class="h-6 w-6" />
          </button>
        </div>
        <nav>
          <ul class="space-y-2">
            <li>
              <NuxtLink 
                to="/entry" 
                class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md"
                @click="mobileMenuOpen = false"
              >
                <Home class="h-5 w-5 mr-3" />
                <span>Dashboard</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/records" 
                class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md"
                @click="mobileMenuOpen = false"
              >
                <ClipboardList class="h-5 w-5 mr-3" />
                <span>Production Records</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/rawmaterials" 
                class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md"
                @click="mobileMenuOpen = false"
              >
                <Package class="h-5 w-5 mr-3" />
                <span>Materials Inventory</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/setup" 
                class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md"
                @click="mobileMenuOpen = false"
              >
                <Settings class="h-5 w-5 mr-3" />
                <span>Setup</span>
              </NuxtLink>
            </li>
            <li>
              <button 
                @click="logout" 
                class="flex items-center px-4 py-2 text-white hover:bg-brand-color-700 rounded-md w-full text-left"
              >
                <LogOut class="h-5 w-5 mr-3" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="lg:ml-64 pt-4 lg:pt-0">
      <main class="p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Home, ClipboardList, Settings, LogOut, Menu, X, Package } from 'lucide-vue-next';

const router = useRouter();
const mobileMenuOpen = ref(false);

const logout = () => {
  localStorage.removeItem('user_pin');
  router.push('/');
};
</script>

<style scoped>
.bg-brand-color {
  background-color: #3C0753;
}

.bg-brand-color-700 {
  background-color: #2b053c;
}
</style>