# OffsideCheck

**Plataforma de apoio à análise de impedimento no futebol.**  
**A football offside analysis support platform.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)

---

## 🇧🇷 Português

### Sobre o projeto

O **OffsideCheck** é um projeto pessoal em desenvolvimento que tem como objetivo criar uma ferramenta visual para auxiliar na análise de possíveis situações de impedimento no futebol.

A proposta é permitir que o usuário carregue uma imagem ou um vídeo de uma jogada, calibre manualmente a perspectiva do campo e, em etapas futuras, marque os jogadores e a posição da bola para projetar uma linha de referência e apoiar a análise do lance.

A calibração manual será o fluxo principal da aplicação. Futuramente, será oferecida também uma opção de calibração automática, na qual o sistema tentará identificar as linhas do campo e sugerir os ajustes, permitindo que o usuário revise o resultado e faça correções manuais quando necessário.

O sistema será uma ferramenta de apoio visual e educacional. Ele não substitui a interpretação da arbitragem nem constitui uma decisão oficial.

### Status atual

O projeto está em desenvolvimento, com a interface principal e os recursos iniciais de calibração manual implementados.

**Implementado**
- [x] Estrutura do frontend com React, TypeScript e Vite.
- [x] Configuração do Vite e ESLint.
- [x] Interface principal de análise.
- [x] Carregamento e visualização de imagens e vídeos.
- [x] Calibração manual da perspectiva por meio de três eixos auxiliares.
- [x] Ponto de origem compartilhado e pontos de ajuste independentes para os eixos.
- [x] Opção para redefinir a calibração.

**Em desenvolvimento / planejado**
- [ ] Implementar a base matemática e o sistema de coordenadas da perspectiva.
- [ ] Calcular e projetar a linha de impedimento com base na perspectiva calibrada.
- [ ] Permitir a marcação manual de atacantes, defensores e bola.
- [ ] Criar uma opção de calibração automática assistida por visão computacional.
- [ ] Adicionar recursos de análise, validação e usabilidade.

### Tecnologias

| Tecnologia | Finalidade |
|---|---|
| React | Construção da interface |
| TypeScript | Tipagem estática e organização do código |
| Vite | Ambiente de desenvolvimento e build |
| ESLint | Análise estática e padronização do código |
| SVG / CSS | Exibição e interação com os eixos e pontos de calibração |
| OpenCV.js | Tecnologia em avaliação para futura detecção automática |

### Como executar localmente

**Pré-requisitos**
- Node.js (versão 22 ou compatível)
- npm

**Instalação**

```bash
git clone https://github.com/LucianoSF1992/OffsideCheck.git
cd OffsideCheck
npm install
```

**Ambiente de desenvolvimento**

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local para abrir a aplicação no navegador (normalmente `http://localhost:5173`).

**Build de produção**

```bash
npm run build
```

**Verificação de código**

```bash
npm run lint
```

### Abordagem de análise

A calibração da perspectiva será inicialmente manual e continuará sendo a forma principal de configuração. O usuário posicionará o ponto de origem e ajustará os três eixos auxiliares para estabelecer referências geométricas da perspectiva do campo.

Em uma etapa futura, a aplicação poderá oferecer uma opção de calibração automática assistida por visão computacional. Essa funcionalidade será complementar: o usuário poderá conferir o resultado sugerido pelo sistema e realizar ajustes manuais quando necessário.

As três linhas auxiliares servem como referências geométricas; elas **não representam, por si só, a linha de impedimento**.

A linha de impedimento deverá ser calculada em uma etapa posterior, a partir das posições identificadas dos jogadores e da bola e da geometria calibrada da imagem.

### Regra 11 — Impedimento

O desenvolvimento considera a Regra 11 das Leis do Jogo da IFAB. Estar em posição de impedimento, por si só, não constitui uma infração: também é necessário avaliar a participação ativa do jogador na jogada e as condições previstas na regra.

Por isso, o OffsideCheck será apresentado como ferramenta de apoio à análise, sem alegar substituir a avaliação humana ou os procedimentos oficiais de arbitragem.

