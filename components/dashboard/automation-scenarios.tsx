import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Settings, Plus, Clock, Zap, Home, Moon } from "lucide-react"

export function AutomationScenarios() {
  const scenarios = [
    {
      id: 1,
      name: "Morning Routine",
      description: "Gradually turn on lights and adjust temperature",
      status: "active",
      lastRun: "Today at 6:00 AM",
      icon: Clock,
      devices: 5,
    },
    {
      id: 2,
      name: "Away Mode",
      description: "Turn off lights, lock doors, and arm security",
      status: "inactive",
      lastRun: "Yesterday at 9:30 AM",
      icon: Home,
      devices: 8,
    },
    {
      id: 3,
      name: "Movie Night",
      description: "Dim lights, close blinds, and turn on entertainment system",
      status: "active",
      lastRun: "2 days ago",
      icon: Moon,
      devices: 6,
    },
    {
      id: 4,
      name: "Energy Saver",
      description: "Optimize energy usage during peak hours",
      status: "active",
      lastRun: "Today at 2:00 PM",
      icon: Zap,
      devices: 12,
    },
  ]

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Automation Scenarios</CardTitle>
            <CardDescription className="text-gray-300">Manage your smart home automation packages</CardDescription>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => {
            const IconComponent = scenario.icon
            return (
              <div
                key={scenario.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{scenario.name}</h3>
                      <p className="text-gray-400 text-sm">{scenario.description}</p>
                    </div>
                  </div>
                  <Badge
                    variant={scenario.status === "active" ? "default" : "secondary"}
                    className={
                      scenario.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {scenario.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{scenario.devices} devices</span>
                  <span>Last run: {scenario.lastRun}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {scenario.status === "active" ? (
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
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
