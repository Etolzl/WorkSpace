"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EnvironmentManager } from "@/components/dashboard/environment-manager"
import { withAuth } from "@/components/withAuth"

function EnvironmentsPage({ user }: { user: any }) {
  const userName = user?.nombre ? `${user.nombre} ${user.apellido}` : "Usuario"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardHeader userName={userName} userRole={user?.rol} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Gestionar
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Entornos</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Crea, configura y administra los entornos inteligentes de tu hogar
          </p>
        </div>

        <EnvironmentManager />
      </main>
    </div>
  )
}

export default withAuth(EnvironmentsPage)
