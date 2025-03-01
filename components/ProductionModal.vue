<!-- components/ProductionModal.vue -->
<template>
  <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-auto">
    <div class="p-6 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-800">
        {{ isEditMode ? "Update Production Entry" : "Add Production Entry" }}
      </h2>
    </div>

    <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
      <!-- Equipment Selection -->
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Settings2 class="h-4 w-4" />
          Equipment
        </label>
        <select
          v-model="formData.equipment_id"
          :disabled="isEditMode"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">Select Equipment</option>
          <option
            v-for="equipment in equipmentList"
            :key="equipment.id"
            :value="equipment.id"
          >
            {{ equipment.name }}
          </option>
        </select>
      </div>

      <!-- Multiple Input Types -->
      <div class="space-y-2" v-if="!isEditMode">
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Package class="h-4 w-4" />
          Select Product Inputs
        </label>
        <div class="grid grid-cols-2 gap-4 border border-gray-300 rounded-md p-4">
          <div
            v-for="input in inputTypes"
            :key="input.id"
            class="flex items-center gap-2"
          >
            <input
              type="checkbox"
              :id="'input-' + input.id"
              v-model="formData.inputTypes"
              :value="input.id"
              :disabled="isEditMode"
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label :for="'input-' + input.id" class="text-sm text-gray-700">
              {{ input.name }} ({{ input.unit || "" }})
            </label>
          </div>
        </div>
        <p v-if="!formData.inputTypes.length" class="text-sm text-red-500 mt-1">
          Please select at least one input type
        </p>
      </div>

      <div v-else>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Package class="h-4 w-4" />
          Inputs
        </label>

        <div>
          <div
            v-for="input in selectedInputTypes"
            :key="input.id"
            class="flex items-center gap-2"
          >
            <label :for="'input-' + input.id" class="text-sm text-gray-700">
              {{ input.name }} ({{ input.unit || "" }})
            </label>
          </div>
        </div>
      </div>

      <!-- Expected and Actual Production -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Target class="h-4 w-4" />
            Expected Production
          </label>
          <input
            type="number"
            v-model="formData.expectedQuantity"
            :disabled="isEditMode"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CheckCircle class="h-4 w-4" />
            Actual Production
          </label>
          <input
            type="number"
            v-model="formData.actualQuantity"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <!-- Production Difference -->
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
          <ArrowRightLeft class="h-4 w-4" />
          Difference
        </label>
        <div class="relative">
          <input
            type="number"
            :value="productionDifference"
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            readonly
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <TrendingDown
              v-if="productionDifference < 0"
              class="h-4 w-4 text-red-500"
            />
            <TrendingUp
              v-if="productionDifference > 0"
              class="h-4 w-4 text-green-500"
            />
            <Minus
              v-if="productionDifference === 0"
              class="h-4 w-4 text-gray-400"
            />
          </div>
        </div>
      </div>

      <!-- In Charge and Date -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User class="h-4 w-4" />
            In Charge
          </label>
          <input
            type="text"
            v-model="formData.inCharge"
            :disabled="isEditMode"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar class="h-4 w-4" />
            Date
          </label>
          <input
            type="datetime-local"
            v-model="formData.date"
            :disabled="isEditMode"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText class="h-4 w-4" />
          Notes
        </label>
        <!-- :disabled="isEditMode" -->
        <textarea
          v-model="formData.notes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter any additional notes"
        />
      </div>

      <div
        v-if="error"
        class="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
      >
        {{ error }}
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSubmitting || !formData.inputTypes.length"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          {{ isSubmitting ? "Saving..." : "Save Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { v4 as uuidv4 } from "uuid";
import {
  Settings2,
  Package,
  Target,
  CheckCircle,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  FileText,
  Save,
  Loader2,
  Calendar,
} from "lucide-vue-next";

const props = defineProps({
  entry: {
    type: Object,
    default: null,
  },
  equipmentList: {
    type: Array,
    default: () => [],
  },
  inputTypes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["saved", "close"]);

const isEditMode = computed(() => !!props.entry);
const isSubmitting = ref(false);
const error = ref("");

const formData = reactive({
  record_id: uuidv4(),
  equipment_id: "",
  inputTypes: [],
  expectedQuantity: "",
  actualQuantity: "",
  inCharge: "",
  notes: "",
  date: new Date().toISOString().slice(0, 16),
});

const productionDifference = computed(() => {
  const actual = Number(formData.actualQuantity) || 0;
  const expected = Number(formData.expectedQuantity) || 0;
  return actual - expected;
});

const selectedInputTypes = computed(() => {
  return props.inputTypes.filter(input => formData.inputTypes.includes(input.id));
});

onMounted(() => {
  if (props.entry) {
    Object.keys(formData).forEach((key) => {
      if (key === "inputTypes") {
        formData[key] = Array.isArray(props.entry.inputTypes)
          ? props.entry.inputTypes
          : props.entry.inputTypes
          ? [props.entry.inputTypes]
          : [];
      } else {
        formData[key] = props.entry[key] || formData[key];
      }
    });
  }
});

const handleSubmit = async () => {
  try {
    if (!formData.inputTypes.length) {
      error.value = "Please select at least one input type";
      return;
    }

    isSubmitting.value = true;
    error.value = "";

    const payload = {
      ...formData,
    };

    if (isEditMode.value) {
      payload.id = props.entry.id;
      emit("saved", {
        record_id: props.entry.id,
        actualQuantity: formData.actualQuantity,
        ...formData,
      });
    } else {
      emit("saved", payload);
    }
  } catch (err) {
    error.value = err.message || "An error occurred while saving";
  } finally {
    isSubmitting.value = false;
  }
};
</script>