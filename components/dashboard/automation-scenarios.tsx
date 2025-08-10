"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Settings, Plus, Clock } from "lucide-react"
import { useEnvironments } from "@/components/dashboard/environments-context"

type Environment = {
  _id?: string
  id?: string
  nombre: string
  estado: boolean
  horaInicio?: string
  horaFin?: string
  sensores?: Array<{ idSensor: string }>
  diasSemana?: string[]
  createdAt?: string
}

interface AutomationScenariosProps {
  userId?: string | null
}

export function AutomationScenarios({ userId }: AutomationScenariosProps) {
  const router = useRouter()
  const { environments, loading, toggleEnvironmentStatus } = useEnvironments()

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Escenarios de Automatización</CardTitle>
            <CardDescription className="text-gray-300">Gestiona tus escenarios de automatización</CardDescription>
          </div>
          <Button
            onClick={() => router.push("/dashboard/environments")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-gray-300">Cargando entornos...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {environments.map((env) => {
              const isActive = !!env.estado
              const devices = env.sensores?.length ?? 0
              const scheduleText = env.horaInicio
                ? `${env.horaInicio}${env.horaFin ? ` - ${env.horaFin}` : ""}`
                : env.createdAt || ""
              return (
                <div
                  key={env._id || env.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{env.nombre}</h3>
                        {env.diasSemana && env.diasSemana.length > 0 ? (
                          <p className="text-gray-400 text-sm">{env.diasSemana.join(", ")}</p>
                        ) : null}
                      </div>
                    </div>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={
                        isActive
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {isActive ? "active" : "inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>{devices} devices</span>
                    <span>{scheduleText}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => toggleEnvironmentStatus(env)}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => router.push("/dashboard/environments")}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              )
            })}
            {environments.length === 0 && (
              <div className="text-gray-400">No tienes entornos aún. Crea el primero.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
