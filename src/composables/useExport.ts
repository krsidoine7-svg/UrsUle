import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '@/types/task.types'

export function useExport() {
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId)
    if (!element) return

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const exportTasksToExcel = (tasks: Task[]) => {
    const data = tasks.map(t => [
      t.id,
      t.title,
      t.status === 'done' ? 'Terminée' : t.status === 'todo' ? 'À faire' : 'À refaire',
      t.priority === 'urgent' ? 'Urgente' : t.priority === 'high' ? 'Haute' : t.priority === 'normal' ? 'Normale' : 'Faible',
      (t as any).categories?.name || 'Sans catégorie',
      t.deadline ? format(new Date(t.deadline), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
      format(new Date(t.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      t.estimated_duration_minutes ? `${t.estimated_duration_minutes} min` : '-',
      t.actual_duration_minutes ? `${t.actual_duration_minutes} min` : '-',
      t.appreciation || '-'
    ])

    const header = [
      'ID', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Échéance', 
      'Créé le', 'Durée estimée', 'Durée réelle', 'Appréciation'
    ]

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tâches')
    
    XLSX.writeFile(workbook, `ursule-taches-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  const exportToJSON = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    downloadFile(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.json`)
  }

  return {
    exportToPDF,
    exportTasksToExcel,
    exportToJSON
  }
}
