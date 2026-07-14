"use client"

import { useState, useEffect } from "react"
import { actionGetFinancialSummary, actionGetAccountsReceivable, actionGetAccountsPayable, actionGetCxCSummary, actionGetCxPSummary, actionGetCashCloseHistory, actionCreateCashClose } from "@/features/contabilidad/server"
import { ThemeToggle } from "@/components/ThemeToggle"

interface FinancialSummary {
  date: string
  totalSales: number
  grossIncome: number
  totalCost: number
  grossProfit: number
  marginPercent: number
  operatingExpenses: number
  netProfit: number
}

export default function ContabilidadPage() {
  const [activeTab, setActiveTab] = useState<"estado" | "cxc" | "cxp" | "corte">("estado")
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [cxcSummary, setCxcSummary] = useState<any>(null)
  const [cxpSummary, setCxpSummary] = useState<any>(null)
  const [cashCloses, setCashCloses] = useState<any[]>([])
  const [initialCash, setInitialCash] = useState("")
  const [finalCash, setFinalCash] = useState("")
  const [observations, setObservations] = useState("")

  useEffect(() => {
    loadContext()
  }, [])

  const loadContext = async () => {
    try {
      const res = await fetch("/api/pos/context")
      const data = await res.json()
      if (!data.error) {
        setBusinessId(data.businessId)
        setLocationId(data.locationId)
      }
    } catch (error) {
      console.error("Error loading context:", error)
    }
  }

  useEffect(() => {
    if (businessId && locationId) {
      loadData()
    }
  }, [businessId, locationId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [finSummary, cxc, cxp, closes] = await Promise.all([
        actionGetFinancialSummary(businessId!, locationId!),
        actionGetCxCSummary(businessId!, locationId),
        actionGetCxPSummary(businessId!),
        actionGetCashCloseHistory(businessId!, locationId!)
      ])
      setSummary(finSummary)
      setCxcSummary(cxc)
      setCxpSummary(cxp)
      setCashCloses(closes)
    } catch (error) {
      console.error("Error loading data:", error)
    }
    setIsLoading(false)
  }

  const handleCreateCashClose = async () => {
    if (!initialCash || !finalCash) {
      alert("Ingresa efectivo inicial y final")
      return
    }
    try {
      const result = await actionCreateCashClose(businessId!, locationId!, parseFloat(initialCash), parseFloat(finalCash), observations)
      if (result.success) {
        alert("Corte de caja creado")
        setInitialCash("")
        setFinalCash("")
        setObservations("")
        await loadData()
      }
    } catch (error) {
      alert("Error al crear corte")
    }
  }

  if (!businessId || !locationId) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" }}><h1 style={{ fontSize: "24px", color: "var(--text-primary)" }}>Cargando...</h1></div>
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
      <div style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "600", color: "var(--text-primary)", margin: "0" }}>Contabilidad</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle />
          <a href="/" style={{ color: "var(--accent-orange)", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>Volver</a>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", padding: "1rem 2rem", background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)" }}>
        {["estado", "cxc", "cxp", "corte"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ padding: "8px 16px", background: activeTab === tab ? "var(--accent-orange)" : "var(--bg-secondary)", color: activeTab === tab ? "#fff" : "var(--text-primary)", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            {tab === "estado" && "Estado de Resultados"}
            {tab === "cxc" && "CxC"}
            {tab === "cxp" && "CxP"}
            {tab === "corte" && "Corte de Caja"}
          </button>
        ))}
      </div>

      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {activeTab === "estado" && summary && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1.5rem" }}>Estado de Resultados</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              {[{ label: "Ventas", value: summary.grossIncome, color: "var(--success)" }, { label: "Costo", value: summary.totalCost, color: "var(--error)" }, { label: "Utilidad", value: summary.grossProfit, color: summary.grossProfit >= 0 ? "var(--success)" : "var(--error)" }, { label: "Margen", value: summary.marginPercent + "%", color: "var(--accent-orange)" }].map((item, idx) => (
                <div key={idx} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{item.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: item.color }}>${typeof item.value === "number" ? item.value.toFixed(2) : item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "cxc" && cxcSummary && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1.5rem" }}>Cuentas por Cobrar</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              {[{ label: "Total CxC", value: cxcSummary.totalAmount, color: "var(--accent-orange)" }, { label: "Pendiente", value: cxcSummary.pending, color: "var(--warning)" }, { label: "Vencida", value: cxcSummary.overdue, color: "var(--error)" }, { label: "Tasa Cobro", value: cxcSummary.collectionRate.toFixed(1) + "%", color: "var(--success)" }].map((item, idx) => (
                <div key={idx} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{item.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: item.color }}>{typeof item.value === "number" ? "$" + item.value.toFixed(2) : item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "corte" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1.5rem" }}>Corte de Caja</h2>
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.5rem", maxWidth: "500px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input type="number" placeholder="Efectivo inicial" value={initialCash} onChange={e => setInitialCash(e.target.value)} style={{ padding: "8px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "14px", boxSizing: "border-box" }} />
                <input type="number" placeholder="Efectivo final" value={finalCash} onChange={e => setFinalCash(e.target.value)} style={{ padding: "8px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "14px", boxSizing: "border-box" }} />
                <button onClick={handleCreateCashClose} style={{ padding: "10px", background: "var(--accent-orange)", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>Crear Corte</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
