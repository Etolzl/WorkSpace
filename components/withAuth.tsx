"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authOffline } from "@/lib/auth-offline"

export function withAuth<P>(WrappedComponent: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.replace("/login")
        return
      }

      // Validar el token y obtener datos del usuario (con soporte offline)
      authOffline.validateToken(token)
        .then(({ user: userData, fromCache }) => {
          setUser(userData)
          
          // Solo hacer redirecciones si NO estamos usando cache (para evitar loops cuando offline)
          if (!fromCache) {
            // Redirección basada en roles
            const userRole = userData.rol
            console.log("=== DEBUG AUTH ===")
            console.log("Usuario autenticado:", userData.nombre)
            console.log("Rol:", userRole)
            console.log("Pathname actual:", pathname)
            console.log("ID del usuario:", userData.id || userData._id)
            console.log("Desde cache:", fromCache)
            console.log("==================")
            
            // Si es admin y está en dashboard normal, redirigir a admin
            if (userRole === 'admin' && pathname === '/dashboard') {
              console.log("🚀 Redirigiendo admin a dashboard admin")
              router.replace('/dashboard/admin')
              return
            }
            
            // Si es usuario normal y está en dashboard admin, redirigir a dashboard normal
            if (userRole === 'usuario' && pathname.startsWith('/dashboard/admin')) {
              console.log("🚀 Redirigiendo usuario normal a dashboard")
              router.replace('/dashboard')
              return
            }
            
            // Si es usuario normal y está en analytics, redirigir a dashboard normal
            if (userRole === 'usuario' && pathname === '/dashboard/analytics') {
              console.log("🚀 Redirigiendo usuario normal a dashboard desde analytics")
              router.replace('/dashboard')
              return
            }
            
            console.log("✅ No se requieren redirecciones")
          } else {
            console.log("📴 Modo offline: usando datos guardados, sin redirecciones")
          }
        })
        .catch((error) => {
          console.error("Error en autenticación:", error)
          // Solo eliminar token y redirigir si realmente no hay datos guardados
          const cachedUser = authOffline.getUserData()
          if (!cachedUser) {
            localStorage.removeItem("token")
            router.replace("/login")
          } else {
            // Si hay datos guardados, usarlos aunque haya error
            console.log("⚠️ Error en validación pero usando datos guardados")
            setUser(cachedUser)
          }
        })
        .finally(() => setLoading(false))
    }, [router, pathname])

    if (loading) {
      return <div className="text-white p-8">Cargando...</div>
    }

    // Pasa el usuario como prop
    return <WrappedComponent {...props} user={user} />
  }
}