# ⚽ OffsideCheck

**Sistema de Análise de Impedimento no Futebol | Football Offside Analysis System**

[Português](#português) | [English](#english)

---

# 🇧🇷 Português

## Sobre o projeto

O **OffsideCheck** é um sistema desenvolvido para auxiliar na análise de lances de impedimento no futebol de campo, utilizando visão computacional, geometria e análise de imagens e vídeos.

A aplicação permitirá carregar imagens ou vídeos de partidas, calibrar a perspectiva do campo por meio de linhas de referência e analisar o posicionamento dos jogadores em relação à linha de impedimento.

O objetivo é oferecer uma ferramenta visual e interativa para árbitros, analistas, estudantes de arbitragem e entusiastas do futebol.

## Objetivos

- Desenvolver uma ferramenta de análise visual de impedimento.
- Permitir calibração manual e automática da perspectiva do campo.
- Identificar referências geométricas para projetar a linha de impedimento.
- Analisar imagens e vídeos de partidas.
- Aplicar os critérios da Regra 11 das Regras do Jogo da IFAB.
- Explorar tecnologias de visão computacional.

## Funcionalidades

### Implementadas na versão inicial
- [x] Estrutura inicial do frontend.
- [x] Interface inicial de análise.
- [x] Upload de imagens e vídeos.
- [x] Editor visual de linhas de referência.

### Planejadas
- [ ] Calibração automática da perspectiva.
- [ ] Correção manual das referências detectadas.
- [ ] Identificação e marcação dos jogadores.
- [ ] Identificação do penúltimo adversário.
- [ ] Cálculo geométrico da linha de impedimento.
- [ ] Análise quadro a quadro de vídeos.
- [ ] Apresentação visual do resultado.
- [ ] Histórico de análises.
- [ ] Testes automatizados.

> O status das funcionalidades será atualizado conforme a implementação evoluir.

## Tecnologias

**Frontend**
- React
- TypeScript
- Vite
- HTML5 Canvas

**Visão computacional — planejado**
- OpenCV.js
- Homografia e geometria computacional
- Tecnologias de detecção de objetos

**Backend — evolução futura, se necessário**
- C#
- ASP.NET Core Web API
- SQL Server ou PostgreSQL

## Como funciona

1. O usuário carrega uma imagem ou vídeo de uma partida.
2. O sistema identifica ou permite configurar três linhas auxiliares para orientação e perspectiva do campo.
3. A perspectiva é calibrada para permitir a análise geométrica.
4. O usuário identifica o atacante, o penúltimo adversário e o momento do passe.
5. O sistema projeta a linha de impedimento.
6. O resultado é apresentado visualmente para auxiliar a análise do lance.

## Regra 11 — Impedimento

O projeto utiliza como referência a Regra 11 das Regras do Jogo publicadas pela International Football Association Board (IFAB).

A análise considera, entre outros aspectos:
- A posição do atacante no momento em que a bola é jogada ou tocada por um companheiro.
- A posição da bola.
- A posição do penúltimo adversário.
- As partes do corpo relevantes para determinar uma posição de impedimento.
- A participação ativa do jogador na jogada.
- As exceções previstas na regra.

**Importante:** estar em posição de impedimento não constitui, por si só, uma infração. A avaliação de participação ativa e das situações específicas previstas na Regra 11 exige interpretação humana. O OffsideCheck é uma ferramenta de auxílio à análise, não um sistema oficial de arbitragem.

Referência: [IFAB — Lei 11: Impedimento](https://www.theifab.com/laws/latest/offside/).

## Executando localmente

### Pré-requisitos
- Node.js (versão LTS recomendada)
- npm
- Git

### Instalação

Clone o repositório:

```bash
git clone https://github.com/LucianoSF1992/OffsideCheck.git
```

Entre na pasta:

```bash
cd OffsideCheck
```

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### Build de produção

```bash
npm run build
```

## Estrutura do projeto

```text
OffsideCheck/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   │   └── analysis/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

*A estrutura será ajustada conforme a implementação real evoluir.*

## Roadmap

1. Finalizar o editor de análise.
2. Implementar a calibração geométrica da perspectiva.
3. Integrar OpenCV.js para auxiliar na detecção das linhas do campo.
4. Permitir a correção manual das referências.
5. Implementar a marcação e identificação dos jogadores.
6. Calcular e projetar a linha de impedimento.
7. Evoluir os recursos de análise de vídeos.
8. Avaliar a necessidade de um backend.
9. Adicionar testes, documentação e publicação.

## Autor

**Luciano Silva Ferreira**

- Portfólio: https://www.lucianoferreiradev.com/
- GitHub: https://github.com/LucianoSF1992

---

# 🇺🇸 English

## About the project

**OffsideCheck** is a football offside analysis system designed to assist in reviewing offside situations using computer vision, geometry, and image and video analysis.

The application will allow users to upload match images or videos, calibrate the pitch perspective using reference lines, and analyze player positions in relation to the offside line.

The goal is to provide an interactive visual tool for referees, analysts, referee students, and football enthusiasts.

## Project objectives

- Develop a visual offside analysis tool.
- Support manual and automatic pitch perspective calibration.
- Identify geometric references for offside line projection.
- Analyze football match images and videos.
- Apply IFAB Law 11 — Offside.
- Explore computer vision technologies.

## Features

### Included in the initial version
- [x] Initial frontend structure.
- [x] Initial analysis interface.
- [x] Image and video uploads.
- [x] Visual reference line editor.

### Planned
- [ ] Automatic perspective calibration.
- [ ] Manual correction of detected references.
- [ ] Player identification and annotation.
- [ ] Second-last opponent identification.
- [ ] Geometric offside line calculation.
- [ ] Frame-by-frame video analysis.
- [ ] Visual analysis results.
- [ ] Analysis history.
- [ ] Automated tests.

> Feature status will be updated as development progresses.

## Technologies

**Frontend**
- React
- TypeScript
- Vite
- HTML5 Canvas

**Computer vision — planned**
- OpenCV.js
- Homography and computational geometry
- Object detection technologies

**Backend — future development, if needed**
- C#
- ASP.NET Core Web API
- SQL Server or PostgreSQL

## How it works

1. The user uploads a football match image or video.
2. The system detects or allows the user to configure three auxiliary reference lines for pitch orientation and perspective.
3. The perspective is calibrated for geometric analysis.
4. The user identifies the attacker, the second-last opponent, and the moment the ball is played.
5. The system projects the offside line.
6. The result is displayed visually to assist with the analysis.

## Law 11 — Offside

The project uses Law 11 of the Laws of the Game published by the International Football Association Board (IFAB) as its reference.

The analysis considers, among other aspects:
- The attacker's position when the ball is played or touched by a teammate.
- The position of the ball.
- The position of the second-last opponent.
- The body parts relevant to determining an offside position.
- Active involvement in play.
- The exceptions defined by the law.

**Important:** being in an offside position is not, by itself, an offence. Assessing active involvement and specific situations under Law 11 requires human interpretation. OffsideCheck is an analysis assistance tool, not an official refereeing system.

Reference: [IFAB — Law 11: Offside](https://www.theifab.com/laws/latest/offside/).

## Running locally

### Prerequisites
- Node.js (recommended LTS version)
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/LucianoSF1992/OffsideCheck.git
```

Navigate to the project directory:

```bash
cd OffsideCheck
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production build

```bash
npm run build
```

## Project structure

```text
OffsideCheck/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   │   └── analysis/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

*The structure will be adjusted as the actual implementation evolves.*

## Roadmap

1. Complete the analysis editor.
2. Implement geometric perspective calibration.
3. Integrate OpenCV.js to assist with pitch line detection.
4. Allow manual correction of reference lines.
5. Implement player annotation and identification.
6. Calculate and project the offside line.
7. Improve video analysis capabilities.
8. Evaluate whether a backend is necessary.
9. Add tests, documentation, and deployment.

## Author

**Luciano Silva Ferreira**

- Portfolio: https://www.lucianoferreiradev.com/
- GitHub: https://github.com/LucianoSF1992

---

**Project status:** Initial development  
**License:** To be defined
