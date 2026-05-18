import { http, unwrap } from './http'
import type { BatchUploadResponse, DocumentDeleteResponse, DocumentItem, DocumentPage, RagIngestResponse } from '@/types/api'

export interface DocumentQuery {
  pageNo: number
  pageSize: number
  kbCode?: string
  fileName?: string
  fileType?: string
  parseStatus?: number
  createdFrom?: string
  createdTo?: string
}

export function pageDocuments(params: DocumentQuery) {
  return unwrap<DocumentPage>(http.get('/api/v1/ai/documents', { params }))
}

export function getDocument(fileId: number) {
  return unwrap<DocumentItem>(http.get(`/api/v1/ai/documents/${fileId}`))
}

export function deleteDocument(fileId: number, deletePhysicalFile = false) {
  return unwrap<DocumentDeleteResponse>(
    http.delete(`/api/v1/ai/documents/${fileId}`, { params: { deletePhysicalFile } })
  )
}

export function reingestDocument(
  fileId: number,
  payload: {
    chunkSize: number
    overlapRatio: number
    async: boolean
  }
) {
  return unwrap<RagIngestResponse>(http.post(`/api/v1/ai/documents/${fileId}/reingest`, null, { params: payload }))
}

export function batchUploadDocuments(payload: {
  files: File[]
  kbCode: string
  chunkSize: number
  overlapRatio: number
  async: boolean
}) {
  const formData = new FormData()
  payload.files.forEach((file) => formData.append('files', file))
  formData.append('kbCode', payload.kbCode)
  formData.append('chunkSize', String(payload.chunkSize))
  formData.append('overlapRatio', String(payload.overlapRatio))
  formData.append('async', String(payload.async))
  return unwrap<BatchUploadResponse>(http.post('/api/v1/ai/documents/batch-upload', formData))
}
