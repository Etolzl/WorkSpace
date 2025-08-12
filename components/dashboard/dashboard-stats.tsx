import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Lightbulb, Volume2, Plug, Camera, Fan, Snowflake, Droplets, VenetianMask, Eye, Wind } from "lucide-react"
import { useEnvironments } from "@/components/dashboard/environments-context"
import { useSensors } from "@/components/dashboard/sensors-context"

export function DashboardStats() {
  const { environments, loading } = useEnvironments()
  const { sensorsState, getSensorValue, getSensorState } = useSensors()
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
      case "FAN":
        return Fan
      case "AIR_CONDITIONER":
        return Snowflake
      case "HUMIDITY_SENSOR":
        return Droplets
      case "CURTAIN":
        return VenetianMask
      case "AIR_PURIFIER":
        return Wind
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
      case "FAN":
        return "text-green-400"
      case "AIR_CONDITIONER":
        return "text-cyan-400"
      case "HUMIDITY_SENSOR":
        return "text-cyan-400"
      case "CURTAIN":
        return "text-purple-400"
      case "AIR_PURIFIER":
        return "text-blue-400"
      default:
        return "text-gray-300"
    }
  }

  const getValueDisplay = (tipo: string, valor: number) => {
    switch (tipo) {
      case "TEMPERATURE_SENSOR":
        return `${valor}°C`
      case "LIGHT":
        return `${valor}%`
      case "HUMIDITY_SENSOR":
        return `${valor}%`
      case "FAN":
        return `Nivel ${valor}`
      case "AIR_CONDITIONER":
        return `${valor}°C`
      case "AIR_PURIFIER":
        return `Nivel ${valor}`
      case "CURTAIN":
        return `${valor}%`
      case "MOTION_SENSOR":
        return valor > 0 ? "Activo" : "Inactivo"
      case "SMART_PLUG":
        return valor > 0 ? "Encendido" : "Apagado"
      default:
        return valor.toString()
    }
  }

  const getStatusColor = (estado: boolean) => {
    return estado 
      ? "bg-green-500/20 text-green-400 border-green-500/30" 
      : "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getStatusText = (estado: boolean) => {
    return estado ? "Activo" : "Inactivo"
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
          {!loading && activeEnvs.map((env) => {
            const envId = (env._id || env.id) as string
            return (
              <div key={envId} className="space-y-3">
                <div className="text-white font-semibold">{env.nombre}</div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {env.sensores?.map((sensor) => {
                    const Icon = getIconForType(sensor.tipoSensor)
                    const color = getColorForType(sensor.tipoSensor)
                    const currentValue = getSensorValue(envId, sensor.idSensor)
                    const currentState = getSensorState(envId, sensor.idSensor)
                    
                    return (
                      <div key={sensor.idSensor} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-5 h-5 ${color}`} />
                            <span className="text-white font-medium">{sensor.nombreSensor}</span>
                          </div>
                          <Badge className={getStatusColor(currentState)}>
                            {getStatusText(currentState)}
                          </Badge>
                        </div>
                        <div className="text-gray-400 text-sm mb-2">{sensor.tipoSensor}</div>
                        <div className="text-white font-semibold text-lg">
                          {getValueDisplay(sensor.tipoSensor, currentValue)}
                        </div>
                      </div>
                    )
                  })}
                  {(!env.sensores || env.sensores.length === 0) && (
                    <div className="text-gray-400">Sin sensores</div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
