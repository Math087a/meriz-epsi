import { t } from "../i18n/runtime"
import type { Edge, Node } from '@xyflow/react'
import type { Association, Cardinality, Entity, Mcd, Inheritance, PostIt } from '../model/mcd'
import type { McdLayout } from '../model/layout'
import { resolveAttributes } from '../model/queries'
import type { ResolvedAttribute } from '../model/queries'

/**
 * Types React Flow dérivés du modèle. Le `data` des nœuds est une vue
 * calculée à chaque rendu (références résolues vers le dictionnaire) :
 * la source de vérité reste le Mcd.
 */
export type EntityFlowNode = Node<
  { entity: Entity; attributes: ResolvedAttribute[] },
  'entity'
>
export type AssociationFlowNode = Node<
  { association: Association; attributes: ResolvedAttribute[] },
  'association'
>
export type InheritanceFlowNode = Node<
  { inheritance: Inheritance; parentName?: string; childrenNames?: string[] },
  'inheritance'
>
export type PostItFlowNode = Node<
  { postit: PostIt; mcd: Mcd },
  'postit'
>
export type McdFlowNode = EntityFlowNode | AssociationFlowNode | InheritanceFlowNode | PostItFlowNode

export type LegFlowEdge = Edge<
  {
    cardinality?: Cardinality
    role?: string
    /** Position choisie de l'étiquette (layout), sinon défaut sur la ligne. */
    labelPosition?: { x: number; y: number }
    /** Tracé en ligne droite (sinon chemin orthogonal au plus court). */
    straight?: boolean
  },
  'leg'
>

const FALLBACK_POSITION = { x: 0, y: 0 }

/**
 * Transformation pure : Mcd + McdLayout → nœuds et liens React Flow.
 * Une entité et une association sont des nœuds, une patte est un lien.
 */
export function mcdToFlow(
  mcd: Mcd,
  layout: McdLayout,
): { nodes: McdFlowNode[]; edges: LegFlowEdge[] } {
  const nodes: McdFlowNode[] = [
    ...mcd.entities.map(
      (entity): EntityFlowNode => ({
        id: entity.id,
        type: 'entity',
        position: layout[entity.id] ?? FALLBACK_POSITION,
        data: { entity, attributes: resolveAttributes(mcd, entity.attributes) },
        ariaLabel: t("Entité {0}", [entity.name]),
      }),
    ),
    ...mcd.associations.map(
      (association): AssociationFlowNode => ({
        id: association.id,
        type: 'association',
        position: layout[association.id] ?? FALLBACK_POSITION,
        data: { association, attributes: resolveAttributes(mcd, association.attributes) },
        ariaLabel: t("Association {0}", [association.name]),
      }),
    ),
    ...(mcd.inheritances ?? []).map(
      (inheritance): InheritanceFlowNode => {
        const parentName = mcd.entities.find((e) => e.id === inheritance.parentId)?.name
        const childrenNames = inheritance.childIds
          .map((id) => mcd.entities.find((e) => e.id === id)?.name)
          .filter(Boolean) as string[]
        return {
          id: inheritance.id,
          type: 'inheritance',
          position: layout[inheritance.id] ?? FALLBACK_POSITION,
          data: { inheritance, parentName, childrenNames },
          ariaLabel: t("Héritage {0}", [parentName ?? '']),
        }
      },
    ),
    ...(mcd.postits ?? []).map(
      (postit): PostItFlowNode => ({
        id: postit.id,
        type: 'postit',
        position: layout[postit.id] ?? FALLBACK_POSITION,
        data: { postit, mcd },
        ariaLabel: postit.title || t("Post-it"),
      }),
    ),
  ]

  const edges: LegFlowEdge[] = [
    ...mcd.associations.flatMap((association) =>
      association.legs.map((leg): LegFlowEdge => {
        const entityName = mcd.entities.find((e) => e.id === leg.entityId)?.name ?? leg.entityId
        return {
          id: leg.id,
          type: 'leg',
          source: association.id,
          target: leg.entityId,
          data: { cardinality: leg.cardinality, role: leg.role, labelPosition: layout[leg.id] },
          ariaLabel: t("Patte de {0} vers {1}, cardinalité {2},{3}", [association.name, entityName, leg.cardinality.min, leg.cardinality.max]),
        }
      }),
    ),
    ...(mcd.inheritances ?? []).flatMap((inheritance) => {
      const inhEdges: LegFlowEdge[] = []
      if (inheritance.parentId && mcd.entities.some((e) => e.id === inheritance.parentId)) {
        inhEdges.push({
          id: `inh-p-${inheritance.id}-${inheritance.parentId}`,
          type: 'leg',
          source: inheritance.id,
          target: inheritance.parentId,
          data: {},
          ariaLabel: t("Lien héritage vers parent"),
        })
      }
      for (const childId of inheritance.childIds) {
        if (mcd.entities.some((e) => e.id === childId)) {
          inhEdges.push({
            id: `inh-c-${inheritance.id}-${childId}`,
            type: 'leg',
            source: inheritance.id,
            target: childId,
            data: {},
            ariaLabel: t("Lien héritage vers enfant"),
          })
        }
      }
      return inhEdges
    }),
  ]

  return { nodes, edges }
}
