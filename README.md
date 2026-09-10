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

O sistema possui Header responsivo com a logo local RIOW, Home e as rotas estáticas `/relatorios/novo`, `/relatorios/editar?id=<id>` e `/relatorios/preview?id=<id>`. Relatórios novos começam como `draft`, exibem a data atual do dispositivo e podem permanecer incompletos. Um relatório aberto em `/relatorios/novo` permanece apenas em memória até receber conteúdo real em um campo ou uma fotografia; a data automática sozinha não cria um rascunho. Rascunhos totalmente vazios não são persistidos nem aparecem na Home. A Home lista os relatórios salvos por última atualização e permite continuar a edição.

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

Compartilhamento ainda não está implementado. A geração local de PDF não envia fotos ou dados para servidores.

## Publicação estática, PWA e funcionamento offline

A aplicação é instalável como PWA em navegadores compatíveis e usa `output: "export"` do Next.js. `npm run build` gera a pasta `out/`, pronta para publicação em Apache sem processo Node.js/Next.js em produção. Envie todo o conteúdo de `out/` para a raiz do document root de `https://obrasriow.invetec.com.br/`, inclusive `.htaccess`. A implementação usa `@serwist/next` com Webpack somente no build de produção; em desenvolvimento o worker fica desativado para não persistir cache no `localhost`.

- O manifest declara o nome, ícones RIOW de 192 px e 512 px (também maskable), modo `standalone`, idioma `pt-BR` e cores da aplicação.
- O service worker é gerado fisicamente como `out/sw.js`, registrado em `/sw.js` e possui escopo `/`. O `.htaccess` exportado define `Service-Worker-Allowed: /`, impede cache persistente do worker e converte URLs estáticas sem extensão, como `/relatorios/novo`, nos respectivos arquivos `.html`. O Apache precisa ter `mod_rewrite`, `mod_headers` e `AllowOverride FileInfo` habilitados.
- O shell da aplicação, Home, páginas estáticas de novo relatório, edição, prévia, fallback offline, logo, ícones e assets de build são precacheados. O identificador do relatório permanece na query string; nenhum ID precisa existir como rota física no build.
- Cache Storage guarda somente shell, JavaScript, CSS, fontes e assets HTTP. Relatórios, fotos e blobs não são duplicados no cache: continuam exclusivamente em `riowReportsDB` (IndexedDB).
- Após o primeiro carregamento sob controle do service worker, o fluxo local pode operar offline: Home, novo relatório, edição e prévia de rotas já visitadas, autosave, seleção/captura local de fotos quando suportada pelo dispositivo, e geração/download local de PDF.
- Atualizações ativam o novo worker sem recarregar a página em uso nem limpar a IndexedDB. O precache gerado no novo build substitui versões antigas de assets automaticamente.

Para a instalação e o service worker funcionarem plenamente em produção, a aplicação deve ser servida em HTTPS. `localhost` é uma exceção segura para desenvolvimento; um IP local em HTTP pode não disponibilizar instalação ou service worker.

No Android, Chrome pode oferecer a instalação quando os requisitos do navegador forem atendidos. Em Chrome e Edge desktop, a instalação também é oferecida pelo navegador quando suportada. No iPhone/iPad, use o fluxo nativo do Safari de adicionar à Tela de Início; não há botão próprio de instalação nesta etapa.

### Como testar offline

1. Execute `npm run build` e sirva a pasta `out/` com um servidor estático em HTTPS (ou use `localhost` para inspeção local); não use `next start`.
2. Abra a Home, crie/edite um relatório, visite a prévia e confirme o autosave.
3. Em DevTools, confira o Manifest, o worker `/sw.js` com escopo `/`, os assets em Cache Storage e os dados em IndexedDB.
4. Marque a rede como Offline e recarregue a Home, uma edição/prévia já visitada e `/relatorios/novo`; gere um PDF de um relatório salvo.

Durante o desenvolvimento, o provider desativa o worker. Caso tenha testado uma build de produção no mesmo host, remova o registro em DevTools → Application → Service Workers e limpe os caches em DevTools → Application → Storage antes de voltar ao modo de desenvolvimento.

Não há backend, API, sincronização, background sync, notificações push, analytics, telemetria ou Web Share nesta etapa.

O projeto utiliza TypeScript, SCSS Modules e as dependências `dexie`, `pdf-lib`, `sass`, `typescript`, `@types/react` e `@types/node`. A geração fica isolada em `src/lib/pdf/`. Os estilos globais ficam em `src/app/globals.scss`; os estilos da página e do Header usam SCSS Modules, junto aos respectivos componentes.
