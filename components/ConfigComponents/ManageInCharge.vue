<template>
  <div>
    <!-- Tab for Manage Incharge and Assign equipments to in charge -->
    <div class="flex space-x-4 mb-6">
      <button
        v-for="section in inChargesSections"
        :key="section.id"
        @click="activeInChargesSection = section.id"
        :class="[
          'px-4 py-2 transition-colors duration-200',
          activeInChargesSection === section.id
            ? 'text-blue-800 border-b-2 border-blue-800'
            : 'text-gray-800 hover:text-red-300',
        ]"
      >
        {{ section.label }}
      </button>
    </div>

    <!-- Manage In-Charge Section -->
    <div class="space-y-4" v-if="activeInChargesSection === 'manageInCharge'">
      <form @submit.prevent="addOrUpdateInCharge" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <input
            v-model="inChargeForm.name"
            placeholder="Name"
            class="input input-bordered w-full"
            required
          />
          <input
            v-model="inChargeForm.department"
            placeholder="Department"
            class="input input-bordered w-full"
            required
          />
        </div>
        <div class="flex justify-end space-x-2">
          <button type="submit" class="btn btn-primary">
            {{ isEditing ? "Update" : "Add" }} In-Charge
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
          v-for="inCharge in inCharges"
          :key="inCharge.incharge_id"
          class="flex justify-between items-center border-b py-3 hover:bg-gray-50"
        >
          <div>
            <p class="font-medium">{{ inCharge.name }}</p>
            <p class="text-sm text-gray-500">{{ inCharge.department }}</p>
          </div>
          <div class="space-x-2">
            <button
              @click="editInCharge(inCharge)"
              class="btn btn-sm btn-outline"
            >
              Edit
            </button>
            <button
              @click="handleDeleteInCharge(inCharge.incharge_id)"
              class="btn btn-sm btn-error"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Equipments Section -->
    <div
      v-else-if="activeInChargesSection === 'assignEquipments'"
      class="space-y-4"
    >
      <form @submit.prevent="assignEquipmentToInCharge" class="space-y-4">
        <div class="grid grid-cols-4 gap-4">
          <select
            v-model="assignmentForm.inChargeId"
            class="input input-bordered w-full"
            required
          >
            <option value="">Select In-Charge</option>
            <option
              v-for="inCharge in inCharges"
              :key="inCharge.incharge_id"
              :value="inCharge.incharge_id"
            >
              {{ inCharge.name }} ({{ inCharge.department }})
            </option>
          </select>

          <select
            v-model="assignmentForm.equipmentId"
            class="input input-bordered w-full"
            required
          >
            <option value="">Select Equipment</option>
            <option
              v-for="equip in equipment"
              :key="equip.equipment_id"
              :value="equip.equipment_id"
            >
              {{ equip.name }} ({{ equip.code }})
            </option>
          </select>

          <input
            type="date"
            v-model="assignmentForm.assignedDate"
            class="input input-bordered w-full"
            required
          />

          <input
            v-model="assignmentForm.notes"
            placeholder="Additional Notes"
            class="input input-bordered w-full"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <button type="submit" class="btn btn-primary">
            {{ isEditingAssignment ? "Update" : "Assign" }} Equipment
          </button>
          <button
            v-if="isEditingAssignment"
            type="button"
            class="btn btn-ghost"
            @click="cancelEditingAssignment"
          >
            Cancel
          </button>
        </div>
      </form>

      <div class="mt-6">
        <div
          v-for="assignment in equipmentAssignments"
          :key="assignment.id"
          class="flex justify-between items-center border-b py-3 hover:bg-gray-50"
        >
          <div>
            <p class="font-medium">
              {{ getInChargeName(assignment.inChargeId) }}
            </p>
            <p class="text-sm text-gray-500">
              {{ getEquipmentName(assignment.equipmentId) }}
            </p>
            <p class="text-xs text-gray-400">
              Assigned on: {{ formatDate(assignment.assignedDate) }}
            </p>
            <p v-if="assignment.notes" class="text-sm text-gray-600">
              {{ assignment.notes }}
            </p>
          </div>
          <div class="space-x-2">
            <button
              @click="editAssignment(assignment)"
              class="btn btn-sm btn-outline"
            >
              Edit
            </button>
            <button
              @click="deleteAssignment(assignment.id)"
              class="btn btn-sm btn-error"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useManageInCharge } from '@/composables/useManageInCharge';
import { useManageEquipComp } from '@/composables/useManageEquipComp';

// Composables
const toast = useToast();
const { fetchIncharge, addNewIncharge, deleteIncharge, updateIncharge } = useManageInCharge();
const { fetchEquipments } = useManageEquipComp();

// State
const inChargesSections = ref([
  { id: 'manageInCharge', label: 'Manage In-Charge' },
  { id: 'assignEquipments', label: 'Assign Equipments' },
]);

