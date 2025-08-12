"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Script from "next/script"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { withAdminAuth } from "@/components/withAdminAuth"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

const API_BASE = "https://api-python-vc4l.onrender.com"

type PlotlyFigure = {
  data: any[]
  layout?: Record<string, any>
  frames?: any[]
}

function useExternalScriptReady(ids: string[]) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const checkReady = () => {
      const passed = ids.every((id) => !!document.getElementById(id))
      if (passed) setReady(true)
    }
    const t = setInterval(checkReady, 200)
    checkReady()
    return () => clearInterval(t)
  }, [ids])
  return ready
}

function AnalyticsPage({ user }: { user: any }) {
  const userName = useMemo(
    () => (user?.nombre ? `${user.nombre} ${user.apellido}` : "Usuario"),
    [user]
  )

  const [plotlyFig1, setPlotlyFig1] = useState<PlotlyFigure | null>(null)
  const [imgPlot1, setImgPlot1] = useState<string | null>(null) // fallback si el API vuelve a PNG
  const [vegaSpec3, setVegaSpec3] = useState<any>(null)
  const [imgPlot3, setImgPlot3] = useState<string | null>(null) // fallback si el API vuelve a PNG
  const [bokehItem, setBokehItem] = useState<any>(null)
  const [plotlyFig, setPlotlyFig] = useState<PlotlyFigure | null>(null)
  const [vegaSpec, setVegaSpec] = useState<any>(null)

  const [loading, setLoading] = useState({ p1: true, p2: true, p3: true, p4: true, p5: true })
  const [error, setError] = useState<Record<string, string | null>>({ p1: null, p2: null, p3: null, p4: null, p5: null })

  const bokehContainerRef = useRef<HTMLDivElement>(null)
  const plotlyContainerRef = useRef<HTMLDivElement>(null)
  const plotly1ContainerRef = useRef<HTMLDivElement>(null)
  const vegaContainerRef = useRef<HTMLDivElement>(null)
  const vega3ContainerRef = useRef<HTMLDivElement>(null)

  // External script readiness
  const bokehReady = typeof window !== "undefined" && (window as any).Bokeh
  const plotlyReady = typeof window !== "undefined" && (window as any).Plotly
  const vegaEmbedReady = typeof window !== "undefined" && (window as any).vegaEmbed
  useExternalScriptReady(["bokeh-js", "plotly-js", "vega-js", "vega-lite-js", "vega-embed-js"])

  const fetchJson = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { method: "GET" })
    if (!res.ok) throw new Error(`Error ${res.status}`)
    return res.json()
  }

  const loadAll = async () => {
    // Reset
    setError({ p1: null, p2: null, p3: null, p4: null, p5: null })
    setLoading({ p1: true, p2: true, p3: true, p4: true, p5: true })

    // p1 (ahora devuelve figura Plotly JSON)
    fetchJson("/plot1")
      .then((d) => {
        if (d?.data) {
          setPlotlyFig1(d as PlotlyFigure)
          setImgPlot1(null)
        } else if (d?.image) {
          setImgPlot1(d.image)
        } else {
          throw new Error("Formato no soportado en /plot1")
        }
      })
      .catch((e) => setError((s) => ({ ...s, p1: e.message })))
      .finally(() => setLoading((s) => ({ ...s, p1: false })))

    // p2 Bokeh
    fetchJson("/plot2")
      .then((d) => setBokehItem(d))
      .catch((e) => setError((s) => ({ ...s, p2: e.message })))
      .finally(() => setLoading((s) => ({ ...s, p2: false })))

    // p3 (ahora devuelve spec Vega-Lite/Altair JSON)
    fetchJson("/plot3")
      .then((d) => {
        if (d?.$schema || d?.mark || d?.encoding) {
          setVegaSpec3(d)
          setImgPlot3(null)
        } else if (d?.image) {
          setImgPlot3(d.image)
        } else {
          throw new Error("Formato no soportado en /plot3")
        }
      })
      .catch((e) => setError((s) => ({ ...s, p3: e.message })))
      .finally(() => setLoading((s) => ({ ...s, p3: false })))

    // p4 Plotly
    fetchJson("/plot4")
      .then((d) => setPlotlyFig(d as PlotlyFigure))
      .catch((e) => setError((s) => ({ ...s, p4: e.message })))
      .finally(() => setLoading((s) => ({ ...s, p4: false })))

    // p5 Vega-Lite
    fetchJson("/plot5")
      .then((d) => setVegaSpec(d))
      .catch((e) => setError((s) => ({ ...s, p5: e.message })))
      .finally(() => setLoading((s) => ({ ...s, p5: false })))
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render Bokeh when ready
  useEffect(() => {
    if (!bokehItem || !bokehContainerRef.current) return
    const el = bokehContainerRef.current
    el.innerHTML = ""
    try {
      if ((window as any).Bokeh && (window as any).Bokeh.embed) {
        const targetId = el.id || "bokeh-plot"
        if (!el.id) el.id = targetId
        ;(window as any).Bokeh.embed.embed_item(bokehItem, targetId)
      }
    } catch (_) {}
  }, [bokehItem, bokehReady])

  // Render Plotly when ready
  useEffect(() => {
    if (!plotlyFig || !plotlyContainerRef.current) return
    const el = plotlyContainerRef.current
    try {
      if ((window as any).Plotly) {
        ;(window as any).Plotly.newPlot(el, plotlyFig.data || [], plotlyFig.layout || {})
      }
    } catch (_) {}
  }, [plotlyFig, plotlyReady])

  // Render Plotly for plot1 when ready
  useEffect(() => {
    if (!plotlyFig1 || !plotly1ContainerRef.current) return
    const el = plotly1ContainerRef.current
    try {
      if ((window as any).Plotly) {
        ;(window as any).Plotly.newPlot(el, plotlyFig1.data || [], plotlyFig1.layout || {})
      }
    } catch (_) {}
  }, [plotlyFig1, plotlyReady])

  // Render Vega-Lite when ready
  useEffect(() => {
    if (!vegaSpec || !vegaContainerRef.current) return
    const el = vegaContainerRef.current
    el.innerHTML = ""
    try {
      if ((window as any).vegaEmbed) {
        ;(window as any).vegaEmbed(el, { ...vegaSpec, background: "transparent" }, { actions: false })
      }
    } catch (_) {}
  }, [vegaSpec, vegaEmbedReady])

  // Render Vega-Lite for plot3 when ready (responsive to container)
  useEffect(() => {
    const el = vega3ContainerRef.current
    if (!vegaSpec3 || !el) return
    el.innerHTML = ""
    try {
      if ((window as any).vegaEmbed) {
        const spec = {
          ...vegaSpec3,
          width: "container" as any,
          height: 380,
          autosize: { type: "fit", contains: "padding", resize: true },
          background: "transparent",
        }
        ;(window as any).vegaEmbed(el, spec, { actions: false, renderer: "canvas" })
      }
    } catch (_) {}
  }, [vegaSpec3, vegaEmbedReady])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardHeader userName={userName} userRole={user?.rol} />

      {/* External libs */}
      <Script id="bokeh-js" src="https://cdn.bokeh.org/bokeh/release/bokeh-3.7.3.min.js" strategy="afterInteractive" />
      <Script id="plotly-js" src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" />
      <Script id="vega-js" src="https://cdn.jsdelivr.net/npm/vega@5" strategy="afterInteractive" />
      <Script id="vega-lite-js" src="https://cdn.jsdelivr.net/npm/vega-lite@5" strategy="afterInteractive" />
      <Script id="vega-embed-js" src="https://cdn.jsdelivr.net/npm/vega-embed@6" strategy="afterInteractive" />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Analíticas</h1>
            <p className="text-gray-300 text-lg">Visualizacion de las gráficas generales</p>
          </div>
          <Button onClick={loadAll} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Plot 1 - Plotly (o imagen de fallback) */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Cantidad de sensores por tipo (Global)</CardTitle>
              <CardDescription className="text-gray-300">/plot1 (Plotly)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.p1 && <div className="text-gray-300">Cargando...</div>}
              {error.p1 && <div className="text-red-400">Error: {error.p1}</div>}
              {plotlyFig1 ? (
                <div ref={plotly1ContainerRef} className="w-full min-h-[360px]" />
              ) : imgPlot1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="plot1" src={`data:image/png;base64,${imgPlot1}`} className="w-full rounded-lg border border-white/10" />
              ) : null}
            </CardContent>
          </Card>

          {/* Plot 2 - Bokeh */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Sensores asignados vs no asignados
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Bokeh</Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">/plot2</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.p2 && <div className="text-gray-300">Cargando...</div>}
              {error.p2 && <div className="text-red-400">Error: {error.p2}</div>}
              <div ref={bokehContainerRef} id="bokeh-plot" className="w-full min-h-[360px]" />
            </CardContent>
          </Card>

          {/* Plot 3 - Vega-Lite (o imagen de fallback) */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Top usuarios con más entornos</CardTitle>
              <CardDescription className="text-gray-300">/plot3 (Altair/Vega-Lite)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.p3 && <div className="text-gray-300">Cargando...</div>}
              {error.p3 && <div className="text-red-400">Error: {error.p3}</div>}
              {vegaSpec3 ? (
                <div ref={vega3ContainerRef} className="w-full h-[400px] overflow-hidden" />
              ) : imgPlot3 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="plot3" src={`data:image/png;base64,${imgPlot3}`} className="w-full rounded-lg border border-white/10" />
              ) : null}
            </CardContent>
          </Card>

          {/* Plot 4 - Plotly */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Promedio de sensores por entorno
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Plotly</Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">/plot4</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.p4 && <div className="text-gray-300">Cargando...</div>}
              {error.p4 && <div className="text-red-400">Error: {error.p4}</div>}
              <div ref={plotlyContainerRef} className="w-full min-h-[360px]" />
            </CardContent>
          </Card>

          {/* Plot 5 - Vega-Lite */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Tipos de sensores por entorno
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Vega-Lite</Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">/plot5</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.p5 && <div className="text-gray-300">Cargando...</div>}
              {error.p5 && <div className="text-red-400">Error: {error.p5}</div>}
              <div ref={vegaContainerRef} className="w-full min-h-[420px]" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default withAdminAuth(AnalyticsPage)


