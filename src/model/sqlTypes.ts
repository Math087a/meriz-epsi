import type { AttributeType } from './mcd'
import type { SqlDialect } from './mpd'

/** Noms SQL réels ; pas de traductions ni de pseudo-types dans les sélecteurs. */
export const MYSQL_TYPES = ['VARCHAR', 'CHAR', 'TEXT', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'MONEY', 'BOOLEAN', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'JSON', 'BLOB', 'VARBINARY', 'ENUM'] as const
export const POSTGRES_TYPES = ['VARCHAR', 'CHAR', 'TEXT', 'INTEGER', 'BIGINT', 'SMALLINT', 'NUMERIC', 'REAL', 'DOUBLE PRECISION', 'MONEY', 'BOOLEAN', 'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE', 'UUID', 'JSON', 'JSONB', 'BYTEA'] as const
export const SQLSERVER_TYPES = ['VARCHAR', 'CHAR', 'TEXT', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'MONEY', 'SMALLMONEY', 'BIT', 'DATE', 'TIME', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET', 'UNIQUEIDENTIFIER', 'VARBINARY'] as const
export type SqlTypeName = (typeof MYSQL_TYPES)[number] | (typeof POSTGRES_TYPES)[number] | (typeof SQLSERVER_TYPES)[number]
export interface SqlTypeSpec { name: SqlTypeName | string; length?: number; precision?: number; scale?: number; values?: string[]; unsigned?: boolean }
export const sqlTypeNames = (dialect: SqlDialect): readonly SqlTypeName[] => {
  if (dialect === 'mysql') return MYSQL_TYPES
  if (dialect === 'postgresql') return POSTGRES_TYPES
  return SQLSERVER_TYPES
}
export const isIntegerType = (name: string) => ['INT', 'INTEGER', 'SMALLINT', 'TINYINT', 'BIGINT', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL'].includes(name)
export const isMoneyType = (name: string) => ['MONEY', 'SMALLMONEY'].includes(name)
export const hasLength = (name: string) => ['VARCHAR', 'CHAR', 'VARBINARY'].includes(name)
export const hasPrecision = (name: string) => name === 'DECIMAL' || name === 'NUMERIC'
export function defaultSqlSpec(name: SqlTypeName): SqlTypeSpec {
  return { name, ...(hasLength(name) ? { length: name === 'CHAR' ? 1 : 255 } : {}), ...(hasPrecision(name) ? { precision: 10, scale: 2 } : {}), ...(name === 'ENUM' ? { values: ['valeur1', 'valeur2'] } : {}) }
}
export function formatSqlType(spec: SqlTypeSpec): string {
  const args = hasLength(spec.name) ? `(${spec.length ?? 255})` : hasPrecision(spec.name) ? `(${spec.precision ?? 10},${spec.scale ?? 2})` : spec.name === 'ENUM' ? '(' + (spec.values ?? []).map(v => "'" + v.replaceAll("'", "''") + "'").join(',') + ')' : ''
  return spec.name + args + (spec.unsigned ? ' UNSIGNED' : '')
}

/** Reconnaît aussi les variantes déjà enregistrées, sans accepter de fragment SQL. */
export function parseSqlType(raw: string): SqlTypeSpec | null {
  const match = raw.trim().match(/^([a-z][a-z0-9_ ]*?)(?:\(([^]*)\))?(\s+UNSIGNED)?$/i)
  if (!match) return null
  const aliases: Record<string, string> = { BOOL: 'BOOLEAN', 'CHARACTER VARYING': 'VARCHAR', 'CHARACTER': 'CHAR', 'TIMESTAMP WITHOUT TIME ZONE': 'TIMESTAMP', 'DOUBLE PRECISION': 'DOUBLE PRECISION' }
  const spelling = match[1]!.trim().replace(/\s+/g, ' ').toUpperCase()
  const name = aliases[spelling] ?? spelling
  const allKnown = [...MYSQL_TYPES, ...POSTGRES_TYPES, ...SQLSERVER_TYPES]
  if (!allKnown.includes(name as SqlTypeName)) return null
  const spec: SqlTypeSpec = { name: name as SqlTypeName }
  const args = match[2]
  if (hasLength(name)) {
    if (args !== undefined && !/^\d+$/.test(args.trim())) return null
    spec.length = args === undefined ? (name === 'CHAR' ? 1 : 255) : Number(args)
    if (spec.length < 1 || spec.length > (name === 'CHAR' ? 255 : 65535)) return null
  } else if (hasPrecision(name)) {
    if (args !== undefined && !/^\s*\d+\s*(,\s*\d+\s*)?$/.test(args)) return null
    const parts = args?.split(',').map(Number)
    spec.precision = parts?.[0] ?? 10; spec.scale = parts?.[1] ?? (parts ? 0 : 2)
    if (spec.precision < 1 || spec.precision > 1000 || spec.scale < 0 || spec.scale > spec.precision) return null
  } else if (name === 'ENUM') {
    if (!args) return null
    const values: string[] = []; const expression = /\s*'((?:[^'\\]|'')*)'\s*(,|$)/gy
    let cursor = 0
    while (cursor < args.length) { expression.lastIndex = cursor; const value = expression.exec(args); if (!value) return null; values.push(value[1]!.replaceAll("''", "'")); cursor = expression.lastIndex; if (value[2] === ',' && cursor === args.length) return null }
    if (!values.length || new Set(values).size !== values.length) return null
    spec.values = values
  } else if (args !== undefined) {
    // Alias historique BOOLEAN de MySQL.
    if (name === 'TINYINT' && args.trim() === '1') return { name: 'BOOLEAN' }
    return null
  }
  if (match[3]) { if (!isIntegerType(name)) return null; spec.unsigned = true }
  return spec
}
export function conceptualTypeFor(spec: SqlTypeSpec): AttributeType {
  if (isIntegerType(spec.name)) return 'entier'
  if (isMoneyType(spec.name)) return 'decimal'
  if (['NUMERIC', 'DECIMAL', 'REAL', 'FLOAT', 'DOUBLE', 'DOUBLE PRECISION'].includes(spec.name)) return 'decimal'
  if (['BOOLEAN', 'BIT'].includes(spec.name)) return 'booleen'
  if (spec.name === 'DATE') return 'date'
  if (spec.name === 'TIME') return 'heure'
  if (['DATETIME', 'DATETIME2', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE'].includes(spec.name)) return 'datetime'
  return 'texte'
}
export function sqlTypeForDialect(spec: SqlTypeSpec, dialect: SqlDialect): SqlTypeSpec | null {
  const mysql: Partial<Record<string, string>> = { INTEGER: 'INT', NUMERIC: 'DECIMAL', REAL: 'FLOAT', 'DOUBLE PRECISION': 'DOUBLE', BYTEA: 'BLOB', BIT: 'BOOLEAN', DATETIME2: 'DATETIME' }
  const postgres: Partial<Record<string, string>> = { INT: 'INTEGER', TINYINT: 'SMALLINT', DECIMAL: 'NUMERIC', FLOAT: 'REAL', DOUBLE: 'DOUBLE PRECISION', DATETIME: 'TIMESTAMP', DATETIME2: 'TIMESTAMP', BLOB: 'BYTEA', VARBINARY: 'BYTEA', BIT: 'BOOLEAN' }
  const sqlserver: Partial<Record<string, string>> = { INTEGER: 'INT', BOOLEAN: 'BIT', TIMESTAMP: 'DATETIME2', 'TIMESTAMP WITH TIME ZONE': 'DATETIMEOFFSET', UUID: 'UNIQUEIDENTIFIER', BLOB: 'VARBINARY', BYTEA: 'VARBINARY', JSON: 'TEXT', JSONB: 'TEXT', DOUBLE: 'FLOAT' }
  const mapper = dialect === 'mysql' ? mysql : dialect === 'postgresql' ? postgres : sqlserver
  const name = (mapper[spec.name] ?? spec.name) as SqlTypeName
  if (!sqlTypeNames(dialect).includes(name)) return null
  if (dialect === 'postgresql' && spec.unsigned) return null
  if (dialect === 'mysql' && hasPrecision(name) && ((spec.precision ?? 10) > 65 || (spec.scale ?? 2) > 30)) return null
  return { ...spec, name }
}
