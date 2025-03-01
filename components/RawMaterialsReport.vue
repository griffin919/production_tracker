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
  
        <!-- Usage Trends Chart -->
        <!-- <div class="bg-white rounded-lg shadow mb-6">
          <div class="p-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h5 class="font-medium">Daily Usage Trends</h5>
              <select v-model="chartView" class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option value="usage">Usage vs Receipt</option>
                <option value="balance">Stock Balance</option>
                <option value="movement">Material Movement</option>
              </select>
            </div>
          </div>
          <div class="p-4" style="height: 300px">
            <div v-if="!dailyStats.length || dailyStats.length === 0" class="flex items-center justify-center h-full text-gray-500">
              No data available for selected date range
            </div>
            <MaterialsChart
              v-else
              :chart-data="chartData"
              :chart-type="chartView"
              :height="300"
            />
          </div>
        </div> -->
  
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
                          {{ formatNumber(movement.quantity) }}
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
  import { ref, computed, onMounted } from 'vue';
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
  
  // Computed properties
  const headerStats = computed(() => {
    // Calculate totals across all materials
    const totals = materialStats.value.reduce((acc, stat) => {
      acc.opening += stat.opening_stock;
      acc.received += stat.total_received;
      acc.used += stat.production_usage;
      acc.damages += stat.damages;
      acc.closing += stat.closing_stock;
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
  
  const chartData = computed(() => {
    if (!dailyStats.value.length) return { labels: [], datasets: [] };
    
    // Get dates for labels
    const labels = dailyStats.value.map(day => 
      formatDate(day.date, 'short')
    );
  
    // Process data based on chart view
    if (chartView.value === 'usage') {
      return {
        labels,
        datasets: [
          {
            label: 'Usage',
            data: dailyStats.value.map(day => 
              day.movements
                .filter(m => m.type === 'production_usage')
                .reduce((sum, m) => sum + (m.quantity || 0), 0)
            ),
            backgroundColor: '#3b82f6',
            order: 2
          },
          {
            label: 'Receipts',
            data: dailyStats.value.map(day => 
              day.movements
                .filter(m => ['stock_received', 'received_from_factory'].includes(m.type))
                .reduce((sum, m) => sum + (m.quantity || 0), 0)
            ),
            backgroundColor: '#10b981',
            order: 1
          }
        ]
      };
    }
  
    if (chartView.value === 'balance') {
      // For simplicity we're using mock data here
      // In a real app, you would calculate running balance from the entries
      const mockOpeningBalance = materialStats.value.length > 0 ? 
        materialStats.value[0].opening_stock : 1000;
        
      let runningBalance = mockOpeningBalance;
      const balanceData = dailyStats.value.map(day => {
        const received = day.movements
          .filter(m => ['stock_received', 'received_from_factory'].includes(m.type))
          .reduce((sum, m) => sum + (m.quantity || 0), 0);
        
        const used = day.movements
          .filter(m => ['production_usage', 'damages'].includes(m.type))
          .reduce((sum, m) => sum + (m.quantity || 0), 0);
        
        runningBalance += (received - used);
        return runningBalance;
      });
  
      const minStockLevel = materialStats.value.length > 0 ? 
        materialStats.value[0].min_stock : 500;
  
      return {
        labels,
        datasets: [
          {
            label: 'Stock Balance',
            data: balanceData,
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            type: 'line',
            fill: false,
            tension: 0.4
          },
          {
            label: 'Minimum Stock',
            data: Array(labels.length).fill(minStockLevel),
            borderColor: '#ef4444',
            borderDash: [5, 5],
            type: 'line',
            fill: false
          }
        ]
      };
    }
  
    // Movement view
    return {
      labels,
      datasets: [
        {
          label: 'Received',
          data: dailyStats.value.map(day => 
            day.movements
              .filter(m => ['stock_received', 'received_from_factory'].includes(m.type))
              .reduce((sum, m) => sum + (m.quantity || 0), 0)
          ),
          backgroundColor: '#10b981'
        },
        {
          label: 'Used',
          data: dailyStats.value.map(day => 
            day.movements
              .filter(m => ['production_usage', 'damages'].includes(m.type))
              .reduce((sum, m) => sum + (m.quantity || 0), 0)
          ),
          backgroundColor: '#ef4444'
        }
      ]
    };
  });
  
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
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatTransactionType(type) {
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
    const ratio = stat.closing_stock / stat.min_stock;
    if (ratio <= 0.5) return 'bg-red-100 text-red-800';
    if (ratio <= 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }
  
  function getStockStatusText(stat) {
    const ratio = stat.closing_stock / stat.min_stock;
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
      
      // Load materials and entries
      materials.value = await fetchMaterials('testuser1234');
      
      let entries = await fetchMaterialEntries('testuser1234', {
        startDate: startDate.value,
        endDate: endDate.value
      });
      
      // Filter by material if selected
      if (selectedMaterial.value !== 'all') {
        entries = entries.filter(entry => entry.material_id === selectedMaterial.value);
      }
      
      materialEntries.value = entries;
      
      // Calculate stats
      materialStats.value = calculateMaterialStats(entries, materials.value);
      dailyStats.value = groupEntriesByDate(entries);
      
      // Hide export menu if open
      showExportMenu.value = false;
      
      // If we don't have any real data, let's add some mock data for demonstration
      if (materialStats.value.length === 0) {
        mockReportData();
      }
    } catch (err) {
      handleToast('Error', 'Failed to generate report', 'red');
    } finally {
      isLoading.value = false;
    }
  }
  
  function mockReportData() {
    // Mock material stats
    materialStats.value = [
      {
        material_id: 'sugar-123',
        material_name: 'Raw Sugar (Dummy Data)',
        opening_stock: 5000,
        total_received: 2500,
        production_usage: 3000,
        returns: 200,
        damages: 100,
        factory_transfer: 300,
        net_movement: -700,
        closing_stock: 4300,
        avg_daily_usage: 428,
        min_stock: 1000
      },
      {
        material_id: 'flour-456',
        material_name: 'Flour',
        opening_stock: 3000,
        total_received: 1500,
        production_usage: 1900,
        returns: 100,
        damages: 50,
        factory_transfer: 0,
        net_movement: -350,
        closing_stock: 2650,
        avg_daily_usage: 271,
        min_stock: 800
      }
    ];
  
    // Mock daily stats
    dailyStats.value = [
      {
        date: '2025-03-01',
        total_movements: 3,
        movements: [
          {
            id: 1,
            timestamp: '2025-03-01T08:00:00',
            material_id: 'sugar-123',
            material_name: 'Raw Sugar (Dummy Data)',
            type: 'stock_received',
            quantity: 1000,
            reference: 'GRN-001',
            notes: 'Regular stock receipt'
          },
          {
            id: 2,
            timestamp: '2025-03-01T10:30:00',
            material_id: 'sugar-123',
            material_name: 'Raw Sugar (Dummy Data)',
            type: 'production_usage',
            quantity: 300,
            reference: 'PROD-001',
            notes: 'Morning production batch'
          },
          {
            id: 3,
            timestamp: '2025-03-01T14:00:00',
            material_id: 'flour-456',
            material_name: 'Flour',
            type: 'stock_received',
            quantity: 500,
            reference: 'GRN-002',
            notes: 'Emergency stock request'
          }
        ]
      },
      {
        date: '2025-02-28',
        total_movements: 2,
        movements: [
          {
            id: 4,
            timestamp: '2025-02-28T09:15:00',
            material_id: 'sugar-123',
            material_name: 'Raw Sugar (Dummy Data)',
            type: 'production_usage',
            quantity: 450,
            reference: 'PROD-002',
            notes: 'Daily production'
          },
          {
            id: 5,
            timestamp: '2025-02-28T16:30:00',
            material_id: 'flour-456',
            material_name: 'Flour',
            type: 'damages',
            quantity: 50,
            reference: 'DMG-001',
            notes: 'Water damage in storage'
          }
        ]
      }
    ];
  }
  
  function exportCSV() {
    try {
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
        'Avg Daily Usage'
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
        stat.avg_daily_usage
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
      handleToast('Error', 'Failed to export CSV', 'red');
    }
  }
  
  function exportPDF() {
    try {
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
        `Generated: ${formatDate(new Date().toISOString())}`,
        `Period: ${formatDate(startDate.value)} to ${formatDate(endDate.value)}`,
        `Total Materials: ${materialStats.value.length}`,
        `Total Entries: ${materialEntries.value.length}`
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
        (stat.closing_stock < (stat.min_stock || 0)) ? 'Low Stock' : 'OK'
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
  
  // Initialize
  onMounted(async () => {
    // Initialize date range
    document.addEventListener('click', (e) => {
      if (showExportMenu.value && !e.target.closest('.export-menu')) {
        showExportMenu.value = false;
      }
    });
  
    // Set default mock data if needed
    materials.value = [
      { id: 'sugar-123', name: 'Raw Sugar (Dummy Data)', min_stock: 1000 },
      { id: 'flour-456', name: 'Flour', min_stock: 800 }
    ];
    
    // Load initial data
    await loadReport();
  });
  </script>