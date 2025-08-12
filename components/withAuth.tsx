"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

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

      // Validar el token y obtener datos del usuario
      fetch("http://localhost:4001/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("No autorizado")
          const data = await res.json()
          setUser(data.user)
          
          // Redirección basada en roles
          const userRole = data.user.rol
          console.log("=== DEBUG AUTH ===")
          console.log("Usuario autenticado:", data.user.nombre)
          console.log("Rol:", userRole)
          console.log("Pathname actual:", pathname)
          console.log("ID del usuario:", data.user.id || data.user._id)
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
        })
        .catch(() => {
          localStorage.removeItem("token")
          router.replace("/login")
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