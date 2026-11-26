/**
 * Travail manuel saisi par l'étudiant en Mode Contrôle / Examen,
 * conservé indépendamment du MCD pour chaque module (Dictionnaire,
 * MLD, MPD, SQL, Code) afin de permettre la correction par l'enseignant.
 */
export interface ExamDictionaryEntry {
  id: string
  name: string
  type: string
  size: string
  comment: string
  ownerKind?: 'table' | 'association'
  ownerName?: string
}

export interface ExamMpdEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
}

export interface ExamWork {
  dictionary: ExamDictionaryEntry[]
  dictTables?: string[]
  dictAssociations?: string[]
  mld: string
  mpd: string
  mpdEdges?: ExamMpdEdge[]
  sql: string
  code: string
}

export const EMPTY_EXAM_WORK: ExamWork = {
  dictionary: [],
  mld: '',
  mpd: '',
  sql: '',
  code: '',
}
