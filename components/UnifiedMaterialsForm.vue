<template>
    <div class="space-y-4">
      <h2 class="text-xl font-semibold mb-4">Manage Materials & Inputs</h2>
      <p class="text-sm text-gray-600 mb-4">
        Materials added here will be available both for inventory tracking and as inputs in production.
      </p>
      
      <form @submit.prevent="addOrUpdateMaterial" class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <input
            v-model="materialForm.name"
            placeholder="Material Name"
            class="input input-bordered w-full"
            required
          />
          <input
            v-model="materialForm.unit"
            placeholder="Unit (e.g., kg, liter)"
            class="input input-bordered w-full"
            required
          />
          <input
            v-model.number="materialForm.min_stock"
            placeholder="Minimum Stock Level"
            type="number"
            class="input input-bordered w-full"
            required
          />
        </div>
        <div class="flex justify-end space-x-2">
          <button type="submit" class="btn btn-primary">
            {{ isEditing ? "Update" : "Add" }} Material
          </button>
          <button
            v-if="isEditing"
            type="button"
            class="btn btn-ghost"
            @click="cancelEditing"
          >
            Cancel
          </button>
        </div>
      </form>
  
      <div class="mt-6">
        <div
          v-for="material in materials"
          :key="material.material_id"
          class="flex justify-between items-center border-b py-3 hover:bg-gray-50"
        >
          <div>
            <p class="font-medium">{{ material.name }}</p>
            <div class="flex gap-4 text-sm text-gray-500">
              <span>Unit: {{ material.unit }}</span>
              <span>Min Stock: {{ material.min_stock || 'Not set' }}</span>
              <span>Current Stock: {{ material.current_stock || '0' }} {{ material.unit }}</span>
            </div>
          </div>
          <div class="space-x-2">
            <button 
              @click="editMaterial(material)" 
              class="btn btn-sm btn-outline"
            >
              Edit
            </button>
            <button 
              @click="handleDeleteMaterial(material.material_id)" 
              class="btn btn-sm btn-error"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div v-if="!materials.length" class="py-4 text-center text-gray-500">
          No materials added yet. Add your first material above.
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue';
  import { v4 as uuidv4 } from 'uuid';
  import { useUnifiedMaterials } from '~/composables/useUnifiedMaterials';
  
  const props = defineProps({
    materials: {
      type: Array,
      default: () => []
    }
  });
  
  const emit = defineEmits(['add', 'update', 'delete']);
  
  // Composables
  const { isLoading, error } = useUnifiedMaterials();
  
  // State
  const isEditing = ref(false);
  const currentEditItem = ref(null);
  const materialForm = reactive({
    name: '',
    unit: '',
    min_stock: 100,
    current_stock: 0
  });
  
  // Methods
  const addOrUpdateMaterial = () => {
    if (isEditing.value) {
      // Update existing material
      emit('update', {
        material_id: currentEditItem.value.material_id,
        name: materialForm.name,
        unit: materialForm.unit,
        min_stock: materialForm.min_stock,
        current_stock: currentEditItem.value.current_stock || 0
      });
    } else {
      // Add new material
      emit('add', {
        material_id: uuidv4(),
        name: materialForm.name,
        unit: materialForm.unit,
        min_stock: materialForm.min_stock,
        current_stock: 0
      });
    }
    
    resetForm();
  };
  
  const editMaterial = (material) => {
    isEditing.value = true;
    currentEditItem.value = material;
    materialForm.name = material.name;
    materialForm.unit = material.unit;
    materialForm.min_stock = material.min_stock || 100;
  };
  
  const handleDeleteMaterial = (materialId) => {
    if (confirm('Are you sure you want to delete this material? It will also be removed from inputs.')) {
      emit('delete', materialId);
    }
  };
  
  const cancelEditing = () => {
    resetForm();
  };
  
  const resetForm = () => {
    isEditing.value = false;
    currentEditItem.value = null;
    materialForm.name = '';
    materialForm.unit = '';
    materialForm.min_stock = 100;
  };
  </script>
  
  <style scoped>
  .input {
    @apply w-full px-3 py-2 border rounded-md;
  }
  
  .btn {
    @apply px-4 py-2 rounded-md transition-colors duration-200;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
  
  .btn-ghost {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }
  
  .btn-error {
    @apply bg-red-600 text-white hover:bg-red-700;
  }
  
  .btn-sm {
    @apply text-sm px-2 py-1;
  }
  
  .btn-outline {
    @apply border border-gray-300 hover:bg-gray-100;
  }
  </style>