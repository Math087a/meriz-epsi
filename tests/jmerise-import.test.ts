import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseJMeriseBuffer } from '../src/lib/jmeriseParser'

describe('JMerise .mcd importer', () => {
  const resourceDir = 'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise'

  it('correctly parses buveur.mcd', () => {
    const filePath = path.join(resourceDir, 'TP 1', 'buveur.mcd')
    if (!fs.existsSync(filePath)) return
    const buf = fs.readFileSync(filePath)
    const state = parseJMeriseBuffer(buf)
    expect(state.mcd.entities.length).toBeGreaterThan(0)
    expect(state.mcd.properties.length).toBeGreaterThan(0)
    expect(state.mcd.associations.length).toBeGreaterThan(0)
  })

  it('correctly parses cinema.mcd', () => {
    const filePath = path.join(resourceDir, 'TP 1', 'cinema.mcd')
    if (!fs.existsSync(filePath)) return
    const buf = fs.readFileSync(filePath)
    const state = parseJMeriseBuffer(buf)
    expect(state.mcd.entities.length).toBeGreaterThan(0)
    expect(state.mcd.associations.length).toBeGreaterThan(0)
  })
})
