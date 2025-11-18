"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authOffline } from "@/lib/auth-offline"

export function withAdminAuth<P>(WrappedComponent: React.ComponentType<P>) {
  return function AdminProtectedComponent(props: P) {
    const router = useRouter()
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
          
          console.log("=== DEBUG ADMIN AUTH ===")
          console.log("Usuario:", userData.nombre, "Rol:", userData.rol)
          console.log("Desde cache:", fromCache)
          console.log("=========================")
          
          // Verificar que el usuario sea administrador
          // Solo redirigir si NO estamos usando cache (para evitar problemas cuando offline)
          if (userData.rol !== 'admin' && !fromCache) {
            console.log("❌ Usuario no es admin, redirigiendo a dashboard")
            router.replace("/dashboard")
            return
          }
          
          if (userData.rol === 'admin') {
            console.log("✅ Usuario es admin, permitiendo acceso")
          } else if (fromCache) {
            console.log("⚠️ Usando datos guardados, verificando rol offline")
          }
        })
        .catch((error) => {
          console.error("Error en autenticación admin:", error)
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
    }, [router])

    if (loading) {
      return <div className="text-white p-8">Verificando permisos de administrador...</div>
    }

    // Solo renderizar si el usuario es administrador
    if (user?.rol !== 'admin') {
      return null
    }

    // Pasa el usuario como prop
    return <WrappedComponent {...props} user={user} />
  }
}
