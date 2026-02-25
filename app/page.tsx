'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
// Card components available if needed via @/components/ui/card
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { FiHome, FiUserPlus, FiShield, FiBarChart2, FiAlertTriangle, FiCheckCircle, FiPlus, FiMapPin, FiUsers, FiActivity, FiMenu, FiX, FiLoader, FiChevronRight, FiInfo } from 'react-icons/fi'

// ============ TYPES ============

interface Visitor {
  id: string
  nama: string
  nik: string
  telepon: string
  alamat: string
  kontakDaruratNama: string
  kontakDaruratTelepon: string
  jalur: string
  tanggalNaik: string
  estimasiTurun: string
  jumlahRombongan: number
  catatan: string
  status: 'aktif' | 'sudah_turun' | 'darurat'
  registeredAt: string
}

interface RegistrationResponse {
  validation_status?: string
  validation_notes?: string
  registration_summary?: string
  safety_tips?: string
  risk_level?: string
  warnings?: string
}

interface SafetyResponse {
  analysis_summary?: string
  total_active?: string
  overdue_count?: string
  risk_assessment?: string
  recommended_actions?: string
  alert_level?: string
}

interface ReportResponse {
  period_label?: string
  total_visitors?: string
  popular_trails?: string
  average_duration?: string
  trends?: string
  comparison?: string
  operational_recommendations?: string
}

interface StatusMessage {
  type: 'success' | 'error' | 'info'
  text: string
}

// ============ CONSTANTS ============

const AGENT_REGISTRATION = '699eb42b4105d187aa1a228a'
const AGENT_SAFETY = '699eb42b2beeae4407b5679a'
const AGENT_REPORT = '699eb42b12ee8368eec5f8ee'

const TRAILS = ['Jalur Utama', 'Jalur Timur', 'Jalur Barat', 'Jalur Selatan']

const SEED_VISITORS: Visitor[] = [
  {
    id: '1',
    nama: 'Budi Santoso',
    nik: '3201010101010001',
    telepon: '081234567890',
    alamat: 'Jl. Merdeka No. 10, Bogor',
    kontakDaruratNama: 'Siti Santoso',
    kontakDaruratTelepon: '081234567891',
    jalur: 'Jalur Utama',
    tanggalNaik: '2026-02-25',
    estimasiTurun: '2026-02-26',
    jumlahRombongan: 4,
    catatan: 'Pendaki berpengalaman',
    status: 'aktif',
    registeredAt: '2026-02-25T06:00:00Z',
  },
  {
    id: '2',
    nama: 'Rina Wulandari',
    nik: '3201010101010002',
    telepon: '082345678901',
    alamat: 'Jl. Sudirman No. 5, Jakarta',
    kontakDaruratNama: 'Andi Wulandari',
    kontakDaruratTelepon: '082345678902',
    jalur: 'Jalur Timur',
    tanggalNaik: '2026-02-24',
    estimasiTurun: '2026-02-25',
    jumlahRombongan: 2,
    catatan: 'Pertama kali mendaki',
    status: 'aktif',
    registeredAt: '2026-02-24T07:30:00Z',
  },
  {
    id: '3',
    nama: 'Ahmad Fauzi',
    nik: '3201010101010003',
    telepon: '083456789012',
    alamat: 'Jl. Pahlawan No. 15, Bandung',
    kontakDaruratNama: 'Dewi Fauzi',
    kontakDaruratTelepon: '083456789013',
    jalur: 'Jalur Barat',
    tanggalNaik: '2026-02-23',
    estimasiTurun: '2026-02-24',
    jumlahRombongan: 6,
    catatan: '',
    status: 'sudah_turun',
    registeredAt: '2026-02-23T05:00:00Z',
  },
  {
    id: '4',
    nama: 'Lisa Permata',
    nik: '3201010101010004',
    telepon: '084567890123',
    alamat: 'Jl. Gatot Subroto No. 22, Surabaya',
    kontakDaruratNama: 'Roni Permata',
    kontakDaruratTelepon: '084567890124',
    jalur: 'Jalur Selatan',
    tanggalNaik: '2026-02-24',
    estimasiTurun: '2026-02-25',
    jumlahRombongan: 3,
    catatan: 'Membawa anak kecil',
    status: 'aktif',
    registeredAt: '2026-02-24T08:00:00Z',
  },
]

