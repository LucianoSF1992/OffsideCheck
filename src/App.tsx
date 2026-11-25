import { useEffect, useRef, useState } from 'react'
import './App.css'

type Point = { x: number; y: number }
type ReferenceLine = { id: number; label: string; color: string; start: Point; end: Point }

const initialLines: ReferenceLine[] = [
  { id: 1, label: 'Referência 1', color: '#35d39a', start: { x: 120, y: 300 }, end: { x: 880, y: 300 } },
  { id: 2, label: 'Referência 2', color: '#55a8ff', start: { x: 180, y: 500 }, end: { x: 820, y: 500 } },
  { id: 3, label: 'Referência 3', color: '#f4bd55', start: { x: 300, y: 700 }, end: { x: 700, y: 700 } },
]

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [imageReady, setImageReady] = useState(false)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [lines, setLines] = useState<ReferenceLine[]>(initialLines)
  const [activeHandle, setActiveHandle] = useState<{ lineId: number; point: 'start' | 'end' } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!activeHandle) return

    function finishDrag() {
      setActiveHandle(null)
    }

    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
    return () => {
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [activeHandle])

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
    setLines(initialLines)
  }

  function clearFile() {
    setFile(null)
    setPreview('')
    setMediaType(null)
    setImageReady(false)
    setCalibrationMode(false)
    setLines(initialLines)
    if (inputRef.current) inputRef.current.value = ''
  }

  function updatePoint(event: React.PointerEvent<SVGSVGElement>) {
    if (!activeHandle || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000))
    const y = Math.max(0, Math.min(1000, ((event.clientY - rect.top) / rect.height) * 1000))

    setLines(current => current.map(line => {
      if (line.id !== activeHandle.lineId) return line
      return { ...line, [activeHandle.point]: { x, y } }
    }))
  }

  function resetCalibration() {
    setLines(initialLines)
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
          <div className="version">VERSÃO 0.2.0</div>
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
                  <span>{calibrationMode ? 'Arraste os pontos para posicionar as referências' : 'Imagem ou vídeo da partida'}</span>
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
                        viewBox="0 0 1000 1000"
                        preserveAspectRatio="none"
                        onPointerMove={updatePoint}
                      >
                        {lines.map(line => (
                          <g key={line.id}>
                            <line
                              x1={line.start.x} y1={line.start.y}
                              x2={line.end.x} y2={line.end.y}
                              stroke={line.color}
                              strokeWidth="5"
                              vectorEffect="non-scaling-stroke"
                              strokeLinecap="round"
                            />
                            <circle
                              cx={line.start.x} cy={line.start.y} r="13"
                              fill={line.color} stroke="#fff" strokeWidth="3"
                              vectorEffect="non-scaling-stroke"
                              className="calibration-handle"
                              onPointerDown={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                setActiveHandle({ lineId: line.id, point: 'start' })
                              }}
                            />
                            <circle
                              cx={line.end.x} cy={line.end.y} r="13"
                              fill={line.color} stroke="#fff" strokeWidth="3"
                              vectorEffect="non-scaling-stroke"
                              className="calibration-handle"
                              onPointerDown={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                setActiveHandle({ lineId: line.id, point: 'end' })
                              }}
                            />
                          </g>
                        ))}
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
                    {lines.map(line => (
                      <span key={line.id}><i style={{ backgroundColor: line.color }} />{line.label}</span>
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
                <p>Use as três linhas auxiliares para marcar referências visuais do campo. Arraste os círculos nas extremidades de cada linha.</p>
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
                  <p>As linhas auxiliares servem para referências de perspectiva. Elas não representam a linha de impedimento.</p>
                </div>
              </div>

              <div className="coming-soon">
                <span>PRÓXIMAS ETAPAS</span>
                <strong>Marcação de jogadores e bola</strong>
                <p>O cálculo geométrico será desenvolvido após a calibração.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
