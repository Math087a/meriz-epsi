import type { McdEditorState } from '../model/mcdReducer'
import type { AttributeType, Property, Entity, Association, PropertyRef } from '../model/mcd'
import { DEFAULT_MPD_SETTINGS } from '../model/mpd'

const STREAM_MAGIC = 0xACED
const STREAM_VERSION = 5

const TC_NULL = 0x70
const TC_REFERENCE = 0x71
const TC_CLASSDESC = 0x72
const TC_OBJECT = 0x73
const TC_STRING = 0x74
const TC_ARRAY = 0x75
const TC_BLOCKDATA = 0x77
const TC_ENDBLOCKDATA = 0x78
const TC_RESET = 0x79
const TC_BLOCKDATALONG = 0x7A
const TC_ENUM = 0x7E

const SC_WRITE_METHOD = 0x01

export class JavaSerializationStreamReader {
  private buf: Uint8Array
  private view: DataView
  private pos = 0
  private handles: any[] = []

  constructor(buffer: ArrayBuffer | Uint8Array) {
    if (buffer instanceof Uint8Array) {
      this.buf = buffer
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    } else {
      this.buf = new Uint8Array(buffer)
      this.view = new DataView(buffer)
    }
  }

  remaining(): number {
    return this.buf.length - this.pos
  }

  readU1(): number {
    return this.buf[this.pos++]
  }

  readU2(): number {
    const val = this.view.getUint16(this.pos)
    this.pos += 2
    return val
  }

  readI4(): number {
    const val = this.view.getInt32(this.pos)
    this.pos += 4
    return val
  }

  readU4(): number {
    const val = this.view.getUint32(this.pos)
    this.pos += 4
    return val
  }

  readI8(): bigint {
    const val = this.view.getBigInt64(this.pos)
    this.pos += 8
    return val
  }

  readF4(): number {
    const val = this.view.getFloat32(this.pos)
    this.pos += 4
    return val
  }

  readF8(): number {
    const val = this.view.getFloat64(this.pos)
    this.pos += 8
    return val
  }

  readUtf(): string {
    const len = this.readU2()
    const bytes = this.buf.subarray(this.pos, this.pos + len)
    this.pos += len
    return new TextDecoder('utf-8').decode(bytes)
  }

  newHandle(obj: any): any {
    this.handles.push(obj)
    return obj
  }

  getHandle(handleId: number): any {
    const idx = handleId - 0x7E0000
    if (idx >= 0 && idx < this.handles.length) {
      return this.handles[idx]
    }
    return { _unknownHandle: handleId }
  }

  parse(): any[] {
    const magic = this.readU2()
    const version = this.readU2()
    if (magic !== STREAM_MAGIC || version !== STREAM_VERSION) {
      throw new Error(`Invalid Java Serialization header: magic=0x${magic.toString(16)}, version=${version}`)
    }

    const results: any[] = []
    while (this.remaining() > 0) {
      const tc = this.readU1()
      const val = this.readContent(tc)
      if (val !== undefined && tc !== TC_ENDBLOCKDATA) {
        results.push(val)
      }
    }
    return results
  }

  readContent(tc: number): any {
    switch (tc) {
      case TC_NULL:
        return null
      case TC_REFERENCE:
        return this.getHandle(this.readU4())
      case TC_CLASSDESC:
        return this.readClassDesc()
      case TC_OBJECT:
        return this.readObject()
      case TC_STRING:
        return this.readString()
      case TC_ARRAY:
        return this.readArray()
      case TC_BLOCKDATA: {
        const len = this.readU1()
        const data = this.buf.subarray(this.pos, this.pos + len)
        this.pos += len
        return { _blockData: data }
      }
      case TC_BLOCKDATALONG: {
        const len = this.readU4()
        const data = this.buf.subarray(this.pos, this.pos + len)
        this.pos += len
        return { _blockData: data }
      }
      case TC_ENDBLOCKDATA:
        return undefined
      case TC_RESET:
        this.handles = []
        return undefined
      case TC_ENUM:
        return this.readEnum()
      default:
        throw new Error(`Unhandled TC byte: 0x${tc.toString(16)} at offset ${this.pos - 1}`)
    }
  }

  readString(): string {
    const s = this.readUtf()
    this.newHandle(s)
    return s
  }

