import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { AutomationScenarios } from "@/components/dashboard/automation-scenarios"
import { QuickControls } from "@/components/dashboard/quick-controls"
import { NotificationsPanel } from "@/components/dashboard/notifications-panel"

export default function DashboardPage() {
  // In a real app, this would come from authentication context or API
  const userName = "Juan Pérez"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardHeader userName={userName} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">¡Bienvenido de vuelta, {userName}! 👋</h1>
          <p className="text-gray-300 text-lg">Aquí está lo que está pasando en tu hogar inteligente hoy.</p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="space-y-8">
          {/* Stats Section */}
          <DashboardStats />

          {/* Two Column Layout */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Scenarios and Controls */}
            <div className="lg:col-span-2 space-y-8">
              <AutomationScenarios />
            </div>

            {/* Right Column - Controls and Notifications */}
            <div className="space-y-8">
              <QuickControls />
              <NotificationsPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
