"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Lightbulb, Thermometer, Volume2, Plug, Power } from "lucide-react"
import { useEnvironments } from "@/components/dashboard/environments-context"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

type Environment = {
  _id?: string
  id?: string
  nombre: string
  estado: boolean
  sensores?: Array<{ idSensor: string; nombreSensor: string; tipoSensor: string }>
  usuario?: string
}

interface QuickControlsProps {
  userId?: string | null
}

export function QuickControls({ userId }: QuickControlsProps) {
  const { environments, loading, refreshEnvironments } = useEnvironments()

  // Carousel api for auto-play
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)

  // Per-environment control states
  const [temperatureByEnv, setTemperatureByEnv] = useState<Record<string, number>>({})
  const [brightnessByEnv, setBrightnessByEnv] = useState<Record<string, number>>({})
  const [volumeByEnv, setVolumeByEnv] = useState<Record<string, number>>({})
  const [switchesByEnv, setSwitchesByEnv] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    if (userId) void refreshEnvironments()
  }, [userId, refreshEnvironments])

  const activeEnvs = useMemo(() => environments.filter((e) => e.estado), [environments])

  // Initialize per-env defaults and switches when active envs change
  useEffect(() => {
    const nextTemp = { ...temperatureByEnv }
    const nextBright = { ...brightnessByEnv }
    const nextVol = { ...volumeByEnv }
    const nextSwitches = { ...switchesByEnv }
    for (const env of activeEnvs) {
      const envId = (env._id || env.id) as string
      if (envId) {
        if (nextTemp[envId] === undefined) nextTemp[envId] = 22
        if (nextBright[envId] === undefined) nextBright[envId] = 75
        if (nextVol[envId] === undefined) nextVol[envId] = 60
        if (!nextSwitches[envId]) {
          const switches: Record<string, boolean> = {}
          env.sensores?.forEach((s) => (switches[s.idSensor] = true))
          nextSwitches[envId] = switches
        }
      }
    }
    setTemperatureByEnv(nextTemp)
    setBrightnessByEnv(nextBright)
    setVolumeByEnv(nextVol)
    setSwitchesByEnv(nextSwitches)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnvs])

  // Autoplay carousel every 5s if multiple envs
  useEffect(() => {
    if (!carouselApi || activeEnvs.length <= 1) return
    const id = setInterval(() => {
      carouselApi.scrollNext()
    }, 5000)
    return () => clearInterval(id)
  }, [carouselApi, activeEnvs.length])

  if (!userId || loading) return null
  if (activeEnvs.length === 0) return null

  return (
    <Carousel className="relative" setApi={setCarouselApi} opts={{ loop: true, duration: 20 }}>
      <CarouselContent>
        {activeEnvs.map((env) => {
          const envId = (env._id || env.id) as string
          const hasLight = env.sensores?.some((s) => s.tipoSensor === "LIGHT")
          const hasTemp = env.sensores?.some((s) => s.tipoSensor === "TEMPERATURE_SENSOR")
          const plugSensors = env.sensores?.filter((s) => s.tipoSensor === "SMART_PLUG") || []
          const audioPlugs = plugSensors.filter((s) => s.nombreSensor.toLowerCase().includes("audio"))

          const temperature = temperatureByEnv[envId] ?? 22
          const brightness = brightnessByEnv[envId] ?? 75
          const volume = volumeByEnv[envId] ?? 60
          const switches = switchesByEnv[envId] ?? {}

          const setTemperature = (vals: number[]) => setTemperatureByEnv((prev) => ({ ...prev, [envId]: vals[0] }))
          const setBrightness = (vals: number[]) => setBrightnessByEnv((prev) => ({ ...prev, [envId]: vals[0] }))
          const setVolume = (vals: number[]) => setVolumeByEnv((prev) => ({ ...prev, [envId]: vals[0] }))
          const toggleSwitch = (sensorId: string) =>
            setSwitchesByEnv((prev) => ({ ...prev, [envId]: { ...(prev[envId] || {}), [sensorId]: !switches[sensorId] } }))

          return (
            <CarouselItem key={envId}>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Quick Controls</CardTitle>
                  <CardDescription className="text-gray-300">Controles para: {env.nombre}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(hasLight || plugSensors.length > 0) && (
                    <div>
                      <h3 className="text-white font-medium mb-4">Dispositivos</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {hasLight && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              brightness > 0
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => setBrightness([brightness > 0 ? 0 : 75])}
                          >
                            <Lightbulb className="w-5 h-5" />
                            <span className="text-xs">Luces</span>
                          </Button>
                        )}
                        {plugSensors.map((s) => (
                          <Button
                            key={s.idSensor}
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              switches[s.idSensor]
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => toggleSwitch(s.idSensor)}
                          >
                            <Plug className="w-5 h-5" />
                            <span className="text-xs">{s.nombreSensor}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(hasTemp || hasLight || audioPlugs.length > 0) && (
                    <div>
                      <h3 className="text-white font-medium mb-4">Ajustes</h3>
                      <div className="space-y-6">
                        {hasTemp && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Thermometer className="w-4 h-4 text-blue-400" />
                                <span className="text-white text-sm">Temperatura</span>
                              </div>
                              <span className="text-white font-medium">{temperature}°C</span>
                            </div>
                            <Slider value={[temperature]} onValueChange={setTemperature} max={30} min={15} step={1} className="w-full" />
                          </div>
                        )}

                        {hasLight && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Lightbulb className="w-4 h-4 text-yellow-400" />
                                <span className="text-white text-sm">Brillo</span>
                              </div>
                              <span className="text-white font-medium">{brightness}%</span>
                            </div>
                            <Slider value={[brightness]} onValueChange={setBrightness} max={100} min={0} step={5} className="w-full" />
                          </div>
                        )}

                        {audioPlugs.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Volume2 className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm">Volumen</span>
                              </div>
                              <span className="text-white font-medium">{volume}%</span>
                            </div>
                            <Slider value={[volume]} onValueChange={setVolume} max={100} min={0} step={5} className="w-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(hasLight || plugSensors.length > 0 || hasTemp) && (
                    <div className="flex justify-end">
                      <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Power className="w-4 h-4 mr-2" />
                        Apagar Todo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      {activeEnvs.length > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3">
          <CarouselPrevious className="relative static h-8 w-8 rounded-full border-white/20 text-white bg-white/10 hover:bg-white/20" />
          <CarouselNext className="relative static h-8 w-8 rounded-full border-white/20 text-white bg-white/10 hover:bg-white/20" />
        </div>
      )}
    </Carousel>
  )
}
