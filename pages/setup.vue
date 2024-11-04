<!-- pages/settings.vue -->
<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl text-brand-color-500 mb-6">Equipment Management</h1>

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
              <!-- <button
                @click="handleDeleteEquipment(equip.equipment_id)"
                class="btn btn-sm btn-error"
              >
                Delete
              </button> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Inputs Section -->
      <div v-if="activeSection === 'inputs'" class="space-y-4">
        <h2 class="text-xl font-semibold mb-4">Manage Inputs</h2>
        <form @submit.prevent="addOrUpdateInput" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
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
              <p class="text-sm text-gray-500">Unit: {{ input.unit }}</p>
            </div>
            <div class="space-x-2">
              <button @click="editInput(input)" class="btn btn-sm btn-outline">
                Edit
              </button>
              <!-- <button @click="handleDeleteInput(input.input_id)" class="btn btn-sm btn-error">
                Delete
              </button> -->
            </div>
          </div>
        </div>
      </div>

      <!-- In Charges Section -->
      <div v-if="activeSection === 'inCharges'" class="space-y-4">
        <ManageInCharge />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { v4 as uuidv4 } from "uuid";

import ManageInCharge from "@/components/ConfigComponents/ManageInCharge.vue";

const { fetchEquipments, addEquipment, deleteEquipment, updateEquipment } =
  useManageEquipComp();

const { fetchInputs, addNewInput, deleteInput, updateInput } = useManageInput();


// Sections
const sections = [
  { id: "equipment", label: "Equipment" },
  { id: "inputs", label: "Inputs" },
//   { id: "inCharges", label: "In-Charges" },
];

// Active section state
const activeSection = ref("equipment");

// Equipment Management
const equipment = ref([]);

const equipmentForm = ref({ name: "", code: "" });

// Inputs Management
const inputs = ref([]);
const inputForm = ref({ name: "", unit: "" });

// Editing state
const isEditing = ref(false);
const currentEditItem = ref(null);

// Equipment Methods
const addOrUpdateEquipment = async () => {
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
  handleFetchEquipments("testuser1234");

  resetForms();
};

const editEquipment = (item) => {
  isEditing.value = true;
  currentEditItem.value = item;
  equipmentForm.value = { name: item.name, code: item.code };
};

const handleDeleteEquipment = async (id) => {
  const result = await deleteEquipment("testuser1234", id);

  if (result.success) {
    handleToast("Success", "Equipment deleted successfully", "green");
  } else {
    handleToast("Error", "Failed to delete equipment", "red");
  }
};

const handleDeleteInput = async (id) => {
  const result = await deleteInput(id);

  if (result.success) {
    handleToast("Success", "Input deleted successfully", "green");
  } else {
    handleToast("Error", "Failed to delete input", "red");
  }
};

// Inputs Methods
const addOrUpdateInput = () => {
  if (isEditing.value) {
    const result = updateInput("testuser1234", {
      input_id: currentEditItem.value.id,
      name: inputForm.value.name,
      unit: inputForm.value.unit,
    });

    if (result.success) {
      handleToast("Success", "Input updated successfully", "green");
    } else {
      handleToast("Error", "Failed to update input", "red");
    }
  } else {
    const result = addNewInput(
      {
        input_id: uuidv4(),
        name: inputForm.value.name,
        unit: inputForm.value.unit,
      },
      "testuser1234"
    );
  }

  handleFetchInputs("testuser1234");

  resetForms();
};

const editInput = (item) => {
  isEditing.value = true;
  currentEditItem.value = item;
  inputForm.value = { name: item.name, unit: item.unit };
};

// Utility Methods
const handleToast = (title, description, color) => {
  const toast = useToast();
  toast.add({
    title: title,
    description: description,
    color: color,
  });
};

const cancelEditing = () => {
  resetForms();
};

const resetForms = () => {
  isEditing.value = false;
  currentEditItem.value = null;
  equipmentForm.value = { name: "", code: "" };
  inputForm.value = { name: "", unit: "" };
};

definePageMeta({
  title: "Performance tracker",
  description: "Performance tracker.",
  layout: "mainlayout",
});

// fecth equipments

const handleFetchEquipments = async (user_id) => {
  equipment.value = await fetchEquipments(user_id);
};

const handleFetchInputs = async (user_id) => {
  inputs.value = await fetchInputs(user_id);
};

// Lifecycle Hooks

onMounted(() => {
  handleFetchEquipments("testuser1234");
  handleFetchInputs("testuser1234");
});

// Optional: Add validation, error handling, and persistence in a real app
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
