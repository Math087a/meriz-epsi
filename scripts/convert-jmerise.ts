import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { parseJMeriseBuffer } from '../src/lib/jmeriseParser'
import { serializeModel, parseModelFile } from '../src/lib/persistence'
import { DEFAULT_MPD_SETTINGS } from '../src/model/mpd'
import { mcdToFlow } from '../src/canvas/mcdToFlow'
import { validate } from '../src/model/validate'

const filesToConvert = [
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\Marcheur Canigou.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 1\\buveur.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 1\\cinema.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 1\\TD1 Ex 3.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 2\\jsp.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 2\\jsp2.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 2\\jsp3.mcd',
  'C:\\Users\\ragot\\Documents\\EPSI\\03-Ressources\\B3 - Conception BDD Merise\\TP 3\\JMerise TP3.mcd',
  'C:\\Users\\ragot\\Documents\\JMeriseEtudiant\\exemple_MCD_GestionCommandeClient.mcd',
]

interface ConversionReport {
  file: string
  outputPath: string
  name: string
  entitiesCount: number
  associationsCount: number
  propertiesCount: number
  legsCount: number
  parseValid: boolean
  canvasNodesCount: number
  canvasEdgesCount: number
  validationProblems: number
  error?: string
}

const reports: ConversionReport[] = []

for (const filePath of filesToConvert) {
  try {
    const rawBuffer = readFileSync(filePath)
    const state = parseJMeriseBuffer(rawBuffer)
    const modelName = basename(filePath, extname(filePath))
    const serializedJson = serializeModel(state, DEFAULT_MPD_SETTINGS, modelName)

    // Verification 1 : parseModelFile de Meriz
    const parseResult = parseModelFile(serializedJson)
    if (!parseResult.ok) {
      throw new Error(`Échec parseModelFile : ${parseResult.error}`)
    }

    // Verification 2 : génération des nœuds et arêtes canvas
    const { nodes, edges } = mcdToFlow(parseResult.state.mcd, parseResult.state.layout)

    // Verification 3 : validation du MCD Merise
    const problems = validate(parseResult.state.mcd)

    const outputPath = join(dirname(filePath), `${modelName}.json`)
    writeFileSync(outputPath, serializedJson, 'utf-8')

    let legsCount = 0
    for (const assoc of state.mcd.associations) {
      legsCount += assoc.legs.length
    }

    reports.push({
      file: filePath,
      outputPath,
      name: modelName,
      entitiesCount: state.mcd.entities.length,
      associationsCount: state.mcd.associations.length,
      propertiesCount: state.mcd.properties.length,
      legsCount,
      parseValid: parseResult.ok,
      canvasNodesCount: nodes.length,
      canvasEdgesCount: edges.length,
      validationProblems: problems.length,
    })
  } catch (err: any) {
    reports.push({
      file: filePath,
      outputPath: '',
      name: basename(filePath),
      entitiesCount: 0,
      associationsCount: 0,
      propertiesCount: 0,
      legsCount: 0,
      parseValid: false,
      canvasNodesCount: 0,
      canvasEdgesCount: 0,
      validationProblems: 0,
      error: err.message,
    })
  }
}

console.log(JSON.stringify(reports, null, 2))
