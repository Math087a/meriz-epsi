import { t } from "../i18n/runtime"
import type { McdEditorState } from '../model/mcdReducer'
import { DEFAULT_MPD_SETTINGS } from '../model/mpd'
import type { MpdSettings } from '../model/mpd'
import { nameFromFileName, parseModelFile } from './persistence'
import { parseJMeriseBuffer } from './jmeriseParser'

export type ImportResult =
  | { ok: true; name: string; state: McdEditorState; mpdSettings: MpdSettings }
  | { ok: false; error: string }

/**
 * Lit un fichier Meriz (.json) ou JMerise (.mcd) choisi par l'utilisateur,
 * prêt à devenir un document. Le nom vient du fichier lui-même s'il en porte un,
 * sinon du nom du fichier sur le disque.
 */
export async function importModelFile(file: File): Promise<ImportResult> {
  const isMcd = file.name.toLowerCase().endsWith('.mcd')

  if (isMcd) {
    try {
      const buffer = await file.arrayBuffer()
      const state = parseJMeriseBuffer(buffer)
      return {
        ok: true,
        name: nameFromFileName(file.name),
        state,
        mpdSettings: DEFAULT_MPD_SETTINGS,
      }
    } catch (e: any) {
      return { ok: false, error: t("Impossible de lire ce fichier JMerise (.mcd) : {0}", [e?.message ?? 'Format invalide']) }
    }
  }

  let buffer: ArrayBuffer | null = null
  try {
    buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer.slice(0, 4))
    if (bytes[0] === 0xAC && bytes[1] === 0xED) {
      const state = parseJMeriseBuffer(buffer)
      return {
        ok: true,
        name: nameFromFileName(file.name),
        state,
        mpdSettings: DEFAULT_MPD_SETTINGS,
      }
    }
  } catch {
    // continue to json
  }

  let text: string
  try {
    text = buffer ? new TextDecoder('utf-8').decode(buffer) : await file.text()
  } catch {
    return { ok: false, error: t("Impossible de lire ce fichier.") }
  }
  const result = parseModelFile(text)
  if (!result.ok) {
    return result
  }
  return {
    ok: true,
    name: result.name ?? nameFromFileName(file.name),
    state: result.state,
    mpdSettings: result.mpdSettings ?? DEFAULT_MPD_SETTINGS,
  }
}
