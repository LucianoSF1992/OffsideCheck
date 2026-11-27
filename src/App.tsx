import { useEffect, useRef, useState } from 'react'
import './App.css'

type Point = { x: number; y: number }
type DetectedLine = { x1: number; y1: number; x2: number; y2: number; length: number }
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

        let turfStartY = Math.floor(height * 0.18)
        const requiredGreenRatio = 0.16
        for (let y = Math.floor(height * 0.12); y < Math.floor(height * 0.65); y++) {
          let consecutiveRows = 0
          for (let k = 0; k < 7 && y + k < height; k++) {
            if (greenRatioByRow[y + k] >= requiredGreenRatio) consecutiveRows++
          }
          if (consecutiveRows >= 6) {
            turfStartY = Math.max(0, y - Math.round(height * 0.008))
            break
          }
        }

        // 2) Cria uma máscara apenas com pixels quase brancos dentro da região
        // identificada como gramado. Evita detectar textos/placas na arquibancada.
        const maskImage = new ImageData(width, height)
        const maskData = maskImage.data
        for (let y = turfStartY; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const r = data[i], g = data[i + 1], b = data[i + 2]
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            const brightNeutral = min >= 132 && (max - min) <= 72
            if (brightNeutral) {
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

        const found: DetectedLine[] = []
        const values = lines.data32S
        for (let i = 0; i + 3 < values.length; i += 4) {
          const x1 = values[i]
          const y1 = values[i + 1]
          const x2 = values[i + 2]
          const y2 = values[i + 3]
          const length = Math.hypot(x2 - x1, y2 - y1)
          if (length < Math.max(45, canvas.width * 0.045)) continue

          // Converte para o sistema de coordenadas do overlay.
          found.push({
            x1: (x1 / canvas.width) * VIEWBOX_SIZE,
            y1: (y1 / canvas.height) * VIEWBOX_SIZE,
            x2: (x2 / canvas.width) * VIEWBOX_SIZE,
            y2: (y2 / canvas.height) * VIEWBOX_SIZE,
            length,
          })
        }

        setDetectedLines(found)
        setDetectionMessage(
          found.length
            ? `${found.length} segmentos candidatos encontrados na região do gramado (início estimado em ${(turfStartY / height * 100).toFixed(1)}% da imagem). Ainda podem existir falsos positivos em uniformes e outras áreas claras.`
            : 'O gramado foi localizado, mas nenhum segmento longo foi encontrado. Tente uma imagem com linhas mais visíveis.'
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
          <div className="version">VERSÃO 0.5.5</div>
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
                            stroke="#ff4d6d" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
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
                  <span className="section-label">VISÃO COMPUTACIONAL · v0.5.5</span>
                  <span className={`opencv-status ${openCvReady ? 'ready' : 'loading'}`}>
                    <i /> {openCvReady ? 'OPENCV PRONTO' : 'CARREGANDO OPENCV'}
                  </span>
                </div>
                <strong>Detecção inicial das linhas do campo</strong>
                <p>O processamento procura segmentos longos associados a regiões claras e pouco saturadas da imagem. Os resultados são candidatos visuais, não uma identificação definitiva das linhas do gramado.</p>
                <button className="primary-button full-button" disabled={!imageReady || mediaType !== 'image' || !openCvReady || isDetecting}
                  onClick={detectFieldLines}>
                  {isDetecting ? 'Analisando imagem...' : 'Detectar linhas do campo'}
                </button>
                <button className="secondary-button full-button" disabled={detectedLines.length === 0}
                  onClick={() => { setDetectedLines([]); setDetectionMessage('Detecção removida.'); }}>
                  Limpar detecção
                </button>
                <div className="detection-feedback">{detectionMessage}</div>
                {detectedLines.length > 0 && <div className="detection-count">{detectedLines.length} segmentos sobrepostos em vermelho</div>}
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
