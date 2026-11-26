import { parseSqlType, conceptualTypeFor } from './sqlTypes'
import type { MpdSettings, SqlDialect } from './mpd'
import { DEFAULT_MPD_SETTINGS } from './mpd'
import { t } from "../i18n/runtime"
import type {
  Association,
  PropertyRef,
  AttributeType,
  Cardinality,
  Entity,
  Leg,
  Mcd,
  Property,
  PostIt,
  Inheritance,
  InheritanceConstraint,
} from './mcd'
import type { ExamWork } from './examWork'
import { EMPTY_EXAM_WORK } from './examWork'
import type { McdLayout, Position } from './layout'
import { findPlacement, findProperty } from './queries'
import { newId } from '../lib/id'

/**
 * État applicatif : le MCD (source de vérité) et le layout (positions).
 * Toute action utilisateur passe par ce reducer pur ; l'affichage
 * React Flow est ensuite recalculé à partir de cet état.
 */
export interface McdEditorState {
  mcd: Mcd
  layout: McdLayout
  /** Réglages physiques, hors du MCD mais partagés dans le même document. */
  mpd?: MpdSettings
  /** Travail manuel saisi en Mode Contrôle (indépendant du MCD). */
  exam?: ExamWork
}

/** Modification partielle d'une propriété du dictionnaire. */
export interface PropertyPatch {
  name?: string
  type?: AttributeType
  size?: number | undefined
}

export type McdAction =
  | { type: 'ADD_ENTITY'; position: Position }
  | { type: 'ADD_ASSOCIATION'; position: Position }
  | { type: 'ADD_LEG'; associationId: string; entityId: string }
  /*
   * `gesture` n'appartient pas au modèle : c'est le jeton du geste en
   * cours, qui sert au seul découpage de l'historique. Le réducteur
   * l'ignore, et il ne part jamais dans le fichier enregistré.
   */
  | { type: 'MOVE_NODE'; id: string; position: Position; gesture?: string }
  | { type: 'MOVE_NODES'; moves: { id: string; position: Position }[]; gesture?: string }
  | { type: 'DELETE_ENTITY'; id: string }
  | { type: 'DELETE_DICTIONARY_TABLE'; id: string }
  | { type: 'DELETE_ASSOCIATION'; id: string }
  | { type: 'DELETE_LEG'; id: string }
  | { type: 'RENAME_ENTITY'; id: string; name: string }
  | { type: 'RENAME_ASSOCIATION'; id: string; name: string }
  // Dictionnaire central : la propriété est définie une seule fois.
  | { type: 'SET_DIALECT'; dialect: SqlDialect }
  | { type: 'SET_SQL_TYPE'; propertyId: string; value: string }
  | { type: 'SET_IDENTITY'; propertyId: string; value: boolean }
  | { type: 'MOVE_PROPERTY'; propertyId: string; ownerId: string | null; beforeId?: string }
  | { type: 'ADD_PROPERTY' }
  | { type: 'UPDATE_PROPERTY'; propertyId: string; patch: PropertyPatch }
  | { type: 'DELETE_PROPERTY'; propertyId: string }
  // Placements : une propriété dans au plus un porteur.
  | { type: 'ADD_ATTRIBUTE'; ownerId: string }
  | { type: 'PLACE_PROPERTY'; ownerId: string; propertyId: string }
  | { type: 'REMOVE_ATTRIBUTE'; ownerId: string; propertyId: string }
  | { type: 'SET_ATTRIBUTE_IDENTIFIER'; entityId: string; propertyId: string; isIdentifier: boolean }
  | { type: 'SET_LEG_CARDINALITY'; legId: string; cardinality: Cardinality }
  | { type: 'SET_LEG_ROLE'; legId: string; role: string | undefined }
  | { type: 'ADD_POSTIT'; id?: string; position: Position; mode?: 'text' | 'mld' }
  | { type: 'UPDATE_POSTIT'; id: string; patch: Partial<PostIt> }
  | { type: 'DELETE_POSTIT'; id: string }
  | { type: 'ADD_INHERITANCE'; id?: string; name?: string; position: Position; parentId?: string; childIds?: string[]; constraint?: InheritanceConstraint }
  | { type: 'UPDATE_INHERITANCE'; id: string; patch: Partial<Inheritance> }
  | { type: 'DELETE_INHERITANCE'; id: string }
  | { type: 'UPDATE_EXAM_WORK'; patch: Partial<ExamWork> }

