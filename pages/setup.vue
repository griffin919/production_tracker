<template>
  <div>
    <!-- Tab for Manage Equipment, Inputs and Raw Materials -->
    <div class="flex space-x-4 mb-6">
      <button
        v-for="section in sections"
        :key="section.id"
        @click="activeSection = section.id"
        :class="[
          'px-4 py-2 rounded transition-colors duration-200',
          activeSection === section.id
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        ]"
      >
        {{ section.label }}
      </button>
    </div>

    <div class="bg-white shadow-md rounded-lg p-6">
      <!-- Equipment Section -->
      <div v-if="activeSection === 'equipment'" class="space-y-4">
        <h2 class="text-xl font-semibold mb-4">Manage Equipment</h2>
        <form @submit.prevent="addOrUpdateEquipment" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <input
              v-model="equipmentForm.name"
              placeholder="Equipment Name"
              class="input input-bordered w-full"
              required
            />
            <input
              v-model="equipmentForm.code"
              placeholder="Equipment Code"
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button type="submit" class="btn btn-primary">
              {{ isEditing ? "Update" : "Add" }} Equipment
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
            v-for="equip in equipment"
            :key="equip.equipment_id"
            class="flex justify-between items-center border-b py-3 hover:bg-gray-50"
          >
            <div>
              <p class="font-medium">{{ equip.name }}</p>
              <p class="text-sm text-gray-500">{{ equip.code }}</p>
            </div>
            <div class="space-x-2">
              <button
                @click="editEquipment(equip)"
                class="btn btn-sm btn-outline"
              >
                Edit
              </button>
              <button
                @click="handleDeleteEquipment(equip.equipment_id)"
                class="btn btn-sm btn-error"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Inputs Section -->
      <div v-if="activeSection === 'inputs'" class="space-y-4">
        <h2 class="text-xl font-semibold mb-4">Manage Production Inputs</h2>
        <form @submit.prevent="addOrUpdateInput" class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <input
              v-model="inputForm.name"
              placeholder="Input Name"
              class="input input-bordered w-full"
              required
            />
            <input
              v-model="inputForm.unit"
              placeholder="Unit (e.g., kg, liter)"
              class="input input-bordered w-full"
              required
            />
            <input
              v-model.number="inputForm.min_stock"
              placeholder="Minimum Stock Level"
              type="number"
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button type="submit" class="btn btn-primary">
              {{ isEditing ? "Update" : "Add" }} Input
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
            v-for="input in inputs"
            :key="input.id"
            class="flex justify-between items-center border-b py-3 hover:bg-gray-50"
          >
            <div>
              <p class="font-medium">{{ input.name }}</p>
              <div class="flex gap-4 text-sm text-gray-500">
                <span>Unit: {{ input.unit }}</span>
                <span>Min Stock: {{ input.min_stock || 'Not set' }}</span>
              </div>
            </div>
            <div class="space-x-2">
              <button @click="editInput(input)" class="btn btn-sm btn-outline">
                Edit
              </button>
              <button @click="handleDeleteInput(input.input_id)" class="btn btn-sm btn-error">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Materials & Inputs Section -->
      <div v-if="activeSection === 'materials'" class="space-y-4">
        <UnifiedMaterialsForm 
          :materials="materials"
          @add="handleAddMaterial"
          @update="handleUpdateMaterial"
          @delete="handleDeleteMaterial"
        />
      </div>

      <!-- In Charges Section -->
      <div v-if="activeSection === 'inCharges'" class="space-y-4">
        <ManageInCharge />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useManageEquipComp } from '@/composables/useManageEquipComp';
import { useManageInput } from '@/composables/useManageInput';
import { useUnifiedMaterials } from '@/composables/useUnifiedMaterials';
import ManageInCharge from "@/components/ConfigComponents/ManageInCharge.vue";
import UnifiedMaterialsForm from "@/components/UnifiedMaterialsForm.vue";

const sections = [
  { id: "equipment", label: "Equipment" },
  // { id: "inputs", label: "Inputs" },
  { id: "materials", label: "Raw Materials" },
  { id: "inCharges", label: "In-Charges" },
];

// Composables
const { fetchEquipments, addEquipment, deleteEquipment, updateEquipment } = useManageEquipComp();
const { fetchInputs, addNewInput, deleteInput, updateInput } = useManageInput();
const { fetchMaterials, addMaterial, updateMaterial, deleteMaterial } = useUnifiedMaterials();
const toast = useToast();

// Active section state
const activeSection = ref("equipment");

// Equipment Management
const equipment = ref([]);
const equipmentForm = ref({ name: "", code: "" });

// Inputs Management
const inputs = ref([]);
const inputForm = reactive({ name: "", unit: "", min_stock: 100 });

// Materials Management
const materials = ref([]);
const materialForm = reactive({ name: "", unit: "", min_stock: 100 });

// Editing state
const isEditing = ref(false);
const currentEditItem = ref(null);

