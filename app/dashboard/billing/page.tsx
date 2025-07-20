"use client"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PlansBilling } from "@/components/dashboard/plans-billing"
import { withAuth } from "@/components/withAuth"

function BillingPage({ user }: { user: any }) {
  const userName = user?.nombre ? `${user.nombre} ${user.apellido}` : "Usuario"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardHeader userName={userName} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlansBilling />
      </main>
    </div>
  )
}

export default withAuth(BillingPage)
