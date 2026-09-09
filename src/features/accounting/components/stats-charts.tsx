"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCLP } from "@/lib/format"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  EN_PROCESO: "En proceso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
}

function formatPeriodLabel(period: string, granularity: "day" | "month" | "year") {
  const date = new Date(period)
  if (granularity === "year") return date.getFullYear().toString()
  if (granularity === "month") return date.toLocaleDateString("es-CL", { month: "short", year: "2-digit" })
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
}

export function TimeSeriesChart({
  data,
  granularity,
}: {
  data: { period: Date; count: number; revenue: number }[]
  granularity: "day" | "month" | "year"
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos en este rango.</p>
  }

  const chartData = data.map((d) => ({
    label: formatPeriodLabel(d.period.toString(), granularity),
    cantidad: d.count,
    ingresos: d.revenue,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis yAxisId="left" fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis
          yAxisId="right"
          orientation="right"
          fontSize={12}
          stroke="var(--muted-foreground)"
          tickFormatter={(v) => formatCLP(v)}
        />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }}
          formatter={(value, name) => (name === "ingresos" ? formatCLP(Number(value)) : value)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="cantidad"
          name="Mantenciones"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="ingresos"
          name="Ingresos"
          stroke="var(--chart-3)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CollaboratorBarChart({
  data,
}: {
  data: { name: string; total: number; count: number }[]
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos en este rango.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => formatCLP(v)} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }}
          formatter={(value, name) => (name === "total" ? formatCLP(Number(value)) : value)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="total" name="Ingresos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos en este rango.</p>
  }

  const chartData = data.map((d) => ({ name: STATUS_LABELS[d.status] ?? d.status, value: d.count }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
