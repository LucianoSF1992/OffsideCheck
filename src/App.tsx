import { useEffect, useRef, useState } from 'react'
import './App.css'

type Point = { x: number; y: number }
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
          <div className="version">VERSÃO 0.4.0</div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">ANÁLISE DE ARBITRAGEM</span>
              <h1>Análise de impedimento</h1>
              <p>Carregue uma jogada e prepare a perspectiva do campo.</p>
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
                      src={preview}
                      alt="Imagem da jogada selecionada"
                      onLoad={() => setImageReady(true)}
                    />
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
                  <div><strong>Calibrar perspectiva</strong><p>Definir referências do campo</p></div>
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
                <span className="section-label">CALIBRAÇÃO MANUAL</span>
                <p>O ponto central escuro identifica o penúltimo defensor e funciona como origem compartilhada dos eixos. Posicione a extremidade laranja sobre a linha de fundo. Ajuste as demais extremidades para orientar as referências longitudinal e lateral do campo.</p>
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
                  <p>O ponto central identifica a referência do penúltimo defensor. A extremidade laranja indica a referência da linha de fundo. Os eixos orientam a calibração, mas não são, por si só, a linha de impedimento.</p>
                </div>
              </div>

              <div className="geometry-card">
                <div className="geometry-card-header">
                  <div>
                    <span className="section-label">BASE GEOMÉTRICA · v0.4.0</span>
                    <strong>Geometria da imagem e do campo</strong>
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
                  <strong>PLANO REAL DO CAMPO · AINDA NÃO CALIBRADO</strong>
                  <span>As coordenadas em metros serão calculadas após relacionar pelo menos quatro pontos conhecidos do campo com seus pontos correspondentes na imagem.</span>
                </div>

                <p className="geometry-disclaimer">
                  As coordenadas e distâncias acima pertencem somente ao espaço 2D da imagem
                  (escala interna 1000 × 1000). Elas descrevem a posição e a orientação dos eixos na
                  imagem, não distâncias reais em metros. Para converter pontos da imagem em coordenadas
                  do campo, precisaremos de pelo menos quatro correspondências entre pontos visíveis e
                  posições conhecidas no gramado (homografia).
                </p>
              </div>

              <div className="coming-soon">
                <span>PRÓXIMAS ETAPAS</span>
                <strong>Plano do campo e homografia</strong>
                <p>Próxima etapa: informar dimensões do campo e selecionar pelo menos quatro pontos correspondentes para relacionar a imagem ao plano do gramado.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
