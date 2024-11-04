import { ref } from 'vue'
import { ref as dbRef, get, set, update, remove, child } from 'firebase/database'

export const useManageEquipComp = () => {
    const { $database } = useNuxtApp()
    
    // State
    const isLoading = ref(false)
    const error = ref(null)
    
    // Fetch equipment using Promise pattern
    const fetchEquipments = async (userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            const equipmentRef = dbRef($database, `${userId}/equipments`)
            const snapshot = await get(equipmentRef)
            
            if (snapshot.exists()) {
                const equipmentArray = []
                snapshot.forEach((childSnapshot) => {
                    equipmentArray.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    })
                })
                return equipmentArray
            }
            return []
        } catch (err) {
            console.error('Error fetching equipment:', err)
            error.value = err
            throw err
        } finally {
            isLoading.value = false
        }
    }
    
    // Record new equipment
    const addEquipment = async (data, userId) => {
        isLoading.value = true
        error.value = null
        
        try {
            await set(dbRef($database, `${userId}/equipments/${data.equipment_id}`), {
                ...data,
                timestamp: Date.now()
            })
            return { success: true }
        } catch (err) {
            console.error('Error recording equipment:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    // Delete equipment
    const deleteEquipment = async (userId, equipment_id) => {
        isLoading.value = true
        error.value = null
        
        try {
            await remove(dbRef($database, `${userId}/equipments/${equipment_id}`))
            return { success: true }
        } catch (err) {
            console.error('Error deleting equipment:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    // Update equipment
    const updateEquipment = async (userId, data) => {
        isLoading.value = true
        error.value = null
        
        try {
            await update(dbRef($database, `${userId}/equipments/${data.equipment_id}`), data)
            return { success: true }
        } catch (err) {
            console.error('Error updating equipment:', err)
            error.value = err
            return { success: false, message: err.message }
        } finally {
            isLoading.value = false
        }
    }
    
    return {
        isLoading,
        error,
        fetchEquipments,
        addEquipment,
        deleteEquipment,
        updateEquipment,
    }
}