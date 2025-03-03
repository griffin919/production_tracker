// Modified useUnifiedMaterials.js with fixes for inventory calculations
import { ref } from 'vue';
import { ref as dbRef, get, set, update, remove, child } from 'firebase/database';

export const useUnifiedMaterials = () => {
    const { $database } = useNuxtApp();

    // State
    const isLoading = ref(false);
    const error = ref(null);

    /**
     * Fetch materials that serve as both raw materials and inputs
     * @param {string} userId - User ID 
     * @returns {Promise<Array>} Array of materials
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
     * Add a new material (also serves as input)
     * @param {Object} data - Material data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    const addMaterial = async (data, userId) => {
        isLoading.value = true;
        error.value = null;

        try {
            // Add to materials collection
            await set(dbRef($database, `${userId}/materials/${data.material_id}`), {
                ...data,
                timestamp: Date.now()
            });

            // Also add to inputs collection for production use
            await set(dbRef($database, `${userId}/inputs/${data.material_id}`), {
                input_id: data.material_id,
                name: data.name,
                unit: data.unit,
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
     * Update an existing material
     * @param {string} userId - User ID
     * @param {Object} data - Updated material data
     * @returns {Promise<Object>} Operation result
     */
    const updateMaterial = async (userId, data) => {
        isLoading.value = true;
        error.value = null;

        try {
            // Update in materials collection
            await update(dbRef($database, `${userId}/materials/${data.material_id}`), {
                ...data,
                updated_at: Date.now()
            });

            // Also update in inputs collection
            await update(dbRef($database, `${userId}/inputs/${data.material_id}`), {
                name: data.name,
                unit: data.unit,
                updated_at: Date.now()
            });

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
     * Delete a material
     * @param {string} userId - User ID
     * @param {string} materialId - Material ID
     * @returns {Promise<Object>} Operation result
     */
    const deleteMaterial = async (userId, materialId) => {
        isLoading.value = true;
        error.value = null;

        try {
            // Remove from materials collection
            await remove(dbRef($database, `${userId}/materials/${materialId}`));

            // Also remove from inputs collection
            await remove(dbRef($database, `${userId}/inputs/${materialId}`));

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
     * Fetch material inventory transactions
     * @param {string} userId - User ID
     * @param {Object} dateRange - Date range for filtering
     * @returns {Promise<Array>} Array of material transactions
     */
    const fetchInventoryTransactions = async (userId, dateRange = {}) => {
        isLoading.value = true;
        error.value = null;

        try {
            const transactionsRef = dbRef($database, `${userId}/material_transactions`);
            const snapshot = await get(transactionsRef);

            if (snapshot.exists()) {
                const transactionsArray = [];

                snapshot.forEach((childSnapshot) => {
                    const transaction = childSnapshot.val();

                    // Skip invalid transactions
                    if (!transaction || !transaction.timestamp) {
                        console.warn(`Invalid transaction found with key: ${childSnapshot.key}`);
                        return;
                    }

                    // Apply date range filter if provided
                    if (dateRange.startDate && dateRange.endDate) {
                        const transactionDate = new Date(transaction.timestamp);
                        const startDate = new Date(dateRange.startDate);
                        const endDate = new Date(dateRange.endDate);

                        // Set end date to end of day
                        endDate.setHours(23, 59, 59, 999);

                        if (transactionDate < startDate || transactionDate > endDate) {
                            return;
                        }
                    }

                    // Process the transaction
                    const processedTransaction = {
                        id: childSnapshot.key,
                        ...transaction
                    };

                    // Ensure numeric values
                    processedTransaction.quantity_in = Number(transaction.quantity_in || 0);
                    processedTransaction.quantity_out = Number(transaction.quantity_out || 0);
                    processedTransaction.quantity_damaged = Number(transaction.quantity_damaged || 0);
                    processedTransaction.opening_balance = Number(transaction.opening_balance || 0);
                    processedTransaction.running_balance = Number(transaction.running_balance || 0);

                    transactionsArray.push(processedTransaction);
                });

                // Sort by timestamp
                transactionsArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                return transactionsArray;
            }
            return [];
        } catch (err) {
            console.error('Error fetching inventory transactions:', err);
            error.value = err;
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Add a new inventory transaction
     * @param {Object} data - Transaction data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    const addInventoryTransaction = async (data, userId) => {
        isLoading.value = true;
        error.value = null;

        try {
            const transactionRef = dbRef($database, `${userId}/material_transactions/${data.transaction_id}`);

            // Ensure quantity data is numeric
            const processedData = {
                ...data,
                quantity: Number(data.quantity || 0),
                quantity_in: Number(data.quantity_in || 0),
                quantity_out: Number(data.quantity_out || 0),
                quantity_damaged: Number(data.quantity_damaged || 0),
                opening_balance: Number(data.opening_balance || 0),
                running_balance: Number(data.running_balance || 0)
            };

            // Save the transaction
            await set(transactionRef, {
                ...processedData,
                timestamp: data.timestamp || new Date().toISOString()
            });

            // Update material current stock level
            await updateMaterialStock(userId, data.material_id, processedData);

            return { success: true };
        } catch (err) {
            console.error('Error adding inventory transaction:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Update an inventory transaction
     * @param {string} userId - User ID
     * @param {Object} data - Updated transaction data
     * @returns {Promise<Object>} Operation result
     */
    const updateInventoryTransaction = async (userId, data) => {
        isLoading.value = true;
        error.value = null;

        try {
            if (!data.entry_id && !data.transaction_id) {
                throw new Error('Transaction ID is required');
            }

            const transactionId = data.entry_id || data.transaction_id;

            // Ensure numeric data
            const processedData = {
                ...data,
                quantity: Number(data.quantity || 0),
                quantity_in: Number(data.quantity_in || 0),
                quantity_out: Number(data.quantity_out || 0),
                quantity_damaged: Number(data.quantity_damaged || 0),
                opening_balance: Number(data.opening_balance || 0),
                running_balance: Number(data.running_balance || 0)
            };

            // Update the transaction
            await update(dbRef($database, `${userId}/material_transactions/${transactionId}`), processedData);

            // Update material stock
            await updateMaterialStock(userId, data.material_id, processedData);

            return { success: true };
        } catch (err) {
            console.error('Error updating inventory transaction:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Update material stock level
     * @param {string} userId - User ID
     * @param {string} materialId - Material ID
     * @param {Object} transaction - Transaction data
     * @returns {Promise<void>}
     */
    const updateMaterialStock = async (userId, materialId, transaction) => {
        try {
            // Get current material data
            const materialRef = dbRef($database, `${userId}/materials/${materialId}`);
            const snapshot = await get(materialRef);

            if (snapshot.exists()) {
                const material = snapshot.val();
                
                // Calculate the net change from this transaction
                const netChange = (Number(transaction.quantity_in) || 0) - 
                                 (Number(transaction.quantity_out) || 0) - 
                                 (Number(transaction.quantity_damaged) || 0);
                
                // Get current stock level
                let currentStock = Number(material.current_stock || 0);
                
                // For update operations, we need to account for the previous values
                if (transaction.entry_id) {
                    // Fetch the old transaction to reverse its effect
                    const oldTransactionRef = dbRef($database, `${userId}/material_transactions/${transaction.entry_id}`);
                    const oldTransactionSnapshot = await get(oldTransactionRef);
                    
                    if (oldTransactionSnapshot.exists()) {
                        const oldTransaction = oldTransactionSnapshot.val();
                        
                        // Calculate and subtract the old effect
                        const oldNetChange = (Number(oldTransaction.quantity_in) || 0) - 
                                           (Number(oldTransaction.quantity_out) || 0) - 
                                           (Number(oldTransaction.quantity_damaged) || 0);
                        
                        // Remove old effect before adding new one
                        currentStock -= oldNetChange;
                    }
                }
                
                // Calculate new stock level
                const newStock = currentStock + netChange;
                
                // Update material with new stock level
                await update(materialRef, {
                    current_stock: newStock,
                    last_updated: Date.now()
                });
            }
        } catch (err) {
            console.error('Error updating material stock:', err);
            throw err;
        }
    };
    
    /**
     * Delete a material transaction
     * @param {string} userId - User ID
     * @param {string} transactionId - Transaction ID to delete
     * @returns {Promise<Object>} Operation result
     */
    const deleteMaterialEntry = async (userId, transactionId) => {
        isLoading.value = true;
        error.value = null;

        try {
            // Get the transaction first to reverse its effect on stock
            const transactionRef = dbRef($database, `${userId}/material_transactions/${transactionId}`);
            const snapshot = await get(transactionRef);
            
            if (snapshot.exists()) {
                const transaction = snapshot.val();
                
                // Reverse the transaction effect by negating quantity values
                const reversedTransaction = {
                    ...transaction,
                    quantity_in: -(Number(transaction.quantity_in) || 0),
                    quantity_out: -(Number(transaction.quantity_out) || 0),
                    quantity_damaged: -(Number(transaction.quantity_damaged) || 0)
                };
                
                // Update material stock to reverse the effect
                await updateMaterialStock(userId, transaction.material_id, reversedTransaction);
                
                // Delete the transaction
                await remove(transactionRef);
                
                return { success: true };
            } else {
                return { success: false, message: 'Transaction not found' };
            }
        } catch (err) {
            console.error('Error deleting material entry:', err);
            error.value = err;
            return { success: false, message: err.message };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Calculate material stats for reporting
     * @param {Array} entries - Material entries
     * @param {Array} materials - Materials list
     * @returns {Array} Material statistics
     */
    const calculateMaterialStats = (entries, materials, dateRange = {}) => {
        if (!Array.isArray(entries) || !Array.isArray(materials)) {
            console.warn('Invalid entries or materials provided to calculateMaterialStats');
            return [];
        }
    
        // Create start and end date objects if date range is provided
        let startDateObj, endDateObj;
        if (dateRange.startDate && dateRange.endDate) {
            startDateObj = new Date(dateRange.startDate);
            startDateObj.setHours(0, 0, 0, 0);
            
            endDateObj = new Date(dateRange.endDate);
            endDateObj.setHours(23, 59, 59, 999);
        }
    
        // Group all entries by material for processing
        const entriesByMaterial = entries.reduce((acc, entry) => {
            if (!entry.material_id) return acc;
            
            if (!acc[entry.material_id]) {
                acc[entry.material_id] = [];
            }
            acc[entry.material_id].push(entry);
            return acc;
        }, {});
    
        // Calculate stats for each material
        const materialStats = materials.map(material => {
            const materialId = material.id;
            const allMaterialEntries = entriesByMaterial[materialId] || [];
    
            // Sort entries by date (oldest first) for accurate calculations
            allMaterialEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
            // Initialize stats
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
                closing_stock: Number(material.current_stock || 0),
                avg_daily_usage: 0
            };
    
            // If date range is specified
            if (startDateObj && endDateObj) {
                // Find entries that occurred before the start date
                const entriesBeforeStart = allMaterialEntries.filter(entry => 
                    new Date(entry.timestamp) < startDateObj
                );
                
                // Find the most recent entry before start date to get opening balance
                if (entriesBeforeStart.length > 0) {
                    const lastEntryBeforeStart = entriesBeforeStart[entriesBeforeStart.length - 1];
                    stats.opening_stock = Number(lastEntryBeforeStart.running_balance || 0);
                }
                
                // Filter entries within the date range
                const entriesInRange = allMaterialEntries.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate >= startDateObj && entryDate <= endDateObj;
                });
                
                // Process all entries within date range
                entriesInRange.forEach(entry => {
                    // Add received quantities
                    if (['stock_received', 'received_from_factory'].includes(entry.type)) {
                        stats.total_received += Number(entry.quantity_in || 0);
                    } else if (entry.type === 'return_from_production') {
                        stats.returns += Number(entry.quantity_in || 0);
                    } 
                    
                    // Add used quantities
                    if (entry.type === 'production_usage') {
                        stats.production_usage += Number(entry.quantity_out || 0);
                    } else if (entry.type === 'damages') {
                        stats.damages += Number(entry.quantity_damaged || entry.quantity_out || 0);
                    } else if (entry.type === 'sent_to_factory') {
                        stats.factory_transfer += Number(entry.quantity_out || 0);
                    }
                });
    
                // Calculate net movement within date range
                stats.net_movement = stats.total_received + stats.returns -
                                   stats.production_usage - stats.damages - stats.factory_transfer;
                                   
                // If we have entries in range, update closing stock based on last entry in range
                if (entriesInRange.length > 0) {
                    const lastEntryInRange = entriesInRange[entriesInRange.length - 1];
                    stats.closing_stock = Number(lastEntryInRange.running_balance || 0);
                } else {
                    // If no entries in range but we have an opening stock, closing = opening
                    stats.closing_stock = stats.opening_stock;
                }
                
                // Calculate average daily usage if we have production usage
                if (stats.production_usage > 0 && entriesInRange.length > 0) {
                    // Calculate days between start and end date
                    const daysDiff = Math.max(1, Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)));
                    stats.avg_daily_usage = stats.production_usage / daysDiff;
                }
            } else {
                // If no date range specified, use all entries
                if (allMaterialEntries.length > 0) {
                    // Set opening stock from first entry
                    stats.opening_stock = Number(allMaterialEntries[0].opening_balance || 0);
                    
                    // Process all entries
                    allMaterialEntries.forEach(entry => {
                        // Add received quantities
                        if (['stock_received', 'received_from_factory'].includes(entry.type)) {
                            stats.total_received += Number(entry.quantity_in || 0);
                        } else if (entry.type === 'return_from_production') {
                            stats.returns += Number(entry.quantity_in || 0);
                        } 
                        
                        // Add used quantities
                        if (entry.type === 'production_usage') {
                            stats.production_usage += Number(entry.quantity_out || 0);
                        } else if (entry.type === 'damages') {
                            stats.damages += Number(entry.quantity_damaged || entry.quantity_out || 0);
                        } else if (entry.type === 'sent_to_factory') {
                            stats.factory_transfer += Number(entry.quantity_out || 0);
                        }
                    });
                    
                    // Calculate net movement
                    stats.net_movement = stats.total_received + stats.returns -
                                       stats.production_usage - stats.damages - stats.factory_transfer;
                    
                    // Set closing stock from last entry
                    const lastEntry = allMaterialEntries[allMaterialEntries.length - 1];
                    stats.closing_stock = Number(lastEntry.running_balance || 0);
                    
                    // Calculate average daily usage if multiple entries
                    if (stats.production_usage > 0 && allMaterialEntries.length > 1) {
                        const firstDate = new Date(allMaterialEntries[0].timestamp);
                        const lastDate = new Date(allMaterialEntries[allMaterialEntries.length - 1].timestamp);
                        const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
                        stats.avg_daily_usage = stats.production_usage / daysDiff;
                    }
                }
            }
    
            return stats;
        });
    
        return materialStats;
    };

    return {
        isLoading,
        error,
        fetchMaterials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        fetchInventoryTransactions,
        addInventoryTransaction,
        updateInventoryTransaction,
        deleteMaterialEntry,
        calculateMaterialStats
    };
};