import { ref } from 'vue'
import { ref as dbRef, get, set, update, remove, child } from 'firebase/database'

export const useManageInput = () => {
    const { $database } = useNuxtApp()
    
    // State
    const isLoading = ref(false)
    const error = ref(null)
    
    // Fetch input using Promise pattern
    const fetchInputs = async (userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            const inputRef = dbRef($database, `${userId}/inputs`)
            const snapshot = await get(inputRef)
            
            if (snapshot.exists()) {
                const inputArray = []
                snapshot.forEach((childSnapshot) => {
                    inputArray.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    })
                })
                return inputArray
            }
            return []
        } catch (err) {
            console.error('Error fetching input:', err)
            error.value = err
            throw err
        } finally {
            isLoading.value = false
        }
    }
    
    // Record new input
    const addNewInput = async (data, userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            await set(dbRef($database, `${userId}/inputs/${data.input_id}`), {
                ...data,
                timestamp: Date.now()
            })
            return { success: true }
        } catch (err) {
            console.error('Error recording input:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    // Delete input
    const deleteInput = async (userId, input_id) => {
        isLoading.value = true
        error.value = null
        
        try {
            await remove(dbRef($database, `${userId}/inputs/${input_id}`))
            return { success: true }
        } catch (err) {
            console.error('Error deleting input:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    // Update input
    const updateInput = async (userId, data) => {
        isLoading.value = true
        error.value = null
        
        try {
            await update(dbRef($database, `${userId}/inputs/${data.input_id}`), data)
            return { success: true }
        } catch (err) {
            console.error('Error updating input:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    return {
        isLoading,
        error,
       fetchInputs,
        addNewInput,
        updateInput,
        deleteInput
    }
}