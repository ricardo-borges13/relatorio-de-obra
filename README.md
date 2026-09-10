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

O sistema possui Header responsivo com a logo local RIOW, Home e as rotas `/relatorios/novo`, `/relatorios/[id]` e `/relatorios/[id]/preview`. Relatórios novos começam como `draft`, podem permanecer incompletos e são salvos automaticamente neste dispositivo. A Home lista os relatórios salvos por última atualização e permite continuar a edição.

As imagens são validadas e processadas localmente no navegador: o maior lado é limitado a 1280 px e a versão JPEG gerada utiliza qualidade `0.80`. Apenas a fotografia otimizada e seus metadados são persistidos; previews usam Object URLs temporárias.

## Persistência local

A persistência utiliza `dexie` como abstração sobre IndexedDB, sem servidor ou API.

- Banco: `riowReportsDB`, versão 1.
- Tabelas: `reports` e `reportPhotos`.
- Relatórios são salvos com autosave de 700 ms.
- Fotografias otimizadas, descrições e ordem são associadas ao relatório na tabela `reportPhotos`.
- Relatórios podem ser excluídos pela Home; a exclusão remove permanentemente, neste dispositivo, o relatório e todas as suas fotografias associadas.
- A rota de prévia apresenta o relatório salvo em páginas A4 visuais: até quatro fotos na primeira página e até seis em cada página seguinte. É somente uma prévia no navegador; PDF, impressão e download ainda não foram implementados.

Os dados permanecem somente no navegador e dispositivo atuais. Eles não são sincronizados entre navegadores, celulares, notebooks ou computadores. Limpar os dados do site pode remover a IndexedDB e os relatórios; ela não deve ser tratada como backup definitivo.

PWA, geração e compartilhamento de PDF ainda não foram implementados.

O projeto utiliza TypeScript, SCSS Modules e as dependências `dexie`, `sass`, `typescript`, `@types/react` e `@types/node`. Os estilos globais ficam em `src/app/globals.scss`; os estilos da página e do Header usam SCSS Modules, junto aos respectivos componentes.