/** Premier nom « base N » non encore utilisé. */
function nextName(base: string, usedNames: string[]): string {
  let n = 1
  while (usedNames.includes(`${base} ${n}`)) {
    n += 1
  }
  return `${base} ${n}`
}

/** Nouvelle propriété au nom unique dans le dictionnaire. */
function newProperty(mcd: Mcd, base: string, type: AttributeType): Property {
  return {
    id: newId(),
    name: nextName(
      base,
      mcd.properties.map((p) => p.name),
    ),
    type,
  }
}

function withEntity(
  state: McdEditorState,
  id: string,
  update: (entity: Entity) => Entity,
): McdEditorState {
  return {
    ...state,
    mcd: {
      ...state.mcd,
      entities: state.mcd.entities.map((e) => (e.id === id ? update(e) : e)),
    },
  }
}

function withAssociation(
  state: McdEditorState,
  id: string,
  update: (association: Association) => Association,
): McdEditorState {
  return {
    ...state,
    mcd: {
      ...state.mcd,
      associations: state.mcd.associations.map((a) => (a.id === id ? update(a) : a)),
    },
  }
}

/** Applique une transformation aux références du porteur (entité ou association). */
function withOwnerAttributes(
  state: McdEditorState,
  ownerId: string,
  update: (attributes: PropertyRef[]) => PropertyRef[],
): McdEditorState {
  if (state.mcd.entities.some((e) => e.id === ownerId)) {
    return withEntity(state, ownerId, (e) => ({ ...e, attributes: update(e.attributes) }))
  }
  return withAssociation(state, ownerId, (a) => ({ ...a, attributes: update(a.attributes) }))
}

function withLeg(
  state: McdEditorState,
  legId: string,
  update: (leg: Leg) => Leg,
): McdEditorState {
  return {
    ...state,
    mcd: {
      ...state.mcd,
      associations: state.mcd.associations.map((a) =>
        a.legs.some((l) => l.id === legId)
          ? { ...a, legs: a.legs.map((l) => (l.id === legId ? update(l) : l)) }
          : a,
      ),
    },
  }
}

