import { ref } from 'vue';
import { ref as dbRef, get, set, update, remove } from 'firebase/database';

export const useRawMaterials = () => {
    const { $database } = useNuxtApp();

    // State
    const isLoading = ref(false);
    const error = ref(null);

    /**
     * Fetch raw materials using Promise pattern
     * @param {string} userId - User ID 
     * @returns {Promise<Array>} Array of raw materials
     */
    const fetchMaterials = async (userId) => {
        isLoading.value = true;
        error.value = null;

        try {
            const materialsRef = dbRef($database, `${userId}/materials`);
            const snapshot = await get(materialsRef);

            if (snapshot.exists()) {
                const materialsArray = [];
                snapshot.forEach((childSnapshot) => {
                    materialsArray.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                return materialsArray;
            }
            return [];
        } catch (err) {
            console.error('Error fetching materials:', err);
            error.value = err;
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Add a new material
     * @param {Object} data - Material data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    const addMaterial = async (data, userId) => {
        isLoading.value = true;
        error.value = null;

        try {
            await set(dbRef($database, `${userId}/materials/${data.material_id}`), {
                ...data,
                timestamp: Date.now()
            });
            return { success: true };
        } catch (err) {
            console.error('Error adding material:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Delete a material
     * @param {string} userId - User ID
     * @param {string} materialId - Material ID
     * @returns {Promise<Object>} Operation result
     */
    const deleteMaterial = async (userId, materialId) => {
        isLoading.value = true;
        error.value = null;

        try {
            await remove(dbRef($database, `${userId}/materials/${materialId}`));
            return { success: true };
        } catch (err) {
            console.error('Error deleting material:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Update a material
     * @param {string} userId - User ID
     * @param {Object} data - Updated material data
     * @returns {Promise<Object>} Operation result
     */
    const updateMaterial = async (userId, data) => {
        isLoading.value = true;
        error.value = null;

        try {
            await update(dbRef($database, `${userId}/materials/${data.material_id}`), data);
            return { success: true };
        } catch (err) {
            console.error('Error updating material:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Fetch material entries
     * @param {string} userId - User ID
     * @param {Object} dateRange - Date range for filtering
     * @returns {Promise<Array>} Array of material entries
     */
    const fetchMaterialEntries = async (userId, dateRange = {}) => {
        isLoading.value = true;
        error.value = null;

        try {
            const entriesRef = dbRef($database, `${userId}/material_transactions`);
            const snapshot = await get(entriesRef);

            if (snapshot.exists()) {
                const entriesArray = [];

                snapshot.forEach((childSnapshot) => {
                    const entry = childSnapshot.val();

                    // Apply date range filter if provided
                    if (dateRange.startDate && dateRange.endDate) {
                        const entryDate = new Date(entry.timestamp);
                        const startDate = new Date(dateRange.startDate);
                        const endDate = new Date(dateRange.endDate);

                        // Set end date to end of day
                        endDate.setHours(23, 59, 59, 999);

                        if (entryDate < startDate || entryDate > endDate) {
                            return;
                        }
                    }

                    entriesArray.push({
                        id: childSnapshot.key,
                        ...entry
                    });
                });

                // Sort by timestamp, newest first
                entriesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                return entriesArray;
            }
            return [];
        } catch (err) {
            console.error('Error fetching material entries:', err);
            error.value = err;
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Add a new material entry
     * @param {Object} data - Entry data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    const addMaterialEntry = async (data, userId) => {
        isLoading.value = true;
        error.value = null;

        try {
            const entryRef = dbRef($database, `${userId}/material_transactions/${data.entry_id}`);

            // Process quantities based on entry type
            const entryData = {
                ...data,
                quantity_received: 0,
                quantity_used: 0,
                quantity_damaged: 0,
                timestamp: data.timestamp || new Date().toISOString()
            };

            // Determine which quantity field to use based on transaction type
            if (['stock_received', 'received_from_factory', 'return_from_production'].includes(data.type)) {
                entryData.quantity_received = data.quantity;
            } else if (data.type === 'damages') {
                entryData.quantity_damaged = data.quantity;
            } else {
                entryData.quantity_used = data.quantity;
            }

            await set(entryRef, entryData);

            return { success: true };
        } catch (err) {
            console.error('Error adding material entry:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Update a material entry
     * @param {string} userId - User ID
     * @param {Object} data - Updated entry data
     * @returns {Promise<Object>} Operation result
     */
    const updateMaterialEntry = async (userId, data) => {
        console.log("🚀 ~ updateMaterialEntry ~ userId, data:", userId, data)
        isLoading.value = true;
        error.value = null;

        try {
            // Process quantities based on entry type
            const entryData = {
                ...data,
                quantity_received: 0,
                quantity_used: 0,
                quantity_damaged: 0
            };

            // Determine which quantity field to use based on transaction type
            if (['stock_received', 'received_from_factory', 'return_from_production'].includes(data.type)) {
                entryData.quantity_received = data.quantity;
            } else if (data.type === 'damages') {
                entryData.quantity_damaged = data.quantity;
            } else {
                entryData.quantity_used = data.quantity;
            }

            await update(dbRef($database, `${userId}/material_transactions/${data.entry_id}`), entryData);

            return { success: true };
        } catch (err) {
            console.error('Error updating material entry:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Delete a material entry
     * @param {string} userId - User ID
     * @param {string} entryId - Entry ID
     * @returns {Promise<Object>} Operation result
     */
    const deleteMaterialEntry = async (userId, entryId) => {
        isLoading.value = true;
        error.value = null;

        try {
            await remove(dbRef($database, `${userId}/material_transactions/${entryId}`));
            return { success: true };
        } catch (err) {
            console.error('Error deleting material entry:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Calculate material stats
     * @param {Array} entries - Material entries
     * @param {Array} materials - Materials list
     * @returns {Object} Material statistics
     */
    const calculateMaterialStats = (entries, materials) => {
        if (!entries.length || !materials.length) return {};

        // Group entries by material
        const entriesByMaterial = entries.reduce((acc, entry) => {
            if (!acc[entry.material_id]) {
                acc[entry.material_id] = [];
            }
            acc[entry.material_id].push(entry);
            return acc;
        }, {});

        // Calculate stats for each material
        const materialStats = materials.map(material => {
            const materialEntries = entriesByMaterial[material.id] || [];

            // Sort entries by date (oldest first)
            materialEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Default values
            let stats = {
                material_id: material.id,
                material_name: material.name,
                min_stock: material.min_stock || 0,
                opening_stock: 0,
                total_received: 0,
                production_usage: 0,
                returns: 0,
                damages: 0,
                factory_transfer: 0,
                closing_stock: 0,
                avg_daily_usage: 0
            };

            // If we have entries, set opening stock from the first entry
            if (materialEntries.length) {
                stats.opening_stock = materialEntries[0].opening_balance || 0;
            }

            // Process all entries to calculate totals
            materialEntries.forEach(entry => {
                if (['stock_received', 'received_from_factory'].includes(entry.type)) {
                    stats.total_received += (entry.quantity_received || 0);
                } else if (entry.type === 'return_from_production') {
                    stats.returns += (entry.quantity_received || 0);
                } else if (entry.type === 'production_usage') {
                    stats.production_usage += (entry.quantity_used || 0);
                } else if (entry.type === 'damages') {
                    stats.damages += (entry.quantity_damaged || 0);
                } else if (entry.type === 'sent_to_factory') {
                    stats.factory_transfer += (entry.quantity_used || 0);
                }
            });

            // Calculate net movement and closing stock
            stats.net_movement = stats.total_received + stats.returns -
                                stats.production_usage - stats.damages - stats.factory_transfer;

            stats.closing_stock = stats.opening_stock + stats.net_movement;

            // Calculate average daily usage
            if (materialEntries.length > 0) {
                const firstDate = new Date(materialEntries[0].timestamp);
                const lastDate = new Date(materialEntries[materialEntries.length - 1].timestamp);
                const daysDiff = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
                stats.avg_daily_usage = stats.production_usage / daysDiff;
            }

            return stats;
        });

        return materialStats;
    };

    /**
     * Group entries by date
     * @param {Array} entries - Material entries
     * @returns {Object} Entries grouped by date
     */
    const groupEntriesByDate = (entries) => {
        if (!entries.length) return [];

        // Convert entries to daily structure
        const entriesByDate = entries.reduce((acc, entry) => {
            const date = new Date(entry.timestamp).toISOString().split('T')[0];

            if (!acc[date]) {
                acc[date] = {
                    date,
                    total_movements: 0,
                    movements: []
                };
            }

            acc[date].movements.push(entry);
            acc[date].total_movements++;

            return acc;
        }, {});

        // Convert to array and sort by date (newest first)
        const dailyStats = Object.values(entriesByDate);
        dailyStats.sort((a, b) => new Date(b.date) - new Date(a.date));

        return dailyStats;
    };

    return {
        isLoading,
        error,
        fetchMaterials,
        addMaterial,
        deleteMaterial,
        updateMaterial,
        fetchMaterialEntries,
        addMaterialEntry,
        updateMaterialEntry,
        deleteMaterialEntry,
        calculateMaterialStats,
        groupEntriesByDate
    };
};