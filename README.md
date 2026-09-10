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

O sistema possui Header responsivo com a logo local RIOW, Home e as rotas `/relatorios/novo`, `/relatorios/[id]` e `/relatorios/[id]/preview`. Relatórios novos começam como `draft`, exibem a data atual do dispositivo e podem permanecer incompletos. Um relatório aberto em `/relatorios/novo` permanece apenas em memória até receber conteúdo real em um campo ou uma fotografia; a data automática sozinha não cria um rascunho. Rascunhos totalmente vazios não são persistidos nem aparecem na Home. A Home lista os relatórios salvos por última atualização e permite continuar a edição.

As imagens são validadas e processadas localmente no navegador: o maior lado é limitado a 1280 px e a versão JPEG gerada utiliza qualidade `0.80`. Apenas a fotografia otimizada e seus metadados são persistidos; previews usam Object URLs temporárias.

O relatório pode ser visualizado na rota de prévia ou salvo como PDF A4 diretamente na edição e na prévia. A geração usa `pdf-lib` inteiramente no navegador, com até quatro fotos na primeira página e seis nas páginas seguintes. O arquivo é gerado sob demanda, não fica armazenado na IndexedDB e recebe o nome `Relatorio_Obra_[NomeDaObra]_[AAAA-MM-DD].pdf`. Após uma geração bem-sucedida, o relatório passa de `draft` para `finished`. Compartilhamento ainda não está implementado.

## Persistência local

A persistência utiliza `dexie` como abstração sobre IndexedDB, sem servidor ou API.

- Banco: `riowReportsDB`, versão 1.
- Tabelas: `reports` e `reportPhotos`.
- Relatórios são salvos com autosave de 700 ms.
- Fotografias otimizadas, descrições e ordem são associadas ao relatório na tabela `reportPhotos`.
- Relatórios podem ser excluídos pela Home; a exclusão remove permanentemente, neste dispositivo, o relatório e todas as suas fotografias associadas.
- A rota de prévia apresenta o relatório salvo em páginas A4 visuais: até quatro fotos na primeira página e até seis em cada página seguinte. Os botões “Visualizar relatório” e “Salvar PDF” são ações distintas; o PDF pode ser salvo tanto na edição quanto na prévia.

Os dados permanecem somente no navegador e dispositivo atuais. Eles não são sincronizados entre navegadores, celulares, notebooks ou computadores. Limpar os dados do site pode remover a IndexedDB e os relatórios; ela não deve ser tratada como backup definitivo.

PWA e compartilhamento de PDF ainda não foram implementados. A geração local de PDF não envia fotos ou dados para servidores.

O projeto utiliza TypeScript, SCSS Modules e as dependências `dexie`, `pdf-lib`, `sass`, `typescript`, `@types/react` e `@types/node`. A geração fica isolada em `src/lib/pdf/`. Os estilos globais ficam em `src/app/globals.scss`; os estilos da página e do Header usam SCSS Modules, junto aos respectivos componentes.