function reduceModel(state: McdEditorState, action: McdAction): McdEditorState {
  switch (action.type) {
    case 'SET_DIALECT': return { ...state, mpd: { ...(state.mpd ?? DEFAULT_MPD_SETTINGS), dialect: action.dialect } }
    case 'SET_SQL_TYPE': {
      const settings = state.mpd ?? DEFAULT_MPD_SETTINGS
      const overrides = { ...settings.overrides }
      if (action.value.trim()) overrides[action.propertyId] = action.value.trim()
      else delete overrides[action.propertyId]
      const spec = parseSqlType(action.value)
      const mcd = spec ? { ...state.mcd, properties: state.mcd.properties.map(p => p.id === action.propertyId ? { ...p, type: conceptualTypeFor(spec) } : p) } : state.mcd
      return { ...state, mcd, mpd: { ...settings, overrides } }
    }
    case 'SET_IDENTITY': return { ...state, mpd: { ...(state.mpd ?? DEFAULT_MPD_SETTINGS), identity: { ...state.mpd?.identity, [action.propertyId]: action.value } } }
    case 'MOVE_PROPERTY': {
      if (!findProperty(state.mcd, action.propertyId)) return state
      const owners = [...state.mcd.entities, ...state.mcd.associations]
      if (action.ownerId !== null && !owners.some(o => o.id === action.ownerId)) return state
      const placement = findPlacement(state.mcd, action.propertyId)
      const identifier = placement?.owner.attributes.find(a => a.propertyId === action.propertyId)?.isIdentifier ?? false
      const update = <T extends Entity | Association>(owner: T): T => {
        if (owner.id !== placement?.owner.id && owner.id !== action.ownerId) return owner
        const attributes = owner.attributes.map((a, index) => ({ ...a, order: a.order ?? index * 1024 })).filter(a => a.propertyId !== action.propertyId)
        if (owner.id === action.ownerId) {
          const at = action.beforeId ? attributes.findIndex(a => a.propertyId === action.beforeId) : -1
          const position = at < 0 ? attributes.length : at
          const left = attributes[position - 1]?.order ?? ((attributes[position]?.order ?? 0) - 2048)
          const right = attributes[position]?.order ?? (left + 2048)
          attributes.splice(position, 0, { order: (left + right) / 2, propertyId: action.propertyId, isIdentifier: state.mcd.entities.some(e => e.id === owner.id) && identifier })
        }
        return { ...owner, attributes }
      }
      return { ...state, mcd: { ...state.mcd, entities: state.mcd.entities.map(update), associations: state.mcd.associations.map(update) } }
    }
    case 'ADD_ENTITY': {
      // Une entité naît avec une propriété identifiant placée, pour
      // respecter les invariants (au moins un attribut, un identifiant).
      const property = newProperty(state.mcd, 'id', 'entier')
      const entity: Entity = {
        id: newId(),
        name: nextName(
          t("Entite"),
          state.mcd.entities.map((e) => e.name),
        ),
        attributes: [{ propertyId: property.id, isIdentifier: true }],
      }
      return {
        mcd: {
          ...state.mcd,
          properties: [...state.mcd.properties, property],
          entities: [...state.mcd.entities, entity],
        },
        layout: { ...state.layout, [entity.id]: action.position },
      }
    }

    case 'ADD_ASSOCIATION': {
      const association: Association = {
        id: newId(),
        name: nextName(
          t("Association"),
          state.mcd.associations.map((a) => a.name),
        ),
        attributes: [],
        legs: [],
      }
      return {
        mcd: { ...state.mcd, associations: [...state.mcd.associations, association] },
        layout: { ...state.layout, [association.id]: action.position },
      }
    }

    case 'ADD_LEG': {
      // Cardinalité par défaut (1,1), éditable dans l'inspecteur.
      return {
        ...state,
        mcd: {
          ...state.mcd,
          associations: state.mcd.associations.map((a) =>
            a.id === action.associationId
              ? {
                  ...a,
                  legs: [
                    ...a.legs,
                    {
                      id: newId(),
                      entityId: action.entityId,
                      cardinality: { min: 1, max: 1 },
                    },
                  ],
                }
              : a,
          ),
        },
      }
    }

    case 'MOVE_NODE': {
      // Le déplacement ne touche que le layout, jamais le modèle.
      return {
        ...state,
        layout: { ...state.layout, [action.id]: action.position },
      }
    }

    case 'MOVE_NODES': {
      // Glisser groupé : une seule action, et toutes les images d'un
      // même geste se fondent en une seule étape d'undo.
      const layout = { ...state.layout }
      for (const move of action.moves) {
        layout[move.id] = move.position
      }
      return { ...state, layout }
    }

    case 'DELETE_DICTIONARY_TABLE': {
      const entity = state.mcd.entities.find(e => e.id === action.id)
      if (!entity) return state
      // On prend les propriétés encore présentes dans la table au moment de confirmer.
      const removed = new Set(entity.attributes.map(a => a.propertyId))
      const next = reduceModel(state, { type: 'DELETE_ENTITY', id: action.id })
      const settings = state.mpd
      const mpd = settings ? { ...settings, overrides: Object.fromEntries(Object.entries(settings.overrides).filter(([id]) => !removed.has(id))), ...(settings.identity ? { identity: Object.fromEntries(Object.entries(settings.identity).filter(([id]) => !removed.has(id))) } : {}) } : undefined
      return { ...next, mcd: { ...next.mcd, properties: next.mcd.properties.filter(p => !removed.has(p.id)) }, ...(mpd ? { mpd } : {}) }
    }
    case 'DELETE_ENTITY': {
      // Retire aussi les pattes qui référencent l'entité (pas de lien
      // orphelin). Ses propriétés restent au dictionnaire, non placées.
      const layout = { ...state.layout }
      delete layout[action.id]
      // Les positions d'étiquettes des pattes supprimées partent aussi.
      for (const association of state.mcd.associations) {
        for (const leg of association.legs) {
          if (leg.entityId === action.id) {
            delete layout[leg.id]
          }
        }
      }
      return {
        mcd: {
          ...state.mcd,
          entities: state.mcd.entities.filter((e) => e.id !== action.id),
          associations: state.mcd.associations.map((a) =>
            a.legs.some((l) => l.entityId === action.id)
              ? { ...a, legs: a.legs.filter((l) => l.entityId !== action.id) }
              : a,
          ),
          ...(state.mcd.inheritances
            ? {
                inheritances: state.mcd.inheritances
                  .filter((i) => i.parentId !== action.id)
                  .map((i) => ({
                    ...i,
                    childIds: i.childIds.filter((cid) => cid !== action.id),
                  })),
              }
            : {}),
        },
        layout,
      }
    }

    case 'DELETE_ASSOCIATION': {
      const layout = { ...state.layout }
      delete layout[action.id]
      const association = state.mcd.associations.find((a) => a.id === action.id)
      for (const leg of association?.legs ?? []) {
        delete layout[leg.id]
      }
      return {
        mcd: {
          ...state.mcd,
          associations: state.mcd.associations.filter((a) => a.id !== action.id),
        },
        layout,
      }
    }

    case 'DELETE_LEG': {
      const layout = { ...state.layout }
      delete layout[action.id]
      return {
        mcd: {
          ...state.mcd,
          associations: state.mcd.associations.map((a) =>
            a.legs.some((l) => l.id === action.id)
              ? { ...a, legs: a.legs.filter((l) => l.id !== action.id) }
              : a,
          ),
        },
        layout,
      }
    }

    case 'RENAME_ENTITY': {
      return withEntity(state, action.id, (e) => ({ ...e, name: action.name }))
    }

    case 'RENAME_ASSOCIATION': {
      return withAssociation(state, action.id, (a) => ({ ...a, name: action.name }))
    }

    case 'ADD_PROPERTY': {
      return {
        ...state,
        mcd: {
          ...state.mcd,
          properties: [...state.mcd.properties, newProperty(state.mcd, 'propriete', 'texte')],
        },
      }
    }

    case 'UPDATE_PROPERTY': {
      return {
        ...state,
        mcd: {
          ...state.mcd,
          properties: state.mcd.properties.map((p) =>
            p.id === action.propertyId ? { ...p, ...action.patch } : p,
          ),
        },
      }
    }

    case 'DELETE_PROPERTY': {
      // Suppression définitive : la propriété quitte le dictionnaire
      // et son placement éventuel disparaît avec elle.
      const dropRef = (refs: PropertyRef[]) =>
        refs.filter((ref) => ref.propertyId !== action.propertyId)
      return {
        ...state,
        mcd: {
          properties: state.mcd.properties.filter((p) => p.id !== action.propertyId),
          entities: state.mcd.entities.map((e) => ({ ...e, attributes: dropRef(e.attributes) })),
          associations: state.mcd.associations.map((a) => ({
            ...a,
            attributes: dropRef(a.attributes),
          })),
        },
      }
    }

    case 'ADD_ATTRIBUTE': {
      // Crée une propriété au dictionnaire et la place dans le porteur.
      const property = newProperty(state.mcd, 'propriete', 'texte')
      const placed = withOwnerAttributes(
        { ...state, mcd: { ...state.mcd, properties: [...state.mcd.properties, property] } },
        action.ownerId,
        (attributes) => [...attributes, { propertyId: property.id, isIdentifier: false }],
      )
      return placed
    }

    case 'PLACE_PROPERTY': {
      // Unicité par construction : refus silencieux si la propriété
      // n'existe pas ou est déjà placée quelque part.
      if (
        !findProperty(state.mcd, action.propertyId) ||
        findPlacement(state.mcd, action.propertyId)
      ) {
        return state
      }
      return withOwnerAttributes(state, action.ownerId, (attributes) => [
        ...attributes,
        { propertyId: action.propertyId, isIdentifier: false },
      ])
    }

    case 'REMOVE_ATTRIBUTE': {
      // Retire le placement ; la propriété reste au dictionnaire.
      return withOwnerAttributes(state, action.ownerId, (attributes) =>
        attributes.filter((ref) => ref.propertyId !== action.propertyId),
      )
    }

    case 'SET_ATTRIBUTE_IDENTIFIER': {
      return withEntity(state, action.entityId, (e) => ({
        ...e,
        attributes: e.attributes.map((ref) =>
          ref.propertyId === action.propertyId
            ? { ...ref, isIdentifier: action.isIdentifier }
            : ref,
        ),
      }))
    }

    case 'SET_LEG_CARDINALITY': {
      return withLeg(state, action.legId, (l) => ({ ...l, cardinality: action.cardinality }))
    }

    case 'SET_LEG_ROLE': {
      return withLeg(state, action.legId, (l) => ({ ...l, role: action.role }))
    }

    case 'ADD_POSTIT': {
      const id = action.id ?? newId()
      const postit: PostIt = {
        id,
        title: action.mode === 'mld' ? 'MLD Dynamique' : 'Mémo',
        content: '',
        mode: action.mode ?? 'text',
        color: 'yellow',
      }
      return {
        ...state,
        mcd: {
          ...state.mcd,
          postits: [...(state.mcd.postits ?? []), postit],
        },
        layout: {
          ...state.layout,
          [id]: action.position,
        },
      }
    }

    case 'UPDATE_POSTIT': {
      return {
        ...state,
        mcd: {
          ...state.mcd,
          postits: (state.mcd.postits ?? []).map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
        },
      }
    }

    case 'DELETE_POSTIT': {
      const layout = { ...state.layout }
      delete layout[action.id]
      const postits = (state.mcd.postits ?? []).filter((p) => p.id !== action.id)
      const nextMcd: Mcd = { ...state.mcd }
      if (postits.length > 0) {
        nextMcd.postits = postits
      } else {
        delete nextMcd.postits
      }
      return {
        ...state,
        mcd: nextMcd,
        layout,
      }
    }

    case 'ADD_INHERITANCE': {
      const id = action.id ?? newId()
      const inheritance: Inheritance = {
        id,
        parentId: action.parentId ?? (state.mcd.entities[0]?.id ?? ''),
        childIds: action.childIds ?? (state.mcd.entities.length > 1 ? [state.mcd.entities[1].id] : []),
        constraint: action.constraint ?? 'none',
        ...(action.name ? { name: action.name } : {}),
      }
      return {
        ...state,
        mcd: {
          ...state.mcd,
          inheritances: [...(state.mcd.inheritances ?? []), inheritance],
        },
        layout: {
          ...state.layout,
          [id]: action.position,
        },
      }
    }

    case 'UPDATE_INHERITANCE': {
      return {
        ...state,
        mcd: {
          ...state.mcd,
          inheritances: (state.mcd.inheritances ?? []).map((i) => {
            if (i.id !== action.id) return i
            const updated = { ...i, ...action.patch }
            const res: Inheritance = {
              id: updated.id,
              parentId: updated.parentId,
              childIds: updated.childIds,
              constraint: updated.constraint,
              ...(updated.name !== undefined ? { name: updated.name } : {}),
            }
            return res
          }),
        },
      }
    }

    case 'DELETE_INHERITANCE': {
      const layout = { ...state.layout }
      delete layout[action.id]
      const inheritances = (state.mcd.inheritances ?? []).filter((i) => i.id !== action.id)
      const nextMcd: Mcd = { ...state.mcd }
      if (inheritances.length > 0) {
        nextMcd.inheritances = inheritances
      } else {
        delete nextMcd.inheritances
      }
      return {
        ...state,
        mcd: nextMcd,
        layout,
      }
    }

    case 'UPDATE_EXAM_WORK': {
      const current = state.exam ?? EMPTY_EXAM_WORK
      return {
        ...state,
        exam: {
          ...current,
          ...action.patch,
        },
      }
    }
  }
}

/** Les actions du MCD conservent les réglages physiques et le travail d'examen. */
export function mcdReducer(state: McdEditorState, action: McdAction): McdEditorState {
  const next = reduceModel(state, action)
  if (next === state) return state
  const needMpd = Boolean(state.mpd && !next.mpd)
  const needExam = Boolean(state.exam && !next.exam)
  if (!needMpd && !needExam) return next
  return {
    ...next,
    ...(needMpd ? { mpd: state.mpd } : {}),
    ...(needExam ? { exam: state.exam } : {}),
  }
}
