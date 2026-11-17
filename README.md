# OffsideCheck

**Plataforma de apoio à análise de impedimento no futebol.**  
**A football offside analysis support platform.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

---

## 🇧🇷 Português

### Sobre o projeto

O **OffsideCheck** é um projeto pessoal em desenvolvimento que tem como objetivo criar uma ferramenta visual para auxiliar na análise de possíveis situações de impedimento no futebol.

A proposta é permitir que o usuário carregue uma imagem ou um vídeo de uma jogada, ajuste a perspectiva do campo e, em etapas futuras, marque os jogadores e a posição da bola para projetar uma linha de referência e apoiar a análise do lance.

O sistema será uma ferramenta de apoio visual e educacional. Ele não substitui a interpretação da arbitragem nem constitui uma decisão oficial.

### Status atual

O projeto está em sua fase inicial. Neste momento, foi criada a estrutura-base do frontend com React, TypeScript e Vite.

**Implementado**
- [x] Estrutura inicial do frontend com React e TypeScript.
- [x] Configuração do Vite e ESLint.

**Planejado**
- [ ] Criar a interface principal de análise.
- [ ] Permitir o carregamento de imagens e vídeos.
- [ ] Implementar um editor visual baseado em HTML Canvas.
- [ ] Permitir o ajuste manual de três linhas auxiliares para calibrar a perspectiva do campo.
- [ ] Marcar manualmente atacantes, defensores e bola.
- [ ] Calcular e projetar a linha de impedimento com base na perspectiva calibrada.
- [ ] Avaliar a integração com OpenCV.js para auxiliar na detecção de elementos do campo.
- [ ] Desenvolver recursos de análise e validação da jogada.

### Tecnologias

| Tecnologia | Finalidade |
|---|---|
| React | Construção da interface |
| TypeScript | Tipagem estática e organização do código |
| Vite | Ambiente de desenvolvimento e build |
| ESLint | Análise estática e padronização do código |
| HTML Canvas | Editor visual planejado para as marcações |

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

A calibração da perspectiva será inicialmente manual. As três linhas auxiliares servirão como referências geométricas para orientar a perspectiva do campo; elas **não representam, por si só, a linha de impedimento**.

A linha de impedimento deverá ser calculada em uma etapa posterior, a partir das posições identificadas dos jogadores e da bola e da geometria calibrada da imagem.

### Regra 11 — Impedimento

O desenvolvimento considera a Regra 11 das Leis do Jogo da IFAB. Estar em posição de impedimento, por si só, não constitui uma infração: também é necessário avaliar a participação ativa do jogador na jogada e as condições previstas na regra.

Por isso, o OffsideCheck será apresentado como ferramenta de apoio à análise, sem alegar substituir a avaliação humana ou os procedimentos oficiais de arbitragem.

Referência: [IFAB — Laws of the Game](https://www.theifab.com/laws/latest/offside/).

### Roadmap

1. Finalizar a interface inicial.
2. Implementar upload e visualização de imagens e vídeos.
3. Construir o editor de calibração manual.
4. Implementar a geometria de perspectiva e a projeção da linha.
5. Avaliar detecção assistida por visão computacional.
6. Adicionar testes, documentação e melhorias de usabilidade.

### Autor

**Luciano Silva Ferreira**

- Portfólio: [lucianoferreiradev.com](https://www.lucianoferreiradev.com/)
- GitHub: [@LucianoSF1992](https://github.com/LucianoSF1992)

---

## 🇺🇸 English

### About the project

**OffsideCheck** is a personal project under development. Its goal is to provide a visual tool that supports the analysis of potential offside situations in football (soccer).

The planned workflow allows users to upload an image or video of a play, calibrate the pitch perspective and, in future stages, mark players and the ball to project a reference line and support the analysis.

The application is intended as a visual and educational support tool. It does not replace referees' judgment or provide an official decision.

### Current status

The project is at an early stage. The initial frontend scaffold has been created with React, TypeScript and Vite.

**Implemented**
- [x] Initial React and TypeScript frontend scaffold.
- [x] Vite and ESLint configuration.

**Planned**
- [ ] Build the main analysis interface.
- [ ] Add image and video upload.
- [ ] Implement a visual editor using HTML Canvas.
- [ ] Allow manual adjustment of three auxiliary lines to calibrate pitch perspective.
- [ ] Manually mark attackers, defenders and the ball.
- [ ] Calculate and project the offside line using the calibrated perspective.
- [ ] Evaluate OpenCV.js integration to assist with pitch-element detection.
- [ ] Add play-analysis and validation features.

### Tech stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Static typing and code organization |
| Vite | Development environment and build tooling |
| ESLint | Static analysis and code consistency |
| HTML Canvas | Planned visual marking editor |

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

Perspective calibration will initially be manual. The three auxiliary lines will act as geometric references to establish the pitch perspective; they are **not, by themselves, the offside line**.

The offside line is planned to be calculated in a later stage using the identified player and ball positions together with the calibrated image geometry.

### Law 11 — Offside

The project takes IFAB Law 11 into account. Being in an offside position is not, by itself, an offence. Active involvement in play and the conditions defined by the law must also be considered.

For this reason, OffsideCheck is intended to support analysis and learning, not to replace human judgment or official refereeing procedures.

Reference: [IFAB — Laws of the Game](https://www.theifab.com/laws/latest/offside/).

### Roadmap

1. Complete the initial interface.
2. Implement image and video upload and preview.
3. Build the manual perspective-calibration editor.
4. Implement perspective geometry and offside-line projection.
5. Evaluate computer-vision-assisted detection.
6. Add tests, documentation and usability improvements.

### Author

**Luciano Silva Ferreira**

- Portfolio: [lucianoferreiradev.com](https://www.lucianoferreiradev.com/)
- GitHub: [@LucianoSF1992](https://github.com/LucianoSF1992)

---

## License

No license has been added yet. Until a license is chosen, all rights are reserved by the author.