const activeInChargesSection = ref('manageInCharge');
const isEditing = ref(false);
const isEditingAssignment = ref(false);
const currentEditItem = ref(null);
const currentEditAssignment = ref(null);

const inCharges = ref([]);
const equipment = ref([]);
const equipmentAssignments = ref([]);

// Form models
const inChargeForm = ref({
  name: '',
  department: '',
});

const assignmentForm = reactive({
  inChargeId: '',
  equipmentId: '',
  assignedDate: '',
  notes: '',
});

// Toast handler
const handleToast = (title, description, color) => {
  const toast = useToast();
  toast.add({
    title,
    description,
    color,
  });
};

// In-Charge Methods
const addOrUpdateInCharge = async () => {
  try {
    if (isEditing.value) {
      const result = await updateIncharge('testuser1234', {
        incharge_id: currentEditItem.value.incharge_id,
        name: inChargeForm.value.name,
        department: inChargeForm.value.department,
      });

      if (result.success) {
        handleToast('Success', 'In-Charge updated successfully', 'green');
      } else {
        throw new Error('Failed to update in-charge');
      }
    } else {
      const result = await addNewIncharge(
        {
          incharge_id: uuidv4(),
          name: inChargeForm.value.name,
          department: inChargeForm.value.department,
        },
        'testuser1234'
      );

      if (result.success) {
        handleToast('Success', 'In-Charge added successfully', 'green');
      } else {
        throw new Error('Failed to add in-charge');
      }
    }

    await handleFetchIncharge('testuser1234');
    resetForms();
  } catch (error) {
    handleToast('Error', error.message, 'red');
  }
};

const editInCharge = (item) => {
  isEditing.value = true;
  currentEditItem.value = item;
  inChargeForm.value = {
    name: item.name,
    department: item.department,
  };
};

const handleDeleteInCharge = async (id) => {
  try {
    const result = await deleteIncharge(id);
    if (result.success) {
      handleToast('Success', 'In-Charge deleted successfully', 'green');
      await handleFetchIncharge('testuser1234');
    } else {
      throw new Error('Failed to delete in-charge');
    }
  } catch (error) {
    handleToast('Error', error.message, 'red');
  }
};


// Equipment Assignment Methods
const assignEquipmentToInCharge = async () => {
  try {
    if (isEditingAssignment.value) {
      const index = equipmentAssignments.value.findIndex(
        (a) => a.id === currentEditAssignment.value.id
      );
      if (index !== -1) {
        equipmentAssignments.value[index] = {
          ...currentEditAssignment.value,
          ...assignmentForm,
        };
        handleToast('Success', 'Assignment updated successfully', 'green');
      }
    } else {
      const newAssignment = {
        id: uuidv4(),
        ...assignmentForm,
      };
      equipmentAssignments.value.push(newAssignment);
      handleToast('Success', 'Equipment assigned successfully', 'green');
    }
    resetAssignmentForm();
  } catch (error) {
    handleToast('Error', 'Failed to process assignment', 'red');
  }
};

const editAssignment = (assignment) => {
  isEditingAssignment.value = true;
  currentEditAssignment.value = assignment;
  Object.assign(assignmentForm, assignment);
};

const deleteAssignment = (assignmentId) => {
  try {
    equipmentAssignments.value = equipmentAssignments.value.filter(
      (assignment) => assignment.id !== assignmentId
    );
    handleToast('Success', 'Assignment removed successfully', 'green');
  } catch (error) {
    handleToast('Error', 'Failed to remove assignment', 'red');
  }
};

// Utility Methods
const cancelEditing = () => {
  resetForms();
};

const cancelEditingAssignment = () => {
  resetAssignmentForm();
};

const resetForms = () => {
  isEditing.value = false;
  currentEditItem.value = null;
  inChargeForm.value = {
    name: '',
    department: '',
  };
};

const resetAssignmentForm = () => {
  isEditingAssignment.value = false;
  currentEditAssignment.value = null;
  Object.assign(assignmentForm, {
    inChargeId: '',
    equipmentId: '',
    assignedDate: '',
    notes: '',
  });
};

const getInChargeName = (inChargeId) => {
  const inCharge = inCharges.value.find((ic) => ic.incharge_id === inChargeId);
  return inCharge ? inCharge.name : 'Unknown';
};

const getEquipmentName = (equipmentId) => {
  const equip = equipment.value.find((e) => e.equipment_id === equipmentId);
  return equip ? equip.name : 'Unknown';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Data fetching
const handleFetchEquipments = async (userId) => {
  try {
    equipment.value = await fetchEquipments(userId);
  } catch (error) {
    handleToast('Error', 'Failed to fetch equipment', 'red');
  }
};

const handleFetchIncharge = async (userId) => {
  try {
    inCharges.value = await fetchIncharge(userId);
  } catch (error) {
    handleToast('Error', 'Failed to fetch in-charge data', 'red');
  }
};




// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    handleFetchEquipments('testuser1234'),
    handleFetchIncharge('testuser1234'),
  ]);
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