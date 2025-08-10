import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Lightbulb, Volume2, Plug, Camera } from "lucide-react"
import { useEnvironments } from "@/components/dashboard/environments-context"

export function DashboardStats() {
  const { environments, loading } = useEnvironments()
  const activeEnvs = environments.filter((e) => e.estado)

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case "TEMPERATURE_SENSOR":
        return Thermometer
      case "LIGHT":
        return Lightbulb
      case "SMART_PLUG":
        return Plug
      case "MOTION_SENSOR":
        return Camera
      default:
        return Plug
    }
  }

  const getColorForType = (tipo: string) => {
    switch (tipo) {
      case "TEMPERATURE_SENSOR":
        return "text-blue-400"
      case "LIGHT":
        return "text-yellow-400"
      case "SMART_PLUG":
        return "text-purple-400"
      case "MOTION_SENSOR":
        return "text-pink-400"
      default:
        return "text-gray-300"
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Estado de Sensores</CardTitle>
          <CardDescription className="text-gray-300">
            {loading ? "Cargando..." : activeEnvs.length > 0 ? "Sensores de entornos activos" : "No hay entornos activos"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!loading && activeEnvs.map((env) => (
            <div key={env._id || env.id} className="space-y-3">
              <div className="text-white font-semibold">{env.nombre}</div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {env.sensores?.map((sensor) => {
                  const Icon = getIconForType(sensor.tipoSensor)
                  const color = getColorForType(sensor.tipoSensor)
                  return (
                    <div key={sensor.idSensor} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-5 h-5 ${color}`} />
                          <span className="text-white font-medium">{sensor.nombreSensor}</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>
                      </div>
                      <div className="text-gray-400 text-sm">{sensor.tipoSensor}</div>
                    </div>
                  )
                })}
                {(!env.sensores || env.sensores.length === 0) && (
                  <div className="text-gray-400">Sin sensores</div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
