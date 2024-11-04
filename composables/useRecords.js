import { ref } from 'vue'
import { ref as dbRef, get, set, update, remove } from 'firebase/database'

/**
 * Composable for managing records in Firebase Realtime Database
 * @returns {Object} Collection of methods and reactive state for records management
 */
export const useRecords = () => {
    const { $database } = useNuxtApp()

    // Reactive state
    const isLoading = ref(false)
    const error = ref(null)

    /**
     * Clear error state
     */
    const clearError = () => {
        error.value = null
    }

    /**
     * Handle database operation with loading state and error handling
     * @param {Function} operation - Async operation to perform
     * @returns {Promise} Result of the operation
     */
    const handleDatabaseOperation = async (operation) => {
        isLoading.value = true
        clearError()

        try {
            const result = await operation()
            return { success: true, data: result }
        } catch (err) {
            console.error('Database operation failed:', err)
            error.value = err.message
            return { success: false, error: err.message }
        } finally {
            isLoading.value = false
        }
    }

    /**
  * Fetch records with related data
  * @param {string} userId - User ID
  * @param {Object} dateRange - Optional date range for filtering
  * @param {Date} dateRange.startDate - Start date
  * @param {Date} dateRange.endDate - End date
  * @returns {Promise<Array>} Array of records with related data
  */
    const fetchRecords = async (userId, dateRange = {}) => {
        console.log("🚀 ~ fetchRecords ~ dateRange:", dateRange)
        return handleDatabaseOperation(async () => {
            // Input validation
            if (!userId || typeof userId !== 'string') {
                throw new Error('Valid user ID string is required')
            }

            // Define database paths
            const paths = {
                records: `${userId}/records`,
                equipment: `${userId}/equipments`,
                inputs: `${userId}/inputs`
            }

            try {
                // Fetch all required data in parallel
                const [recordsSnap, equipmentSnap, inputsSnap] = await Promise.all([
                    get(dbRef($database, paths.records)),
                    get(dbRef($database, paths.equipment)),
                    get(dbRef($database, paths.inputs))
                ])

                // Early return if no records exist
                if (!recordsSnap.exists()) {
                    return []
                }

                // Create lookup maps with null safety
                const equipment = equipmentSnap.val() || {}
                const inputs = inputsSnap.val() || {}

                const records = []

                // Process records with improved validation and error handling
                recordsSnap.forEach((snapshot) => {
                    const record = snapshot.val()

                    // Validate record data
                    if (!record || !record.date) {
                        console.warn(`Invalid record found with key: ${snapshot.key}`)
                        return
                    }

                    const recordDate = new Date(record.date)

                    // Validate and apply date range filter if provided
                    if (dateRange.startDate && dateRange.endDate) {
                        const startDate = new Date(dateRange.startDate)
                        const endDate = new Date(dateRange.endDate)

                        // add 1 day to the end date to include the end date in the range
                        endDate.setDate(endDate.getDate() + 1)

                        // Validate date range
                        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            console.warn('Invalid date range provided')
                            return
                        }

                        if (recordDate < startDate || recordDate > endDate) {
                            return
                        }
                    }

                    // Get equipment data with fallback
                    const equipmentData = equipment[record.equipment_id] || {
                        name: 'Unknown Equipment',
                        code: 'N/A'
                    }

                    // Process inputs with validation
                    const inputData = Object.entries(record.inputTypes || {}).map(([key, value]) => {
                        const input = inputs[value] || {}
                        return {
                            input_id: input.input_id,
                            name: input.name,
                            timestamp: input.timestamp,
                            unit: input.unit
                        }
                    })

                    // Construct the final record object
                    records.push({
                        id: snapshot.key,
                        ...record,
                        equipment_name: equipmentData.name,
                        equipment_code: equipmentData.code,
                        inputs: inputData,
                        timestamp: recordDate.getTime() // Add timestamp for sorting if needed
                    })
                })

                // Sort records by date (newest first)
                records.sort((a, b) => b.timestamp - a.timestamp)

                return records
            } catch (error) {
                console.error('Error fetching records:', error)
                throw new Error(`Failed to fetch records: ${error.message}`)
            }
        })
    }

    /**
  * Fetches and processes today's records for a specific user
  * @param {string} userId - The ID of the user
  * @returns {Promise<Array>} Array of processed records
  */
    const fetchTodayRecords = async (userId) => {
        return handleDatabaseOperation(async () => {
            // Input validation
            if (!userId || typeof userId !== 'string') {
                throw new Error('Valid user ID string is required');
            }

            // Define database paths
            const paths = {
                records: `${userId}/records`,
                equipment: `${userId}/equipments`,
                inputs: `${userId}/inputs`
            };

            try {
                // Fetch all required data in parallel
                const [recordsSnap, equipmentSnap, inputsSnap] = await Promise.all([
                    get(dbRef($database, paths.records)),
                    get(dbRef($database, paths.equipment)),
                    get(dbRef($database, paths.inputs))
                ]);

                // Early return if no records exist
                if (!recordsSnap.exists()) {
                    return [];
                }

                // Create lookup maps with null safety
                const equipment = equipmentSnap.val() || {};
                const inputs = inputsSnap.val() || {};

                // Get today's date string for comparison
                const today = new Date().toDateString();

                // Process and filter records
                const records = [];
                recordsSnap.forEach((snapshot) => {
                    const record = snapshot.val();

                    // Validate record data
                    if (!record || !record.date) {
                        console.warn(`Invalid record found with key: ${snapshot.key}`);
                        return;
                    }

                    // Filter for today's records
                    const recordDate = new Date(record.date);
                    if (recordDate.toDateString() !== today) {
                        return;
                    }

                    // Get equipment data with fallback
                    const equipmentData = equipment[record.equipment_id] || {
                        name: 'Unknown Equipment',
                        code: 'N/A'
                    };

                    // Process inputs with validation
                    const inputData = Object.entries(record.inputTypes || {}).map(([key, value]) => {
                        const input = inputs[value] || {};
                        return {
                            input_id: input.input_id,
                            name: input.name,
                            timestamp: input.timestamp,
                            unit: input.unit
                        };
                    });


                    // Construct the final record object
                    records.push({
                        id: snapshot.key,
                        ...record,
                        equipment_name: equipmentData.name,
                        equipment_code: equipmentData.code,
                        inputs: inputData,
                        timestamp: new Date(record.date).getTime() // Add timestamp for sorting if needed
                    });
                });

                // Sort records by date (newest first) if needed
                records.sort((a, b) => b.timestamp - a.timestamp);
                console.log("🚀 ~ returnhandleDatabaseOperation ~ records:", records)


                return records;
            } catch (error) {
                console.error('Error fetching today\'s records:', error);
                throw new Error(`Failed to fetch today's records: ${error.message}`);
            }
        });
    };

    /**
     * Add a new record
     * @param {Object} data - Record data
     * @param {string} userId - User ID
     */
    const addNewRecord = async (data, userId) => {
        return handleDatabaseOperation(async () => {
            if (!data.record_id || !userId) {
                throw new Error('Record ID and User ID are required')
            }

            await set(dbRef($database, `${userId}/records/${data.record_id}`), {
                ...data,
                created_at: Date.now(),
                updated_at: Date.now()
            })
        })
    }

    /**
     * Update an existing record
     * @param {string} userId - User ID
     * @param {Object} data - Updated record data
     */
    const updateRecord = async (userId, data) => {
        return handleDatabaseOperation(async () => {
            if (!data.record_id || !userId) {
                throw new Error('Record ID and User ID are required')
            }

            await update(dbRef($database, `${userId}/records/${data.record_id}`), {
                ...data,
                updated_at: Date.now()
            })
        })
    }

    /**
     * Delete a record
     * @param {string} userId - User ID
     * @param {string} recordId - Record ID to delete
     */
    const deleteRecord = async (userId, recordId) => {
        return handleDatabaseOperation(async () => {
            if (!userId || !recordId) {
                throw new Error('User ID and Record ID are required')
            }

            await remove(dbRef($database, `${userId}/records/${recordId}`))
        })
    }

    return {
        isLoading,
        error,
        clearError,
        fetchRecords,
        addNewRecord,
        updateRecord,
        deleteRecord,
        fetchTodayRecords
    }
}