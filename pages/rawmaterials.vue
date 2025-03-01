<template>
    <div class="container mx-auto p-4">
      <!-- Tab Navigation -->
      <div class="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 transition-colors duration-200',
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-400',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
  
      <!-- Tab Content -->
      <div>
        <!-- Raw Materials Management Tab -->
        <div v-if="activeTab === 'management'">
          <RawMaterials />
        </div>
  
        <!-- Raw Materials Report Tab -->
        <div v-else-if="activeTab === 'reports'">
          <RawMaterialsReport />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import RawMaterials from '~/components/RawMaterials.vue';
  import RawMaterialsReport from '~/components/RawMaterialsReport.vue';
  
  const tabs = [
    { id: 'management', label: 'Materials Management' },
    { id: 'reports', label: 'Materials Reports' },
  ];
  
  const activeTab = ref('management');
  
  definePageMeta({
    title: 'Materials Inventory',
    description: 'Manage and track materials inventory for production',
    layout: 'mainlayout',
  });
  </script>