import * as XLSX from 'sheetjs-xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export const exportToPDF = async (elementId: string, fileName: string) => {
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
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })
  
  const imgProps = pdf.getImageProperties(imgData)
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export const formatTasksForExport = (tasks: any[]) => {
  return tasks.map(t => ({
    'ID': t.id,
    'Titre': t.title,
    'Statut': t.status,
    'Priorité': t.priority,
    'Deadline': t.deadline ? format(new Date(t.deadline), 'dd/MM/yyyy HH:mm') : '-',
    'Complété le': t.completed_at ? format(new Date(t.completed_at), 'dd/MM/yyyy HH:mm') : '-',
    'Durée (min)': t.actual_duration_minutes || 0,
    'Projet': t.project?.name || '-'
  }))
}
