import { EXAM_MODE } from './examMode'
import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import { toPng } from 'html-to-image'

// Plafond de dimensions pour ne pas produire un canvas démesuré.
const MAX_DIMENSION = 4096
const PADDING = 0.1

/**
 * Exporte le schéma entier en PNG (pas seulement la partie visible),
 * selon la méthode recommandée par React Flow : boîte englobante de
 * tous les nœuds → viewport ajusté à ces dimensions → capture de
 * l'élément du viewport avec html-to-image.
 */
function canvasBackground(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--c-canvas').trim()
  return value === '' ? '#ffffff' : value
}

export async function exportToPng(nodes: Node[], viewportElement: HTMLElement, edges: Edge[] = []): Promise<string> {
  const nodeBounds = getNodesBounds(nodes)
  let minX = nodeBounds.x
  let minY = nodeBounds.y
  let maxX = nodeBounds.x + nodeBounds.width
  let maxY = nodeBounds.y + nodeBounds.height
  for (const edge of edges) {
    const labelPos = (edge.data as { labelPosition?: { x: number; y: number } } | undefined)?.labelPosition
    if (labelPos) {
      minX = Math.min(minX, labelPos.x - 72)
      minY = Math.min(minY, labelPos.y - 48)
      maxX = Math.max(maxX, labelPos.x + 72)
      maxY = Math.max(maxY, labelPos.y + 48)
    }
  }
  const bounds = {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
  const scale = Math.min(1, MAX_DIMENSION / bounds.width, MAX_DIMENSION / bounds.height)
  const width = Math.max(1, Math.round(bounds.width * scale))
  const height = Math.max(1, Math.round(bounds.height * scale))
  const viewport = getViewportForBounds(bounds, width, height, 0.05, 1, PADDING)

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const computed = getComputedStyle(document.documentElement)
  const canvasBg = computed.getPropertyValue('--c-canvas').trim() || (EXAM_MODE ? (isDark ? '#160e10' : '#fcf9f9') : (isDark ? '#131715' : '#fafbfa'))
  const surface = computed.getPropertyValue('--c-surface').trim() || (EXAM_MODE ? (isDark ? '#26181b' : '#ffffff') : (isDark ? '#1d2520' : '#ffffff'))
  const surfaceSoft = computed.getPropertyValue('--c-surface-soft').trim() || (EXAM_MODE ? (isDark ? '#301f22' : '#f5eaea') : (isDark ? '#242e28' : '#ebf0ec'))
  const lineStrong = computed.getPropertyValue('--c-line-strong').trim() || (EXAM_MODE ? (isDark ? '#9e7379' : '#8f6266') : (isDark ? '#6d8c7b' : '#6d8475'))
  const line = computed.getPropertyValue('--c-line').trim() || (EXAM_MODE ? (isDark ? '#3d262a' : '#ebd8da') : (isDark ? '#26332b' : '#d8e2da'))
  const mark = computed.getPropertyValue('--c-mark').trim() || (EXAM_MODE ? (isDark ? '#e05363' : '#a61b2b') : (isDark ? '#52b788' : '#1b5328'))
  const ink = computed.getPropertyValue('--c-ink').trim() || (EXAM_MODE ? (isDark ? '#f5ecee' : '#241416') : (isDark ? '#eaf2ec' : '#1a241e'))
  const inkSoft = computed.getPropertyValue('--c-ink-soft').trim() || (EXAM_MODE ? (isDark ? '#c2a5a9' : '#66474a') : (isDark ? '#a8bcaf' : '#4e6155'))
  const accentInk = computed.getPropertyValue('--c-accent-ink').trim() || (EXAM_MODE ? (isDark ? '#f28b96' : '#991625') : (isDark ? '#74c69d' : '#1b5328'))

  // Injecter un élément style temporaire directement dans viewportElement pour que
  // le clonage html-to-image emporte avec lui les variables CSS et les règles SVG d'arêtes et de nœuds.
  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-meriz-export', 'true')
  styleEl.textContent = `
    .react-flow__viewport {
      --c-canvas: ${canvasBg};
      --c-surface: ${surface};
      --c-surface-soft: ${surfaceSoft};
      --c-line-strong: ${lineStrong};
      --c-line: ${line};
      --c-mark: ${mark};
      --c-ink: ${ink};
      --c-ink-soft: ${inkSoft};
      --c-accent-ink: ${accentInk};
      --color-canvas: ${canvasBg};
      --color-surface: ${surface};
      --color-surface-soft: ${surfaceSoft};
      --color-line-strong: ${lineStrong};
      --color-line: ${line};
      --color-mark: ${mark};
      --color-ink: ${ink};
      --color-ink-soft: ${inkSoft};
      --color-accent-ink: ${accentInk};
    }
    .react-flow__edges,
    .react-flow__edgelabel-renderer {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
    }
    .react-flow__edges svg {
      overflow: visible !important;
      position: absolute !important;
      pointer-events: none !important;
    }
    .react-flow__edge-path {
      stroke: ${lineStrong} !important;
      stroke-width: 1.5px !important;
      fill: none !important;
    }
    .react-flow__node.selected {
      box-shadow: none !important;
      outline: none !important;
    }
    .react-flow__node polygon {
      fill: ${surface} !important;
      stroke: ${lineStrong} !important;
    }
  `
  viewportElement.appendChild(styleEl)

  // Donner également la classe react-flow temporairement à viewportElement pour matcher les règles @xyflow
  const addedReactFlowClass = !viewportElement.classList.contains('react-flow')
  if (addedReactFlowClass) {
    viewportElement.classList.add('react-flow')
  }

  try {
    return await toPng(viewportElement, {
      backgroundColor: canvasBackground(),
      width,
      height,
      pixelRatio: 2,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      /*
       * N'appartiennent pas au schéma : la grille de fond, les ronds de
       * liaison avec le calque de lâcher, et le calque de présence. Ce sont
       * des poignées d'édition ; les curseurs et les tracés des autres
       * participants, eux, n'ont rien à faire dans une image enregistrée.
       */
      filter: (domNode) =>
        !domNode.classList?.contains('react-flow__background') &&
        !domNode.classList?.contains('react-flow__handle') &&
        !domNode.classList?.contains('react-flow__resize-control') &&
        !domNode.classList?.contains('react-flow__viewport-portal'),
    })
  } finally {
    styleEl.remove()
    if (addedReactFlowClass) {
      viewportElement.classList.remove('react-flow')
    }
  }
}
