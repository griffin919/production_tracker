<template>
  <!-- Previous header and stats sections remain the same -->
  <div class="container mx-auto p-2 sm:p-4">
  <!-- Header Section -->
  <header class="mb-3 sm:mb-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex justify-between items-center gap-2">
          <h1 class="text-base sm:text-lg font-semibold text-gray-900">
            Equipments Running Today
          </h1>
          <button
            @click="refreshData"
            class="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            :disabled="isLoading"
            :title="isLoading ? 'Refreshing...' : 'Refresh data'"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
        <div class="flex flex-wrap justify-between items-center gap-2">
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <Calendar class="h-3.5 w-3.5" />
            {{ formatDate(new Date()) }}
          </div>
          <button
            @click="handleAddEntry"
            class="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PlusCircle class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Add Entry</span>
            <span class="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3 sm:mb-4">
      <div class="bg-white p-2 sm:p-3 rounded-md border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-xs text-gray-500">Total Equipments</h3>
          <Settings2 class="h-3.5 w-3.5 text-gray-400" />
        </div>
        <p class="mt-1 text-lg sm:text-xl font-semibold">{{ totalEquipment }}</p>
      </div>

      <div class="bg-white p-2 sm:p-3 rounded-md border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-xs text-gray-500">Average Production</h3>
          <TrendingUp class="h-3.5 w-3.5 text-gray-400" />
        </div>
        <p class="mt-1 text-lg sm:text-xl font-semibold">{{ averageProduction }}%</p>
      </div>

      <div class="bg-white p-2 sm:p-3 rounded-md border border-gray-200 shadow-sm col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between">
          <h3 class="text-xs text-gray-500">Active Equipments</h3>
          <Clipboard class="h-3.5 w-3.5 text-gray-400" />
        </div>
        <p class="mt-1 text-lg sm:text-xl font-semibold">{{ entries.length }}</p>
      </div>
    </div>

    
    <!-- Table/Cards Section -->
    <div class="bg-white rounded-md shadow-sm border border-gray-200">
      <!-- Search and Filter -->
      <div class="p-2 sm:p-3 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search entries..."
              class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            v-model="filterStatus"
            class="w-full sm:w-auto px-2.5 py-1.5 text-sm border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="over">Over Production</option>
            <option value="under">Under Production</option>
            <option value="matched">Matched</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center p-6">
        <div class="flex flex-col items-center gap-2">
          <Loader2 class="h-6 w-6 animate-spin text-blue-600" />
          <p class="text-xs text-gray-500">Loading entries...</p>
        </div>
      </div>

      <!-- Content: Table for Desktop, Cards for Mobile -->
      <div v-else-if="filteredEntries.length > 0">
        <!-- Desktop Table View -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="min-w-full table-fixed divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="header in tableHeaders"
                  :key="header.key"
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap"
                  :class="[
                    header.sortable && 'cursor-pointer hover:bg-gray-100',
                    header.width || 'w-auto'
                  ]"
                  @click="header.sortable && handleSort(header.key)"
                >
                  <div class="flex items-center gap-1">
                    {{ header.label }}
                    <ArrowUpDown
                      v-if="header.sortable"
                      class="h-3.5 w-3.5"
                      :class="{ 'text-blue-500': sortBy === header.key }"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="entry in filteredEntries"
                :key="entry.id"
                class="hover:bg-gray-50"
              >
                <td class="px-3 py-2 text-xs whitespace-nowrap">{{ formatDate(entry.date) }}</td>
                <td class="px-3 py-2 min-w-[160px]">
                  <div class="flex flex-col">
                    <span class="text-xs font-medium truncate">{{ entry.equipment_name }}</span>
                  </div>
                </td>
                <td class="px-3 py-2 text-xs whitespace-nowrap">
                  {{ entry.expectedQuantity }} {{ entry.input_unit }}
                </td>
                <td class="px-3 py-2 text-xs whitespace-nowrap">
                  {{ entry.actualQuantity }} {{ entry.input_unit }}
                </td>
                <td class="px-3 py-2 text-xs whitespace-nowrap">
                  {{ entry.actualQuantity - entry.expectedQuantity }}
                </td>
                <td class="px-3 py-2 text-xs whitespace-nowrap">{{ entry.inCharge }}</td>
                <td class="px-3 py-2 whitespace-nowrap w-[50px]">
                  <UTooltip text="Edit entry">
                    <button
                      @click="handleEdit(entry)"
                      class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit class="h-3.5 w-3.5" />
                    </button>
                  </UTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="sm:hidden divide-y divide-gray-200">
          <div
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="p-3 hover:bg-gray-50"
          >
            <div class="flex items-start justify-between gap-2">
              <!-- Equipment Info -->
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-sm">{{ entry.equipment_name }}</h3>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(entry.date) }}</p>
              </div>
              
              <!-- Action Button -->
              <button
                @click="handleEdit(entry)"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit class="h-4 w-4" />
              </button>
            </div>

            <!-- Production Details -->
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-xs text-gray-500">Expected</p>
                <p class="text-sm font-medium mt-0.5">
                  {{ entry.expectedQuantity }} {{ entry.input_unit }}
                </p>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-xs text-gray-500">Actual</p>
                <p class="text-sm font-medium mt-0.5">
                  {{ entry.actualQuantity }} {{ entry.input_unit }}
                </p>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="mt-3 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span>  In Charge: {{ entry.inCharge }}</span>
              </div>
              <div 
                class="px-2 py-1 rounded-full text-xs"
                :class="{
                  'bg-green-100 text-green-700': entry.actualQuantity === entry.expectedQuantity,
                  'bg-red-100 text-red-700': entry.actualQuantity < entry.expectedQuantity,
                  'bg-blue-100 text-blue-700': entry.actualQuantity > entry.expectedQuantity
                }"
              >
               Difference: {{ entry.actualQuantity - entry.expectedQuantity }} {{ entry.input_unit }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State remains unchanged -->
      <div v-else class="py-6 px-3 text-center">
        <div class="flex flex-col items-center gap-2">
          <ClipboardList class="h-8 w-8 text-gray-300" />
          <div>
            <h3 class="text-xs font-medium text-gray-900">No entries found</h3>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ searchQuery ? "No entries match your search criteria." : "No production entries found for today." }}
            </p>
          </div>
          <button
            v-if="!searchQuery"
            @click="showModal = true"
            class="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-1.5"
          >
            Add First Entry
          </button>
        </div>
        </div>  
    </div>

    <!-- Modal remains unchanged -->
    <UModal v-model="showModal">
      <ProductionModal
        :entry="selectedEntry"
        :equipment-list="equipmentList"
        :input-types="inputTypes"
        @saved="handleSave"
        @close="handleModalClose"
      />
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  ClipboardList,
  Calendar,
  Settings2,
  TrendingUp,
  Clipboard,
  Search,
  ArrowUpDown,
} from "lucide-vue-next";

