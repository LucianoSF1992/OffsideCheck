import { useEffect, useRef, useState } from 'react'
import './App.css'

type Point = { x: number; y: number }
type DetectedLine = { x1: number; y1: number; x2: number; y2: number; length: number; orientation: 'horizontal' | 'vertical' | 'diagonal'; fieldClass: 'longitudinal' | 'lateral' | 'goal-line' | 'unclassified'; axisDifference: number; whiteSupport: number; turfSupport: number; confidence: number; accepted: boolean }
type OpenCvRuntime = {
  Mat: new () => { rows: number; cols: number; data32S: Int32Array; delete: () => void }
  matFromImageData: (imageData: ImageData) => { delete: () => void }
  cvtColor: (src: unknown, dst: unknown, code: number) => void
  threshold: (src: unknown, dst: unknown, threshold: number, maxValue: number, type: number) => void
  Canny: (src: unknown, dst: unknown, threshold1: number, threshold2: number) => void
  HoughLinesP: (src: unknown, lines: unknown, rho: number, theta: number, threshold: number, minLineLength: number, maxLineGap: number) => void
  Scalar: new (v0: number, v1?: number, v2?: number, v3?: number) => unknown
  COLOR_RGBA2GRAY: number
  THRESH_BINARY: number
}
declare global {
  interface Window { cv?: OpenCvRuntime }
}
type Axis = { id: 'vertical' | 'sideline' | 'goalLine'; label: string; color: string; end: Point; oppositeEnd?: Point }
type DragTarget = { kind: 'origin' } | { kind: 'axis'; axisId: Axis['id']; endpoint: 'end' | 'oppositeEnd' }

const initialOrigin: Point = { x: 500, y: 520 }
const initialAxes: Axis[] = [
  { id: 'vertical', label: 'Eixo vertical', color: '#38d99a', end: { x: 500, y: 150 } },
  { id: 'sideline', label: 'Eixo da linha lateral', color: '#55a8ff', end: { x: 820, y: 790 }, oppositeEnd: { x: 205, y: 245 } },
  { id: 'goalLine', label: 'Eixo da linha de fundo', color: '#f4bd55', end: { x: 130, y: 450 } },
]

const VIEWBOX_SIZE = 1000

function getPointPercentage(point: Point) {
  return {
    x: (point.x / VIEWBOX_SIZE) * 100,
    y: (point.y / VIEWBOX_SIZE) * 100,
  }
}

function getVectorMetrics(from: Point, to: Point) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const angle = (Math.atan2(-dy, dx) * 180) / Math.PI

  return { dx, dy, length, angle }
}

function formatCoordinate(value: number) {
  return `${value.toFixed(1)}%`
}

function formatAngle(value: number) {
  return `${value.toFixed(1)}°`
}


