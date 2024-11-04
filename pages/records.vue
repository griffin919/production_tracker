<template>
  <div class="container mx-auto px-4 py-4">
    <!-- Header with Compact Stats -->
    <div class="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div class="flex items-center gap-2">
          <h1 class="text-xl lg:text-2xl">Production Records</h1>
        </div>

        <!-- Compact Stats Row - Responsive Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:flex lg:gap-6">
          <div class="flex items-center gap-2">
            <Settings2 class="h-4 w-4 text-gray-400" />
            <div>
              <div class="text-sm text-gray-500">Equipments: {{ equipmentList.length }}</div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <TrendingUp class="h-4 w-4 text-gray-400" />
            <div>
              <div class="text-sm text-gray-500">Avg. Production: {{ calculateAverageProduction() }}%</div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <Clipboard class="h-4 w-4 text-gray-400" />
            <div>
              <div class="text-sm text-gray-500">Active: {{ Object.keys(groupedEntries).length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Responsive Filter Row -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              v-model="filters.startDate"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
            />
            <input
              type="date"
              v-model="filters.endDate"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div class="sm:w-64">
          <label class="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
          <select
            v-model="filters.selectedEquipment"
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
          >
            <option value="all">All Equipment</option>
            <option
              v-for="equipment in equipmentList"
              :key="equipment.id"
              :value="equipment.id"
            >
              {{ equipment.name }}
            </option>
          </select>
        </div>

        <div class="flex gap-2 sm:self-end">
          <button
            @click="refreshData"
            class="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 disabled:opacity-50 h-9"
            :disabled="recordsLoading"
          >
            <Loader2 v-if="recordsLoading" class="h-4 w-4 animate-spin" />
            <RefreshCw v-else class="h-4 w-4" />
            {{ recordsLoading ? "Loading..." : "Load" }}
          </button>

          <!-- Export Menu -->
          <div class="relative">
            <button
              @click="showDownloadMenu = !showDownloadMenu"
              class="w-full sm:w-auto px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
            >
              <Download class="h-4 w-4" />
              Export
            </button>

            <div
              v-if="showDownloadMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10"
            >
              <button
                @click="downloadCSV"
                class="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <FileText class="h-4 w-4" />
                Export as CSV
              </button>
              <button
                @click="downloadPDF"
                class="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <File class="h-4 w-4" />
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-4 bg-red-50 p-4 rounded-lg border border-red-200">
      <p class="text-red-700">{{ error }}</p>
    </div>

    <!-- Production Data -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div v-if="!recordsLoading" class="divide-y">
        <div
          v-for="(group, equipmentId) in groupedEntries"
          :key="equipmentId"
          class="group"
        >
          <!-- Enhanced Equipment Group Header -->
          <div
            @click="toggleGroup(equipmentId)"
            class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex items-center gap-2">
                  <Settings2 class="h-5 w-5 text-gray-600" />
                  <h3 class="text-lg font-semibold">
                    {{ group[0]?.equipment_name || "Unknown Equipment" }}
                  </h3>
                  <span class="text-sm text-gray-500">
                    ({{ group[0]?.equipment_code || "No Code" }})
                  </span>
                </div>
                
                <!-- Equipment Performance Indicators -->
                <div class="grid grid-cols-2 sm:flex gap-4 lg:gap-6 text-sm">
                  <div class="flex items-center gap-1">
                    <CircleDot class="h-4 w-4" :class="getStatusColor(calculateEquipmentEfficiency(group))" />
                    <span>{{ calculateEquipmentEfficiency(group) }}% Efficiency</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <AlertCircle class="h-4 w-4" :class="getIssueColor(calculateIssueCount(group))" />
                    <span>{{ calculateIssueCount(group) }} Issues</span>
                  </div>
                  <!-- <div class="px-2 py-0.5 rounded text-xs" :class="getCapacityClass(calculateCapacityUtilization(group))">
                    {{ calculateCapacityUtilization(group) }}% Capacity
                  </div> -->
                </div>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar class="h-4 w-4" />
                  <span>Last Update: {{ formatDate(getLastUpdate(group)) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">{{ group.length }} entries</span>
                  <ChevronDown v-if="!expandedGroups[equipmentId]" class="h-5 w-5 text-gray-400" />
                  <ChevronUp v-else class="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <!-- Responsive Table -->
          <div v-if="expandedGroups[equipmentId]" class="px-4 pb-4">
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Expected</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actual</th>
                    <th class="hidden sm:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500">Difference</th>
                    <!-- <th class="hidden md:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500">Efficiency</th> -->
                    <th class="hidden lg:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500">In Charge</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="entry in group" :key="entry.id" class="hover:bg-gray-50">
                    <td class="px-4 py-2 text-sm">{{ formatDate(entry.date) }}</td>
                    <td class="px-4 py-2 text-sm">
                      {{ entry.expectedQuantity }}
                      <span class="text-gray-500 text-xs">{{ entry.input_unit }}</span>
                    </td>
                    <td class="px-4 py-2 text-sm">
                      {{ entry.actualQuantity }}
                      <span class="text-gray-500 text-xs">{{ entry.input_unit }}</span>
                    </td>
                    <td class="hidden sm:table-cell px-4 py-2">
                      <div class="flex items-center gap-1">
                        <ArrowUp v-if="entry.actualQuantity > entry.expectedQuantity" class="h-3 w-3 text-green-500" />
                        <ArrowDown v-if="entry.actualQuantity < entry.expectedQuantity" class="h-3 w-3 text-red-500" />
                        <span class="text-sm" :class="{
                          'text-red-500': entry.actualQuantity < entry.expectedQuantity,
                          'text-green-500': entry.actualQuantity > entry.expectedQuantity,
                          'text-gray-500': entry.actualQuantity === entry.expectedQuantity
                        }">
                          {{ Math.abs(entry.actualQuantity - entry.expectedQuantity) }}
                        </span>
                      </div>
                    </td>
                    <!-- <td class="hidden md:table-cell px-4 py-2">
                      <div class="flex items-center gap-1">
                        <div class="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            class="h-2 rounded-full"
                            :style="{
                              width: `${(entry.actualQuantity / entry.expectedQuantity) * 100}%`,
                              backgroundColor: getEfficiencyColor(entry.actualQuantity / entry.expectedQuantity)
                            }"
                          ></div>
                        </div>
                        <span class="text-xs text-gray-500">
                          {{ ((entry.actualQuantity / entry.expectedQuantity) * 100).toFixed(1) }}%
                        </span>
                      </div>
                    </td> -->
                    <td class="hidden lg:table-cell px-4 py-2">
                      <div class="flex items-center gap-1">
                        <User class="h-4 w-4 text-gray-400" />
                        <span class="text-sm">{{ entry.inCharge }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-2">
                      <span class="px-2 py-1 text-xs rounded-full" :class="getStatusClass(entry)">
                        {{ getStatusText(entry) }}
                      </span>
                    </td>
                    <td class="px-4 py-2">
                      <div class="flex items-center gap-1">
                        <button
                          @click="handleEdit(entry)"
                          class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit class="h-4 w-4" />
                        </button>
                        <button
                          @click="deleteEntry(entry.id)"
                          class="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="recordsLoading" class="flex items-center justify-center p-8">
        <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
      </div>

      <!-- Empty State -->
      <div
        v-if="!recordsLoading && Object.keys(groupedEntries).length === 0"
        class="p-8 text-center"
      >
        <div class="max-w-sm mx-auto">
          <ClipboardX class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 mb-2">No production entries found for the selected filters.</p>
          <p class="text-sm text-gray-400">Try adjusting your filters or selecting a different date range.</p>
        </div>
      </div>
    </div>

    <!-- Production Modal -->
    <UModal v-model="showModal">
      <ProductionModalAdmin
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
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
  import { ref, reactive, computed, onMounted } from 'vue';
  import {
    Shield,
    Settings2,
    TrendingUp,
    Clipboard,
    Filter,
    Calendar,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    Download,
    File,
    FileText,
    CircleDot,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    User,
    ClipboardX
  } from 'lucide-vue-next';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  // Composables
  const { fetchRecords,updateRecord, deleteRecord, error: recordsError, isLoading: recordsLoading } = useRecords();
  const { fetchEquipments } = useManageEquipComp();
  const { fetchInputs } = useManageInput();
const toast = useToast();

// State
const equipmentList = ref([]);
const inputTypes = ref([]);
const productionEntries = ref([]);
const expandedGroups = ref({});
const showDownloadMenu = ref(false);
const error = computed(() => recordsError.value);
const showModal = ref(false);
const selectedEntry = ref(null);

// Filters
const filters = reactive({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  selectedEquipment: 'all'
});

// Computed
const calculateAverageProduction = () => {
  if (!productionEntries.value.length) return 0;
  const totalEfficiency = productionEntries.value.reduce((sum, entry) => {
    return sum + (entry.actualQuantity / entry.expectedQuantity) * 100;
  }, 0);
  return (totalEfficiency / productionEntries.value.length).toFixed(1);
};

const groupedEntries = computed(() => {
  if (!productionEntries.value.length) return {};
  return productionEntries.value.reduce((acc, entry) => {
    if (filters.selectedEquipment !== 'all' && entry.equipment_id !== filters.selectedEquipment) {
      return acc;
    }
    if (!acc[entry.equipment_id]) {
      acc[entry.equipment_id] = [];
    }
    acc[entry.equipment_id].push(entry);
    return acc;
  }, {});
});

const handleModalClose = () => {
  showModal.value = false;
  selectedEntry.value = null;
};

// Equipment Analytics Methods
const calculateEquipmentEfficiency = (group) => {
  if (!group.length) return 0;
  const efficiency = group.reduce((sum, entry) => {
    return sum + (entry.actualQuantity / entry.expectedQuantity) * 100;
  }, 0) / group.length;
  return efficiency.toFixed(1);
};

const calculateIssueCount = (group) => {
  return group.filter(entry => entry.actualQuantity < entry.expectedQuantity).length;
};

const calculateCapacityUtilization = (group) => {
  if (!group.length) return 0;
  const utilization = group.reduce((sum, entry) => {
    return sum + (entry.actualQuantity / entry.expectedQuantity) * 100;
  }, 0) / group.length;
  return Math.min(100, utilization).toFixed(1);
};

const getLastUpdate = (group) => {
  return group.reduce((latest, entry) => {
    return new Date(entry.date) > new Date(latest) ? entry.date : latest;
  }, group[0].date);
};

// Style Helper Methods
const getStatusColor = (efficiency) => {
  const eff = parseFloat(efficiency);
  if (eff >= 90) return 'text-green-500';
  if (eff >= 75) return 'text-yellow-500';
  return 'text-red-500';
};

const getIssueColor = (count) => {
  if (count === 0) return 'text-green-500';
  if (count <= 2) return 'text-yellow-500';
  return 'text-red-500';
};

const getCapacityClass = (utilization) => {
  const util = parseFloat(utilization);
  if (util >= 90) return 'bg-green-100 text-green-800';
  if (util >= 75) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const getEfficiencyColor = (ratio) => {
  if (ratio >= 0.9) return '#10B981'; // green
  if (ratio >= 0.75) return '#FBBF24'; // yellow
  return '#EF4444'; // red
};

const getStatusClass = (entry) => {
  const ratio = entry.actualQuantity / entry.expectedQuantity;
  if (ratio >= 0.9) return 'bg-green-100 text-green-800';
  if (ratio >= 0.75) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const getStatusText = (entry) => {
  const ratio = entry.actualQuantity / entry.expectedQuantity;
  if (ratio >= 0.9) return 'On Target';
  if (ratio >= 0.75) return 'At Risk';
  return 'Below Target';
};

// Date Formatting
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Group Toggle
const toggleGroup = (equipmentId) => {
  expandedGroups.value[equipmentId] = !expandedGroups.value[equipmentId];
};

const handleSave = async (formData) => {
  console.log("🚀 ~ handleSave ~ formData:", formData)
  try {
    if (formData.record_id) {
     const result = await updateRecord("testuser1234", formData);
     if (result.success) {
     handleToast("Success", "Entry updated successfully", "green");
     } else {
      handleToast("Error", "Failed to update entry", "red");
     }
    } else {
      const result = await addNewRecord(formData, "testuser1234");

      if (result.success) {
        handleToast("Success", "Entry added successfully", "green");
      } else {
       handleToast("Error", "Failed to add entry", "red");
      }
    }
    await refreshData();
    handleModalClose();
   
  } catch (error) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to save entry",
      color: "red",
    });
  }
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

// Data Operations
const refreshData = async () => {
  try {
    const { success, data } = await fetchRecords('testuser1234', {
      startDate: filters.startDate,
      endDate: filters.endDate
    });

    if (success) {
      productionEntries.value = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  } catch (err) {
    toast.add({
      title: 'Error',
      description: 'Failed to refresh data',
      color: 'red'
    });
  }
};


const handleEdit = (entry) => {
  selectedEntry.value = entry;
  showModal.value = true;
};

const deleteEntry = async (recordId) => {
  if (!confirm('Are you sure you want to delete this entry?')) return;

  try {
    const { success } = await deleteRecord('testuser1234', recordId);
    if (success) {
      toast.add({
        title: 'Success',
        description: 'Entry deleted successfully',
        color: 'green'
      });
      await refreshData();
    }
  } catch (err) {
    toast.add({
      title: 'Error',
      description: 'Failed to delete entry',
      color: 'red'
    });
  }
};
// Modified export functions
const downloadCSV = () => {
  try {
    showDownloadMenu.value = false; // Close menu after selection
    
    // Flatten the grouped entries for export
    const entries = Object.values(groupedEntries.value).flat();
    
    if (entries.length === 0) {
      toast.add({
        title: 'Export Failed',
        description: 'No data available to export',
        color: 'red'
      });
      return;
    }

    // Define headers
    const headers = [
      'Date',
      'Equipment',
      'Expected Quantity',
      'Actual Quantity',
      // 'Efficiency',
      'Status',
      'In Charge',
      'Unit'
    ];

    // Convert entries to rows
    const rows = entries.map(entry => {
      // const efficiency = ((entry.actualQuantity / entry.expectedQuantity) * 100).toFixed(1);
      const row = [
        formatDate(entry.date),
        entry.equipment_name,
        entry.expectedQuantity,
        entry.actualQuantity,
        // `${efficiency}%`,
        getStatusText(entry),
        entry.inCharge,
        entry.input_unit
      ];
      // Escape special characters and wrap in quotes if needed
      return row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
          ? `"${cellStr.replace(/"/g, '""')}"`
          : cellStr;
      }).join(',');
    });

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `production-records-${filters.startDate}-to-${filters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.add({
      title: 'Success',
      description: 'CSV file downloaded successfully',
      color: 'green'
    });
  } catch (error) {
    console.error('CSV Export Error:', error);
    toast.add({
      title: 'Export Failed',
      description: error.message || 'Failed to export CSV',
      color: 'red'
    });
  }
};

const downloadPDF = async () => {
  try {
    showDownloadMenu.value = false; // Close menu after selection

    // Flatten the grouped entries for export
    const entries = Object.values(groupedEntries.value).flat();
    
    if (entries.length === 0) {
      toast.add({
        title: 'Export Failed',
        description: 'No data available to export',
        color: 'red'
      });
      return;
    }

    // Initialize PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add title and metadata
    doc.setFontSize(16);
    doc.text('Production Records Report', 14, 10);

    // Add report metadata
    doc.setFontSize(10);
    doc.text([
      `Generated: ${formatDate(new Date())}`,
      `Period: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`,
      `Total Equipment: ${Object.keys(groupedEntries.value).length}`,
      `Total Records: ${entries.length}`
    ], 14, 20);

    // Create summary data
    const summaryData = Object.entries(groupedEntries.value).map(([_, group]) => [
      group[0].equipment_name,
      group.length.toString(),
      calculateIssueCount(group).toString(),
      formatDate(getLastUpdate(group))
    ]);

    // Add summary table
    doc.autoTable({
      head: [['Equipment', 'Records', 'Issues', 'Last Update']],
      body: summaryData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
      margin: { top: 35 }
    });

    // Add detailed records
    const detailData = entries.map(entry => [
      formatDate(entry.date),
      entry.equipment_name,
      `${entry.expectedQuantity}` ,
      `${entry.actualQuantity}`,
      getStatusText(entry),
      entry.inCharge
    ]);

    // Add detailed records table
    doc.autoTable({
      head: [['Date', 'Equipment', 'Expected', 'Actual', 'Status', 'In Charge']],
      body: detailData,
      startY: doc.previousAutoTable.finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30 }
      },
      didDrawPage: (data) => {
        // Add header to each new page
        if (data.pageCount > 1) {
          doc.setFontSize(8);
          doc.text('Production Records Report - Page ' + data.pageCount, 14, 10);
        }
      }
    });

    // Save the PDF
    doc.save(`production-records-${filters.startDate}-to-${filters.endDate}.pdf`);

    toast.add({
      title: 'Success',
      description: 'PDF file downloaded successfully',
      color: 'green'
    });
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.add({
      title: 'Export Failed',
      description: error.message || 'Failed to export PDF',
      color: 'red'
    });
  }
};


// Page metadata
definePageMeta({
  title: 'Production Records',
  description: 'View and manage production records',
  layout: 'mainlayout'
});

// Lifecycle
onMounted(async () => {
  try {
    const [equipments, inputs] = await Promise.all([
      fetchEquipments('testuser1234'),
      fetchInputs('testuser1234')
    ]);

    equipmentList.value = equipments;
    inputTypes.value = inputs;
    await refreshData();
  } catch (err) {
    console.error('Error initializing dashboard:', err);
    toast.add({
      title: 'Error',
      description: 'Failed to initialize dashboard',
      color: 'red'
    });
  }
});
</script>

<style scoped>
.group + .group {
  border-top: 1px solid #e5e7eb;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>