// Equipment Methods
const addOrUpdateEquipment = async () => {
  try {
    if (isEditing.value) {
      const result = await updateEquipment("testuser1234", {
        equipment_id: currentEditItem.value.equipment_id,
        name: equipmentForm.value.name,
        code: equipmentForm.value.code,
      });

      if (result.success) {
        handleToast("Success", "Equipment updated successfully", "green");
      } else {
        handleToast("Error", "Failed to update equipment", "red");
      }
    } else {
      const result = await addEquipment(
        {
          equipment_id: uuidv4(),
          name: equipmentForm.value.name,
          code: equipmentForm.value.code,
        },
        "testuser1234"
      );

      if (result.success) {
        handleToast("Success", "Equipment added successfully", "green");
      } else {
        handleToast("Error", "Failed to add equipment", "red");
      }
    }
    
    await handleFetchEquipments("testuser1234");
    resetForms();
  } catch (error) {
    handleToast("Error", error.message || "An error occurred", "red");
  }
};

const editEquipment = (item) => {
  isEditing.value = true;
  currentEditItem.value = item;
  equipmentForm.value = { name: item.name, code: item.code };
};

const handleDeleteEquipment = async (id) => {
  try {
    const result = await deleteEquipment("testuser1234", id);

    if (result.success) {
      handleToast("Success", "Equipment deleted successfully", "green");
      await handleFetchEquipments("testuser1234");
    } else {
      handleToast("Error", "Failed to delete equipment", "red");
    }
  } catch (error) {
    handleToast("Error", error.message || "An error occurred", "red");
  }
};

// Inputs Methods
const addOrUpdateInput = async () => {
  try {
    if (isEditing.value) {
      const result = await updateInput("testuser1234", {
        input_id: currentEditItem.value.id,
        name: inputForm.name,
        unit: inputForm.unit,
        min_stock: inputForm.min_stock
      });

      if (result.success) {
        handleToast("Success", "Input updated successfully", "green");
      } else {
        handleToast("Error", "Failed to update input", "red");
      }
    } else {
      const result = await addNewInput(
        {
          input_id: uuidv4(),
          name: inputForm.name,
          unit: inputForm.unit,
          min_stock: inputForm.min_stock
        },
        "testuser1234"
      );

      if (result.success) {
        handleToast("Success", "Input added successfully", "green");
      } else {
        handleToast("Error", "Failed to add input", "red");
      }
    }

    await handleFetchInputs("testuser1234");
    resetForms();
  } catch (error) {
    handleToast("Error", error.message || "An error occurred", "red");
  }
};

const editInput = (item) => {
  isEditing.value = true;
  currentEditItem.value = item;
  inputForm.name = item.name;
  inputForm.unit = item.unit;
  inputForm.min_stock = item.min_stock || 100;
};

const handleDeleteInput = async (id) => {
  try {
    const result = await deleteInput("testuser1234", id);

    if (result.success) {
      handleToast("Success", "Input deleted successfully", "green");
      await handleFetchInputs("testuser1234");
    } else {
      handleToast("Error", "Failed to delete input", "red");
    }
  } catch (error) {
    handleToast("Error", error.message || "An error occurred", "red");
  }
};

// Material Methods
const handleAddMaterial = async (materialData) => {
  try {
    const result = await addMaterial(materialData, "testuser1234");
    
    if (result.success) {
      handleToast("Success", "Material added successfully", "green");
      await handleFetchMaterials("testuser1234");
    } else {
      handleToast("Error", result.message || "Failed to add material", "red");
    }
  } catch (error) {
    handleToast("Error", error.message || "An error occurred", "red");
  }
};

const handleUpdateMaterial = async (materialData) => {
  try {
    const result = await updateMaterial("testuser1234", materialData);
    
    if (result.success) {
      handleToast("Success", "Material updated successfully", "green");
      await handleFetchMaterials("testuser1234");
    } else {
      handleToast("Error", result.message || "Failed to update material", "red");
    }
  } catch (error) {
    handleToast("Error", error.message || "An error occurred", "red");
  }
};

// Data fetching
const handleFetchEquipments = async (userId) => {
  try {
    equipment.value = await fetchEquipments(userId);
  } catch (error) {
    handleToast("Error", "Failed to fetch equipment", "red");
  }
};

const handleFetchInputs = async (userId) => {
  try {
    inputs.value = await fetchInputs(userId);
  } catch (error) {
    handleToast("Error", "Failed to fetch inputs", "red");
  }
};

const handleFetchMaterials = async (userId) => {
  try {
    materials.value = await fetchMaterials(userId);
  } catch (error) {
    handleToast("Error", "Failed to fetch materials", "red");
  }
};

// Utility Methods
const handleToast = (title, description, color) => {
  toast.add({
    title,
    description,
    color,
  });
};

const cancelEditing = () => {
  resetForms();
};

const resetForms = () => {
  isEditing.value = false;
  currentEditItem.value = null;
  equipmentForm.value = { name: "", code: "" };
  inputForm.name = "";
  inputForm.unit = "";
  inputForm.min_stock = 100;
  materialForm.name = "";
  materialForm.unit = "";
  materialForm.min_stock = 100;
};

// Lifecycle Hooks
onMounted(async () => {
  await Promise.all([
    handleFetchEquipments("testuser1234"),
    handleFetchInputs("testuser1234"),
    handleFetchMaterials("testuser1234"),
  ]);
});

definePageMeta({
  title: "Performance tracker",
  description: "Performance tracker.",
  layout: "mainlayout",
});
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