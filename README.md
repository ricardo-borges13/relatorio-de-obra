# Relatórios Fotográficos

Aplicação web para organização de relatórios fotográficos de serviços executados em obras.

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts

```bash
npm run lint
npm run build
```

## Estado atual

A primeira etapa estabelece somente a base visual: Header responsivo com a logo local RIOW, página inicial e cartões com dados mockados. Não há persistência, upload, câmera, PWA, API ou geração de PDF nesta fase.

O projeto utiliza TypeScript, SCSS Modules e as dependências de desenvolvimento `sass`, `typescript`, `@types/react` e `@types/node`. Os estilos globais ficam em `src/app/globals.scss`; os estilos da página e do Header usam SCSS Modules, junto aos respectivos componentes.