  readClassDesc(): any {
    const name = this.readUtf()
    const suid = this.readI8()
    const flags = this.readU1()
    const fieldCount = this.readU2()

    const desc: any = {
      name,
      suid: suid.toString(),
      flags,
      fields: [],
      super: null,
    }
    this.newHandle(desc)

    for (let i = 0; i < fieldCount; i++) {
      const typecode = String.fromCharCode(this.readU1())
      const fname = this.readUtf()
      let className = null
      if (typecode === '[' || typecode === 'L') {
        const subTc = this.readU1()
        className = this.readContent(subTc)
      }
      desc.fields.push({ name: fname, type: typecode, className })
    }

    while (true) {
      const subTc = this.readU1()
      if (subTc === TC_ENDBLOCKDATA) break
      this.readContent(subTc)
    }

    const superTc = this.readU1()
    if (superTc !== TC_NULL) {
      desc.super = this.readContent(superTc)
    }

    return desc
  }

  readEnum(): any {
    const tc = this.readU1()
    const cd = this.readContent(tc)
    const enumObj: any = { _class: cd.name, _isEnum: true }
    this.newHandle(enumObj)
    const nameTc = this.readU1()
    enumObj.name = this.readContent(nameTc)
    return enumObj
  }

  readArray(): any[] {
    const tc = this.readU1()
    const cd = this.readContent(tc)
    const len = this.readI4()
    const arr: any[] = []
    this.newHandle(arr)
    const elemType = cd.name.substring(1)
    for (let i = 0; i < len; i++) {
      if (elemType === 'B') arr.push(this.readU1())
      else if (elemType === 'I') arr.push(this.readI4())
      else if (elemType === 'Z') arr.push(this.readU1() !== 0)
      else {
        const subTc = this.readU1()
        arr.push(this.readContent(subTc))
      }
    }
    return arr
  }

  readObject(): any {
    const tc = this.readU1()
    const cd = this.readContent(tc)
    const obj: any = { _class: cd.name }
    this.newHandle(obj)

    const hierarchy = []
    let curr = cd
    while (curr) {
      hierarchy.push(curr)
      curr = curr.super
    }
    hierarchy.reverse()

    for (const c of hierarchy) {
      for (const f of c.fields) {
        let val: any
        switch (f.type) {
          case 'B': val = this.readU1(); break
          case 'Z': val = (this.readU1() !== 0); break
          case 'S': val = this.view.getInt16(this.pos); this.pos += 2; break
          case 'C': val = String.fromCharCode(this.readU2()); break
          case 'I': val = this.readI4(); break
          case 'J': val = this.readI8().toString(); break
          case 'F': val = this.readF4(); break
          case 'D': val = this.readF8(); break
          case '[':
          case 'L': {
            const subTc = this.readU1()
            val = this.readContent(subTc)
            break
          }
          default:
            throw new Error(`Unknown type code '${f.type}'`)
        }
        obj[f.name] = val
      }

      if (c.flags & SC_WRITE_METHOD) {
        if (c.name === 'java.util.ArrayList') {
          const nextTc = this.readU1()
          if (nextTc === TC_BLOCKDATA) {
            const blen = this.readU1()
            this.pos += blen
          } else if (nextTc === TC_BLOCKDATALONG) {
            const blen = this.readU4()
            this.pos += blen
          } else {
            this.pos--
          }

          const size = obj.size || 0
          const elements = []
          for (let i = 0; i < size; i++) {
            const subTc = this.readU1()
            elements.push(this.readContent(subTc))
          }
          obj._elements = elements

          if (this.remaining() > 0 && this.buf[this.pos] === TC_ENDBLOCKDATA) {
            this.pos++
          }
        } else if (c.name === 'java.awt.Color') {
          while (this.remaining() > 0) {
            const subTc = this.readU1()
            if (subTc === TC_ENDBLOCKDATA) break
            this.readContent(subTc)
          }
        } else {
          while (this.remaining() > 0) {
            const subTc = this.readU1()
            if (subTc === TC_ENDBLOCKDATA) break
            this.readContent(subTc)
          }
        }
      }
    }
    return obj
  }
}

function mapJMeriseType(rawType?: string): AttributeType {
  if (!rawType) return 'texte'
  const t = rawType.toUpperCase().trim()
  if (t.includes('INT') || t.includes('SERIAL') || t === 'AUTO_INCREMENT') return 'entier'
  if (t.includes('DECIMAL') || t.includes('NUMERIC') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('MONEY') || t.includes('REAL')) return 'decimal'
  if (t.includes('BOOL')) return 'booleen'
  if (t === 'DATE') return 'date'
  if (t.includes('TIME') && !t.includes('DATE')) return 'heure'
  if (t.includes('DATETIME') || t.includes('TIMESTAMP')) return 'datetime'
  return 'texte'
}

