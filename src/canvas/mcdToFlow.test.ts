import { describe, expect, it } from 'vitest'
import { mcdToFlow } from './mcdToFlow'
import { clientCommande } from '../model/testFixtures'
import { createModelDoc } from '../model/modelDoc'

const layout = { 'ent-client': { x: 0, y: 0 }, 'ent-commande': { x: 400, y: 0 } }

describe('mcdToFlow, du modèle à la vue', () => {
  it('ne fige aucun côté d’accroche sur les pattes', () => {
    // Le côté dépend des tailles mesurées et des positions vivantes : il se
    // choisit dans le canevas, à chaque image. Le laisser entrer ici ferait
    // revenir le retard d'un cran qu'on vient de corriger.
    const { edges } = mcdToFlow(clientCommande, layout)

    expect(edges.length).toBeGreaterThan(0)
    for (const edge of edges) {
      expect(edge.sourceHandle).toBeUndefined()
      expect(edge.targetHandle).toBeUndefined()
    }
  })

  it('fait partir chaque patte de son association vers son entité', () => {
    const { edges } = mcdToFlow(clientCommande, layout)
    const association = clientCommande.associations[0]!

    for (const edge of edges) {
      expect(edge.source).toBe(association.id)
      expect(clientCommande.entities.map((entity) => entity.id)).toContain(edge.target)
      expect(edge.ariaLabel).toMatch(/^Patte de .+ vers .+, cardinalité \d+,[\dn]+$/)
    }
  })

  it('génère les nœuds et liens pour les post-its et les héritages', () => {
    const mcdWithExtras = {
      ...clientCommande,
      inheritances: [
        {
          id: 'inh-1',
          parentId: 'ent-client',
          childIds: ['ent-commande'],
          constraint: 'X' as const,
        },
      ],
      postits: [
        {
          id: 'post-1',
          title: 'Notes du projet',
          content: 'Exemple de memo',
          mode: 'text' as const,
        },
      ],
    }

    const { nodes, edges } = mcdToFlow(mcdWithExtras, layout)
    expect(nodes.some((n) => n.type === 'inheritance')).toBe(true)
    expect(nodes.some((n) => n.type === 'postit')).toBe(true)
    expect(edges.some((e) => e.id.startsWith('inh-p-'))).toBe(true)
    expect(edges.some((e) => e.id.startsWith('inh-c-'))).toBe(true)
  })

  it('crée un héritage dans le modelDoc et vérifie sa présence sur le canvas', () => {
    const doc = createModelDoc({ mcd: clientCommande, layout })
    doc.apply({
      type: 'ADD_INHERITANCE',
      id: 'inh-test',
      position: { x: 200, y: 100 },
      parentId: 'ent-client',
      childIds: ['ent-commande'],
      constraint: 'XT',
    })

    const snapshot = doc.snapshot()
    expect(snapshot.mcd.inheritances).toBeDefined()
    expect(snapshot.mcd.inheritances?.length).toBe(1)
    expect(snapshot.mcd.inheritances?.[0].id).toBe('inh-test')
    expect(snapshot.mcd.inheritances?.[0].constraint).toBe('XT')

    const { nodes, edges } = mcdToFlow(snapshot.mcd, snapshot.layout)
    const inhNode = nodes.find((n) => n.id === 'inh-test')
    expect(inhNode).toBeDefined()
    expect(inhNode?.type).toBe('inheritance')
    expect(inhNode?.position).toEqual({ x: 200, y: 100 })

    const parentEdge = edges.find((e) => e.id === 'inh-p-inh-test-ent-client')
    expect(parentEdge).toBeDefined()
    expect(parentEdge?.source).toBe('inh-test')
    expect(parentEdge?.target).toBe('ent-client')

    const childEdge = edges.find((e) => e.id === 'inh-c-inh-test-ent-commande')
    expect(childEdge).toBeDefined()
    expect(childEdge?.source).toBe('inh-test')
    expect(childEdge?.target).toBe('ent-commande')
    doc.destroy()
  })
})
