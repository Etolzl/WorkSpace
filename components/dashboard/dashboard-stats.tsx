import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Thermometer, Lightbulb, CheckCircle, TrendingUp, TrendingDown, Clock } from "lucide-react"

export function DashboardStats() {
  const todayActivities = [
    { time: "06:00", action: "Encender luces de la recámara", status: "completed" },
    { time: "07:30", action: "Ajustar temperatura de la sala", status: "completed" },
    { time: "18:00", action: "Activar sistema de seguridad", status: "pending" },
    { time: "22:00", action: "Apagar todas las luces", status: "pending" },
  ]

  const sensorData = [
    { name: "Sala", type: "temperatura", value: "22°C", status: "normal", icon: Thermometer, color: "blue" },
    { name: "Cocina", type: "luz", value: "85%", status: "normal", icon: Lightbulb, color: "yellow" },
    { name: "Recámara", type: "temperatura", value: "18°C", status: "normal", icon: Thermometer, color: "blue" },
    { name: "Jardín", type: "luz", value: "45%", status: "low", icon: Lightbulb, color: "orange" },
  ]

  const usageStats = [
    { name: "Dispositivos Activos", value: "24", change: "+2", trend: "up", icon: CheckCircle },
    { name: "Automatizaciones", value: "156", change: "+8%", trend: "up", icon: Clock },
    { name: "Tiempo de Actividad", value: "99.9%", change: "0%", trend: "up", icon: CheckCircle },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Today's Activities */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">Actividades Programadas de Hoy</CardTitle>
          </div>
          <CardDescription className="text-gray-300">Tareas automatizadas para hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400 font-mono text-sm">{activity.time}</div>
                  <div className="text-gray-300">{activity.action}</div>
                </div>
                <Badge
                  variant={activity.status === "completed" ? "default" : "secondary"}
                  className={
                    activity.status === "completed"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }
                >
                  {activity.status === "completed" ? "completado" : "pendiente"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Estadísticas de Uso</CardTitle>
          <CardDescription className="text-gray-300">Resumen de hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageStats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{stat.value}</div>
                      <div className="text-gray-400 text-sm">{stat.name}</div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center space-x-1 ${stat.trend === "up" ? "text-green-400" : "text-red-400"}`}
                  >
                    {stat.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm">{stat.change}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Status */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-white">Estado de Sensores</CardTitle>
          <CardDescription className="text-gray-300">Lecturas de sensores en tiempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sensorData.map((sensor, index) => {
              const IconComponent = sensor.icon
              return (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-5 h-5 text-${sensor.color}-400`} />
                      <span className="text-white font-medium">{sensor.name}</span>
                    </div>
                    <Badge
                      variant={sensor.status === "normal" ? "default" : "secondary"}
                      className={
                        sensor.status === "normal"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      }
                    >
                      {sensor.status === "normal" ? "normal" : "bajo"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white">{sensor.value}</div>
                  <div className="text-gray-400 text-sm capitalize">{sensor.type}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
