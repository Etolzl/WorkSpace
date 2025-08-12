"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Lightbulb, Thermometer, Volume2, Plug, Power, Fan, Snowflake, Droplets, VenetianMask, Eye, Wind } from "lucide-react"
import { useEnvironments } from "@/components/dashboard/environments-context"
import { useSensors } from "@/components/dashboard/sensors-context"
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
  const { 
    sensorsState, 
    updateSensorValue, 
    updateSensorState, 
    getSensorValue, 
    getSensorState,
    initializeEnvironmentSensors 
  } = useSensors()

  // Carousel api for auto-play
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)

  useEffect(() => {
    if (userId) void refreshEnvironments()
  }, [userId, refreshEnvironments])

  const activeEnvs = useMemo(() => environments.filter((e) => e.estado), [environments])

  // Initialize sensors when environments change
  useEffect(() => {
    activeEnvs.forEach(env => {
      const envId = (env._id || env.id) as string
      if (envId && env.sensores) {
        initializeEnvironmentSensors(envId, env.sensores)
      }
    })
  }, [activeEnvs, initializeEnvironmentSensors])

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
          
          // Categorizar todos los tipos de sensores
          const hasLight = env.sensores?.some((s) => s.tipoSensor === "LIGHT")
          const hasTemp = env.sensores?.some((s) => s.tipoSensor === "TEMPERATURE_SENSOR")
          const hasHumidity = env.sensores?.some((s) => s.tipoSensor === "HUMIDITY_SENSOR")
          const hasFan = env.sensores?.some((s) => s.tipoSensor === "FAN")
          const hasAC = env.sensores?.some((s) => s.tipoSensor === "AIR_CONDITIONER")
          const hasAirPurifier = env.sensores?.some((s) => s.tipoSensor === "AIR_PURIFIER")
          const hasCurtain = env.sensores?.some((s) => s.tipoSensor === "CURTAIN")
          const hasMotion = env.sensores?.some((s) => s.tipoSensor === "MOTION_SENSOR")
          
          const plugSensors = env.sensores?.filter((s) => s.tipoSensor === "SMART_PLUG") || []
          const audioPlugs = plugSensors.filter((s) => s.nombreSensor.toLowerCase().includes("audio"))

          // Obtener valores actuales de los sensores
          const lightSensor = env.sensores?.find(s => s.tipoSensor === "LIGHT")
          const tempSensor = env.sensores?.find(s => s.tipoSensor === "TEMPERATURE_SENSOR")
          const humiditySensor = env.sensores?.find(s => s.tipoSensor === "HUMIDITY_SENSOR")
          const fanSensor = env.sensores?.find(s => s.tipoSensor === "FAN")
          const acSensor = env.sensores?.find(s => s.tipoSensor === "AIR_CONDITIONER")
          const airPurifierSensor = env.sensores?.find(s => s.tipoSensor === "AIR_PURIFIER")
          const curtainSensor = env.sensores?.find(s => s.tipoSensor === "CURTAIN")

          const lightValue = lightSensor ? getSensorValue(envId, lightSensor.idSensor) : 75
          const tempValue = tempSensor ? getSensorValue(envId, tempSensor.idSensor) : 22
          const humidityValue = humiditySensor ? getSensorValue(envId, humiditySensor.idSensor) : 60
          const fanValue = fanSensor ? getSensorValue(envId, fanSensor.idSensor) : 3
          const acValue = acSensor ? getSensorValue(envId, acSensor.idSensor) : 24
          const airPurifierValue = airPurifierSensor ? getSensorValue(envId, airPurifierSensor.idSensor) : 2
          const curtainValue = curtainSensor ? getSensorValue(envId, curtainSensor.idSensor) : 50

          return (
            <CarouselItem key={envId}>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Controles Rápidos</CardTitle>
                  <CardDescription className="text-gray-300">Controles para: {env.nombre}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dispositivos de Control */}
                  {(hasLight || hasFan || hasAC || hasAirPurifier || hasCurtain || hasMotion || plugSensors.length > 0) && (
                    <div>
                      <h3 className="text-white font-medium mb-4">Dispositivos</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {hasLight && lightSensor && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, lightSensor.idSensor)
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => updateSensorState(envId, lightSensor.idSensor, !getSensorState(envId, lightSensor.idSensor))}
                          >
                            <Lightbulb className="w-5 h-5" />
                            <span className="text-xs">Luces</span>
                          </Button>
                        )}
                        
                        {hasFan && fanSensor && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, fanSensor.idSensor)
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => updateSensorState(envId, fanSensor.idSensor, !getSensorState(envId, fanSensor.idSensor))}
                          >
                            <Fan className="w-5 h-5" />
                            <span className="text-xs">Ventilador</span>
                          </Button>
                        )}

                        {hasAC && acSensor && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, acSensor.idSensor)
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => updateSensorState(envId, acSensor.idSensor, !getSensorState(envId, acSensor.idSensor))}
                          >
                            <Snowflake className="w-5 h-5" />
                            <span className="text-xs">Aire Acondicionado</span>
                          </Button>
                        )}

                        {hasAirPurifier && airPurifierSensor && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, airPurifierSensor.idSensor)
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => updateSensorState(envId, airPurifierSensor.idSensor, !getSensorState(envId, airPurifierSensor.idSensor))}
                          >
                            <Wind className="w-5 h-5" />
                            <span className="text-xs">Purificador</span>
                          </Button>
                        )}

                        {hasCurtain && curtainSensor && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, curtainSensor.idSensor)
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => updateSensorState(envId, curtainSensor.idSensor, !getSensorState(envId, curtainSensor.idSensor))}
                          >
                            <VenetianMask className="w-5 h-5" />
                            <span className="text-xs">Cortinas</span>
                          </Button>
                        )}

                        {hasMotion && (
                          <Button
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, env.sensores?.find(s => s.tipoSensor === "MOTION_SENSOR")?.idSensor || "")
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => {
                              const motionSensor = env.sensores?.find(s => s.tipoSensor === "MOTION_SENSOR")
                              if (motionSensor) updateSensorState(envId, motionSensor.idSensor, !getSensorState(envId, motionSensor.idSensor))
                            }}
                          >
                            <Eye className="w-5 h-5" />
                            <span className="text-xs">Sensor de Movimiento</span>
                          </Button>
                        )}

                        {plugSensors.map((s) => (
                          <Button
                            key={s.idSensor}
                            variant="outline"
                            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                              getSensorState(envId, s.idSensor)
                                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                            }`}
                            onClick={() => updateSensorState(envId, s.idSensor, !getSensorState(envId, s.idSensor))}
                          >
                            <Plug className="w-5 h-5" />
                            <span className="text-xs">{s.nombreSensor}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ajustes */}
                  {(hasTemp || hasHumidity || hasLight || hasFan || hasAC || hasAirPurifier || hasCurtain || audioPlugs.length > 0) && (
                    <div>
                      <h3 className="text-white font-medium mb-4">Ajustes</h3>
                      <div className="space-y-6">
                        {hasTemp && tempSensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Thermometer className="w-4 h-4 text-blue-400" />
                                <span className="text-white text-sm">Temperatura</span>
                              </div>
                              <span className="text-white font-medium">{tempValue}°C</span>
                            </div>
                            <Slider 
                              value={[tempValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, tempSensor.idSensor, vals[0])} 
                              max={30} 
                              min={15} 
                              step={1} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {hasHumidity && humiditySensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Droplets className="w-4 h-4 text-cyan-400" />
                                <span className="text-white text-sm">Humedad</span>
                              </div>
                              <span className="text-white font-medium">{humidityValue}%</span>
                            </div>
                            <Slider 
                              value={[humidityValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, humiditySensor.idSensor, vals[0])} 
                              max={100} 
                              min={0} 
                              step={5} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {hasLight && lightSensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Lightbulb className="w-4 h-4 text-yellow-400" />
                                <span className="text-white text-sm">Brillo</span>
                              </div>
                              <span className="text-white font-medium">{lightValue}%</span>
                            </div>
                            <Slider 
                              value={[lightValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, lightSensor.idSensor, vals[0])} 
                              max={100} 
                              min={0} 
                              step={5} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {hasFan && fanSensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Fan className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm">Velocidad Ventilador</span>
                              </div>
                              <span className="text-white font-medium">Nivel {fanValue}</span>
                            </div>
                            <Slider 
                              value={[fanValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, fanSensor.idSensor, vals[0])} 
                              max={5} 
                              min={1} 
                              step={1} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {hasAC && acSensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Snowflake className="w-4 h-4 text-cyan-400" />
                                <span className="text-white text-sm">Temperatura AC</span>
                              </div>
                              <span className="text-white font-medium">{acValue}°C</span>
                            </div>
                            <Slider 
                              value={[acValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, acSensor.idSensor, vals[0])} 
                              max={30} 
                              min={16} 
                              step={1} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {hasAirPurifier && airPurifierSensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Wind className="w-4 h-4 text-blue-400" />
                                <span className="text-white text-sm">Nivel Purificador</span>
                              </div>
                              <span className="text-white font-medium">Nivel {airPurifierValue}</span>
                            </div>
                            <Slider 
                              value={[airPurifierValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, airPurifierSensor.idSensor, vals[0])} 
                              max={5} 
                              min={1} 
                              step={1} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {hasCurtain && curtainSensor && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <VenetianMask className="w-4 h-4 text-purple-400" />
                                <span className="text-white text-sm">Apertura Cortinas</span>
                              </div>
                              <span className="text-white font-medium">{curtainValue}%</span>
                            </div>
                            <Slider 
                              value={[curtainValue]} 
                              onValueChange={(vals) => updateSensorValue(envId, curtainSensor.idSensor, vals[0])} 
                              max={100} 
                              min={0} 
                              step={5} 
                              className="w-full" 
                            />
                          </div>
                        )}

                        {audioPlugs.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Volume2 className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm">Volumen</span>
                              </div>
                              <span className="text-white font-medium">60%</span>
                            </div>
                            <Slider value={[60]} max={100} min={0} step={5} className="w-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botón Apagar Todo */}
                  {(hasLight || hasFan || hasAC || hasAirPurifier || hasCurtain || hasMotion || plugSensors.length > 0 || hasTemp) && (
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => {
                          // Apagar todos los sensores del entorno actual
                          env.sensores?.forEach(sensor => {
                            updateSensorState(envId, sensor.idSensor, false)
                          })
                        }}
                      >
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
