"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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

      // Validar el token y obtener datos del usuario
      fetch("http://localhost:4001/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("No autorizado")
          const data = await res.json()
          setUser(data.user)
          
          console.log("=== DEBUG ADMIN AUTH ===")
          console.log("Usuario:", data.user.nombre, "Rol:", data.user.rol)
          console.log("=========================")
          
          // Verificar que el usuario sea administrador
          if (data.user.rol !== 'admin') {
            console.log("❌ Usuario no es admin, redirigiendo a dashboard")
            router.replace("/dashboard")
            return
          }
          
          console.log("✅ Usuario es admin, permitiendo acceso")
        })
        .catch(() => {
          localStorage.removeItem("token")
          router.replace("/login")
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