function App() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [imageReady, setImageReady] = useState(false)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [origin, setOrigin] = useState<Point>(initialOrigin)
  const [axes, setAxes] = useState<Axis[]>(initialAxes)
  const [activeDrag, setActiveDrag] = useState<DragTarget | null>(null)
  const [openCvReady, setOpenCvReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedLines, setDetectedLines] = useState<DetectedLine[]>([])
  const [detectionMessage, setDetectionMessage] = useState('Aguardando imagem para análise.')
  const imageRef = useRef<HTMLImageElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const verticalAxis = axes.find(axis => axis.id === 'vertical')
  const sidelineAxis = axes.find(axis => axis.id === 'sideline')
  const goalLineAxis = axes.find(axis => axis.id === 'goalLine')
  const originPercentage = getPointPercentage(origin)
  const verticalMetrics = verticalAxis ? getVectorMetrics(origin, verticalAxis.end) : null
  const goalLineMetrics = goalLineAxis ? getVectorMetrics(origin, goalLineAxis.end) : null
  const sidelineMetrics = sidelineAxis?.oppositeEnd
    ? getVectorMetrics(sidelineAxis.oppositeEnd, sidelineAxis.end)
    : null

  useEffect(() => {
    // O OpenCV pode carregar depois do React e o evento do script pode ocorrer
    // antes deste efeito. Verificamos o runtime até Mat estar disponível.
    const checkOpenCv = () => {
      const ready = typeof window.cv !== 'undefined' && typeof window.cv.Mat === 'function'
      setOpenCvReady(ready)
      return ready
    }

    if (checkOpenCv()) return

    const intervalId = window.setInterval(() => {
      if (checkOpenCv()) window.clearInterval(intervalId)
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!activeDrag) return

    function finishDrag() {
      setActiveDrag(null)
    }

    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
    return () => {
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [activeDrag])

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      alert('Selecione uma imagem ou um vídeo válido.')
      event.target.value = ''
      return
    }

    setFile(selected)
    setMediaType(selected.type.startsWith('image/') ? 'image' : 'video')
    setImageReady(false)
    setCalibrationMode(false)
    setOrigin(initialOrigin); setAxes(initialAxes)
  }

  function clearFile() {
    setFile(null)
    setPreview('')
    setMediaType(null)
    setImageReady(false)
    setCalibrationMode(false)
    setOrigin(initialOrigin); setAxes(initialAxes)
    if (inputRef.current) inputRef.current.value = ''
  }

  function updatePoint(event: React.PointerEvent<SVGSVGElement>) {
    if (!activeDrag || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(VIEWBOX_SIZE, ((event.clientX - rect.left) / rect.width) * VIEWBOX_SIZE))
    const y = Math.max(0, Math.min(VIEWBOX_SIZE, ((event.clientY - rect.top) / rect.height) * VIEWBOX_SIZE))

    if (activeDrag.kind === 'origin') {
      const deltaX = x - origin.x
      const deltaY = y - origin.y
      setOrigin({ x, y })
      setAxes(current => current.map(axis => ({
        ...axis,
        end: {
          x: Math.max(0, Math.min(VIEWBOX_SIZE, axis.end.x + deltaX)),
          y: Math.max(0, Math.min(VIEWBOX_SIZE, axis.end.y + deltaY)),
        },
        ...(axis.oppositeEnd ? {
          oppositeEnd: {
            x: Math.max(0, Math.min(VIEWBOX_SIZE, axis.oppositeEnd.x + deltaX)),
            y: Math.max(0, Math.min(VIEWBOX_SIZE, axis.oppositeEnd.y + deltaY)),
          },
        } : {}),
      })))
      return
    }

    setAxes(current => current.map(axis =>
      axis.id === activeDrag.axisId
        ? { ...axis, [activeDrag.endpoint]: { x, y } }
        : axis
    ))
  }

  function detectFieldLines() {
    const cv = window.cv
    const image = imageRef.current
    if (!cv) {
      setDetectionMessage('OpenCV.js não está disponível. Atualize a página e aguarde o status OPENCV PRONTO.')
      return
    }
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      setDetectionMessage('A imagem ainda não está pronta para processamento.')
      return
    }

    setIsDetecting(true)
    setDetectionMessage('Identificando o gramado e procurando marcações claras...')
    setDetectedLines([])

    window.requestAnimationFrame(() => {
      let mask: ReturnType<OpenCvRuntime['matFromImageData']> | null = null
      let edges: InstanceType<OpenCvRuntime['Mat']> | null = null
      let lines: InstanceType<OpenCvRuntime['Mat']> | null = null

      try {
        const canvas = document.createElement('canvas')
        const maxDimension = 1400
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

        const context = canvas.getContext('2d')
        if (!context) throw new Error('Não foi possível preparar a imagem para processamento.')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const { data, width, height } = imageData

        // 1) Estima o início do gramado pela presença persistente de pixels verdes
        // em cada linha horizontal. Isso exclui arquibancadas e placas acima do campo.
        const greenRatioByRow = new Array<number>(height).fill(0)
        for (let y = 0; y < height; y++) {
          let greenPixels = 0
          for (let x = 0; x < width; x += 2) {
            const i = (y * width + x) * 4
            const r = data[i], g = data[i + 1], b = data[i + 2]
            if (g > 42 && g > r * 1.10 && g > b * 1.04 && (g - r) > 8) greenPixels++
          }
          greenRatioByRow[y] = greenPixels / Math.ceil(width / 2)
        }

        // Suaviza a proporção de verde em uma janela vertical para evitar
        // que uma faixa isolada de publicidade seja confundida com gramado.
        const smoothedGreenRatio = greenRatioByRow.map((_, row) => {
          let total = 0
          let count = 0
          for (let offset = -4; offset <= 4; offset++) {
            const sampleRow = row + offset
            if (sampleRow >= 0 && sampleRow < height) {
              total += greenRatioByRow[sampleRow]
              count++
            }
          }
          return total / Math.max(1, count)
        })

        let turfStartY = Math.floor(height * 0.28)
        const requiredGreenRatio = 0.48
        let foundTurfTransition = false
        for (let y = Math.floor(height * 0.14); y < Math.floor(height * 0.68); y++) {
          let consecutiveRows = 0
          for (let k = 0; k < 18 && y + k < height; k++) {
            if (smoothedGreenRatio[y + k] >= requiredGreenRatio) consecutiveRows++
          }
          if (consecutiveRows >= 16) {
            turfStartY = Math.min(height - 1, y)
            foundTurfTransition = true
            break
          }
        }

        // Integral image da máscara verde: permite verificar se cada pixel
        // branco está cercado por gramado, reduzindo publicidade e uniformes.
        const integralWidth = width + 1
        const greenIntegral = new Uint32Array((width + 1) * (height + 1))
        for (let y = 1; y <= height; y++) {
          let rowSum = 0
          for (let x = 1; x <= width; x++) {
            const i = ((y - 1) * width + (x - 1)) * 4
            const r = data[i], g = data[i + 1], b = data[i + 2]
            const isGreen = g > 42 && g > r * 1.10 && g > b * 1.04 && (g - r) > 8
            if (isGreen) rowSum++
            greenIntegral[y * integralWidth + x] =
              greenIntegral[(y - 1) * integralWidth + x] + rowSum
          }
        }

        // 2) A máscara considera pixels quase brancos somente dentro da faixa
        // de gramado e quando há uma quantidade mínima de verde ao redor.
        const maskImage = new ImageData(width, height)
        const maskData = maskImage.data
        const neighborhoodRadius = 8
        const minGreenNeighborhoodRatio = 0.22
        for (let y = turfStartY; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const r = data[i], g = data[i + 1], b = data[i + 2]
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            const brightNeutral = min >= 132 && (max - min) <= 72

            const x1 = Math.max(0, x - neighborhoodRadius)
            const y1 = Math.max(turfStartY, y - neighborhoodRadius)
            const x2 = Math.min(width, x + neighborhoodRadius + 1)
            const y2 = Math.min(height, y + neighborhoodRadius + 1)
            const greenCount =
              greenIntegral[y2 * integralWidth + x2] -
              greenIntegral[y1 * integralWidth + x2] -
              greenIntegral[y2 * integralWidth + x1] +
              greenIntegral[y1 * integralWidth + x1]
            const neighborhoodArea = Math.max(1, (x2 - x1) * (y2 - y1))
            const surroundedByTurf = greenCount / neighborhoodArea >= minGreenNeighborhoodRatio

            if (brightNeutral && surroundedByTurf) {
              maskData[i] = 255
              maskData[i + 1] = 255
              maskData[i + 2] = 255
              maskData[i + 3] = 255
            } else {
              maskData[i + 3] = 255
            }
          }
        }

        mask = cv.matFromImageData(maskImage)
        edges = new cv.Mat()
        lines = new cv.Mat()

        cv.Canny(mask, edges, 55, 160)
        cv.HoughLinesP(
          edges,
          lines,
          1,
          Math.PI / 180,
          58,
          Math.max(45, canvas.width * 0.045),
          Math.max(12, Math.round(canvas.width * 0.012))
        )

        type PixelSegment = { x1: number; y1: number; x2: number; y2: number; length: number; angle: number; offset: number }
        const rawSegments: PixelSegment[] = []
        const values = lines.data32S
        for (let i = 0; i + 3 < values.length; i += 4) {
          const x1 = values[i]
          const y1 = values[i + 1]
          const x2 = values[i + 2]
          const y2 = values[i + 3]
          const dx = x2 - x1
          const dy = y2 - y1
          const length = Math.hypot(dx, dy)
          if (length < Math.max(45, canvas.width * 0.045)) continue

          // Ângulo e distância perpendicular permitem reconhecer fragmentos
          // que pertencem à mesma marcação, mesmo quando Hough os separa.
          let angle = Math.atan2(dy, dx)
          // Orientação axial canônica: segmentos em sentidos opostos compartilham
          // o mesmo ângulo e o mesmo lado normal para o cálculo do agrupamento.
          if (angle >= Math.PI / 2) angle -= Math.PI
          if (angle < -Math.PI / 2) angle += Math.PI
          const nx = -Math.sin(angle)
          const ny = Math.cos(angle)
          const midpointX = (x1 + x2) / 2
          const midpointY = (y1 + y2) / 2
          rawSegments.push({
            x1, y1, x2, y2, length, angle,
            offset: nx * midpointX + ny * midpointY,
          })
        }

        const angleTolerance = 7 * Math.PI / 180
        const offsetTolerance = Math.max(8, canvas.width * 0.006)
        const mergeGap = Math.max(24, canvas.width * 0.018)
        const clusters: { angle: number; offset: number; segments: PixelSegment[] }[] = []

        for (const segment of rawSegments.sort((a, b) => b.length - a.length)) {
          let bestCluster: typeof clusters[number] | undefined
          let bestScore = Number.POSITIVE_INFINITY

          for (const cluster of clusters) {
            const angleDifference = Math.abs(segment.angle - cluster.angle)
            const offsetDifference = Math.abs(segment.offset - cluster.offset)
            if (angleDifference <= angleTolerance && offsetDifference <= offsetTolerance) {
              const score = angleDifference / angleTolerance + offsetDifference / offsetTolerance
              if (score < bestScore) {
                bestScore = score
                bestCluster = cluster
              }
            }
          }

          if (bestCluster) {
            bestCluster.segments.push(segment)
            const weight = bestCluster.segments.length - 1
            bestCluster.angle = (bestCluster.angle * weight + segment.angle) / (weight + 1)
            bestCluster.offset = (bestCluster.offset * weight + segment.offset) / (weight + 1)
          } else {
            clusters.push({ angle: segment.angle, offset: segment.offset, segments: [segment] })
          }
        }

        const consolidated: Omit<DetectedLine, 'fieldClass' | 'axisDifference' | 'whiteSupport' | 'turfSupport' | 'confidence' | 'accepted'>[] = []
        for (const cluster of clusters) {
          const angle = cluster.angle
          const dx = Math.cos(angle)
          const dy = Math.sin(angle)
          const projected = cluster.segments.map(segment => {
            const t1 = segment.x1 * dx + segment.y1 * dy
            const t2 = segment.x2 * dx + segment.y2 * dy
            return { start: Math.min(t1, t2), end: Math.max(t1, t2) }
          }).sort((a, b) => a.start - b.start)

          const merged: { start: number; end: number }[] = []
          for (const interval of projected) {
            const previous = merged[merged.length - 1]
            if (previous && interval.start - previous.end <= mergeGap) {
              previous.end = Math.max(previous.end, interval.end)
            } else {
              merged.push({ ...interval })
            }
          }

          const nx = -dy
          const ny = dx
          for (const interval of merged) {
            const length = interval.end - interval.start
            if (length < Math.max(55, canvas.width * 0.055)) continue
            const offset = cluster.offset
            const x1 = dx * interval.start + nx * offset
            const y1 = dy * interval.start + ny * offset
            const x2 = dx * interval.end + nx * offset
            const y2 = dy * interval.end + ny * offset
            const segmentAngle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
            const normalizedAngle = Math.abs(segmentAngle)
            const orientation: DetectedLine['orientation'] =
              normalizedAngle <= 20 || normalizedAngle >= 160
                ? 'horizontal'
                : normalizedAngle >= 70 && normalizedAngle <= 110
                  ? 'vertical'
                  : 'diagonal'

            consolidated.push({
              x1: (x1 / canvas.width) * VIEWBOX_SIZE,
              y1: (y1 / canvas.height) * VIEWBOX_SIZE,
              x2: (x2 / canvas.width) * VIEWBOX_SIZE,
              y2: (y2 / canvas.height) * VIEWBOX_SIZE,
              length,
              orientation,
            })
          }
        }

        // 3) Classificação geométrica: compara a direção de cada linha candidata
        // com as três referências ajustadas manualmente pelo usuário.
        const axisReferences = [
          verticalAxis ? {
            fieldClass: 'longitudinal' as const,
            angle: Math.atan2(verticalAxis.end.y - origin.y, verticalAxis.end.x - origin.x),
          } : null,
          sidelineAxis?.oppositeEnd ? {
            fieldClass: 'lateral' as const,
            angle: Math.atan2(sidelineAxis.end.y - sidelineAxis.oppositeEnd.y, sidelineAxis.end.x - sidelineAxis.oppositeEnd.x),
          } : null,
          goalLineAxis ? {
            fieldClass: 'goal-line' as const,
            angle: Math.atan2(goalLineAxis.end.y - origin.y, goalLineAxis.end.x - origin.x),
          } : null,
        ].filter((reference): reference is { fieldClass: 'longitudinal' | 'lateral' | 'goal-line'; angle: number } => reference !== null)

        const axialAngleDifference = (a: number, b: number) => {
          let difference = Math.abs(a - b) % Math.PI
          if (difference > Math.PI / 2) difference = Math.PI - difference
          return difference
        }
        const classificationTolerance = 22 * Math.PI / 180
        const classifiedLines: DetectedLine[] = consolidated.map(line => {
          const lineAngle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1)
          let bestClass: DetectedLine['fieldClass'] = 'unclassified'
          let bestDifference = Number.POSITIVE_INFINITY
          let secondBestDifference = Number.POSITIVE_INFINITY
          for (const reference of axisReferences) {
            const difference = axialAngleDifference(lineAngle, reference.angle)
            if (difference < bestDifference) {
              secondBestDifference = bestDifference
              bestDifference = difference
              bestClass = reference.fieldClass
            } else if (difference < secondBestDifference) {
              secondBestDifference = difference
            }
          }
          const ambiguousReference = secondBestDifference - bestDifference < 4 * Math.PI / 180
          if (bestDifference > classificationTolerance || ambiguousReference) bestClass = 'unclassified'

          // 4) Validação espacial de cada linha candidata. Além do alinhamento,
          // exige comprimento útil, pixels claros ao longo do traço e gramado
          // dos dois lados da linha. Isso ajuda a rejeitar textos, placas e ruído.
          const px1 = line.x1 / VIEWBOX_SIZE * width
          const py1 = line.y1 / VIEWBOX_SIZE * height
          const px2 = line.x2 / VIEWBOX_SIZE * width
          const py2 = line.y2 / VIEWBOX_SIZE * height
          const segmentLength = Math.hypot(px2 - px1, py2 - py1)
          const sampleCount = Math.max(12, Math.ceil(segmentLength / 5))
          let whiteHits = 0
          let turfHits = 0
          let validSamples = 0
          const ux = (px2 - px1) / Math.max(1, segmentLength)
          const uy = (py2 - py1) / Math.max(1, segmentLength)
          const normalX = -uy
          const normalY = ux

          for (let sample = 1; sample < sampleCount; sample++) {
            const t = sample / sampleCount
            const sx = Math.round(px1 + (px2 - px1) * t)
            const sy = Math.round(py1 + (py2 - py1) * t)
            if (sx < 2 || sx >= width - 2 || sy < turfStartY || sy >= height - 2) continue
            validSamples++

            let hasWhite = false
            for (let ox = -2; ox <= 2 && !hasWhite; ox++) {
              for (let oy = -2; oy <= 2; oy++) {
                const ix = sx + ox
                const iy = sy + oy
                const pixel = (iy * width + ix) * 4
                const rr = data[pixel], gg = data[pixel + 1], bb = data[pixel + 2]
                const maximum = Math.max(rr, gg, bb)
                const minimum = Math.min(rr, gg, bb)
                if (minimum >= 132 && maximum - minimum <= 78) { hasWhite = true; break }
              }
            }
            if (hasWhite) whiteHits++

            let greenSides = 0
            for (const side of [-1, 1]) {
              const gx = Math.round(sx + normalX * side * 9)
              const gy = Math.round(sy + normalY * side * 9)
              if (gx < 0 || gx >= width || gy < turfStartY || gy >= height) continue
              const pixel = (gy * width + gx) * 4
              const rr = data[pixel], gg = data[pixel + 1], bb = data[pixel + 2]
              if (gg > 42 && gg > rr * 1.10 && gg > bb * 1.04 && (gg - rr) > 8) greenSides++
            }
            if (greenSides >= 1) turfHits++
          }

          const whiteSupport = validSamples ? whiteHits / validSamples : 0
          const turfSupport = validSamples ? turfHits / validSamples : 0
          const lengthSupport = Math.min(1, segmentLength / (width * 0.18))
          const confidence = (whiteSupport * 0.45) + (turfSupport * 0.35) + (lengthSupport * 0.20)
          const accepted =
            bestClass !== 'unclassified' &&
            segmentLength >= width * 0.085 &&
            validSamples >= 8 &&
            whiteSupport >= 0.42 &&
            turfSupport >= 0.48 &&
            confidence >= 0.56

          return {
            ...line,
            fieldClass: bestClass,
            axisDifference: bestDifference * 180 / Math.PI,
            whiteSupport,
            turfSupport,
            confidence,
            accepted,
          }
        })

        const acceptedLines = classifiedLines.filter(line => line.accepted)
        const classifiedCount = acceptedLines.length
        setDetectedLines(acceptedLines)
        setDetectionMessage(
          classifiedLines.length
            ? `${rawSegments.length} segmentos brutos foram agrupados em ${classifiedLines.length} linhas candidatas. ${classifiedCount} passaram pela validação espacial e geométrica; ${classifiedLines.length - classifiedCount} foram descartadas. Início estimado do gramado: ${(turfStartY / height * 100).toFixed(1)}%${foundTurfTransition ? '' : ' (estimativa padrão)'}. Revise visualmente as linhas mantidas.`
            : 'O gramado foi localizado, mas não foram encontrados agrupamentos longos suficientes. Tente outra imagem ou ajuste o enquadramento.'
        )
      } catch (error) {
        setDetectionMessage(error instanceof Error ? error.message : 'Falha ao processar a imagem.')
      } finally {
        mask?.delete()
        edges?.delete()
        lines?.delete()
        setIsDetecting(false)
      }
    })
  }

  function resetCalibration() {
    setOrigin(initialOrigin)
    setAxes(initialAxes)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">OC</div>
          <div><strong>OffsideCheck</strong><span>FOOTBALL ANALYSIS</span></div>
        </div>

        <div className="menu-label">WORKSPACE</div>
        <nav className="navigation">
          <button className="nav-item active"><span>▦</span> Nova análise</button>
          <button className="nav-item" disabled><span>◷</span> Histórico</button>
          <button className="nav-item" disabled><span>⚙</span> Configurações</button>
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>Ambiente de demonstração</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="breadcrumb">Workspace /</span><strong> Nova análise</strong></div>
          <div className="version">VERSÃO 0.6.1</div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">ANÁLISE DE ARBITRAGEM</span>
              <h1>Análise de impedimento</h1>
              <p>Carregue uma imagem do lance para iniciar a análise.</p>
            </div>
            <div className="law-tag">IFAB · REGRA 11</div>
          </div>

          <div className="workspace">
            <section className="analysis-panel">
              <div className="panel-header">
                <div>
                  <h2>{calibrationMode ? 'Calibração da perspectiva' : 'Visualização da jogada'}</h2>
                  <span>{calibrationMode ? 'Posicione a referência no penúltimo defensor e ajuste os três eixos' : 'Imagem ou vídeo da partida'}</span>
                </div>
                {file && <button className="clear-button" onClick={clearFile}>Remover arquivo</button>}
              </div>

              <div className={`media-area ${file ? 'has-file' : ''} ${calibrationMode ? 'calibration-active' : ''}`}>
                {preview && mediaType === 'image' && (
                  <div className="calibration-stage">
                    <img
                      ref={imageRef}
                      src={preview}
                      alt="Imagem da jogada selecionada"
                      onLoad={() => { setImageReady(true); setDetectedLines([]); setDetectionMessage('Imagem pronta. Execute a detecção das linhas.'); }}
                    />
                    {detectedLines.length > 0 && imageReady && (
                      <svg className="detection-overlay" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} preserveAspectRatio="none" aria-label="Segmentos detectados">
                        {detectedLines.map((line, index) => (
                          <line key={`detected-${index}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                            stroke={line.fieldClass === 'longitudinal' ? '#38d99a' : line.fieldClass === 'lateral' ? '#55a8ff' : line.fieldClass === 'goal-line' ? '#f4bd55' : '#ff4d6d'}
                            strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                        ))}
                      </svg>
                    )}
                    {calibrationMode && imageReady && (
                      <svg
                        ref={svgRef}
                        className="calibration-overlay"
                        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                        preserveAspectRatio="none"
                        onPointerMove={updatePoint}
                      >
{axes.map(axis => {
                          const endpoints = [
                            { key: 'end' as const, point: axis.end },
                            ...(axis.oppositeEnd ? [{ key: 'oppositeEnd' as const, point: axis.oppositeEnd }] : []),
                          ]
                          return (
                            <g key={axis.id}>
                              {endpoints.map(({ key, point }) => (
                                <g key={key}>
                                  <line
                                    x1={origin.x} y1={origin.y}
                                    x2={point.x} y2={point.y}
                                    stroke={axis.color}
                                    strokeWidth="5"
                                    vectorEffect="non-scaling-stroke"
                                    strokeLinecap="round"
                                  />
                                  <circle
                                    cx={point.x} cy={point.y} r="11"
                                    fill={axis.color} stroke="#fff" strokeWidth="3"
                                    vectorEffect="non-scaling-stroke"
                                    className="calibration-handle axis-handle"
                                    onPointerDown={event => {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      setActiveDrag({ kind: 'axis', axisId: axis.id, endpoint: key })
                                    }}
                                  />
                                </g>
                              ))}
                            </g>
                          )
                        })}
                        <circle
                          cx={origin.x} cy={origin.y} r="5"
                          fill="#ffd43b" stroke="#fff" strokeWidth="4"
                          vectorEffect="non-scaling-stroke"
                          className="calibration-handle origin-handle"
                          onPointerDown={event => {
                            event.preventDefault()
                            event.stopPropagation()
                            setActiveDrag({ kind: 'origin' })
                          }}
                        />
                        <circle
                          cx={origin.x} cy={origin.y} r="3"
                          fill="#342700"
                          pointerEvents="none"
                        />

                      </svg>
                    )}
                  </div>
                )}

                {preview && mediaType === 'video' && <video src={preview} controls playsInline />}
                {!file && (
                  <div className="upload-content">
                    <div className="upload-icon">↑</div>
                    <h3>Carregue uma jogada</h3>
                    <p>Selecione uma imagem ou vídeo para começar sua análise.</p>
                    <button className="primary-button" onClick={() => inputRef.current?.click()}>
                      Selecionar arquivo
                    </button>
                    <span className="file-info">PNG, JPG, JPEG, MP4 ou WEBM</span>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleFile}
                hidden
              />

              <div className="media-footer">
                <span>{file ? file.name : 'Nenhum arquivo selecionado'}</span>
                <span>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Aguardando arquivo'}</span>
              </div>

              {calibrationMode && mediaType === 'image' && (
                <div className="calibration-footer">
                  <div className="calibration-legend">
                    <span><i style={{ backgroundColor: '#ffd43b' }} />Penúltimo defensor</span>
                    {axes.map(axis => (
                      <span key={axis.id}><i style={{ backgroundColor: axis.color }} />{axis.label}</span>
                    ))}
                  </div>
                  <button className="secondary-button" onClick={resetCalibration}>Redefinir linhas</button>
                </div>
              )}
            </section>

            <aside className="tools-panel">
              <div className="panel-header">
                <div><h2>Ferramentas</h2><span>Configuração da análise</span></div>
              </div>

              <div className="tool-section">
                <span className="section-label">ETAPAS DA ANÁLISE</span>
                <div className="step">
                  <span className="step-number">01</span>
                  <div><strong>Carregar jogada</strong><p>Selecionar imagem ou vídeo</p></div>
                  <span className="step-status">{file ? '●' : '○'}</span>
                </div>
                <div className={`step ${calibrationMode ? 'selected-step' : ''}`}>
                  <span className="step-number">02</span>
                  <div><strong>Referência visual</strong><p>Orientar a projeção da linha</p></div>
                  <span className="step-status">{calibrationMode ? '●' : '○'}</span>
                </div>
                <div className="step">
                  <span className="step-number">03</span>
                  <div><strong>Marcar jogadores</strong><p>Identificar jogadores e bola</p></div>
                  <span className="step-status pending">○</span>
                </div>
                <div className="step">
                  <span className="step-number">04</span>
                  <div><strong>Analisar impedimento</strong><p>Projetar linha de referência</p></div>
                  <span className="step-status pending">○</span>
                </div>
              </div>

              <div className="calibration-controls">
                <span className="section-label">REFERÊNCIA DA ANÁLISE</span>
                <p>O ponto central identifica a posição de referência do penúltimo defensor. Os eixos ajudam a orientar visualmente a perspectiva e a projeção da linha. Nesta versão, o ajuste ainda é manual; a detecção automática das marcações do campo será implementada na próxima etapa.</p>
                <button
                  className="primary-button full-button"
                  disabled={mediaType !== 'image' || !imageReady}
                  onClick={() => setCalibrationMode(value => !value)}
                >
                  {calibrationMode ? 'Concluir edição' : 'Abrir calibração'}
                </button>
                {mediaType === 'video' && <span className="calibration-note">A calibração de vídeo será adicionada em uma próxima versão. Selecione uma imagem para testar agora.</span>}
                {!file && <span className="calibration-note">Carregue uma imagem para habilitar a calibração.</span>}
              </div>

              <div className="info-card">
                <span className="info-icon">ⓘ</span>
                <div>
                  <strong>Importante</strong>
                  <p>A referência do penúltimo defensor e os eixos auxiliam a análise visual. A linha de impedimento deverá ser projetada considerando a perspectiva do campo; os eixos, isoladamente, ainda não determinam o resultado.</p>
                </div>
              </div>

              <div className="geometry-card">
                <div className="geometry-card-header">
                  <div>
                    <span className="section-label">BASE GEOMÉTRICA · v0.5.0</span>
                    <strong>Referências geométricas da imagem</strong>
                  </div>
                  <span className="geometry-live"><i /> AO VIVO</span>
                </div>

                <div className="geometry-origin">
                  <span className="geometry-dot" />
                  <div>
                    <span>Referência na imagem (normalizada)</span>
                    <strong>X {formatCoordinate(originPercentage.x)} <em>·</em> Y {formatCoordinate(originPercentage.y)}</strong>
                  </div>
                </div>

                <div className="geometry-metrics">
                  {verticalMetrics && (
                    <div className="geometry-metric">
                      <span><i style={{ backgroundColor: '#38d99a' }} />Eixo longitudinal (imagem)</span>
                      <strong>{verticalMetrics.length.toFixed(1)} u</strong>
                      <small>Ângulo {formatAngle(verticalMetrics.angle)}</small>
                    </div>
                  )}
                  {sidelineMetrics && (
                    <div className="geometry-metric">
                      <span><i style={{ backgroundColor: '#55a8ff' }} />Eixo lateral (imagem)</span>
                      <strong>{sidelineMetrics.length.toFixed(1)} u</strong>
                      <small>Ângulo {formatAngle(sidelineMetrics.angle)}</small>
                    </div>
                  )}
                  {goalLineMetrics && (
                    <div className="geometry-metric">
                      <span><i style={{ backgroundColor: '#f4bd55' }} />Direção da linha de fundo</span>
                      <strong>{goalLineMetrics.length.toFixed(1)} u</strong>
                      <small>Ângulo {formatAngle(goalLineMetrics.angle)}</small>
                    </div>
                  )}
                </div>

                <div className="geometry-field-status">
                  <strong>DETECÇÃO AUTOMÁTICA · EM DESENVOLVIMENTO</strong>
                  <span>A primeira detecção de segmentos claros está disponível. A classificação das linhas do campo e a estimativa de perspectiva ainda serão desenvolvidas.</span>
                </div>

                <p className="geometry-disclaimer">
                  As medidas acima descrevem somente posições e direções no espaço 2D da imagem.
                  Elas ainda não representam distâncias reais no gramado nem realizam a correção automática
                  da perspectiva.
                </p>
              </div>


              <div className="detection-card">
                <div className="detection-card-heading">
                  <span className="section-label">VISÃO COMPUTACIONAL · v0.6.1</span>
                  <span className={`opencv-status ${openCvReady ? 'ready' : 'loading'}`}>
                    <i /> {openCvReady ? 'OPENCV PRONTO' : 'CARREGANDO OPENCV'}
                  </span>
                </div>
                <strong>Validação espacial e geométrica das linhas</strong>
                <p>Compara direção, comprimento, presença de tinta clara e gramado ao redor. Somente linhas que passam pelos filtros espacial e geométrico são exibidas; ainda exigem revisão visual.</p>
                <button className="primary-button full-button" disabled={!imageReady || mediaType !== 'image' || !openCvReady || isDetecting}
                  onClick={detectFieldLines}>
                  {isDetecting ? 'Analisando imagem...' : 'Detectar linhas do campo'}
                </button>
                <button className="secondary-button full-button" disabled={detectedLines.length === 0}
                  onClick={() => { setDetectedLines([]); setDetectionMessage('Detecção removida.'); }}>
                  Limpar detecção
                </button>
                <div className="detection-feedback">{detectionMessage}</div>
                {detectedLines.length > 0 && (
                  <>
                    <div className="detection-count">{detectedLines.length} linhas aprovadas após validação espacial e geométrica</div>
                    <div className="detection-legend">
                      <span><i style={{ background: '#38d99a' }} /> Longitudinais: {detectedLines.filter(line => line.fieldClass === 'longitudinal').length}</span>
                      <span><i style={{ background: '#55a8ff' }} /> Laterais: {detectedLines.filter(line => line.fieldClass === 'lateral').length}</span>
                      <span><i style={{ background: '#f4bd55' }} /> Linha de fundo: {detectedLines.filter(line => line.fieldClass === 'goal-line').length}</span>
                      <span><i style={{ background: '#ff4d6d' }} /> Não classificadas: {detectedLines.filter(line => line.fieldClass === 'unclassified').length}</span>
                    </div>
                  </>
                )}
                {!openCvReady && <p className="detection-footnote">É necessária conexão com a internet na primeira carga para baixar o OpenCV.js.</p>}
              </div>

              <div className="info-card">
                <span className="info-icon">◎</span>
                <div>
                  <strong>Próxima etapa · análise automática</strong>
                  <p>Classificar as marcações detectadas, estimar a perspectiva, localizar os jogadores e a bola e projetar a linha de impedimento a partir do penúltimo adversário. O sistema deverá apresentar o resultado e permitir revisão das detecções.</p>
                </div>
              </div>
              <div className="coming-soon">
                <span>PRÓXIMAS ETAPAS</span>
                <strong>Detecção das linhas e projeção automática</strong>
                <p>Sem marcação manual de quatro pontos. A análise será construída a partir das linhas visíveis do campo e da posição dos jogadores e da bola.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
