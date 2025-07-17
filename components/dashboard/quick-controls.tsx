"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Lightbulb, Thermometer, Lock, Wifi, Volume2, Fan, Home } from "lucide-react"

export function QuickControls() {
  const [temperature, setTemperature] = useState([22])
  const [brightness, setBrightness] = useState([75])
  const [volume, setVolume] = useState([60])

  const [deviceStates, setDeviceStates] = useState({
    lights: true,
    security: false,
    wifi: true,
    fan: false,
  })

  const toggleDevice = (device: keyof typeof deviceStates) => {
    setDeviceStates((prev) => ({
      ...prev,
      [device]: !prev[device],
    }))
  }

  const quickActions = [
    { name: "All Lights", icon: Lightbulb, state: deviceStates.lights, action: () => toggleDevice("lights") },
    { name: "Security", icon: Lock, state: deviceStates.security, action: () => toggleDevice("security") },
    { name: "WiFi", icon: Wifi, state: deviceStates.wifi, action: () => toggleDevice("wifi") },
    { name: "Fan", icon: Fan, state: deviceStates.fan, action: () => toggleDevice("fan") },
  ]

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Quick Controls</CardTitle>
        <CardDescription className="text-gray-300">Control your devices and environment settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Toggle Buttons */}
        <div>
          <h3 className="text-white font-medium mb-4">Device Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                    action.state
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/50 text-white"
                      : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                  }`}
                  onClick={action.action}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs">{action.name}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Environment Controls */}
        <div>
          <h3 className="text-white font-medium mb-4">Environment Settings</h3>
          <div className="space-y-6">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">Temperature</span>
                </div>
                <span className="text-white font-medium">{temperature[0]}°C</span>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                max={30}
                min={15}
                step={1}
                className="w-full"
              />
            </div>

            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="text-white text-sm">Brightness</span>
                </div>
                <span className="text-white font-medium">{brightness[0]}%</span>
              </div>
              <Slider value={brightness} onValueChange={setBrightness} max={100} min={0} step={5} className="w-full" />
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm">Volume</span>
                </div>
                <span className="text-white font-medium">{volume[0]}%</span>
              </div>
              <Slider value={volume} onValueChange={setVolume} max={100} min={0} step={5} className="w-full" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-white font-medium mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20">
              <Home className="mr-2 w-4 h-4" />
              Activate Home Mode
            </Button>
            <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20">
              <Lock className="mr-2 w-4 h-4" />
              Lock All Doors
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
