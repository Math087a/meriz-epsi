import { describe, expect, it } from 'vitest'
import { mcdReducer } from '../model/mcdReducer'
import { createModelDoc } from '../model/modelDoc'
import { mcdToFlow } from '../canvas/mcdToFlow'
import type { McdEditorState } from '../model/mcdReducer'

const baseState: McdEditorState = {
  mcd: {
    properties: [
      { id: 'p-1', name: 'id', type: 'entier' },
      { id: 'p-2', name: 'nom', type: 'texte' },
    ],
    entities: [
      { id: 'e-parent', name: 'Personne', attributes: [{ propertyId: 'p-1', isIdentifier: true }] },
      { id: 'e-child-1', name: 'Etudiant', attributes: [] },
      { id: 'e-child-2', name: 'Professeur', attributes: [] },
    ],
    associations: [],
  },
  layout: {
    'e-parent': { x: 100, y: 50 },
    'e-child-1': { x: 50, y: 250 },
    'e-child-2': { x: 200, y: 250 },
  },
}

describe('Gestion complète de l’héritage Merise', () => {
  it('ajoute un héritage au modèle avec entité mère et sous-types', () => {
    const s1 = mcdReducer(baseState, {
      type: 'ADD_INHERITANCE',
      id: 'inh-1',
      position: { x: 120, y: 150 },
      parentId: 'e-parent',
      childIds: ['e-child-1'],
      constraint: 'none',
      name: 'Specialisation Personne',
    })

    expect(s1.mcd.inheritances).toBeDefined()
    expect(s1.mcd.inheritances?.length).toBe(1)
    const inh = s1.mcd.inheritances![0]
    expect(inh.id).toBe('inh-1')
    expect(inh.parentId).toBe('e-parent')
    expect(inh.childIds).toEqual(['e-child-1'])
    expect(inh.constraint).toBe('none')
    expect(inh.name).toBe('Specialisation Personne')
    expect(s1.layout['inh-1']).toEqual({ x: 120, y: 150 })
  })

  it('met à jour un héritage (lier un second sous-type et changer la contrainte en XT)', () => {
    let state = mcdReducer(baseState, {
      type: 'ADD_INHERITANCE',
      id: 'inh-1',
      position: { x: 120, y: 150 },
      parentId: 'e-parent',
      childIds: ['e-child-1'],
      constraint: 'none',
    })

    // Ajout d'une deuxième fille et passage en partition XT
    state = mcdReducer(state, {
      type: 'UPDATE_INHERITANCE',
      id: 'inh-1',
      patch: {
        childIds: ['e-child-1', 'e-child-2'],
        constraint: 'XT',
      },
    })

    const inh = state.mcd.inheritances![0]
    expect(inh.childIds).toEqual(['e-child-1', 'e-child-2'])
    expect(inh.constraint).toBe('XT')
  })

  it('détache un sous-type', () => {
    let state = mcdReducer(baseState, {
      type: 'ADD_INHERITANCE',
      id: 'inh-1',
      position: { x: 120, y: 150 },
      parentId: 'e-parent',
      childIds: ['e-child-1', 'e-child-2'],
      constraint: 'X',
    })

    // Retrait de child-1
    state = mcdReducer(state, {
      type: 'UPDATE_INHERITANCE',
      id: 'inh-1',
      patch: {
        childIds: ['e-child-2'],
      },
    })

    expect(state.mcd.inheritances![0].childIds).toEqual(['e-child-2'])
  })

  it('supprime un héritage et nettoie son entrée layout', () => {
    let state = mcdReducer(baseState, {
      type: 'ADD_INHERITANCE',
      id: 'inh-1',
      position: { x: 120, y: 150 },
      parentId: 'e-parent',
      childIds: ['e-child-1'],
    })

    expect(state.mcd.inheritances?.length).toBe(1)
    expect(state.layout['inh-1']).toBeDefined()

    state = mcdReducer(state, {
      type: 'DELETE_INHERITANCE',
      id: 'inh-1',
    })

    expect(state.mcd.inheritances).toBeUndefined()
    expect(state.layout['inh-1']).toBeUndefined()
  })

  it('supprimer une entité mère ou fille met à jour l’héritage automatiquement', () => {
    let state = mcdReducer(baseState, {
      type: 'ADD_INHERITANCE',
      id: 'inh-1',
      position: { x: 120, y: 150 },
      parentId: 'e-parent',
      childIds: ['e-child-1', 'e-child-2'],
    })

    // Supprimer l'entité fille 2
    state = mcdReducer(state, {
      type: 'DELETE_ENTITY',
      id: 'e-child-2',
    })

    expect(state.mcd.inheritances![0].childIds).toEqual(['e-child-1'])
  })

  it('reflète l’héritage sur le canvas via mcdToFlow', () => {
    const state = mcdReducer(baseState, {
      type: 'ADD_INHERITANCE',
      id: 'inh-1',
      position: { x: 120, y: 150 },
      parentId: 'e-parent',
      childIds: ['e-child-1', 'e-child-2'],
      constraint: 'T',
    })

    const { nodes, edges } = mcdToFlow(state.mcd, state.layout)

    const node = nodes.find((n) => n.id === 'inh-1')
    expect(node).toBeDefined()
    expect(node?.type).toBe('inheritance')
    expect(node?.position).toEqual({ x: 120, y: 150 })

    // 1 lien vers le parent + 2 liens vers les enfants = 3 arêtes
    const parentEdge = edges.find((e) => e.id === 'inh-p-inh-1-e-parent')
    const child1Edge = edges.find((e) => e.id === 'inh-c-inh-1-e-child-1')
    const child2Edge = edges.find((e) => e.id === 'inh-c-inh-1-e-child-2')

    expect(parentEdge).toBeDefined()
    expect(child1Edge).toBeDefined()
    expect(child2Edge).toBeDefined()
  })

  it('persiste dans le document Yjs sans être écrasé', () => {
    const doc = createModelDoc(baseState)
    doc.apply({
      type: 'ADD_INHERITANCE',
      id: 'inh-crdt',
      position: { x: 220, y: 180 },
      parentId: 'e-parent',
      childIds: ['e-child-1'],
      constraint: 'XT',
      name: 'Héritage Yjs',
    })

    const snapshot = doc.snapshot()
    expect(snapshot.mcd.inheritances).toBeDefined()
    expect(snapshot.mcd.inheritances?.length).toBe(1)
    expect(snapshot.mcd.inheritances![0].id).toBe('inh-crdt')
    expect(snapshot.mcd.inheritances![0].constraint).toBe('XT')
    expect(snapshot.mcd.inheritances![0].name).toBe('Héritage Yjs')
    expect(snapshot.layout['inh-crdt']).toEqual({ x: 220, y: 180 })

    doc.destroy()
  })
})