// State
const entries = ref([]);
const isLoading = ref(false);
const error = ref("");
const showModal = ref(false);
const selectedEntry = ref(null);
const equipmentList = ref([]);
const inputTypes = ref([]);
const searchQuery = ref("");
const filterStatus = ref("all");
const sortBy = ref("date");
const sortDirection = ref("desc");

// Composables
const {
  fetchTodayRecords,
  fetchRecords,
  addNewRecord,
  updateRecord,
  deleteRecord,
} = useRecords();
const { fetchEquipments } = useManageEquipComp();
const { fetchInputs } = useManageInput();
const toast = useToast();

// Computed
const totalEquipment = computed(() => equipmentList.value.length);

const averageProduction = computed(() => {
  if (!entries.value.length) return 0;
  const total = entries.value.reduce((acc, entry) => {
    return acc + (entry.actualQuantity / entry.expectedQuantity) * 100;
  }, 0);
  return Math.round(total / entries.value.length);
});

const filteredEntries = computed(() => {
  let filtered = [...entries.value];

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (entry) =>
        entry.equipment_name.toLowerCase().includes(query) ||
        entry.equipment_code.toLowerCase().includes(query) ||
        entry.inCharge.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (filterStatus.value !== "all") {
    filtered = filtered.filter((entry) => {
      const diff = entry.actualQuantity - entry.expectedQuantity;
      switch (filterStatus.value) {
        case "over":
          return diff > 0;
        case "under":
          return diff < 0;
        case "matched":
          return diff === 0;
        default:
          return true;
      }
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let result = 0;
    switch (sortBy.value) {
      case "date":
        result = new Date(a.date) - new Date(b.date);
        break;
      case "equipment":
        result = a.equipment_name.localeCompare(b.equipment_name);
        break;
      default:
        result = a[sortBy.value] - b[sortBy.value];
    }
    return sortDirection.value === "desc" ? -result : result;
  });

  return filtered;
});

// Constants
const tableHeaders = [
  { key: "date", label: "Date", sortable: true },
  { key: "equipment", label: "Equipment", sortable: true },
  { key: "expected", label: "Expected", sortable: true },
  { key: "actual", label: "Actual", sortable: true },
  { key: "difference", label: "Difference", sortable: true },
  { key: "inCharge", label: "In Charge", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// Methods

const handleAddEntry = () => {
  selectedEntry.value = null;
  showModal.value = true;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleSort = (key) => {
  if (sortBy.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = key;
    sortDirection.value = "desc";
  }
};

const handleSave = async (formData) => {
  try {
    if (formData.id) {
      await updateRecord("testuser1234", formData.id, {
        actualQuantity: formData.actualQuantity,
      });
    } else {
      await addNewRecord(formData, "testuser1234");
    }
    await refreshData();
    handleModalClose();
    toast.add({
      title: "Success",
      description: `Entry ${formData.id ? "updated" : "added"} successfully`,
      color: "green",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to save entry",
      color: "red",
    });
  }
};
const handleModalClose = () => {
  showModal.value = false;
  selectedEntry.value = null;
};

const refreshData = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    const { success, data } = await fetchTodayRecords("testuser1234");

    if (!success) throw new Error("Failed to fetch records");

    entries.value = data;
  } catch (err) {
    error.value = err.message || "Failed to fetch today's records";
    toast.add({
      title: "Error",
      description: error.value,
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (entry) => {
  selectedEntry.value = entry;
  showModal.value = true;
};

const handleDelete = async (id) => {
  const confirmed = await useConfirmDialog({
    title: "Delete Entry",
    message:
      "Are you sure you want to delete this entry? This action cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    type: "danger",
  });

  if (!confirmed) return;

  try {
    const { success } = await deleteRecord("testuser1234", id);

    if (success) {
      toast.add({
        title: "Success",
        description: "Entry deleted successfully",
        color: "green",
      });
      await refreshData();
    } else {
      throw new Error("Failed to delete entry");
    }
  } catch (err) {
    toast.add({
      title: "Error",
      description: err.message || "Failed to delete entry",
      color: "red",
    });
  }
};

// Initialize
const initialize = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    // Fetch equipment and input types in parallel
    const [equipments, inputs] = await Promise.all([
      fetchEquipments("testuser1234"),
      fetchInputs("testuser1234"),
    ]);

    equipmentList.value = equipments;
    inputTypes.value = inputs;

    await refreshData();
  } catch (err) {
    error.value = err.message || "Failed to initialize page";
    toast.add({
      title: "Error",
      description: error.value,
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
};

// Auto-refresh data every 5 minutes
let refreshInterval;
onMounted(() => {
  initialize();
  refreshInterval = setInterval(refreshData, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

definePageMeta({
  title: "production metrics",
  description: "View and manage equipment running today",
  layout: "mainlayout",
});

// Page meta
//   useHead({
//     title: 'Today\'s Equipment',
//     meta: [
//       { name: 'description', content: 'View and manage equipment running today' }
//     ],
//     layout: "mainlayout",

//   })
</script>
