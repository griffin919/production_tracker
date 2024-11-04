import { ref } from 'vue'
import { ref as dbRef, get, set, update, remove, child } from 'firebase/database'

export const useManageInCharge = () => {
    const { $database } = useNuxtApp()

    // State
    const isLoading = ref(false)
    const error = ref(null)

    // Fetch ncharge using Promise pattern
    const fetchIncharge = async (userId) => {
        isLoading.value = true
        error.value = null

        try {
            const inchargeRef = dbRef($database, `${userId}/incharge`)
            const snapshot = await get(inchargeRef)

            if (snapshot.exists()) {
                const inchargeArray = []
                snapshot.forEach((childSnapshot) => {
                    inchargeArray.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    })
                })
                return inchargeArray
            }
            return []
        } catch (err) {
            console.error('Error fetching incharge:', err)
            error.value = err
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Record new incharge
    const addNewIncharge = async (data, userId) => {
        isLoading.value = true
        error.value = null

        try {
            await set(dbRef($database, `${userId}/incharge/${data.incharge_id}`), {
                ...data,
                timestamp: Date.now()
            })
            return { success: true }
        } catch (err) {
            console.error('Error recording incharge:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }

    // Delete incharge
    const deleteIncharge = async (userId, incharge_id) => {
        isLoading.value = true
        error.value = null

        try {
            await remove(dbRef($database, `${userId}/incharge/${incharge_id}`))
            return { success: true }
        } catch (err) {
            console.error('Error deleting incharge:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }

    // Update incharge
    const updateIncharge = async (userId, data) => {
        isLoading.value = true
        error.value = null

        try {
            await update(dbRef($database, `${userId}/incharge/${data.incharge_id}`), data)
            return { success: true }
        } catch (err) {
            console.error('Error updating incharge:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }

    return {
        isLoading,
        error,
        fetchIncharge,
        addNewIncharge,
        deleteIncharge,
        updateIncharge
    }
}