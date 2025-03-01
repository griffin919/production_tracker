<template>
    <div class="container px-4 py-6">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">Materials Inventory</h2>
        
        <!-- Date Range and Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex gap-2 items-center">
            <input 
              type="date" 
              class="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
              v-model="filters.startDate"
            />
            <span class="text-gray-500">to</span>
            <input 
              type="date" 
              class="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
              v-model="filters.endDate"
            />
            <button 
              class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-1.5"
              @click="loadMaterialEntries"
              :disabled="isLoading"
            >
              <Search v-if="!isLoading" class="h-4 w-4" />
              <Loader2 v-else class="h-4 w-4 animate-spin" />
            </button>
          </div>
          
          <button 
            class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1.5"
            @click="showEntryModal = true"
          >
            <PlusCircle class="h-4 w-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>
  
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <h6 class="text-sm text-gray-500 mb-1">Opening Balance</h6>
          <div class="text-xl font-semibold">{{ formatNumber(periodStats.openingBalance) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <h6 class="text-sm text-gray-500 mb-1">Total Received</h6>
          <div class="text-xl font-semibold text-green-600">{{ formatNumber(periodStats.totalReceived) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <h6 class="text-sm text-gray-500 mb-1">Total Used</h6>
          <div class="text-xl font-semibold text-blue-600">{{ formatNumber(periodStats.totalUsed) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <h6 class="text-sm text-gray-500 mb-1">Closing Balance</h6>
          <div class="text-xl font-semibold">{{ formatNumber(periodStats.closingBalance) }}</div>
        </div>
      </div>
  
      <!-- Daily Entries Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center p-12">
          <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
          <span class="ml-2 text-gray-600">Loading materials data...</span>
        </div>
  
        <!-- Empty State -->
        <div 
          v-else-if="Object.keys(groupedEntries).length === 0" 
          class="text-center py-12"
        >
          <InboxIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 mb-2">No entries found for the selected date range</p>
          <button 
            @click="showEntryModal = true"
            class="px-4 py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add First Entry
          </button>
        </div>
  
        <!-- Data Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Damages</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="(entries, date) in groupedEntries" :key="date">
                <!-- Date Header -->
                <tr class="bg-gray-50">
                  <td colspan="10" class="px-6 py-2 font-medium text-gray-800">
                    {{ formatDate(date) }}
                  </td>
                </tr>
                <!-- Entries for the date -->
                <tr 
                  v-for="entry in entries" 
                  :key="entry.id"
                  :class="{'bg-yellow-50': isNegativeBalance(entry)}"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatTime(entry.timestamp) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ entry.material_name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span :class="getTransactionTypeClass(entry.type)">
                      {{ formatTransactionType(entry.type) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatNumber(entry.opening_balance) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatNumber(entry.quantity_received) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatNumber(entry.quantity_used) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatNumber(entry.quantity_damaged) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ formatNumber(entry.running_balance) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ entry.reference }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex space-x-2">
                      <button 
                        @click="editEntry(entry)"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        <Edit class="h-4 w-4" />
                      </button>
                      <button 
                        @click="deleteEntry(entry.id)"
                        class="text-red-600 hover:text-red-900"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- Material Entry Modal -->
      <UModal v-model="showEntryModal">
        <div class="p-6 max-w-2xl w-full mx-auto">
          <h2 class="text-xl font-semibold mb-4">
            {{ selectedEntry ? 'Edit Material Entry' : 'New Material Entry' }}
          </h2>
  
          <form @submit.prevent="saveEntry" class="space-y-4">
            <!-- Date & Time -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input 
                type="datetime-local"
                v-model="entryForm.timestamp"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
  
            <!-- Material -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <select 
                v-model="entryForm.material_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Material</option>
                <option 
                  v-for="material in materials"
                  :key="material.id"
                  :value="material.id"
                >
                  {{ material.name }}
                </option>
              </select>
            </div>
  
            <!-- Transaction Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select 
                v-model="entryForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Type</option>
                <optgroup label="Stock Additions">
                  <option value="stock_received">Stock Received</option>
                  <option value="received_from_factory">From Factory</option>
                  <option value="return_from_production">Production Return</option>
                </optgroup>
                <optgroup label="Stock Reductions">
                  <option value="production_usage">Production Usage</option>
                  <option value="sent_to_factory">Sent to Factory</option>
                  <option value="damages">Damages/Losses</option>
                </optgroup>
              </select>
            </div>
  
            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input 
                type="number"
                v-model.number="entryForm.quantity"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
  
            <!-- Reference -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input 
                type="text"
                v-model="entryForm.reference"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., GRN number, Batch number"
              />
            </div>
  
            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea 
                v-model="entryForm.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>
  
            <!-- Error Message -->
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {{ error }}
            </div>
  
            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="closeEntryModal"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
                <Save v-else class="h-4 w-4" />
                {{ isSaving ? "Saving..." : "Save Entry" }}
              </button>
            </div>
          </form>
        </div>
      </UModal>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted } from 'vue';
  import { v4 as uuidv4 } from 'uuid';
  import { useUnifiedMaterials } from '~/composables/useUnifiedMaterials';
  import { 
    PlusCircle, 
    Search, 
    Loader2, 
    Edit, 
    Trash2, 
    Save,
    InboxIcon
  } from 'lucide-vue-next';
  
  // Composables
  const { 
    isLoading, 
    error: apiError, 
    fetchMaterials, 
    fetchInventoryTransactions: fetchMaterialEntries, 
    addInventoryTransaction: addMaterialEntry, 
    updateInventoryTransaction: updateMaterialEntry, 
    deleteMaterialEntry 
  } = useUnifiedMaterials();
  
  const toast = useToast();
  
  // State
  const materials = ref([]);
  const materialEntries = ref([]);
  const showEntryModal = ref(false);
  const selectedEntry = ref(null);
  const isSaving = ref(false);
  const error = ref('');
  
  // Filters
  const filters = reactive({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Form data
  const entryForm = reactive(getDefaultEntryForm());
  
  // Computed properties
  const groupedEntries = computed(() => {
    // Group entries by date
    return materialEntries.value.reduce((groups, entry) => {
      if (!entry || !entry.timestamp) return groups;
      
      const date = entry.timestamp.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {});
  });
  
  const periodStats = computed(() => {
    let stats = {
      openingBalance: 0,
      totalReceived: 0,
      totalUsed: 0,
      closingBalance: 0
    };
  
    // Get all unique materials in the entries
    const uniqueMaterialIds = [...new Set(materialEntries.value.map(entry => entry.material_id))];
    
    // Calculate stats for each material
    uniqueMaterialIds.forEach(materialId => {
      // Get all entries for this material, sorted by date
      const materialEntryList = materialEntries.value
        .filter(entry => entry.material_id === materialId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      if (materialEntryList.length) {
        // Get the first and last entry for this material
        const firstEntry = materialEntryList[0];
        const lastEntry = materialEntryList[materialEntryList.length - 1];
        
        // Add to total opening balance and closing balance
        stats.openingBalance += firstEntry.opening_balance || 0;
        stats.closingBalance += lastEntry.running_balance || 0;
        
        // Calculate received and used
        materialEntryList.forEach(entry => {
          stats.totalReceived += (entry.quantity_received || 0);
          stats.totalUsed += (entry.quantity_used || 0) + (entry.quantity_damaged || 0);
        });
      }
    });
  
    return stats;
  });
  
  // Methods
  function getDefaultEntryForm() {
    return {
      transaction_id: uuidv4(),
      timestamp: new Date().toISOString().slice(0, 16),
      material_id: '',
      material_name: '',
      type: '',
      quantity: 0,
      opening_balance: 0,
      running_balance: 0,
      reference: '',
      notes: ''
    };
  }
  
  function formatNumber(value) {
    return new Intl.NumberFormat().format(value || 0);
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
  
  function isNegativeBalance(entry) {
    return entry.running_balance < 0;
  }
  
  async function loadMaterials() {
    try {
      materials.value = await fetchMaterials('testuser1234');
    } catch (err) {
      handleToast('Error', 'Failed to load materials', 'red');
    }
  }
  
  async function loadMaterialEntries() {
    try {
      materialEntries.value = await fetchMaterialEntries('testuser1234', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    } catch (err) {
      handleToast('Error', 'Failed to load material entries', 'red');
    }
  }
  
  function editEntry(entry) {
    selectedEntry.value = entry;
    Object.assign(entryForm, {
      transaction_id: entry.id,
      timestamp: entry.timestamp.slice(0, 16),
      material_id: entry.material_id,
      material_name: entry.material_name,
      type: entry.type,
      quantity: entry.quantity_received || entry.quantity_used || entry.quantity_damaged || 0,
      reference: entry.reference || '',
      notes: entry.notes || ''
    });
    showEntryModal.value = true;
  }
  
  async function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
  
    try {
      const result = await deleteMaterialEntry('testuser1234', id);
      if (result.success) {
        handleToast('Success', 'Entry deleted successfully', 'green');
        await loadMaterialEntries();
      } else {
        throw new Error(result.message || 'Failed to delete entry');
      }
    } catch (err) {
      handleToast('Error', err.message || 'Failed to delete entry', 'red');
    }
  }
  
  async function saveEntry() {
    if (isSaving.value) return;
    error.value = '';
  
    try {
      isSaving.value = true;
  
      // Get material name for display
      const material = materials.value.find(m => m.id === entryForm.material_id);
      if (!material) {
        throw new Error('Selected material not found');
      }
      
      entryForm.material_name = material.name;
      
      // Calculate the current stock level for this material
      const materialStock = material.current_stock || 0;
      
      // Set the opening balance based on the material's current stock
      entryForm.opening_balance = materialStock;
      
      // Calculate running balance based on transaction type
      if (['stock_received', 'received_from_factory', 'return_from_production'].includes(entryForm.type)) {
        entryForm.running_balance = materialStock + entryForm.quantity;
      } else {
        entryForm.running_balance = materialStock - entryForm.quantity;
      }
  
      if (selectedEntry.value) {
        // Update existing entry
        const result = await updateMaterialEntry('testuser1234', entryForm);
        
        if (result.success) {
          handleToast('Success', 'Entry updated successfully', 'green');
        } else {
          throw new Error(result.message || 'Failed to update entry');
        }
      } else {
        // Create new entry
        const result = await addMaterialEntry(entryForm, 'testuser1234');
        
        if (result.success) {
          handleToast('Success', 'Entry added successfully', 'green');
        } else {
          throw new Error(result.message || 'Failed to add entry');
        }
      }
  
      await loadMaterialEntries();
      await loadMaterials(); // Refresh materials to get updated stock levels
      closeEntryModal();
    } catch (err) {
      error.value = err.message || 'An error occurred while saving';
    } finally {
      isSaving.value = false;
    }
  }
  
  function closeEntryModal() {
    showEntryModal.value = false;
    selectedEntry.value = null;
    Object.assign(entryForm, getDefaultEntryForm());
    error.value = '';
  }
  
  function handleToast(title, description, color) {
    toast.add({
      title,
      description,
      color,
    });
  }
  
  // Lifecycle hooks
  onMounted(async () => {
    // Set default date range to last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    filters.startDate = sevenDaysAgo.toISOString().split('T')[0];
    filters.endDate = today.toISOString().split('T')[0];
  
    await loadMaterials();
    await loadMaterialEntries();
    
    // Mock data for testing - remove in production
    if (materialEntries.value.length === 0) {
      materialEntries.value = [
        {
          id: 1,
          timestamp: '2025-03-01T08:00:00',
          material_id: 'sugar-123',
          material_name: 'Raw Sugar (Dummy Data)',
          type: 'stock_received',
          quantity_received: 1000,
          quantity_used: 0,
          quantity_damaged: 0,
          opening_balance: 500,
          running_balance: 1500,
          reference: 'GRN-001',
          notes: 'Regular stock receipt'
        },
        {
          id: 2,
          timestamp: '2025-03-01T10:30:00',
          material_id: 'sugar-123',
          material_name: 'Raw Sugar (Dummy Data)',
          type: 'production_usage',
          quantity_received: 0,
          quantity_used: 300,
          quantity_damaged: 0,
          opening_balance: 1500,
          running_balance: 1200,
          reference: 'PROD-001',
          notes: 'Morning production batch'
        }
      ];
    }
  });
  </script>