"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type SensorState = {
  idSensor: string
  nombreSensor: string
  tipoSensor: string
  valorSensor: number
  estado: boolean
  color?: string
}

export type EnvironmentSensorsState = {
  [envId: string]: {
    [sensorId: string]: SensorState
  }
}

interface SensorsContextType {
  sensorsState: EnvironmentSensorsState
  updateSensorValue: (envId: string, sensorId: string, value: number) => void
  updateSensorState: (envId: string, sensorId: string, estado: boolean) => void
  updateSensorColor: (envId: string, sensorId: string, color: string) => void
  getSensorValue: (envId: string, sensorId: string) => number
  getSensorState: (envId: string, sensorId: string) => boolean
  getSensorColor: (envId: string, sensorId: string) => string | undefined
  initializeEnvironmentSensors: (envId: string, sensors: Array<{ idSensor: string; nombreSensor: string; tipoSensor: string; valorSensor?: number; color?: string }>) => void
}

const SensorsContext = createContext<SensorsContextType | undefined>(undefined)

const STORAGE_KEY = "workspace_sensors_state"

export function SensorsProvider({ children }: { children: React.ReactNode }) {
  const [sensorsState, setSensorsState] = useState<EnvironmentSensorsState>({})

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setSensorsState(parsedState)
      }
    } catch (error) {
      console.warn("Error loading sensors state from localStorage:", error)
    }
  }, [])

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sensorsState))
    } catch (error) {
      console.warn("Error saving sensors state to localStorage:", error)
    }
  }, [sensorsState])

  // Inicializar sensores de un entorno
  const initializeEnvironmentSensors = useCallback((
    envId: string, 
    sensors: Array<{ idSensor: string; nombreSensor: string; tipoSensor: string; valorSensor?: number; color?: string }>
  ) => {
    setSensorsState(prev => {
      const newState = { ...prev }
      if (!newState[envId]) {
        newState[envId] = {}
      }
      
      sensors.forEach(sensor => {
        if (!newState[envId][sensor.idSensor]) {
          newState[envId][sensor.idSensor] = {
            idSensor: sensor.idSensor,
            nombreSensor: sensor.nombreSensor,
            tipoSensor: sensor.tipoSensor,
            valorSensor: sensor.valorSensor ?? getDefaultValueForSensorType(sensor.tipoSensor),
            estado: true,
            color: sensor.color
          }
        }
      })
      
      return newState
    })
  }, [])

  // Obtener valor por defecto según el tipo de sensor
  const getDefaultValueForSensorType = (tipoSensor: string): number => {
    switch (tipoSensor) {
      case "LIGHT":
        return 75 // 75% de brillo por defecto
      case "TEMPERATURE_SENSOR":
        return 22 // 22°C por defecto
      case "HUMIDITY_SENSOR":
        return 60 // 60% de humedad por defecto
      case "FAN":
        return 3 // Nivel 3 por defecto
      case "AIR_CONDITIONER":
        return 24 // 24°C por defecto
      case "AIR_PURIFIER":
        return 2 // Nivel 2 por defecto
      case "CURTAIN":
        return 50 // 50% abierto por defecto
      case "MOTION_SENSOR":
        return 1 // Activo por defecto
      case "SMART_PLUG":
        return 1 // Encendido por defecto
      default:
        return 0
    }
  }

  // Actualizar valor de un sensor
  const updateSensorValue = useCallback((envId: string, sensorId: string, value: number) => {
    setSensorsState(prev => ({
      ...prev,
      [envId]: {
        ...prev[envId],
        [sensorId]: {
          ...prev[envId]?.[sensorId],
          valorSensor: value
        }
      }
    }))
  }, [])

  // Actualizar estado de un sensor (encendido/apagado)
  const updateSensorState = useCallback((envId: string, sensorId: string, estado: boolean) => {
    setSensorsState(prev => ({
      ...prev,
      [envId]: {
        ...prev[envId],
        [sensorId]: {
          ...prev[envId]?.[sensorId],
          estado
        }
      }
    }))
  }, [])

  // Actualizar color de un sensor
  const updateSensorColor = useCallback((envId: string, sensorId: string, color: string) => {
    setSensorsState(prev => ({
      ...prev,
      [envId]: {
        ...prev[envId],
        [sensorId]: {
          ...prev[envId]?.[sensorId],
          color
        }
      }
    }))
  }, [])

  // Obtener valor de un sensor
  const getSensorValue = useCallback((envId: string, sensorId: string): number => {
    return sensorsState[envId]?.[sensorId]?.valorSensor ?? getDefaultValueForSensorType("LIGHT")
  }, [sensorsState])

  // Obtener estado de un sensor
  const getSensorState = useCallback((envId: string, sensorId: string): boolean => {
    return sensorsState[envId]?.[sensorId]?.estado ?? true
  }, [sensorsState])

  // Obtener color de un sensor
  const getSensorColor = useCallback((envId: string, sensorId: string): string | undefined => {
    return sensorsState[envId]?.[sensorId]?.color
  }, [sensorsState])

  const value: SensorsContextType = {
    sensorsState,
    updateSensorValue,
    updateSensorState,
    updateSensorColor,
    getSensorValue,
    getSensorState,
    getSensorColor,
    initializeEnvironmentSensors
  }

  return (
    <SensorsContext.Provider value={value}>
      {children}
    </SensorsContext.Provider>
  )
}

export function useSensors() {
  const context = useContext(SensorsContext)
  if (context === undefined) {
    throw new Error("useSensors must be used within a SensorsProvider")
  }
  return context
}