export function parseJMeriseStream(streamObjects: any[]): McdEditorState {
  const rawEntitiesAndRelations = streamObjects[1]?._elements || []
  const rawLinks = streamObjects[2]?._elements || []

  const properties: Property[] = []
  const entities: Entity[] = []
  const associations: Association[] = []
  const layout: Record<string, { x: number; y: number }> = {}

  const entityMap = new Map<any, Entity>()
  const relationMap = new Map<any, Association>()

  let propCounter = 1
  let entityCounter = 1
  let relationCounter = 1

  for (const item of rawEntitiesAndRelations) {
    const cls: string = item._class || ''
    const p0 = item.p0 || { x: 50, y: 50 }
    const posX = p0.x ?? 50
    const posY = p0.y ?? 50

    if (cls.includes('IhmEntite')) {
      const eId = `e-${entityCounter++}`
      const entData = item.entite || {}
      const eName = (entData.nom || `Entite_${entityCounter}`).trim()
      const rawAttrs = entData.listeAttributs?._elements || []

      const attrRefs: PropertyRef[] = []
      for (const att of rawAttrs) {
        const pId = `p-${propCounter++}`
        const pName = (att.nom || `att_${propCounter}`).trim()
        const pType = mapJMeriseType(att.type)
        const pSize = att.longueur > 0 ? Number(att.longueur) : undefined
        const isKey = Boolean(att.primaryKey) || att.key === 'PRIMARY_KEY'

        properties.push({
          id: pId,
          name: pName,
          type: pType,
          ...(pSize ? { size: pSize } : {}),
        })

        attrRefs.push({
          order: attrRefs.length,
          propertyId: pId,
          isIdentifier: isKey,
        })
      }

      const entity: Entity = {
        id: eId,
        name: eName,
        attributes: attrRefs,
      }
      entities.push(entity)
      layout[eId] = { x: posX, y: posY }
      entityMap.set(item, entity)
    } else if (cls.includes('IhmRelation')) {
      const aId = `a-${relationCounter++}`
      const relData = item.relation || {}
      const aName = (relData.nom || `Relation_${relationCounter}`).trim()
      const rawAttrs = relData.listeAttributs?._elements || []

      const attrRefs: PropertyRef[] = []
      for (const att of rawAttrs) {
        const pId = `p-${propCounter++}`
        const pName = (att.nom || `att_${propCounter}`).trim()
        const pType = mapJMeriseType(att.type)
        const pSize = att.longueur > 0 ? Number(att.longueur) : undefined

        properties.push({
          id: pId,
          name: pName,
          type: pType,
          ...(pSize ? { size: pSize } : {}),
        })

        attrRefs.push({
          order: attrRefs.length,
          propertyId: pId,
          isIdentifier: false,
        })
      }

      const association: Association = {
        id: aId,
        name: aName,
        attributes: attrRefs,
        legs: [],
      }
      associations.push(association)
      layout[aId] = { x: posX, y: posY }
      relationMap.set(item, association)
    }
  }

  // Links
  let legCounter = 1
  for (const lien of rawLinks) {
    const rawEnt = lien.entite
    const rawRel = lien.relation
    const targetEntity = entityMap.get(rawEnt)
    const targetAssociation = relationMap.get(rawRel)

    if (targetEntity && targetAssociation) {
      let min: 0 | 1 = 0
      let max: 1 | 'n' = 'n'
      const cards = lien.cardinalites
      const cardStr = (cards ? `${cards.min},${cards.max}` : lien.cardinalite || '0,n').trim().toLowerCase()

      if (cardStr.includes('1,1')) { min = 1; max = 1 }
      else if (cardStr.includes('0,1')) { min = 0; max = 1 }
      else if (cardStr.includes('1,n')) { min = 1; max = 'n' }
      else if (cardStr.includes('0,n')) { min = 0; max = 'n' }

      const role = lien.nom ? lien.nom.trim() : undefined

      targetAssociation.legs.push({
        id: `leg-${legCounter++}`,
        entityId: targetEntity.id,
        cardinality: { min, max },
        ...(role ? { role } : {}),
      })
    }
  }

  return {
    mcd: {
      properties,
      entities,
      associations,
    },
    layout,
    mpd: DEFAULT_MPD_SETTINGS,
  }
}

export function parseJMeriseBuffer(buffer: ArrayBuffer | Uint8Array): McdEditorState {
  const reader = new JavaSerializationStreamReader(buffer)
  const streamObjects = reader.parse()
  return parseJMeriseStream(streamObjects)
}
