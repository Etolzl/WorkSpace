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
      const res = await fetch(`http://localhost:4001/entornos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error(`Error al obtener entornos (${res.status})`)
      const data: Environment[] = await res.json()
      const userEnvs = Array.isArray(data) ? data.filter((e) => e.usuario === userId) : []
      setEnvironments(userEnvs)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      setEnvironments([])
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
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const res = await fetch(`http://localhost:4001/entornos/cambiar-estado/${envId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ estado: !environment.estado }),
        })
        if (!res.ok) throw new Error("No se pudo actualizar el estado")
        await refreshEnvironments()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
      }
    },
    [refreshEnvironments]
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


