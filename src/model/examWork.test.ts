import { describe, expect, it } from 'vitest'
import { mcdReducer } from './mcdReducer'
import { EMPTY_EXAM_WORK } from './examWork'
import { DEFAULT_MPD_SETTINGS } from './mpd'
import { parseModelFile, serializeModel } from '../lib/persistence'
import type { Mcd } from './mcd'

const emptyMcd: Mcd = { properties: [], entities: [], associations: [] }

describe('Travail manuel Mode Contrôle (examWork)', () => {
  it('conserve chaque module indépendamment et le préserve lors des actions MCD', () => {
    let state = mcdReducer(
      { mcd: emptyMcd, layout: {} },
      {
        type: 'UPDATE_EXAM_WORK',
        patch: {
          dictionary: [{ id: 'p1', name: 'nom_client', type: 'VARCHAR', size: '100', comment: 'Obligatoire' }],
          mld: 'CLIENT(id_client, nom_client)',
          mpd: 'CLIENT(id_client INT PK, nom_client VARCHAR(100))',
          sql: 'CREATE TABLE CLIENT (id_client INT PRIMARY KEY, nom_client VARCHAR(100));',
          code: 'class Client {}',
        },
      },
    )

    // Ajouter une entité au MCD ne doit pas écraser ni altérer le dictionnaire ou les modules d'examen
    state = mcdReducer(state, { type: 'ADD_ENTITY', position: { x: 100, y: 100 } })
    expect(state.mcd.entities).toHaveLength(1)
    expect(state.exam?.dictionary).toHaveLength(1)
    expect(state.exam?.dictionary[0]?.name).toBe('nom_client')
    expect(state.exam?.mld).toBe('CLIENT(id_client, nom_client)')
    expect(state.exam?.sql).toContain('CREATE TABLE CLIENT')

    // Sérialisation et réouverture dans la version Standard pour correction par le prof
    const json = serializeModel(state, DEFAULT_MPD_SETTINGS, 'Evaluation_B1')
    const parsed = parseModelFile(json)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.state.exam).toEqual(state.exam)
      expect(parsed.state.mcd.entities).toHaveLength(1)
    }
  })

  it('initialise un travail vide si absent lors dune mise à jour partielle', () => {
    const state = mcdReducer(
      { mcd: emptyMcd, layout: {} },
      { type: 'UPDATE_EXAM_WORK', patch: { sql: 'SELECT 1;' } },
    )
    expect(state.exam).toEqual({ ...EMPTY_EXAM_WORK, sql: 'SELECT 1;' })
  })
})
