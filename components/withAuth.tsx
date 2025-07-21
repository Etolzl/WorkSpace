"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function withAuth<P>(WrappedComponent: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.replace("/login")
        return
      }

      // Opcional: Validar el token y obtener datos del usuario
      fetch("https://workspaceapi-b81x.onrender.com/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("No autorizado")
          const data = await res.json()
          setUser(data.user)
        })
        .catch(() => {
          localStorage.removeItem("token")
          router.replace("/login")
        })
        .finally(() => setLoading(false))
    }, [router])

    if (loading) {
      return <div className="text-white p-8">Cargando...</div>
    }

    // Pasa el usuario como prop
    return <WrappedComponent {...props} user={user} />
  }
}