const EMPTY_FORM = {
  nama: '',
  nik: '',
  telepon: '',
  alamat: '',
  kontakDaruratNama: '',
  kontakDaruratTelepon: '',
  jalur: '',
  tanggalNaik: '',
  estimasiTurun: '',
  jumlahRombongan: 1,
  catatan: '',
}

// ============ HELPERS ============

function parseAgentResult(result: any): Record<string, any> {
  if (!result?.success || !result?.response) return {}
  let data = result.response.result
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { /* keep as string */ }
  }
  if (data?.result && typeof data.result === 'object') {
    data = data.result
  }
  if (data?.response?.result && typeof data.response.result === 'object') {
    data = data.response.result
  }
  return data || {}
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function isOverdue(visitor: Visitor): boolean {
  if (visitor.status !== 'aktif') return false
  if (!visitor.estimasiTurun) return false
  try {
    const estimasi = new Date(visitor.estimasiTurun)
    const now = new Date()
    return now > estimasi
  } catch {
    return false
  }
}

// ============ ERROR BOUNDARY ============

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============ SUB COMPONENTS ============

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md rounded-[0.875rem]', className)}>
      {children}
    </div>
  )
}

function StatusBadge({ status, overdue }: { status: Visitor['status']; overdue?: boolean }) {
  if (overdue && status === 'aktif') {
    return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300 hover:bg-yellow-500/20">Terlambat</Badge>
  }
  switch (status) {
    case 'aktif':
      return <Badge className="bg-green-500/15 text-green-700 border-green-300 hover:bg-green-500/20">Aktif</Badge>
    case 'sudah_turun':
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-300 hover:bg-blue-500/20">Sudah Turun</Badge>
    case 'darurat':
      return <Badge className="bg-red-500/15 text-red-700 border-red-300 hover:bg-red-500/20">Darurat</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function RiskBadge({ level }: { level: string }) {
  const upper = (level ?? '').toUpperCase()
  if (upper === 'LOW') return <Badge className="bg-green-500/15 text-green-700 border-green-300">LOW</Badge>
  if (upper === 'MEDIUM') return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">MEDIUM</Badge>
  if (upper === 'HIGH') return <Badge className="bg-red-500/15 text-red-700 border-red-300">HIGH</Badge>
  return <Badge variant="outline">{level || '-'}</Badge>
}

function AlertBadge({ level }: { level: string }) {
  const upper = (level ?? '').toUpperCase()
  if (upper === 'NORMAL') return <Badge className="bg-green-500/15 text-green-700 border-green-300">NORMAL</Badge>
  if (upper === 'WASPADA') return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">WASPADA</Badge>
  if (upper === 'DARURAT') return <Badge className="bg-red-500/15 text-red-700 border-red-300">DARURAT</Badge>
  return <Badge variant="outline">{level || '-'}</Badge>
}

function InlineStatus({ message, onDismiss }: { message: StatusMessage | null; onDismiss: () => void }) {
  if (!message) return null
  const bgClass = message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
  const IconComp = message.type === 'success' ? FiCheckCircle : message.type === 'error' ? FiAlertTriangle : FiInfo
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3 rounded-[0.875rem] border text-sm', bgClass)}>
      <IconComp className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message.text}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100"><FiX className="w-4 h-4" /></button>
    </div>
  )
}

function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <FiLoader className="w-5 h-5 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{text || 'Memproses...'}</span>
    </div>
  )
}

function AgentInfoPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: AGENT_REGISTRATION, name: 'Registration Assistant', purpose: 'Validasi pendaftaran & tips keselamatan' },
    { id: AGENT_SAFETY, name: 'Safety Tracking', purpose: 'Analisis keamanan pengunjung aktif' },
    { id: AGENT_REPORT, name: 'Report & Analytics', purpose: 'Laporan statistik & rekomendasi' },
  ]
  return (
    <GlassCard className="p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <FiActivity className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Agents</span>
      </div>
      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', activeAgentId === agent.id ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-muted-foreground/30')} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{agent.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{agent.purpose}</p>
            </div>
            {activeAgentId === agent.id && <FiLoader className="w-3 h-3 animate-spin text-primary flex-shrink-0" />}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ============ SECTION: DASHBOARD ============

function DashboardSection({ visitors, setActivePage }: { visitors: Visitor[]; setActivePage: (p: string) => void }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  const todayStr = now ? now.toISOString().split('T')[0] : ''
  const todayCount = visitors.filter((v) => v.registeredAt?.startsWith(todayStr)).length
  const activeCount = visitors.filter((v) => v.status === 'aktif').length
  const overdueCount = visitors.filter((v) => isOverdue(v)).length
  const recentVisitors = [...visitors].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan aktivitas pendaftaran pengunjung gunung</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pengunjung Hari Ini</p>
              <p className="text-3xl font-bold text-foreground mt-1">{todayCount}</p>
            </div>
            <div className="w-12 h-12 rounded-[0.875rem] bg-primary/10 flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-primary" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pengunjung Aktif</p>
              <p className="text-3xl font-bold text-foreground mt-1">{activeCount}</p>
            </div>
            <div className="w-12 h-12 rounded-[0.875rem] bg-green-500/10 flex items-center justify-center">
              <FiMapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alert Keamanan</p>
              <p className={cn('text-3xl font-bold mt-1', overdueCount > 0 ? 'text-red-600' : 'text-foreground')}>{overdueCount}</p>
            </div>
            <div className={cn('w-12 h-12 rounded-[0.875rem] flex items-center justify-center', overdueCount > 0 ? 'bg-red-500/10' : 'bg-muted')}>
              <FiAlertTriangle className={cn('w-6 h-6', overdueCount > 0 ? 'text-red-600' : 'text-muted-foreground')} />
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Aktivitas Terbaru</h2>
          <p className="text-xs text-muted-foreground mt-0.5">5 pendaftaran terakhir</p>
        </div>
        <div className="px-5 pb-5">
          {recentVisitors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Belum ada pengunjung terdaftar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Nama</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Jalur</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Waktu</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisitors.map((v) => (
                    <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium">{v.nama}</td>
                      <td className="py-3 px-2 text-muted-foreground">{v.jalur}</td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDateTime(v.registeredAt)}</td>
                      <td className="py-3 px-2"><StatusBadge status={v.status} overdue={isOverdue(v)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setActivePage('pendaftaran')} className="gap-2">
          <FiPlus className="w-4 h-4" />
          Pendaftaran Baru
        </Button>
        <Button onClick={() => setActivePage('tracking')} variant="outline" className="gap-2">
          <FiShield className="w-4 h-4" />
          Lihat Tracking
        </Button>
      </div>
    </div>
  )
}

// ============ SECTION: PENDAFTARAN ============

function PendaftaranSection({ visitors, setVisitors, setActiveAgentId }: { visitors: Visitor[]; setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>>; setActiveAgentId: (id: string | null) => void }) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState<RegistrationResponse | null>(null)
  const [statusMsg, setStatusMsg] = useState<StatusMessage | null>(null)

  useEffect(() => {
    if (statusMsg) {
      const t = setTimeout(() => setStatusMsg(null), 5000)
      return () => clearTimeout(t)
    }
  }, [statusMsg])

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.nama || !formData.nik || !formData.telepon || !formData.alamat || !formData.kontakDaruratNama || !formData.kontakDaruratTelepon || !formData.jalur || !formData.tanggalNaik || !formData.estimasiTurun) {
      setStatusMsg({ type: 'error', text: 'Mohon lengkapi semua field yang wajib diisi.' })
      return false
    }
    return true
  }

  const handleDaftarkan = async () => {
    if (!validateForm()) return
    setLoading(true)
    setAgentResponse(null)
    setActiveAgentId(AGENT_REGISTRATION)

    const message = `Data Pendaftaran Pengunjung:\n- Nama: ${formData.nama}\n- NIK: ${formData.nik}\n- Telepon: ${formData.telepon}\n- Alamat: ${formData.alamat}\n- Kontak Darurat: ${formData.kontakDaruratNama} (${formData.kontakDaruratTelepon})\n- Jalur: ${formData.jalur}\n- Tanggal Naik: ${formData.tanggalNaik}\n- Estimasi Turun: ${formData.estimasiTurun}\n- Jumlah Rombongan: ${formData.jumlahRombongan}\n- Catatan: ${formData.catatan || 'Tidak ada'}\n\nMohon validasi data ini dan berikan ringkasan pendaftaran serta tips keselamatan.`

    try {
      const result = await callAIAgent(message, AGENT_REGISTRATION)
      const data = parseAgentResult(result)
      setAgentResponse({
        validation_status: data?.validation_status ?? '',
        validation_notes: data?.validation_notes ?? '',
        registration_summary: data?.registration_summary ?? '',
        safety_tips: data?.safety_tips ?? '',
        risk_level: data?.risk_level ?? '',
        warnings: data?.warnings ?? '',
      })
      setStatusMsg({ type: 'success', text: 'Validasi berhasil diproses oleh AI.' })
    } catch {
      setStatusMsg({ type: 'error', text: 'Gagal menghubungi agent. Silakan coba lagi.' })
    }
    setLoading(false)
    setActiveAgentId(null)
  }

  const handleSimpan = () => {
    if (!validateForm()) return
    const newVisitor: Visitor = {
      id: String(Date.now()),
      nama: formData.nama,
      nik: formData.nik,
      telepon: formData.telepon,
      alamat: formData.alamat,
      kontakDaruratNama: formData.kontakDaruratNama,
      kontakDaruratTelepon: formData.kontakDaruratTelepon,
      jalur: formData.jalur,
      tanggalNaik: formData.tanggalNaik,
      estimasiTurun: formData.estimasiTurun,
      jumlahRombongan: formData.jumlahRombongan,
      catatan: formData.catatan,
      status: 'aktif',
      registeredAt: new Date().toISOString(),
    }
    setVisitors((prev) => [...prev, newVisitor])
    setFormData(EMPTY_FORM)
    setAgentResponse(null)
    setStatusMsg({ type: 'success', text: `Pengunjung ${newVisitor.nama} berhasil didaftarkan.` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pendaftaran Pengunjung</h1>
        <p className="text-sm text-muted-foreground mt-1">Daftarkan pengunjung baru dengan validasi AI</p>
      </div>

      <InlineStatus message={statusMsg} onDismiss={() => setStatusMsg(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><FiUserPlus className="w-4 h-4 text-primary" /> Form Pendaftaran</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nama" className="text-xs font-medium">Nama Lengkap *</Label>
              <Input id="nama" placeholder="Masukkan nama lengkap" value={formData.nama} onChange={(e) => handleFieldChange('nama', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nik" className="text-xs font-medium">NIK *</Label>
                <Input id="nik" placeholder="Nomor Induk Kependudukan" value={formData.nik} onChange={(e) => handleFieldChange('nik', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="telepon" className="text-xs font-medium">Nomor Telepon *</Label>
                <Input id="telepon" placeholder="08xxxxxxxxx" value={formData.telepon} onChange={(e) => handleFieldChange('telepon', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="alamat" className="text-xs font-medium">Alamat *</Label>
              <Input id="alamat" placeholder="Alamat lengkap" value={formData.alamat} onChange={(e) => handleFieldChange('alamat', e.target.value)} className="mt-1" />
            </div>

            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontak Darurat</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kdNama" className="text-xs font-medium">Nama Kontak Darurat *</Label>
                <Input id="kdNama" placeholder="Nama keluarga/teman" value={formData.kontakDaruratNama} onChange={(e) => handleFieldChange('kontakDaruratNama', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="kdTelepon" className="text-xs font-medium">Telepon Kontak Darurat *</Label>
                <Input id="kdTelepon" placeholder="08xxxxxxxxx" value={formData.kontakDaruratTelepon} onChange={(e) => handleFieldChange('kontakDaruratTelepon', e.target.value)} className="mt-1" />
              </div>
            </div>

            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detail Pendakian</p>

            <div>
              <Label className="text-xs font-medium">Jalur Pendakian *</Label>
              <Select value={formData.jalur} onValueChange={(val) => handleFieldChange('jalur', val)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih jalur" /></SelectTrigger>
                <SelectContent>
                  {TRAILS.map((trail) => (
                    <SelectItem key={trail} value={trail}>{trail}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tanggalNaik" className="text-xs font-medium">Tanggal Naik *</Label>
                <Input id="tanggalNaik" type="date" value={formData.tanggalNaik} onChange={(e) => handleFieldChange('tanggalNaik', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="estimasiTurun" className="text-xs font-medium">Estimasi Tanggal Turun *</Label>
                <Input id="estimasiTurun" type="date" value={formData.estimasiTurun} onChange={(e) => handleFieldChange('estimasiTurun', e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="jumlah" className="text-xs font-medium">Jumlah Rombongan</Label>
              <Input id="jumlah" type="number" min={1} value={formData.jumlahRombongan} onChange={(e) => handleFieldChange('jumlahRombongan', parseInt(e.target.value) || 1)} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="catatan" className="text-xs font-medium">Catatan Khusus</Label>
              <Textarea id="catatan" placeholder="Catatan tambahan (opsional)" value={formData.catatan} onChange={(e) => handleFieldChange('catatan', e.target.value)} rows={3} className="mt-1" />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleDaftarkan} disabled={loading} className="gap-2">
                {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                Daftarkan Pengunjung
              </Button>
              <Button onClick={handleSimpan} variant="outline" disabled={loading} className="gap-2">
                <FiPlus className="w-4 h-4" />
                Simpan Pendaftaran
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Agent Response Panel */}
        <div>
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><FiActivity className="w-4 h-4 text-primary" /> Hasil Validasi AI</h2>

            {loading && <LoadingSpinner text="Memvalidasi data pendaftaran..." />}

            {!loading && !agentResponse && (
              <div className="text-center py-12">
                <FiShield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Klik "Daftarkan Pengunjung" untuk memvalidasi data dengan AI.</p>
              </div>
            )}

            {!loading && agentResponse && (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-5">
                  {/* Validation Status */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status Validasi:</span>
                    {(agentResponse.validation_status ?? '').toUpperCase() === 'VALID' ? (
                      <Badge className="bg-green-500/15 text-green-700 border-green-300">VALID</Badge>
                    ) : (agentResponse.validation_status ?? '').toUpperCase() === 'INVALID' ? (
                      <Badge className="bg-red-500/15 text-red-700 border-red-300">INVALID</Badge>
                    ) : (
                      <Badge variant="outline">{agentResponse.validation_status || '-'}</Badge>
                    )}
                  </div>

                  {/* Validation Notes */}
                  {agentResponse.validation_notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Catatan Validasi</p>
                      <div className="bg-muted/50 rounded-lg p-3">{renderMarkdown(agentResponse.validation_notes)}</div>
                    </div>
                  )}

                  {/* Risk Level */}
                  {agentResponse.risk_level && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tingkat Risiko:</span>
                      <RiskBadge level={agentResponse.risk_level} />
                    </div>
                  )}

                  {/* Registration Summary */}
                  {agentResponse.registration_summary && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Ringkasan Pendaftaran</p>
                      <div className="bg-muted/50 rounded-lg p-3">{renderMarkdown(agentResponse.registration_summary)}</div>
                    </div>
                  )}

                  {/* Safety Tips */}
                  {agentResponse.safety_tips && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tips Keselamatan</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">{renderMarkdown(agentResponse.safety_tips)}</div>
                    </div>
                  )}

                  {/* Warnings */}
                  {agentResponse.warnings && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Peringatan</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                        <FiAlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">{renderMarkdown(agentResponse.warnings)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ============ SECTION: TRACKING ============

function TrackingSection({ visitors, setVisitors, setActiveAgentId }: { visitors: Visitor[]; setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>>; setActiveAgentId: (id: string | null) => void }) {
  const [filterJalur, setFilterJalur] = useState('semua')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [loading, setLoading] = useState(false)
  const [safetyResponse, setSafetyResponse] = useState<SafetyResponse | null>(null)
  const [statusMsg, setStatusMsg] = useState<StatusMessage | null>(null)

  useEffect(() => {
    if (statusMsg) {
      const t = setTimeout(() => setStatusMsg(null), 5000)
      return () => clearTimeout(t)
    }
  }, [statusMsg])

  const filteredVisitors = visitors.filter((v) => {
    if (filterJalur !== 'semua' && v.jalur !== filterJalur) return false
    if (filterStatus === 'aktif' && v.status !== 'aktif') return false
    if (filterStatus === 'sudah_turun' && v.status !== 'sudah_turun') return false
    if (filterStatus === 'darurat' && v.status !== 'darurat') return false
    return true
  })

  const handleMarkStatus = (id: string, newStatus: 'sudah_turun' | 'darurat') => {
    setVisitors((prev) => prev.map((v) => v.id === id ? { ...v, status: newStatus } : v))
    setStatusMsg({ type: 'success', text: `Status pengunjung berhasil diubah ke ${newStatus === 'sudah_turun' ? 'Sudah Turun' : 'Darurat'}.` })
  }

  const handleAnalisis = async () => {
    setLoading(true)
    setSafetyResponse(null)
    setActiveAgentId(AGENT_SAFETY)

    const activeVisitors = visitors.filter((v) => v.status === 'aktif')
    const visitorList = activeVisitors.map((v, i) => `${i + 1}. ${v.nama} - Jalur: ${v.jalur}, Naik: ${v.tanggalNaik}, Estimasi Turun: ${v.estimasiTurun}, Rombongan: ${v.jumlahRombongan}, Catatan: ${v.catatan || 'Tidak ada'}, Terlambat: ${isOverdue(v) ? 'YA' : 'TIDAK'}`).join('\n')

    const message = `Analisis Keamanan Pengunjung Gunung:\n\nTotal pengunjung aktif: ${activeVisitors.length}\nTotal semua pengunjung: ${visitors.length}\n\nDaftar Pengunjung Aktif:\n${visitorList || 'Tidak ada pengunjung aktif.'}\n\nMohon berikan analisis keamanan, penilaian risiko, dan rekomendasi tindakan.`

    try {
      const result = await callAIAgent(message, AGENT_SAFETY)
      const data = parseAgentResult(result)
      setSafetyResponse({
        analysis_summary: data?.analysis_summary ?? '',
        total_active: data?.total_active ?? '',
        overdue_count: data?.overdue_count ?? '',
        risk_assessment: data?.risk_assessment ?? '',
        recommended_actions: data?.recommended_actions ?? '',
        alert_level: data?.alert_level ?? '',
      })
      setStatusMsg({ type: 'success', text: 'Analisis keamanan berhasil diproses.' })
    } catch {
      setStatusMsg({ type: 'error', text: 'Gagal menghubungi agent keamanan.' })
    }
    setLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tracking Keamanan</h1>
        <p className="text-sm text-muted-foreground mt-1">Pantau status keamanan pengunjung aktif di gunung</p>
      </div>

      <InlineStatus message={statusMsg} onDismiss={() => setStatusMsg(null)} />

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <Label className="text-xs font-medium">Filter Jalur</Label>
            <Select value={filterJalur} onValueChange={setFilterJalur}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Jalur</SelectItem>
                {TRAILS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Label className="text-xs font-medium">Filter Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="sudah_turun">Sudah Turun</SelectItem>
                <SelectItem value="darurat">Darurat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAnalisis} disabled={loading} className="gap-2">
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiShield className="w-4 h-4" />}
            Analisis Keamanan
          </Button>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-base font-semibold">Daftar Pengunjung ({filteredVisitors.length})</h2>
        </div>
        <div className="px-5 pb-5">
          {filteredVisitors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada pengunjung yang sesuai filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Nama</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Jalur</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Waktu Naik</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Estimasi Turun</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Rombongan</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((v) => (
                    <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium">{v.nama}</td>
                      <td className="py-3 px-2 text-muted-foreground">{v.jalur}</td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(v.tanggalNaik)}</td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(v.estimasiTurun)}</td>
                      <td className="py-3 px-2 text-muted-foreground text-center">{v.jumlahRombongan}</td>
                      <td className="py-3 px-2"><StatusBadge status={v.status} overdue={isOverdue(v)} /></td>
                      <td className="py-3 px-2">
                        {v.status === 'aktif' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => handleMarkStatus(v.id, 'sudah_turun')}>Sudah Turun</Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleMarkStatus(v.id, 'darurat')}>Darurat</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Safety Analysis Result */}
      {loading && <GlassCard className="p-5"><LoadingSpinner text="Menganalisis keamanan pengunjung..." /></GlassCard>}

      {!loading && safetyResponse && (
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><FiShield className="w-4 h-4 text-primary" /> Hasil Analisis Keamanan</h2>
          <div className="space-y-5">
            {/* Alert Level */}
            {safetyResponse.alert_level && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level Alert:</span>
                <AlertBadge level={safetyResponse.alert_level} />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {safetyResponse.total_active && (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Aktif</p>
                  <p className="text-xl font-bold text-foreground">{safetyResponse.total_active}</p>
                </div>
              )}
              {safetyResponse.overdue_count && (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Terlambat</p>
                  <p className="text-xl font-bold text-red-600">{safetyResponse.overdue_count}</p>
                </div>
              )}
            </div>

            {/* Analysis Summary */}
            {safetyResponse.analysis_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Ringkasan Analisis</p>
                <div className="bg-muted/50 rounded-lg p-3">{renderMarkdown(safetyResponse.analysis_summary)}</div>
              </div>
            )}

            {/* Risk Assessment */}
            {safetyResponse.risk_assessment && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Penilaian Risiko</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">{renderMarkdown(safetyResponse.risk_assessment)}</div>
              </div>
            )}

            {/* Recommended Actions */}
            {safetyResponse.recommended_actions && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rekomendasi Tindakan</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">{renderMarkdown(safetyResponse.recommended_actions)}</div>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ============ SECTION: LAPORAN ============

function LaporanSection({ visitors, setActiveAgentId }: { visitors: Visitor[]; setActiveAgentId: (id: string | null) => void }) {
  const [period, setPeriod] = useState('Harian')
  const [loading, setLoading] = useState(false)
  const [reportResponse, setReportResponse] = useState<ReportResponse | null>(null)
  const [statusMsg, setStatusMsg] = useState<StatusMessage | null>(null)

  useEffect(() => {
    if (statusMsg) {
      const t = setTimeout(() => setStatusMsg(null), 5000)
      return () => clearTimeout(t)
    }
  }, [statusMsg])

  const handleBuatLaporan = async () => {
    setLoading(true)
    setReportResponse(null)
    setActiveAgentId(AGENT_REPORT)

    const visitorList = visitors.map((v, i) => `${i + 1}. ${v.nama} - Jalur: ${v.jalur}, Naik: ${v.tanggalNaik}, Turun: ${v.estimasiTurun}, Rombongan: ${v.jumlahRombongan}, Status: ${v.status}, Terdaftar: ${v.registeredAt}`).join('\n')

    const message = `Buat Laporan Pengunjung Gunung (Periode: ${period}):\n\nTotal pengunjung terdaftar: ${visitors.length}\nPengunjung aktif: ${visitors.filter((v) => v.status === 'aktif').length}\nPengunjung sudah turun: ${visitors.filter((v) => v.status === 'sudah_turun').length}\nPengunjung darurat: ${visitors.filter((v) => v.status === 'darurat').length}\n\nData Pengunjung:\n${visitorList || 'Tidak ada data pengunjung.'}\n\nMohon buat laporan ${period.toLowerCase()} lengkap dengan statistik, tren, perbandingan, dan rekomendasi operasional.`

    try {
      const result = await callAIAgent(message, AGENT_REPORT)
      const data = parseAgentResult(result)
      setReportResponse({
        period_label: data?.period_label ?? '',
        total_visitors: data?.total_visitors ?? '',
        popular_trails: data?.popular_trails ?? '',
        average_duration: data?.average_duration ?? '',
        trends: data?.trends ?? '',
        comparison: data?.comparison ?? '',
        operational_recommendations: data?.operational_recommendations ?? '',
      })
      setStatusMsg({ type: 'success', text: 'Laporan berhasil dibuat.' })
    } catch {
      setStatusMsg({ type: 'error', text: 'Gagal menghubungi agent laporan.' })
    }
    setLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laporan & Statistik</h1>
        <p className="text-sm text-muted-foreground mt-1">Analisis data kunjungan dan rekomendasi operasional</p>
      </div>

      <InlineStatus message={statusMsg} onDismiss={() => setStatusMsg(null)} />

      {/* Controls */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <Label className="text-xs font-medium">Periode Laporan</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Harian">Harian</SelectItem>
                <SelectItem value="Mingguan">Mingguan</SelectItem>
                <SelectItem value="Bulanan">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleBuatLaporan} disabled={loading} className="gap-2">
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiBarChart2 className="w-4 h-4" />}
            Buat Laporan
          </Button>
        </div>
      </GlassCard>

      {/* Loading */}
      {loading && <GlassCard className="p-5"><LoadingSpinner text="Membuat laporan..." /></GlassCard>}

      {/* Report */}
      {!loading && !reportResponse && (
        <GlassCard className="p-5">
          <div className="text-center py-12">
            <FiBarChart2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Pilih periode dan klik "Buat Laporan" untuk menghasilkan laporan dengan AI.</p>
          </div>
        </GlassCard>
      )}

      {!loading && reportResponse && (
        <div className="space-y-4">
          {/* Period Label & Total */}
          <GlassCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              {reportResponse.period_label && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Periode</p>
                  <p className="text-lg font-semibold">{reportResponse.period_label}</p>
                </div>
              )}
              {reportResponse.total_visitors && (
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Pengunjung</p>
                  <p className="text-3xl font-bold text-primary">{reportResponse.total_visitors}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportResponse.popular_trails && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Jalur Terpopuler</p>
                  {renderMarkdown(reportResponse.popular_trails)}
                </div>
              )}
              {reportResponse.average_duration && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Rata-rata Durasi</p>
                  {renderMarkdown(reportResponse.average_duration)}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Trends */}
          {reportResponse.trends && (
            <GlassCard className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tren</p>
              <div className="bg-muted/50 rounded-lg p-4">{renderMarkdown(reportResponse.trends)}</div>
            </GlassCard>
          )}

          {/* Comparison */}
          {reportResponse.comparison && (
            <GlassCard className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Perbandingan</p>
              <div className="bg-muted/50 rounded-lg p-4">{renderMarkdown(reportResponse.comparison)}</div>
            </GlassCard>
          )}

          {/* Recommendations */}
          {reportResponse.operational_recommendations && (
            <GlassCard className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Rekomendasi Operasional</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">{renderMarkdown(reportResponse.operational_recommendations)}</div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}

// ============ MAIN PAGE ============

export default function Page() {
  const [activePage, setActivePage] = useState('dashboard')
  const [visitors, setVisitors] = useState<Visitor[]>(SEED_VISITORS)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'pendaftaran', label: 'Pendaftaran', icon: FiUserPlus },
    { id: 'tracking', label: 'Tracking', icon: FiShield },
    { id: 'laporan', label: 'Laporan', icon: FiBarChart2 },
  ]

  const handleNav = useCallback((pageId: string) => {
    setActivePage(pageId)
    setSidebarOpen(false)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground" style={{ background: 'linear-gradient(135deg, hsl(120, 25%, 96%) 0%, hsl(140, 30%, 94%) 35%, hsl(160, 25%, 95%) 70%, hsl(100, 20%, 96%) 100%)' }}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-[16px]">
          <div className="flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">Gunung Manager</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex min-h-screen lg:min-h-screen">
          {/* Sidebar */}
          <aside className={cn('fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar-background/90 backdrop-blur-[16px] transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:flex-shrink-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-5 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[0.875rem] bg-primary/10 flex items-center justify-center">
                    <FiMapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-sidebar-foreground">Gunung Manager</h2>
                    <p className="text-[10px] text-muted-foreground">Pendaftaran Pengunjung</p>
                  </div>
                </div>
              </div>

              {/* Nav Items */}
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const IconComp = item.icon
                  const isActive = activePage === item.id
                  return (
                    <button key={item.id} onClick={() => handleNav(item.id)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] text-sm font-medium transition-all duration-200', isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-sidebar-foreground hover:bg-sidebar-accent')}>
                      <IconComp className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isActive && <FiChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  )
                })}
              </nav>

              {/* Agent Info */}
              <div className="p-3">
                <AgentInfoPanel activeAgentId={activeAgentId} />
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ScrollArea className="h-screen">
              <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto pb-20">
                {activePage === 'dashboard' && <DashboardSection visitors={visitors} setActivePage={setActivePage} />}
                {activePage === 'pendaftaran' && <PendaftaranSection visitors={visitors} setVisitors={setVisitors} setActiveAgentId={setActiveAgentId} />}
                {activePage === 'tracking' && <TrackingSection visitors={visitors} setVisitors={setVisitors} setActiveAgentId={setActiveAgentId} />}
                {activePage === 'laporan' && <LaporanSection visitors={visitors} setActiveAgentId={setActiveAgentId} />}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