Referência: [IFAB — Laws of the Game](https://www.theifab.com/laws/latest/offside/).

### Roadmap

1. [x] Estrutura inicial e interface principal.
2. [x] Carregamento e visualização de imagens e vídeos.
3. [x] Implementação da calibração manual com três eixos auxiliares.
4. [ ] **v0.4.0 —** Implementar a base matemática da perspectiva e o sistema de coordenadas a partir dos pontos de calibração.
5. [ ] **v0.5.0 —** Criar ferramentas para marcação manual de jogadores e bola.
6. [ ] **v0.6.0 —** Calcular e projetar a linha de impedimento com base nas marcações e na geometria calibrada.
7. [ ] **v0.7.0 —** Adicionar uma opção de calibração automática assistida por visão computacional, mantendo a calibração manual como alternativa e permitindo revisar os resultados.
8. [ ] Adicionar testes, documentação e melhorias de usabilidade.

### Autor

**Luciano Silva Ferreira**

- Portfólio: [lucianoferreiradev.com](https://www.lucianoferreiradev.com/)
- GitHub: [@LucianoSF1992](https://github.com/LucianoSF1992)

---

## 🇺🇸 English

### About the project

**OffsideCheck** is a personal project under development. Its goal is to provide a visual tool that supports the analysis of potential offside situations in football (soccer).

The proposed workflow allows users to upload an image or video of a play, manually calibrate the pitch perspective and, in future stages, mark players and the ball to project a reference line and support the analysis.

Manual calibration will remain the application's primary workflow. In a future version, users will also be able to choose an automatic calibration option, in which the system will attempt to detect pitch lines and suggest calibration adjustments. Users will be able to review and manually correct the suggested result.

The application is intended as a visual and educational support tool. It does not replace referees' judgment or provide an official decision.

### Current status

The project is under development. The main interface and initial manual-calibration features have been implemented.

**Implemented**
- [x] React, TypeScript and Vite frontend.
- [x] Vite and ESLint configuration.
- [x] Main analysis interface.
- [x] Image and video upload and preview.
- [x] Manual perspective calibration using three auxiliary axes.
- [x] Shared origin point and independently adjustable axis points.
- [x] Calibration reset option.

**In development / planned**
- [ ] Implement the perspective mathematics and coordinate system.
- [ ] Calculate and project the offside line using the calibrated perspective.
- [ ] Add manual marking of attackers, defenders and the ball.
- [ ] Add an optional computer-vision-assisted automatic calibration feature.
- [ ] Add analysis, validation and usability features.

### Tech stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Static typing and code organization |
| Vite | Development environment and build tooling |
| ESLint | Static analysis and code consistency |
| SVG / CSS | Display and interaction with calibration axes and points |
| OpenCV.js | Technology being evaluated for future automatic detection |

### Run locally

**Requirements**
- Node.js (version 22 or compatible)
- npm

**Install**

```bash
git clone https://github.com/LucianoSF1992/OffsideCheck.git
cd OffsideCheck
npm install
```

**Start the development server**

```bash
npm run dev
```

Vite will print the local URL in the terminal (usually `http://localhost:5173`).

**Production build**

```bash
npm run build
```

**Lint**

```bash
npm run lint
```

### Analysis approach

Perspective calibration will initially be manual and will remain the primary setup method. Users will position the shared origin point and adjust the three auxiliary axes to establish geometric references for the pitch perspective.

In a future stage, the application may offer an optional computer-vision-assisted automatic calibration feature. This feature will complement manual calibration: users will be able to review the system's suggested result and make manual adjustments when needed.

The three auxiliary lines act as geometric references; they are **not, by themselves, the offside line**.

The offside line is planned to be calculated in a later stage using the identified player and ball positions together with the calibrated image geometry.

### Law 11 — Offside

The project takes IFAB Law 11 into account. Being in an offside position is not, by itself, an offence. Active involvement in play and the conditions defined by the law must also be considered.

For this reason, OffsideCheck is intended to support analysis and learning, not to replace human judgment or official refereeing procedures.

Reference: [IFAB — Laws of the Game](https://www.theifab.com/laws/latest/offside/).

### Roadmap

1. [x] Initial frontend structure and main interface.
2. [x] Image and video upload and preview.
3. [x] Manual calibration using three auxiliary axes.
4. [ ] **v0.4.0 —** Implement perspective mathematics and a coordinate system based on the calibration points.
5. [ ] **v0.5.0 —** Add tools for manually marking players and the ball.
6. [ ] **v0.6.0 —** Calculate and project the offside line using the markings and calibrated geometry.
7. [ ] **v0.7.0 —** Add an optional computer-vision-assisted automatic calibration feature, keeping manual calibration available and allowing users to review the result.
8. [ ] Add tests, documentation and usability improvements.

### Author

**Luciano Silva Ferreira**

- Portfolio: [lucianoferreiradev.com](https://www.lucianoferreiradev.com/)
- GitHub: [@LucianoSF1992](https://github.com/LucianoSF1992)

---

## License

No license has been added yet. Until a license is chosen, all rights are reserved by the author.
