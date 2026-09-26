'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface TrendDataPoint {
  month: string
  active: number
  expired: number
  claimed: number
}

interface WarrantyTrendChartProps {
  data: TrendDataPoint[]
}

export function WarrantyTrendChart({ data }: WarrantyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        No historical activity recorded yet.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#93c5fd', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          />
          <Bar
            name="Issued / Active"
            dataKey="active"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            name="Claims / Service"
            dataKey="claimed"
            fill="#9333ea"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            name="Expired"
            dataKey="expired"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
