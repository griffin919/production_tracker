// middleware/auth.global.js
export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server-side and during client-side hydration
  if (process.server || import.meta.env.SSR) {
    return
  }

  // Add a small delay to ensure DOM is fully hydrated
  return new Promise(resolve => {
    setTimeout(() => {
      // Get the pin from localStorage
      const pin = localStorage.getItem('user_pin')

      // Allow access to login page
      if (to.path === '/') {
        // If user is already logged in, redirect based on their pin
        if (pin) {
          // Admin PIN: redirect to dashboard
          if (pin === '8090') {
            resolve(navigateTo('/entry', { replace: true }))
            return
          }
          // User PIN: redirect to entry page
          if (pin === '1090') {
            resolve(navigateTo('/records', { replace: true }))
            return
          }
        }
        resolve()
        return
      }

      // If not authenticated at all, redirect to login
      if (!pin) {
        resolve(navigateTo('/', { replace: true }))
        return
      }

      // Handle route access based on PIN
      if (pin === '8090') {
        // Admin PIN: only allow access to dashboard
        if (to.path !== '/entry') {
          resolve(navigateTo('/entry', { replace: true }))
          return
        }
      } else if (pin === '1090') {
        // User PIN: allow access to all routes
        resolve()
        return
      } else {
        // Invalid PIN: redirect to login
        localStorage.removeItem('user_pin')
        resolve(navigateTo('/', { replace: true }))
        return
      }
      
      resolve()
    }, 10)
  })
})