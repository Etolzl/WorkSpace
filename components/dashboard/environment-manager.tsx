"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Settings, Play, Pause, Calendar, Music, Thermometer, Lightbulb, Lock, Camera, Wifi, Volume2, Edit, Trash2, Eye, Clock, CheckCircle, XCircle, CalendarClock, Fan, AirVent, Droplets, VenetianMask, Wind } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'

interface Environment {
  _id?: string;
  id?: string;
  nombre: string;
  estado: boolean;
  horaInicio: string;
  horaFin: string;
  sensores: {
    idSensor: string;
    nombreSensor: string;
    tipoSensor: string;
    valorSensor: number;
    color?: string;
  }[];
  diasSemana: string[];
  playlist: {
    id: string;
    tema: string;
  }[];
  usuario: string;
  createdAt?: string;
  lastActivated?: string;
}

interface Sensor {
  id: string
  name: string
  type: string
  icon: any
  location: string
}

interface Playlist {
  id: string
  name: string
  description: string
  duration: string
}

export function EnvironmentManager() {
  // Form state (debe ir primero)
  const [formData, setFormData] = useState({
    name: "",
    status: "inactive" as "active" | "inactive" | "scheduled",
    sensors: [] as string[],
    scheduledDay: [] as string[],
    scheduledStartTime: "",
    scheduledEndTime: "",
    playlist: "",
  })

  // Edit environment states (después de formData)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<typeof formData>(formData)
  const [editEnvironmentId, setEditEnvironmentId] = useState<string | null>(null)

  const [environments, setEnvironments] = useState<Environment[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [userId, setUserId] = useState<string>("")

  const availableSensors: Sensor[] = [
    // Existing sensors
    { id: "light_001", name: "Luz Habitación", type: "LIGHT", icon: Lightbulb, location: "Habitación" },
    { id: "light_002", name: "Luz Sala", type: "LIGHT", icon: Lightbulb, location: "Sala" },
    { id: "light_003", name: "Luz Cocina", type: "LIGHT", icon: Lightbulb, location: "Cocina" },
    
    // New sensor types
    { id: "fan_001", name: "Ventilador Principal", type: "FAN", icon: Fan, location: "Habitación" },
    { id: "fan_002", name: "Ventilador Secundario", type: "FAN", icon: Fan, location: "Sala" },
    { id: "ac_001", name: "Aire Acondicionado Principal", type: "AIR_CONDITIONER", icon: AirVent, location: "Habitación" },
    { id: "ac_002", name: "Aire Acondicionado Sala", type: "AIR_CONDITIONER", icon: AirVent, location: "Sala" },
    { id: "ac_003", name: "Aire Acondicionado Oficina", type: "AIR_CONDITIONER", icon: AirVent, location: "Oficina" },
    { id: "humid_001", name: "Sensor Humedad Habitación", type: "HUMIDITY_SENSOR", icon: Droplets, location: "Habitación" },
    { id: "humid_002", name: "Sensor Humedad Sala", type: "HUMIDITY_SENSOR", icon: Droplets, location: "Sala" },
    { id: "curtain_001", name: "Cortinas Principales", type: "CURTAIN", icon: VenetianMask, location: "Habitación" },
    { id: "curtain_002", name: "Cortinas Sala", type: "CURTAIN", icon: VenetianMask, location: "Sala" },
    { id: "purifier_001", name: "Purificador Aire Habitación", type: "AIR_PURIFIER", icon: Wind, location: "Habitación" },
    { id: "purifier_002", name: "Purificador Aire Sala", type: "AIR_PURIFIER", icon: Wind, location: "Sala" },
    
    // Existing other sensors
    { id: "temp_001", name: "Termostato Sala", type: "TEMPERATURE_SENSOR", icon: Thermometer, location: "Sala" },
    { id: "audio_001", name: "Audio Sala", type: "SMART_PLUG", icon: Volume2, location: "Sala" },
    { id: "camera_001", name: "Cámara Entrada", type: "MOTION_SENSOR", icon: Camera, location: "Entrada" },
  ]

  const availablePlaylists: Playlist[] = [
    { id: "1", name: "Relajante", description: "Música relajante para concentración", duration: "2h" },
    { id: "2", name: "Energizante", description: "Música para mantener la energía", duration: "1h" },
    { id: "3", name: "Fondo", description: "Música ambiental de fondo", duration: "4h" },
    { id: "4", name: "Clásica", description: "Música clásica para trabajar", duration: "3h" },
    { id: "5", name: "Naturaleza", description: "Sonidos de la naturaleza", duration: "8h" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "inactive":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "scheduled":
        return "Programado"
      default:
        return "Desconocido"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "inactive":
        return <XCircle className="w-4 h-4" />
      case "scheduled":
        return <CalendarClock className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const getSensorInfo = (sensorId: string) => {
    return availableSensors.find((s) => s.id === sensorId)
  }

  const getPlaylistInfo = (playlistId: string) => {
    return availablePlaylists.find((p) => p.id === playlistId)
  }

  const fetchEnvironments = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("❌ No hay token de autenticación")
        return
      }

      console.log("🔍 Obteniendo entornos para userId:", userId)
      
      const res = await fetch("http://localhost:4001/entornos", {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      })
      
      if (!res.ok) {
        throw new Error(`Error al obtener entornos: ${res.status}`)
      }
      
      const data = await res.json()
      console.log("📦 Datos recibidos del backend:", data)
      
      // Filtrar entornos solo del usuario autenticado
      if (Array.isArray(data)) {
        const userEnvironments = data.filter(env => env.usuario === userId)
        console.log(`✅ Total entornos: ${data.length}, Entornos del usuario: ${userEnvironments.length}`)
        console.log("🔍 Entornos filtrados:", userEnvironments)
        setEnvironments(userEnvironments)
      } else {
        console.error("❌ Formato de respuesta inesperado:", data)
        setEnvironments([])
      }
    } catch (error) {
      console.error("❌ Error al obtener entornos:", error)
      setEnvironments([])
    }
  }

  useEffect(() => {
    if (userId) {
      fetchEnvironments()
    }
  }, [userId])

  const diasSemanaMap: Record<string, string> = {
    "lunes": "Lunes",
    "martes": "Martes",
    "miércoles": "Miércoles",
    "jueves": "Jueves",
    "viernes": "Viernes",
    "sábado": "Sábado",
    "domingo": "Domingo",
  }

  const handleCreateEnvironment = async () => {
    console.log("User ID:", userId)

    if (!formData.name || !userId) {
      alert("Por favor complete el nombre del entorno y asegúrese de estar autenticado")
      return
    }

    // Mapea los días seleccionados al formato esperado por el backend
    const diasSemana = formData.scheduledDay.map((d) => diasSemanaMap[d] || d)

    const newEnvironment = {
      nombre: formData.name,
      estado: formData.status === "active",
      horaInicio: formData.scheduledStartTime || "08:00",
      horaFin: formData.scheduledEndTime || "18:00",
      sensores: formData.sensors.map(sensorId => {
        const sensor = availableSensors.find(s => s.id === sensorId)
        return {
          idSensor: sensorId,
          nombreSensor: sensor?.name || "Sensor desconocido",
          tipoSensor: sensor?.type || "UNKNOWN",
          valorSensor: 0
        }
      }),
      diasSemana, // <-- Usa el formato correcto
      playlist: formData.playlist ? [{
        id: formData.playlist,
        tema: availablePlaylists.find(p => p.id === formData.playlist)?.name || "Playlist desconocida"
      }] : [],
      usuario: userId,
      createdAt: new Date().toISOString()
    }

    try {
      const response = await fetch("http://localhost:4001/entornos/crear-entornos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(newEnvironment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear entorno")
      }

      const createdEnvironment = await response.json()
      setIsCreateModalOpen(false)
      resetForm()
      fetchEnvironments()
    } catch (error: any) {
      console.error("Error al crear entorno:", error)
      alert(`Error: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      status: "inactive",
      sensors: [],
      scheduledDay: [],
      scheduledStartTime: "",
      scheduledEndTime: "",
      playlist: "",
    })
  }

  const handleSensorToggle = (sensorId: string) => {
    setFormData((prev) => ({
      ...prev,
      sensors: prev.sensors.includes(sensorId)
        ? prev.sensors.filter((id) => id !== sensorId)
        : [...prev.sensors, sensorId],
    }))
  }

  // Nueva función para manejar el toggle de sensores en el modal de edición
  const handleEditSensorToggle = (sensorId: string) => {
    setEditFormData((prev) => ({
      ...prev,
      sensors: prev.sensors.includes(sensorId)
        ? prev.sensors.filter((id) => id !== sensorId)
        : [...prev.sensors, sensorId],
    }))
  }

  const toggleEnvironmentStatus = async (environmentId: string) => {
    try {
      const entornoActual = environments.find(env => env._id === environmentId || env.id === environmentId)
      if (!entornoActual) return

      const response = await fetch(`http://localhost:4001/entornos/cambiar-estado/${environmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ estado: !entornoActual.estado })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error("Respuesta del backend:", text)
        alert(`Error al cambiar estado: ${response.status} - ${text}`)
        return
      }

      fetchEnvironments()
    } catch (error) {
      console.error("Error al cambiar estado:", error)
      alert("Error al cambiar estado del entorno")
    }
  }

  const deleteEnvironment = async (environmentId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este entorno?")) return;
    try {
      const response = await fetch(`http://localhost:4001/entornos/eliminar/${environmentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar entorno");
      }
      fetchEnvironments();
    } catch (error) {
      console.error("Error al eliminar entorno:", error);
      alert("Error al eliminar entorno");
    }
  }

  const showEnvironmentDetails = (environment: Environment) => {
    setSelectedEnvironment(environment)
    setIsDetailsModalOpen(true)
  }

  const showEditEnvironment = (environment: Environment) => {
    setEditEnvironmentId(environment._id || environment.id || null)
    setEditFormData({
      name: environment.nombre,
      status: environment.estado ? "active" : "inactive",
      sensors: environment.sensores.map(s => s.idSensor),
      scheduledDay: environment.diasSemana.map(d => d.toLowerCase()),
      scheduledStartTime: environment.horaInicio,
      scheduledEndTime: environment.horaFin,
      playlist: environment.playlist?.[0]?.id || "",
    })
    setIsEditModalOpen(true)
  }

  const handleEditEnvironment = async () => {
    if (!editEnvironmentId) return
    // Mapea los días al formato correcto
    const diasSemana = editFormData.scheduledDay.map((d) => diasSemanaMap[d] || d)
    const updatedEnvironment = {
      nombre: editFormData.name,
      estado: editFormData.status === "active",
      horaInicio: editFormData.scheduledStartTime || "08:00",
      horaFin: editFormData.scheduledEndTime || "18:00",
      sensores: editFormData.sensors.map(sensorId => {
        const sensor = availableSensors.find(s => s.id === sensorId)
        return {
          idSensor: sensorId,
          nombreSensor: sensor?.name || "Sensor desconocido",
          tipoSensor: sensor?.type || "UNKNOWN",
          valorSensor: 0
        }
      }),
      diasSemana,
      playlist: editFormData.playlist ? [{
        id: editFormData.playlist,
        tema: availablePlaylists.find(p => p.id === editFormData.playlist)?.name || "Playlist desconocida"
      }] : [],
      usuario: userId,
    }
    try {
      const response = await fetch(`http://localhost:4001/entornos/editar/${editEnvironmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(updatedEnvironment),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al editar entorno")
      }
      setIsEditModalOpen(false)
      fetchEnvironments()
    } catch (error: any) {
      console.error("Error al editar entorno:", error)
      alert(`Error: ${error.message}`)
    }
  }

  // Obtener ID del usuario al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded: any = jwtDecode(token)
        console.log("=== DEBUG ENVIRONMENT MANAGER ===")
        console.log("Token decodificado:", decoded)
        // Priorizar el ID del JWT decodificado
        const tokenUserId = decoded.id || decoded.userId || decoded._id
        if (tokenUserId) {
          console.log("✅ UserId obtenido del JWT:", tokenUserId)
          setUserId(tokenUserId)
        } else {
          console.error("❌ No se pudo obtener userId del JWT:", decoded)
        }
        console.log("================================")
      } catch (error) {
        console.error("Error decodificando token:", error)
      }
    } else {
      console.error("No hay token disponible")
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Create New Environment Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Entornos Configurados</h2>
          <p className="text-gray-300">Gestiona y controla todos tus entornos inteligentes</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Nuevo Entorno
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Crear Nuevo Entorno</DialogTitle>
              <DialogDescription className="text-gray-300">
                Configura un nuevo entorno inteligente para tu hogar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white font-medium">
                    Nombre del Entorno*
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ej: Modo Relajación"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <Label className="text-white font-medium mb-3 block">Estado Inicial*</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "scheduled") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="inactive" className="text-white hover:bg-white/10">
                      Inactivo
                    </SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-white/10">
                      Activo
                    </SelectItem>
                    <SelectItem value="scheduled" className="text-white hover:bg-white/10">
                      Programar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduled Date/Time */}
              {formData.status === "scheduled" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      Días de la semana*
                    </Label>
                    <div className="flex flex-col space-y-1">
                      {["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"].map((day) => (
                        <label 
                          key={`day-${day}`}
                          className="flex items-center space-x-2 text-white"
                        >
                          <Checkbox
                            checked={formData.scheduledDay.includes(day)}
                            onCheckedChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                scheduledDay: prev.scheduledDay.includes(day)
                                  ? prev.scheduledDay.filter((d) => d !== day)
                                  : [...prev.scheduledDay, day],
                              }))
                            }
                          />
                          <span className="capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="scheduledStartTime" className="text-white font-medium">
                      Hora de inicio*
                    </Label>
                    <Input
                      id="scheduledStartTime"
                      type="time"
                      value={formData.scheduledStartTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheduledStartTime: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledEndTime" className="text-white font-medium">
                      Hora de fin*
                    </Label>
                    <Input
                      id="scheduledEndTime"
                      type="time"
                      value={formData.scheduledEndTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheduledEndTime: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Sensors Selection */}
              <div>
                <Label className="text-white font-medium mb-3 block">Sensores a Conectar</Label>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                  {availableSensors.map((sensor) => {
                    const IconComponent = sensor.icon
                    return (
                      <div
                        key={`sensor-${sensor.id}`}
                        className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Checkbox
                          id={sensor.id}
                          checked={formData.sensors.includes(sensor.id)}
                          onCheckedChange={() => handleSensorToggle(sensor.id)}
                          className="border-white/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                        />
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{sensor.name}</div>
                          <div className="text-gray-400 text-sm">
                            {sensor.type} • {sensor.location}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Playlist Selection */}
              <div>
                <Label className="text-white font-medium mb-3 block">Playlist Asociada</Label>
                <Select
                  value={formData.playlist}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, playlist: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecciona una playlist" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {availablePlaylists.map((playlist) => (
                      <SelectItem 
                        key={`playlist-${playlist.id}`} 
                        value={playlist.id} 
                        className="text-white hover:bg-white/10"
                      >
                        <div className="flex flex-col">
                          <span>{playlist.name}</span>
                          <span className="text-xs text-gray-400">{playlist.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateEnvironment}
                  disabled={!formData.name}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Crear Entorno
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Environments Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {environments.map((environment) => {
          if (!environment._id && !environment.id) {
            console.error('Entorno sin ID:', environment);
            return null;
          }

          const envId = environment._id || environment.id;
          const playlist = environment.playlist?.[0];
          const isActive = environment.estado;

          return (
            <Card
              key={`env-${envId}`}
              className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${
                isActive ? "ring-2 ring-green-500/50" : ""
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-2">
                      {environment.nombre}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge className={getStatusColor(isActive ? "active" : "inactive")}>
                        {getStatusIcon(isActive ? "active" : "inactive")}
                        <span className="ml-1">
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={() => showEnvironmentDetails(environment)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={() => showEditEnvironment(environment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteEnvironment(envId!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Sensores */}
                <div>
                  <h4 className="text-white font-medium mb-2 text-sm">Sensores</h4>
                  <div className="flex flex-wrap gap-2">
                    {environment.sensores?.slice(0, 3).map((sensor) => (
                      <div
                        key={`sensor-${envId}-${sensor.idSensor}`}
                        className="flex items-center space-x-1 bg-white/5 rounded-lg px-2 py-1 text-xs"
                      >
                        <span className="text-gray-300">{sensor.nombreSensor}</span>
                      </div>
                    ))}
                    {environment.sensores?.length > 3 && (
                      <div className="flex items-center bg-white/5 rounded-lg px-2 py-1 text-xs text-gray-400">
                        +{environment.sensores.length - 3} más
                      </div>
                    )}
                  </div>
                </div>

                {/* Horario */}
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    {environment.horaInicio} - {environment.horaFin}
                  </span>
                </div>

                {/* Días programados */}
                {environment.diasSemana?.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">
                      {environment.diasSemana.join(", ")}
                    </span>
                  </div>
                )}

                {/* Playlist */}
                {playlist && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Music className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{playlist.tema}</span>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 ${
                      isActive
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    }`}
                    onClick={() => toggleEnvironmentStatus(envId!)}
                  >
                    {isActive ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Activar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Environment Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="bg-slate-800 border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedEnvironment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                  <span>{selectedEnvironment.nombre}</span>
                  <Badge className={getStatusColor(selectedEnvironment.estado ? "active" : "inactive")}>
                    {getStatusIcon(selectedEnvironment.estado ? "active" : "inactive")}
                    <span className="ml-1">{getStatusText(selectedEnvironment.estado ? "active" : "inactive")}</span>
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* General Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Fecha de Creación</h4>
                    <p className="text-gray-300">{selectedEnvironment.createdAt}</p>
                  </div>
                  {selectedEnvironment.lastActivated && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Última Activación</h4>
                      <p className="text-gray-300">{selectedEnvironment.lastActivated}</p>
                    </div>
                  )}
                </div>

                {/* Scheduled Info */}
                {selectedEnvironment.diasSemana?.length > 0 && selectedEnvironment.horaInicio && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>Programación</span>
                    </h4>
                    <p className="text-gray-300">
                      Activación programada para el {selectedEnvironment.diasSemana.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                      a las {selectedEnvironment.horaInicio}
                      {selectedEnvironment.horaFin && (
                        <>
                          <br />
                          Finaliza a las {selectedEnvironment.horaFin}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Sensors Detail */}
                <div>
                  <h4 className="text-white font-medium mb-3">Sensores Conectados</h4>
                  <div className="grid gap-3">
                    {selectedEnvironment.sensores?.map((sensor) => {
                      const sensorInfo = getSensorInfo(sensor.idSensor)
                      if (!sensorInfo) return null
                      const IconComponent = sensorInfo.icon
                      return (
                        <div
                          key={`detail-sensor-${selectedEnvironment._id}-${sensor.idSensor}`}
                          className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{sensorInfo.name}</div>
                            <div className="text-gray-400 text-sm">
                              {sensorInfo.type} • {sensorInfo.location}
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Playlist Detail */}
                <div>
                  <h4 className="text-white font-medium mb-3">Playlist Asociada</h4>
                  {selectedEnvironment.playlist?.[0] ? (
                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{selectedEnvironment.playlist[0].tema}</div>
                        <div className="text-gray-400 text-sm">
                          {getPlaylistInfo(selectedEnvironment.playlist[0].id)?.description || "Sin descripción"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">No hay playlist asociada</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cerrar
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    showEditEnvironment(selectedEnvironment)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Entorno
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Environment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-800 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Entorno</DialogTitle>
            <DialogDescription className="text-gray-300">
              Modifica los datos del entorno seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="edit-name" className="text-white font-medium">
                Nombre del Entorno*
              </Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>
            
            {/* Estado */}
            <div>
              <Label className="text-white font-medium mb-3 block">Estado Inicial*</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: "active" | "inactive" | "scheduled") =>
                  setEditFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="inactive" className="text-white hover:bg-white/10">
                    Inactivo
                  </SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-white/10">
                    Activo
                  </SelectItem>
                  <SelectItem value="scheduled" className="text-white hover:bg-white/10">
                    Programar
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Scheduled Date/Time */}
            {editFormData.status === "scheduled" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white font-medium mb-2 block">
                    Días de la semana*
                  </Label>
                  <div className="flex flex-col space-y-1">
                    {["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"].map((day) => (
                      <label 
                        key={`edit-day-${day}`}
                        className="flex items-center space-x-2 text-white"
                      >
                        <Checkbox
                          checked={editFormData.scheduledDay.includes(day)}
                          onCheckedChange={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              scheduledDay: prev.scheduledDay.includes(day)
                                ? prev.scheduledDay.filter((d) => d !== day)
                                : [...prev.scheduledDay, day],
                            }))
                          }
                        />
                        <span className="capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-scheduledStartTime" className="text-white font-medium">
                    Hora de inicio*
                  </Label>
                  <Input
                    id="edit-scheduledStartTime"
                    type="time"
                    value={editFormData.scheduledStartTime}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, scheduledStartTime: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-scheduledEndTime" className="text-white font-medium">
                    Hora de fin*
                  </Label>
                  <Input
                    id="edit-scheduledEndTime"
                    type="time"
                    value={editFormData.scheduledEndTime}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, scheduledEndTime: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* Sensors Selection */}
            <div>
              <Label className="text-white font-medium mb-3 block">Sensores a Conectar</Label>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                {availableSensors.map((sensor) => {
                  const IconComponent = sensor.icon
                  return (
                    <div
                      key={`edit-sensor-${sensor.id}`}
                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Checkbox
                        id={sensor.id}
                        checked={editFormData.sensors.includes(sensor.id)}
                        onCheckedChange={() => handleEditSensorToggle(sensor.id)}
                        className="border-white/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                      />
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{sensor.name}</div>
                        <div className="text-gray-400 text-sm">
                          {sensor.type} • {sensor.location}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Playlist Selection */}
            <div>
              <Label className="text-white font-medium mb-3 block">Playlist Asociada</Label>
              <Select
                value={editFormData.playlist}
                onValueChange={(value) => setEditFormData((prev) => ({ ...prev, playlist: value }))}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecciona una playlist" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  {availablePlaylists.map((playlist) => (
                    <SelectItem 
                      key={`edit-playlist-${playlist.id}`} 
                      value={playlist.id} 
                      className="text-white hover:bg-white/10"
                    >
                      <div className="flex flex-col">
                        <span>{playlist.name}</span>
                        <span className="text-xs text-gray-400">{playlist.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditEnvironment}
                disabled={!editFormData.name}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {environments.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No hay entornos configurados</h3>
            <p className="text-gray-300 mb-6">Crea tu primer entorno inteligente para comenzar</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Entorno
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}