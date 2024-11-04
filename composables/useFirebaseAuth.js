import { createUserWithEmailAndPassword, User} from 'firebase/auth'

export default function(){
    const registerUser = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user
            return user
        } catch (error) {
            console.error(error)
            return error
        }
    }
    
    return { registerUser }
}