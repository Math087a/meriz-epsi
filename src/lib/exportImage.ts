import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import type { Node } from '@xyflow/react'
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

export async function exportToPng(nodes: Node[], viewportElement: HTMLElement): Promise<string> {
  const bounds = getNodesBounds(nodes)
  const scale = Math.min(1, MAX_DIMENSION / bounds.width, MAX_DIMENSION / bounds.height)
  const width = Math.max(1, Math.round(bounds.width * scale))
  const height = Math.max(1, Math.round(bounds.height * scale))
  const viewport = getViewportForBounds(bounds, width, height, 0.05, 1, PADDING)

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const computed = getComputedStyle(document.documentElement)
  const canvasBg = computed.getPropertyValue('--c-canvas').trim() || (isDark ? '#1b172d' : '#fcfaf5')
  const lineStrong = computed.getPropertyValue('--c-line-strong').trim() || (isDark ? '#827ba0' : '#8a8070')
  const line = computed.getPropertyValue('--c-line').trim() || (isDark ? '#352e54' : '#e6dfd5')
  const mark = computed.getPropertyValue('--c-mark').trim() || (isDark ? '#818cf8' : '#4f46e5')

  // Injecter un élément style temporaire directement dans viewportElement pour que
  // le clonage html-to-image emporte avec lui les variables CSS et les règles SVG d'arêtes.
  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-meriz-export', 'true')
  styleEl.textContent = `
    .react-flow__viewport {
      --c-canvas: ${canvasBg};
      --c-line-strong: ${lineStrong};
      --c-line: ${line};
      --c-mark: ${mark};
    }
    .react-flow__edges {
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
        !domNode.classList?.contains('react-flow__viewport-portal'),
    })
  } finally {
    styleEl.remove()
    if (addedReactFlowClass) {
      viewportElement.classList.remove('react-flow')
    }
  }
}
