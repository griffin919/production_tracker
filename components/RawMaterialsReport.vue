<template>
    <div class="container px-4 py-6">
      <!-- Header with Date Range -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">Raw Materials Report</h2>
        
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <div class="flex gap-2 items-center">
            <input
              type="date"
              v-model="startDate"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
            />
            <span class="text-gray-500">to</span>
            <input
              type="date"
              v-model="endDate"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
            />
          </div>
          
          <!-- Material Filter -->
          <select 
            v-model="selectedMaterial" 
            class="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
          >
            <option value="all">All Materials</option>
            <option 
              v-for="material in materials" 
              :key="material.id"
              :value="material.id"
            >
              {{ material.name }}
            </option>
          </select>
          
          <button
            class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-1.5"
            @click="loadReport"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <Search v-else class="h-4 w-4" />
            <span>Generate Report</span>
          </button>
          
          <!-- Export Dropdown -->
          <div class="relative">
            <button 
              @click="showExportMenu = !showExportMenu"
              class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1.5"
            >
              <Download class="h-4 w-4" />
              <span>Export</span>
            </button>
            <div v-if="showExportMenu" class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-10">
              <button 
                @click="exportCSV"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <FileText class="h-4 w-4 mr-2" />
                Export as CSV
              </button>
              <button 
                @click="exportPDF"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <FileText class="h-4 w-4 mr-2" />
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center p-12">
        <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        <span class="ml-2 text-gray-600">Generating report...</span>
      </div>
  
      <template v-else>
        <!-- Header Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4" v-for="stat in headerStats" :key="stat.label">
            <div class="flex justify-between items-start">
              <div>
                <h6 class="text-sm text-gray-500 mb-1">{{ stat.label }}</h6>
                <div class="text-xl font-semibold" :class="stat.colorClass">
                  {{ formatNumber(stat.value) }}
                </div>
              </div>
              <component :is="stat.icon" class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
  
        <!-- Materials Details Table -->
        <div class="bg-white rounded-lg shadow mb-6">
          <div class="p-4 border-b border-gray-200">
            <h5 class="font-medium">Production Inputs Inventory Summary</h5>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Material</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Stock</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Production Usage</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Returns</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Damages</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Movement</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Stock</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <template v-if="materialStats.length">
                  <tr v-for="stat in materialStats" :key="stat.material_id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ stat.material_name }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {{ formatNumber(stat.opening_stock) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      +{{ formatNumber(stat.total_received) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {{ formatNumber(stat.production_usage) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      +{{ formatNumber(stat.returns) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {{ formatNumber(stat.damages) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right" :class="getNetMovementClass(stat.net_movement)">
                      {{ formatNumber(stat.net_movement, true) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {{ formatNumber(stat.closing_stock) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        :class="getStockStatusClass(stat)"
                      >
                        {{ getStockStatusText(stat) }}
                      </span>
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="9" class="px-6 py-10 text-center text-sm text-gray-500">
                    No data available for the selected filters
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
  
        <!-- Daily Breakdown Accordion -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b border-gray-200">
            <h5 class="font-medium">Daily Breakdown</h5>
          </div>
          <div>
            <Disclosure v-for="(day) in dailyStats" :key="day.date">
              <DisclosureButton class="w-full flex justify-between items-center px-6 py-3 text-left hover:bg-gray-50">
                <div class="flex items-center">
                  <span class="font-medium">{{ formatDate(day.date) }}</span>
                  <span class="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {{ day.total_movements }} movements
                  </span>
                </div>
                <ChevronDown class="h-4 w-4 text-gray-400" />
              </DisclosureButton>
              <DisclosurePanel class="px-6 pb-4">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="movement in day.movements" :key="movement.id">
                        <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {{ formatTime(movement.timestamp) }}
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-xs">
                          {{ movement.material_name }}
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-xs">
                          <span :class="getTransactionTypeClass(movement.type)">
                            {{ formatTransactionType(movement.type) }}
                          </span>
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-xs text-right">
                          {{ formatNumber(movement.quantity || movement.quantity_in || movement.quantity_out || 0) }}
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {{ movement.reference }}
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-500 truncate max-w-xs">
                          {{ movement.notes }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DisclosurePanel>
            </Disclosure>
            
            <div v-if="!dailyStats.length" class="px-6 py-10 text-center text-sm text-gray-500">
              No daily breakdown data available
            </div>
          </div>
        </div>
      </template>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { jsPDF } from 'jspdf';
  import 'jspdf-autotable';
  import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
  import { 
    Search, 
    Download, 
    FileText, 
    Loader2, 
    Package, 
    TrendingUp,
    AlertTriangle,
    ChevronDown,
    AlertCircle,
    ArrowUp,
    ArrowDown
  } from 'lucide-vue-next';
  import MaterialsChart from './MaterialsChart.vue';
  import { useRawMaterials } from '~/composables/useRawMaterials';
  
  // Composables
  const { 
    isLoading, 
    error: apiError, 
    fetchMaterials, 
    fetchMaterialEntries,
    calculateMaterialStats,
    groupEntriesByDate
  } = useRawMaterials();
  
  const toast = useToast();
  
  // State
  const startDate = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const endDate = ref(new Date().toISOString().split('T')[0]);
  const selectedMaterial = ref('all');
  const chartView = ref('usage');
  const showExportMenu = ref(false);
  const materials = ref([]);
  const materialEntries = ref([]);
  const materialStats = ref([]);
  const dailyStats = ref([]);
  
  // Close export menu when clicking outside
  watch(() => showExportMenu.value, (newVal) => {
    if (newVal) {
      setTimeout(() => {
        window.addEventListener('click', closeExportMenuOnOutsideClick);
      }, 0);
    } else {
      window.removeEventListener('click', closeExportMenuOnOutsideClick);
    }
  });
  
  function closeExportMenuOnOutsideClick(e) {
    if (!e.target.closest('.relative')) {
      showExportMenu.value = false;
      window.removeEventListener('click', closeExportMenuOnOutsideClick);
    }
  }
  
  // Computed properties
  const headerStats = computed(() => {
    if (!materialStats.value || !Array.isArray(materialStats.value) || materialStats.value.length === 0) {
      return defaultHeaderStats();
    }
  
    // Calculate totals across all materials
    const totals = materialStats.value.reduce((acc, stat) => {
      acc.opening += Number(stat.opening_stock || 0);
      acc.received += Number(stat.total_received || 0);
      acc.used += Number(stat.production_usage || 0);
      acc.damages += Number(stat.damages || 0);
      acc.closing += Number(stat.closing_stock || 0);
      return acc;
    }, { opening: 0, received: 0, used: 0, damages: 0, closing: 0 });
  
    return [
      {
        label: 'Opening Stock',
        value: totals.opening,
        icon: Package,
        colorClass: 'text-gray-800'
      },
      {
        label: 'Total Received',
        value: totals.received,
        icon: ArrowDown,
        colorClass: 'text-green-600'
      },
      {
        label: 'Production Usage',
        value: totals.used,
        icon: TrendingUp,
        colorClass: 'text-blue-600'
      },
      {
        label: 'Total Damages',
        value: totals.damages,
        icon: AlertTriangle,
        colorClass: 'text-red-600'
      },
      {
        label: 'Closing Stock',
        value: totals.closing,
        icon: Package,
        colorClass: 'text-gray-800'
      }
    ];
  });
  
  function defaultHeaderStats() {
    return [
      { label: 'Opening Stock', value: 0, icon: Package, colorClass: 'text-gray-800' },
      { label: 'Total Received', value: 0, icon: ArrowDown, colorClass: 'text-green-600' },
      { label: 'Production Usage', value: 0, icon: TrendingUp, colorClass: 'text-blue-600' },
      { label: 'Total Damages', value: 0, icon: AlertTriangle, colorClass: 'text-red-600' },
      { label: 'Closing Stock', value: 0, icon: Package, colorClass: 'text-gray-800' }
    ];
  }
  
  // Methods
  function formatNumber(value, showPlus = false) {
    const num = Number(value) || 0;
    const formatted = new Intl.NumberFormat().format(Math.abs(num));
    
    if (showPlus && num > 0) {
      return `+${formatted}`;
    } else if (num < 0) {
      return `-${formatted}`;
    }
    return formatted;
  }
  
  function formatDate(dateString, style = 'long') {
    if (!dateString) return '';
    
    const options = {
      year: 'numeric',
      month: style === 'short' ? 'short' : 'long',
      day: 'numeric',
    };
    
    if (style === 'long') {
      options.weekday = 'long';
    }
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  }
  
  function formatTime(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatTransactionType(type) {
    if (!type) return '';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  function getTransactionTypeClass(type) {
    const classes = {
      stock_received: 'text-green-600',
      received_from_factory: 'text-green-600',
      return_from_production: 'text-green-600',
      production_usage: 'text-blue-600',
      sent_to_factory: 'text-yellow-600',
      damages: 'text-red-600'
    };
    return classes[type] || 'text-gray-600';
  }
  
  function getNetMovementClass(value) {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  }
  
  function getStockStatusClass(stat) {
    if (!stat || typeof stat !== 'object') return 'bg-gray-100 text-gray-800';
    
    const ratio = stat.closing_stock / (stat.min_stock || 1);
    if (ratio <= 0.5) return 'bg-red-100 text-red-800';
    if (ratio <= 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }
  
  function getStockStatusText(stat) {
    if (!stat || typeof stat !== 'object') return 'Unknown';
    
    const ratio = stat.closing_stock / (stat.min_stock || 1);
    if (ratio <= 0.5) return 'Critical';
    if (ratio <= 1) return 'Low';
    return 'Good';
  }
  
  async function loadReport() {
    if (!startDate.value || !endDate.value) {
      handleToast('Error', 'Please select date range', 'red');
      return;
    }
  
    try {
      isLoading.value = true;
      
      // Load materials first
      const materialsList = await fetchMaterials('testuser1234');
      materials.value = materialsList;
      
      // Create proper date range for API
      const apiDateRange = {
        startDate: startDate.value,
        endDate: endDate.value
      };
      
      // Fetch ALL transactions (not just within date range) so we can properly calculate
      // opening balances and other statistics across the full history
      const allEntries = await fetchMaterialEntries('testuser1234');
      
      // Filter by material if selected
      const filteredAllEntries = selectedMaterial.value !== 'all'
        ? allEntries.filter(entry => entry.material_id === selectedMaterial.value)
        : allEntries;
      
      // Store all entries
      materialEntries.value = filteredAllEntries;
      
      // Process the entries for the selected date range
      const startDateObj = new Date(startDate.value);
      startDateObj.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate.value);
      endDateObj.setHours(23, 59, 59, 999);
      
      // Filter entries in range for daily stats and display
      const entriesInRange = filteredAllEntries.filter(entry => {
        if (!entry.timestamp) return false;
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDateObj && entryDate <= endDateObj;
      });
      
      // Generate material stats using all entries but with specific date range
      materialStats.value = calculateMaterialStatsForRange(
        filteredAllEntries, 
        materialsList,
        startDateObj,
        endDateObj
      );
      
      // Group entries by date for daily breakdown
      dailyStats.value = groupEntriesByDate(entriesInRange);
      
      // Hide export menu if open
      showExportMenu.value = false;
    } catch (err) {
      console.error('Error loading report:', err);
      handleToast('Error', 'Failed to generate report: ' + (err.message || ''), 'red');
    } finally {
      isLoading.value = false;
    }
  }
  
  // Improved function to correctly calculate stats for a date range
  function calculateMaterialStatsForRange(entries, materials, startDate, endDate) {
    if (!Array.isArray(entries) || !Array.isArray(materials)) {
      return [];
    }
  
    // Group entries by material
    const entriesByMaterial = entries.reduce((acc, entry) => {
      if (!entry.material_id) return acc;
      
      if (!acc[entry.material_id]) {
        acc[entry.material_id] = [];
      }
      acc[entry.material_id].push(entry);
      return acc;
    }, {});
  
    // Calculate stats for each material
    return materials
      .filter(m => !selectedMaterial.value || selectedMaterial.value === 'all' || selectedMaterial.value === m.id)
      .map(material => {
        const materialId = material.id;
        const materialEntries = entriesByMaterial[materialId] || [];
        
        // Sort entries by date (oldest first)
        materialEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Initialize stats object
        const stats = {
          material_id: materialId,
          material_name: material.name,
          min_stock: Number(material.min_stock || 0),
          unit: material.unit || '',
          opening_stock: 0,
          total_received: 0,
          production_usage: 0,
          returns: 0,
          damages: 0,
          factory_transfer: 0,
          net_movement: 0,
          closing_stock: Number(material.current_stock || 0)
        };
        
        // Find entries before the start date to determine opening balance
        const entriesBeforeStart = materialEntries.filter(entry => 
          new Date(entry.timestamp) < startDate
        );
        
        // Set opening balance from the last entry before start date or 0
        if (entriesBeforeStart.length > 0) {
          const lastEntryBeforeStart = entriesBeforeStart[entriesBeforeStart.length - 1];
          stats.opening_stock = Number(lastEntryBeforeStart.running_balance || 0);
        }
        
        // Find entries within date range
        const entriesInRange = materialEntries.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        // Process entries in range for transaction totals
        entriesInRange.forEach(entry => {
          // Process received quantities
          if (['stock_received', 'received_from_factory'].includes(entry.type)) {
            stats.total_received += Number(entry.quantity_in || 0);
          } else if (entry.type === 'return_from_production') {
            stats.returns += Number(entry.quantity_in || 0);
          }
          
          // Process used quantities
          if (entry.type === 'production_usage') {
            stats.production_usage += Number(entry.quantity_out || 0);
          } else if (entry.type === 'damages') {
            stats.damages += Number(entry.quantity_damaged || entry.quantity_out || 0);
          } else if (entry.type === 'sent_to_factory') {
            stats.factory_transfer += Number(entry.quantity_out || 0);
          }
        });
        
        // Calculate net movement
        stats.net_movement = (stats.total_received + stats.returns) - 
                            (stats.production_usage + stats.damages + stats.factory_transfer);
        
        // Find the last entry in range to determine closing balance
        if (entriesInRange.length > 0) {
          const lastEntryInRange = entriesInRange[entriesInRange.length - 1];
          stats.closing_stock = Number(lastEntryInRange.running_balance || 0);
        } else {
          // If no entries in range, closing balance equals opening balance
          stats.closing_stock = stats.opening_stock;
        }
        
        return stats;
      });
  }
  
  function exportCSV() {
    try {
      if (!materialStats.value || materialStats.value.length === 0) {
        handleToast('Warning', 'No data to export', 'yellow');
        return;
      }
      
      // Create CSV content
      const headers = [
        'Material',
        'Opening Stock',
        'Received',
        'Production Usage',
        'Returns',
        'Damages',
        'Factory Transfer',
        'Net Movement',
        'Closing Stock',
        'Min Stock'
      ];
  
      const rows = materialStats.value.map(stat => [
        stat.material_name,
        stat.opening_stock,
        stat.total_received,
        stat.production_usage,
        stat.returns,
        stat.damages,
        stat.factory_transfer,
        stat.net_movement,
        stat.closing_stock,
        stat.min_stock
      ]);
  
      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
  
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `raw-materials-report-${startDate.value}-to-${endDate.value}.csv`;
  
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showExportMenu.value = false;
      handleToast('Success', 'CSV file downloaded successfully', 'green');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      handleToast('Error', 'Failed to export CSV', 'red');
    }
  }
  
  function exportPDF() {
    try {
      if (!materialStats.value || materialStats.value.length === 0) {
        handleToast('Warning', 'No data to export', 'yellow');
        return;
      }
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
  
      // Add title and metadata
      doc.setFontSize(16);
      doc.text('Raw Materials Report', 14, 10);
  
      // Add report metadata
      doc.setFontSize(10);
      doc.text([
        `Generated: ${new Date().toLocaleDateString()}`,
        `Period: ${formatDate(startDate.value)} to ${formatDate(endDate.value)}`,
        `Total Materials: ${materialStats.value.length}`
      ], 14, 20);
  
      // Add material stats table
      const tableData = materialStats.value.map(stat => [
        stat.material_name || '',
        formatNumber(stat.opening_stock),
        formatNumber(stat.total_received),
        formatNumber(stat.production_usage),
        formatNumber(stat.returns),
        formatNumber(stat.damages),
        formatNumber(stat.net_movement, true),
        formatNumber(stat.closing_stock),
        getStockStatusText(stat)
      ]);
  
      doc.autoTable({
        head: [['Material', 'Opening', 'Received', 'Used', 'Returns', 'Damages', 'Net', 'Closing', 'Status']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 }
      });
  
      // Save PDF
      doc.save(`raw-materials-report-${startDate.value}-to-${endDate.value}.pdf`);
      
      showExportMenu.value = false;
      handleToast('Success', 'PDF file downloaded successfully', 'green');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      handleToast('Error', 'Failed to export PDF', 'red');
    }
  }
  
  function handleToast(title, description, color) {
    toast.add({
      title,
      description,
      color,
    });
  }
  
  // Group entries by date for display
//   function groupEntriesByDate(entries) {
//     if (!Array.isArray(entries) || entries.length === 0) {
//       return [];
//     }
    
//     // Group entries by date (YYYY-MM-DD)
//     const entriesByDate = entries.reduce((acc, entry) => {
//       if (!entry.timestamp) return acc;
      
//       // Get the date portion only (YYYY-MM-DD)
//       const date = entry.timestamp.split('T')[0];
      
//       if (!acc[date]) {
//         acc[date] = {
//           date,
//           movements: [],
//           total_movements: 0
//         };
//       }
      
//       // Add the entry to the appropriate date group
//       acc[date].movements.push(entry);
//       acc[date].total_movements++;
      
//       return acc;
//     }, {});
    
//     // Convert object to array and sort by date (newest first)
//     const result = Object.values(entriesByDate);
//     result.sort((a, b) => new Date(b.date) - new Date(a.date));
    
//     // Sort movements by time within each date
//     result.forEach(day => {
//       day.movements.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
//     });
    
//     return result;
//   }
  
  // Initialize
  onMounted(async () => {
    try {
      // Load materials
      materials.value = await fetchMaterials('testuser1234');
      
      // Load initial report data
      await loadReport();
    } catch (error) {
      console.error('Error initializing report:', error);
      handleToast('Error', 'Failed to initialize report', 'red');
    }
  });
    </script>