'use client'

import React, { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface WarrantyQrProps {
  url: string
  warrantyNumber: string
  size?: number
}

export function WarrantyQr({ url, warrantyNumber, size = 180 }: WarrantyQrProps) {
  const [copied, setCopied] = React.useState(false)
  const svgRef = useRef<HTMLDivElement>(null)

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Verification URL copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const downloadQr = () => {
    if (!svgRef.current) return
    const svgElement = svgRef.current.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const URLObject = window.URL || window.webkitURL || window
    const blobURL = URLObject.createObjectURL(svgBlob)

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size * 2
      canvas.height = size * 2
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const png = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `warranty-${warrantyNumber}-qr.png`
        downloadLink.href = png
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
    }
    image.src = blobURL
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div ref={svgRef} className="p-3 bg-white rounded-lg border border-gray-100">
        <QRCode value={url} size={size} level="M" />
      </div>
      <p className="mt-3 text-xs font-mono font-semibold text-gray-700 tracking-wider">
        {warrantyNumber}
      </p>
      <div className="flex gap-2 mt-4 w-full justify-center">
        <Button size="sm" variant="outline" onClick={copyUrl} className="text-xs">
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          {copied ? 'Copied' : 'Copy Link'}
        </Button>
        <Button size="sm" variant="outline" onClick={downloadQr} className="text-xs">
          <Download className="w-3.5 h-3.5 mr-1" />
          Download QR
        </Button>
      </div>
    </div>
  )
}
