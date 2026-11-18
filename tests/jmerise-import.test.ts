import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseJMeriseBuffer } from '../src/lib/jmeriseParser'
import { parseModelFile } from '../src/lib/persistence'
import { mcdToFlow } from '../src/canvas/mcdToFlow'

describe('JMerise .mcd et conversion .json Meriz', () => {
  const resourceDir = 'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise'

  it('analyse correctement buveur.mcd', () => {
    const filePath = path.join(resourceDir, 'TP 1', 'buveur.mcd')
    if (!fs.existsSync(filePath)) return
    const buf = fs.readFileSync(filePath)
    const state = parseJMeriseBuffer(buf)
    expect(state.mcd.entities.length).toBeGreaterThan(0)
    expect(state.mcd.properties.length).toBeGreaterThan(0)
    expect(state.mcd.associations.length).toBeGreaterThan(0)
  })

  it('analyse correctement cinema.mcd', () => {
    const filePath = path.join(resourceDir, 'TP 1', 'cinema.mcd')
    if (!fs.existsSync(filePath)) return
    const buf = fs.readFileSync(filePath)
    const state = parseJMeriseBuffer(buf)
    expect(state.mcd.entities.length).toBeGreaterThan(0)
    expect(state.mcd.associations.length).toBeGreaterThan(0)
  })

  it('ouvre correctement tous les fichiers .json convertis', () => {
    const examplesDir = path.join(__dirname, '..', 'examples')
    const jsonFiles = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.json'))

    expect(jsonFiles.length).toBeGreaterThanOrEqual(9)

    for (const jsonFile of jsonFiles) {
      const fullPath = path.join(examplesDir, jsonFile)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const result = parseModelFile(content)

      expect(result.ok, `Le fichier ${jsonFile} doit être accepté par parseModelFile`).toBe(true)
      if (result.ok) {
        expect(result.state.mcd.entities.length).toBeGreaterThan(0)
        const { nodes } = mcdToFlow(result.state.mcd, result.state.layout)
        expect(nodes.length).toBeGreaterThan(0)
      }
    }
  })
})
