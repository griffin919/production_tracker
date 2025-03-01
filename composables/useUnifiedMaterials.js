import { ref } from 'vue'
import { ref as dbRef, get, set, update, remove, child } from 'firebase/database'

export const useUnifiedMaterials = () => {
    const { $database } = useNuxtApp()
    
    // State
    const isLoading = ref(false)
    const error = ref(null)
    
    /**
     * Fetch materials that serve as both raw materials and inputs
     * @param {string} userId - User ID 
     * @returns {Promise<Array>} Array of materials
     */
    const fetchMaterials = async (userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            const materialsRef = dbRef($database, `${userId}/materials`)
            const snapshot = await get(materialsRef)
            
            if (snapshot.exists()) {
                const materialsArray = []
                snapshot.forEach((childSnapshot) => {
                    materialsArray.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    })
                })
                return materialsArray
            }
            return []
        } catch (err) {
            console.error('Error fetching materials:', err)
            error.value = err
            throw err
        } finally {
            isLoading.value = false
        }
    }
    
    /**
     * Add a new material (also serves as input)
     * @param {Object} data - Material data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    const addMaterial = async (data, userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            // Add to materials collection
            await set(dbRef($database, `${userId}/materials/${data.material_id}`), {
                ...data,
                timestamp: Date.now()
            })
            
            // Also add to inputs collection for production use
            await set(dbRef($database, `${userId}/inputs/${data.material_id}`), {
                input_id: data.material_id,
                name: data.name,
                unit: data.unit,
                timestamp: Date.now()
            })
            
            return { success: true }
        } catch (err) {
            console.error('Error adding material:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    /**
     * Update an existing material
     * @param {string} userId - User ID
     * @param {Object} data - Updated material data
     * @returns {Promise<Object>} Operation result
     */
    const updateMaterial = async (userId, data) => {
        isLoading.value = true
        error.value = null
        
        try {
            // Update in materials collection
            await update(dbRef($database, `${userId}/materials/${data.material_id}`), {
                ...data,
                updated_at: Date.now()
            })
            
            // Also update in inputs collection
            await update(dbRef($database, `${userId}/inputs/${data.material_id}`), {
                name: data.name,
                unit: data.unit,
                updated_at: Date.now()
            })
            
            return { success: true }
        } catch (err) {
            console.error('Error updating material:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    /**
     * Delete a material
     * @param {string} userId - User ID
     * @param {string} materialId - Material ID
     * @returns {Promise<Object>} Operation result
     */
    const deleteMaterial = async (userId, materialId) => {
        isLoading.value = true
        error.value = null
        
        try {
            // Remove from materials collection
            await remove(dbRef($database, `${userId}/materials/${materialId}`))
            
            // Also remove from inputs collection
            await remove(dbRef($database, `${userId}/inputs/${materialId}`))
            
            return { success: true }
        } catch (err) {
            console.error('Error deleting material:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    /**
     * Fetch material inventory transactions
     * @param {string} userId - User ID
     * @param {Object} dateRange - Date range for filtering
     * @returns {Promise<Array>} Array of material transactions
     */
    const fetchInventoryTransactions = async (userId, dateRange = {}) => {
        isLoading.value = true
        error.value = null
        
        try {
            const transactionsRef = dbRef($database, `${userId}/material_transactions`)
            const snapshot = await get(transactionsRef)
            
            if (snapshot.exists()) {
                const transactionsArray = []
                
                snapshot.forEach((childSnapshot) => {
                    const transaction = childSnapshot.val()
                    
                    // Apply date range filter if provided
                    if (dateRange.startDate && dateRange.endDate) {
                        const transactionDate = new Date(transaction.timestamp)
                        const startDate = new Date(dateRange.startDate)
                        const endDate = new Date(dateRange.endDate)
                        
                        // Set end date to end of day
                        endDate.setHours(23, 59, 59, 999)
                        
                        if (transactionDate < startDate || transactionDate > endDate) {
                            return
                        }
                    }
                    
                    transactionsArray.push({
                        id: childSnapshot.key,
                        ...transaction
                    })
                })
                
                // Sort by timestamp, newest first
                transactionsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                
                return transactionsArray
            }
            return []
        } catch (err) {
            console.error('Error fetching inventory transactions:', err)
            error.value = err
            throw err
        } finally {
            isLoading.value = false
        }
    }
    
    /**
     * Add a new inventory transaction
     * @param {Object} data - Transaction data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    const addInventoryTransaction = async (data, userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            const transactionRef = dbRef($database, `${userId}/material_transactions/${data.transaction_id}`)
            
            // Process transaction based on type
            let calculatedData = processTransactionData(data)
            
            await set(transactionRef, {
                ...calculatedData,
                timestamp: data.timestamp || new Date().toISOString()
            })
            
            // Update material current stock level
            await updateMaterialStock(userId, data.material_id, calculatedData)
            
            return { success: true }
        } catch (err) {
            console.error('Error adding inventory transaction:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    /**
     * Process transaction data based on type
     * @param {Object} data - Raw transaction data
     * @returns {Object} Processed transaction data
     */
    const processTransactionData = (data) => {
        const result = {
            ...data,
            quantity_in: 0,
            quantity_out: 0
        }
        
        // Determine transaction direction and quantities
        if (['stock_received', 'received_from_factory', 'return_from_production'].includes(data.type)) {
            result.quantity_in = data.quantity
        } else {
            result.quantity_out = data.quantity
        }
        
        return result
    }
    
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
            const materialRef = dbRef($database, `${userId}/materials/${materialId}`)
            const snapshot = await get(materialRef)
            
            if (snapshot.exists()) {
                const material = snapshot.val()
                const currentStock = material.current_stock || 0
                
                // Calculate new stock level
                const newStock = currentStock + (transaction.quantity_in - transaction.quantity_out)
                
                // Update material with new stock level
                await update(materialRef, {
                    current_stock: newStock,
                    last_updated: Date.now()
                })
            }
        } catch (err) {
            console.error('Error updating material stock:', err)
            throw err
        }
    }
    
    /**
     * Calculate inventory statistics
     * @param {Array} transactions - Inventory transactions
     * @param {Array} materials - Materials list
     * @returns {Object} Inventory statistics
     */
    const calculateInventoryStats = (transactions, materials) => {
        if (!transactions.length || !materials.length) return []
        
        // Group transactions by material
        const transactionsByMaterial = transactions.reduce((acc, transaction) => {
            if (!acc[transaction.material_id]) {
                acc[transaction.material_id] = []
            }
            acc[transaction.material_id].push(transaction)
            return acc
        }, {})
        
        // Calculate stats for each material
        const materialStats = materials.map(material => {
            const materialTransactions = transactionsByMaterial[material.id] || []
            
            // Default values
            const stats = {
                material_id: material.id,
                material_name: material.name,
                min_stock: material.min_stock || 0,
                unit: material.unit || '',
                opening_stock: material.opening_stock || 0,
                total_received: 0,
                production_usage: 0,
                returns: 0,
                damages: 0,
                factory_transfer: 0,
                closing_stock: material.current_stock || 0,
                avg_daily_usage: 0
            }
            
            // Calculate totals
            materialTransactions.forEach(transaction => {
                if (['stock_received', 'received_from_factory'].includes(transaction.type)) {
                    stats.total_received += (transaction.quantity_in || 0)
                } else if (transaction.type === 'return_from_production') {
                    stats.returns += (transaction.quantity_in || 0)
                } else if (transaction.type === 'production_usage') {
                    stats.production_usage += (transaction.quantity_out || 0)
                } else if (transaction.type === 'damages') {
                    stats.damages += (transaction.quantity_out || 0)
                } else if (transaction.type === 'sent_to_factory') {
                    stats.factory_transfer += (transaction.quantity_out || 0)
                }
            })
            
            // Calculate net movement
            stats.net_movement = (stats.total_received + stats.returns) -
                                (stats.production_usage + stats.damages + stats.factory_transfer)
            
            // Calculate average daily usage if we have transactions
            if (materialTransactions.length > 0) {
                // Get dates of first and last transaction
                const dates = materialTransactions.map(t => new Date(t.timestamp))
                const firstDate = new Date(Math.min(...dates))
                const lastDate = new Date(Math.max(...dates))
                
                // Calculate days difference, minimum 1 day
                const daysDiff = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)))
                
                // Calculate daily average
                stats.avg_daily_usage = stats.production_usage / daysDiff
            }
            
            return stats
        })
        
        return materialStats
    }
    
    return {
        isLoading,
        error,
        fetchMaterials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        fetchInventoryTransactions,
        addInventoryTransaction,
        calculateInventoryStats
    }
}