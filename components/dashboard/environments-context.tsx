"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Environment = {
  _id?: string
  id?: string
  nombre: string
  estado: boolean
  horaInicio?: string
  horaFin?: string
  sensores?: Array<{ idSensor: string; nombreSensor: string; tipoSensor: string }>
  diasSemana?: string[]
  usuario?: string
  createdAt?: string
}

type EnvironmentsContextValue = {
  environments: Environment[]
  loading: boolean
  refreshEnvironments: () => Promise<void>
  toggleEnvironmentStatus: (environment: Environment) => Promise<void>
}

const EnvironmentsContext = createContext<EnvironmentsContextValue | undefined>(undefined)

export function EnvironmentsProvider({ userId, children }: { userId?: string | null; children: React.ReactNode }) {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const refreshEnvironments = useCallback(async () => {
    if (!userId) {
      setEnvironments([])
      return
    }
    try {
      setLoading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      
      // Usar dashboardCache que maneja offline automáticamente
      const { dashboardCache } = await import("@/lib/dashboard-cache")
      const data = await dashboardCache.fetchEnvironments(userId, token)
      setEnvironments(data)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      // Intentar usar datos del caché como último recurso
      try {
        const { dashboardCache } = await import("@/lib/dashboard-cache")
        const cached = dashboardCache.getDashboardData()
        if (cached && cached.environments) {
          const userEnvs = cached.environments.filter((e: any) => e.usuario === userId)
          setEnvironments(userEnvs)
        } else {
          setEnvironments([])
        }
      } catch {
        setEnvironments([])
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refreshEnvironments()
  }, [refreshEnvironments])

  const toggleEnvironmentStatus = useCallback(
    async (environment: Environment) => {
      const envId = environment._id || environment.id
      if (!envId) return
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const { dashboardCache } = await import("@/lib/dashboard-cache")
      const isOffline = !dashboardCache.isOnline()
      const newEstado = !environment.estado
      
      // Actualizar el estado localmente inmediatamente para feedback visual
      // Esto funciona tanto online como offline
      const cached = dashboardCache.getDashboardData()
      if (cached && cached.environments) {
        const updatedEnvironments = cached.environments.map((env: any) => {
          if ((env._id === envId || env.id === envId)) {
            return { ...env, estado: newEstado }
          }
          return env
        })
        dashboardCache.saveDashboardData({ environments: updatedEnvironments })
        // Actualizar el estado local también
        setEnvironments(updatedEnvironments.filter((e: any) => e.usuario === userId))
      }
      
      // Si estamos offline, el interceptor de fetch guardará la petición en IndexedDB
      // Si estamos online, la petición se ejecutará normalmente
      try {
        const res = await fetch(`http://https://workspaceapi-b81x.onrender.com/entornos/cambiar-estado/${envId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ estado: newEstado }),
        })
        
        // Verificar si la respuesta es offline (guardada en IndexedDB)
        const responseData = await res.json().catch(() => ({}))
        if (responseData.offline) {
          console.log("✅ Petición guardada para sincronización offline")
          // El estado ya se actualizó localmente arriba
          return
        }
        
        if (!res.ok) throw new Error("No se pudo actualizar el estado")
        
        // Si la petición fue exitosa y estamos online, refrescar para obtener datos actualizados
        if (!isOffline) {
          await refreshEnvironments()
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        // Si hay error pero estamos offline, el estado ya se actualizó localmente
        // El interceptor debería haber guardado la petición en IndexedDB
        if (isOffline) {
          console.log("📴 Petición guardada en IndexedDB para sincronización posterior")
        }
      }
    },
    [refreshEnvironments, userId]
  )

  const value = useMemo<EnvironmentsContextValue>(
    () => ({ environments, loading, refreshEnvironments, toggleEnvironmentStatus }),
    [environments, loading, refreshEnvironments, toggleEnvironmentStatus]
  )

  return <EnvironmentsContext.Provider value={value}>{children}</EnvironmentsContext.Provider>
}

export function useEnvironments() {
  const ctx = useContext(EnvironmentsContext)
  if (!ctx) throw new Error("useEnvironments debe usarse dentro de EnvironmentsProvider")
  return ctx
}


