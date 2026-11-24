import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

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
  }

  function clearFile() {
    setFile(null)
    setPreview('')
    setMediaType(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">OC</div>
          <div>
            <strong>OffsideCheck</strong>
            <span>FOOTBALL ANALYSIS</span>
          </div>
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
          <div className="version">VERSÃO 0.1.1</div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">ANÁLISE DE ARBITRAGEM</span>
              <h1>Análise de impedimento</h1>
              <p>Carregue uma jogada para iniciar a análise visual.</p>
            </div>
            <div className="law-tag">IFAB · REGRA 11</div>
          </div>

          <div className="workspace">
            <section className="analysis-panel">
              <div className="panel-header">
                <div>
                  <h2>Visualização da jogada</h2>
                  <span>Imagem ou vídeo da partida</span>
                </div>
                {file && <button className="clear-button" onClick={clearFile}>Remover arquivo</button>}
              </div>

              <div className={`media-area ${file ? 'has-file' : ''}`}>
                {preview && mediaType === 'image' && (
                  <img src={preview} alt="Imagem da jogada selecionada" />
                )}
                {preview && mediaType === 'video' && (
                  <video src={preview} controls playsInline />
                )}
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
                  <span className="step-status">●</span>
                </div>
                <div className="step">
                  <span className="step-number">02</span>
                  <div><strong>Calibrar perspectiva</strong><p>Definir referências do campo</p></div>
                  <span className="step-status pending">○</span>
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

              <div className="info-card">
                <span className="info-icon">ⓘ</span>
                <div>
                  <strong>Sobre a análise</strong>
                  <p>Estar em posição de impedimento não constitui, por si só, uma infração. É necessário avaliar a participação do jogador na jogada.</p>
                </div>
              </div>

              <div className="coming-soon">
                <span>EM DESENVOLVIMENTO</span>
                <strong>Calibração e visão computacional</strong>
                <p>As próximas ferramentas serão adicionadas gradualmente.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
