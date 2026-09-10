# Relatórios de Obra

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

A primeira etapa inclui Header responsivo com a logo local RIOW, Home e a rota `/relatorios/novo`. Nessa rota, é possível tirar ou selecionar imagens para previews temporários, incluindo descrição e exclusão local. As fotos não são persistidas: ao atualizar ou fechar a página, elas são removidas. Não há IndexedDB, PWA, compressão, API ou geração de PDF nesta fase.

O projeto utiliza TypeScript, SCSS Modules e as dependências de desenvolvimento `sass`, `typescript`, `@types/react` e `@types/node`. Os estilos globais ficam em `src/app/globals.scss`; os estilos da página e do Header usam SCSS Modules, junto aos respectivos componentes.
