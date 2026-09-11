# AGENTS.md

## 1. Objetivo do projeto

Este projeto é uma aplicação de **Relatório Fotográfico para obras da construção civil**.

O sistema será utilizado principalmente para registrar fotograficamente serviços terceirizados executados em obras.

O uso não é extremamente frequente, portanto o projeto deve permanecer:

- simples;
- profissional;
- rápido;
- fácil de utilizar;
- fácil de manter;
- responsivo;
- sem complexidade desnecessária de infraestrutura.

O sistema deve funcionar bem tanto em:

- celulares;
- tablets;
- notebooks;
- desktops.

Celular e notebook devem ser tratados como plataformas principais, sem priorizar um em detrimento do outro.

---

## 2. Stack principal

Utilizar:

- Next.js
- App Router
- TypeScript
- React
- SCSS Modules
- ESLint

Evitar Tailwind CSS.

Sempre priorizar recursos nativos do Next.js, React e navegador antes de adicionar bibliotecas externas.

---

## 3. Arquitetura inicial

A aplicação deve ser inicialmente:

- client-side quando possível;
- sem API própria;
- sem banco de dados remoto;
- sem dependência obrigatória de servidor backend;
- preparada para hospedagem simples;
- preparada para funcionar como PWA;
- offline-first.

A persistência local deve utilizar:

- IndexedDB para relatórios, fotos e dados estruturados;
- localStorage apenas para preferências simples, caso necessário.

É permitido utilizar uma biblioteca leve como Dexie para facilitar o uso da IndexedDB.

---

## 4. Princípio de simplicidade

Não transformar o projeto em:

- ERP;
- sistema completo de gestão de obras;
- sistema de gerenciamento de equipes;
- sistema financeiro;
- plataforma corporativa complexa.

A finalidade principal é:

1. preencher os dados do serviço;
2. adicionar fotografias;
3. organizar as fotografias;
4. inserir descrições;
5. salvar localmente;
6. visualizar o relatório;
7. gerar PDF;
8. compartilhar ou salvar o PDF.

Evitar implementar funcionalidades que não tragam benefício claro para esse fluxo.

---

## 5. Funcionamento offline

O sistema deve ser projetado desde o início para funcionar offline.

Depois que a PWA estiver instalada ou carregada pelo menos uma vez, o usuário deve conseguir:

- abrir a aplicação;
- criar relatório;
- editar relatório;
- tirar fotografias;
- selecionar fotografias existentes;
- salvar relatório;
- visualizar relatório;
- gerar PDF;

mesmo sem conexão com a internet.

Nenhuma função principal do relatório pode depender obrigatoriamente de API externa.

---

## 6. PWA

O projeto deverá ser preparado para funcionar como Progressive Web App.

Objetivos:

- instalação no celular;
- instalação no Windows;
- funcionamento offline;
- abertura semelhante a aplicativo;
- ícone próprio;
- manifest;
- service worker;
- cache controlado dos assets necessários.

Não implementar a PWA de forma improvisada.

Verificar compatibilidade com a versão atual do Next.js antes de escolher bibliotecas ou estratégias.

### Implementação atual de PWA

O projeto é publicado como exportação estática do Next.js (`output: "export"`) em Apache, sem runtime Node.js/Next.js em produção. A implementação atual utiliza `@serwist/next` e `serwist` no build de produção com Webpack para gerar o service worker físico `public/sw.js`, copiado para `out/sw.js`. O provider o registra em `/sw.js` com escopo `/`.

### Versionamento

`package.json` → `version` é a fonte única da versão. O build expõe esse valor como `NEXT_PUBLIC_APP_VERSION`, e os componentes devem reutilizar `APP_VERSION` de `src/lib/app-version.ts`; não duplicar a versão em componentes, configurações ou `.env`.

- Cache Storage deve conter somente app shell, assets estáticos e rotas HTTP necessárias ao fluxo offline.
- Relatórios, fotografias e blobs continuam exclusivamente na IndexedDB; não duplicar fotos no Cache Storage.
- Não ativar o service worker em desenvolvimento e não forçar recarga automática quando houver atualização; a ativação pode ocorrer sem recarregar a página em uso.
- Publicar todo o conteúdo de `out/`, inclusive `.htaccess`. O Apache deve ter `mod_rewrite`, `mod_headers` e `AllowOverride FileInfo` para servir rotas estáticas sem extensão e os cabeçalhos do worker.
- Relatórios existentes usam páginas físicas estáticas com identificador na query string: `/relatorios/editar?id=<id>` e `/relatorios/preview?id=<id>`. Não recriar rotas dinâmicas baseadas no ID sem avaliar a compatibilidade com a exportação estática.
- As transições entre Home, novo, edição e prévia utilizam navegação HTML nativa, evitando navegação RSC do App Router incompatível com o static export do Next.js 16 em Apache.
- A rota de precache do service worker deve normalizar essas navegações de documento, incluindo barra final e `?id=`, para as entradas canônicas antes do runtime cache; o fallback `/~offline` é reservado a páginas fora desse fluxo.

---

## 7. Responsividade

O projeto deve ser mobile-first, mas notebook e desktop também são plataformas principais.

A interface não deve ser apenas uma versão reduzida do desktop.

Comportamentos esperados:

### Mobile

Priorizar:

- botões grandes;
- controles fáceis de tocar;
- uma coluna;
- ações de câmera;
- galeria;
- formulário simples;
- boa leitura.

### Tablet

Adaptar o número de colunas conforme espaço disponível.

### Notebook/Desktop

Aproveitar melhor a largura da tela:

- grids;
- múltiplas colunas;
- drag and drop;
- visualização ampliada;
- melhor organização dos campos.

Evitar breakpoints excessivos.

---

## 8. Relatórios

Cada relatório deve possuir inicialmente informações como:

- id;
- nome da obra;
- empresa terceirizada;
- responsável;
- data;
- descrição do serviço;
- status;
- data de criação;
- data da última alteração.

Também deve possuir `photoLayout`, com valores `landscape` (padrão) ou `portrait`. A escolha é manual para todo o relatório: não detectar automaticamente a orientação de cada foto. A paginação depende do formato: Horizontal comporta 4 fotos na primeira página e 6 nas seguintes; Vertical, 2 e 4 respectivamente. Relatórios legados sem esse campo devem assumir `landscape`.

Exemplo de tipo:

```ts
export type ReportStatus = 'draft' | 'finished';

export interface Report {
  id: string;
  workName: string;
  contractor: string;
  responsible: string;
  serviceDate: string;
  serviceDescription: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
```

Os nomes finais das propriedades podem evoluir, mas devem permanecer consistentes no projeto.

---

## 9. Fotografias

As fotos fazem parte de um relatório.

Cada foto deve possuir, no mínimo:

- id;
- reportId;
- arquivo/blob;
- ordem;
- descrição;
- data de criação.

Exemplo:

```ts
export interface ReportPhoto {
  id: string;
  reportId: string;
  blob: Blob;
  description: string;
  order: number;
  createdAt: string;
}
```

As fotos devem preferencialmente ser armazenadas separadamente do objeto principal do relatório na IndexedDB.

---

## 10. Captura de fotografias

O sistema deve oferecer duas opções claramente separadas:

### Tirar foto

No celular, utilizar preferencialmente a câmera traseira através de recurso nativo do navegador.

Exemplo:

```html
<input
  type="file"
  accept="image/*"
  capture="environment"
/>
```

### Selecionar fotos

Permitir:

- selecionar uma imagem;
- selecionar várias imagens;
- abrir a galeria no celular;
- abrir o explorador de arquivos no notebook;
- utilizar câmera ou arquivos conforme o contexto do dispositivo.

Exemplo:

```html
<input
  type="file"
  accept="image/*"
  multiple
/>
```

Os inputs nativos podem ficar visualmente ocultos e ser acionados por botões próprios da interface.

Não implementar câmera customizada usando `getUserMedia()` inicialmente, a menos que exista necessidade real.

---

## 11. Tratamento de imagens

Não armazenar automaticamente as fotos originais de celulares em resolução total.

Antes de armazenar a imagem:

1. validar o arquivo;
2. corrigir orientação quando necessário;
3. redimensionar;
4. comprimir;
5. gerar versão adequada para relatório.

Objetivo inicial sugerido:

- dimensão máxima entre 1600 e 1920 px;
- qualidade aproximada entre 80% e 85%.

Esses valores devem ser centralizados em uma configuração.

Não espalhar números mágicos pelo código.

Preservar a proporção das imagens.

Nunca deformar uma fotografia apenas para preencher uma área.

Evitar processamento desnecessário de imagens já pequenas.

Quando possível, realizar o processamento localmente no navegador, sem envio para servidor.

---

## 12. IndexedDB

A IndexedDB será o armazenamento principal da aplicação.

Separar entidades quando fizer sentido, por exemplo:

- reports;
- reportPhotos;
- settings.

Evitar armazenar toda a aplicação em um único objeto.

Criar uma camada de abstração para acesso ao banco.

Exemplo de organização:

```text
src/
  lib/
    db/
      database.ts
      reports.ts
      photos.ts
      settings.ts
```

Os componentes React não devem acessar IndexedDB diretamente de forma desorganizada.

Pode ser utilizada uma biblioteca leve como Dexie para simplificar o acesso à IndexedDB.

Antes de adicionar a dependência, verificar compatibilidade com a versão atual do projeto.

---

## 13. Autosave

Relatórios em edição devem possuir salvamento automático local.

Evitar depender exclusivamente de botão "Salvar".

Utilizar debounce quando necessário.

Exemplo de comportamento:

1. usuário altera um campo;
2. aguarda pequeno intervalo;
3. os dados são persistidos na IndexedDB;
4. a interface informa o estado de salvamento.

Exibir estados claros:

- salvando;
- salvo;
- erro ao salvar.

Não salvar diretamente a cada tecla pressionada sem controle.

Caso ocorra erro de persistência, informar claramente ao usuário.

---

## 14. Status do relatório

Inicialmente utilizar:

- `draft`
- `finished`

Um relatório pode permanecer como rascunho enquanto estiver sendo preparado.

Somente marcar como finalizado quando o usuário confirmar ou gerar a versão final, conforme fluxo definido.

Evitar criar múltiplos status sem necessidade real.

---

## 15. Ordem das fotos

O usuário deve poder organizar a ordem das fotografias.

No desktop:

- drag and drop pode ser utilizado.

No mobile:

- utilizar solução que funcione corretamente com touch.

Não escolher biblioteca de drag and drop sem verificar:

- peso;
- manutenção;
- compatibilidade;
- suporte mobile;
- suporte a touch;
- acessibilidade.

Se uma solução nativa ou simples atender ao requisito, preferi-la.

---

## 16. PDF

A geração de PDF deve acontecer localmente no navegador.

Não enviar fotografias para servidor apenas para gerar PDF.

O PDF deve possuir aparência profissional e adequada ao contexto de construção civil.

Deve incluir:

- identidade visual da empresa;
- título do relatório;
- dados da obra;
- empresa terceirizada;
- responsável;
- data;
- descrição do serviço;
- fotografias;
- identificação das fotos;
- descrição individual;
- paginação;
- rodapé.

As fotos devem manter proporção.

Evitar PDFs excessivamente grandes.

A solução de PDF deve ser isolada em:

```text
src/lib/pdf/
```

Não misturar lógica de geração de PDF diretamente nos componentes de interface.

Sempre considerar:

- tamanho final do arquivo;
- qualidade visual;
- uso de memória;
- performance em celular;
- quantidade de fotos;
- quebra de página;
- orientação;
- margens;
- legibilidade.

---

## 17. Compartilhamento

Quando suportado pelo dispositivo, considerar Web Share API para compartilhar o PDF.

Exemplo:

```ts
navigator.share()
```

Sempre possuir fallback para download do PDF.

O sistema não deve depender da Web Share API para funcionar.

No desktop, disponibilizar download do PDF.

No mobile, permitir compartilhamento quando o navegador oferecer suporte.

---

## 18. Interface

A aplicação deve transmitir aspecto:

- profissional;
- técnico;
- limpo;
- corporativo;
- adequado à construção civil.

Evitar:

- visual infantil;
- excesso de animações;
- efeitos decorativos sem função;
- gradientes exagerados;
- glassmorphism excessivo;
- interfaces carregadas;
- elementos visuais que reduzam a legibilidade.

Priorizar:

- legibilidade;
- hierarquia;
- contraste;
- estados claros;
- espaços consistentes;
- feedback visual;
- facilidade de uso;
- velocidade de operação.

A interface deve funcionar bem tanto no celular quanto no notebook.

---

## 19. Acessibilidade

Sempre considerar:

- labels associados aos inputs;
- navegação por teclado;
- foco visível;
- contraste;
- `aria-*` quando realmente necessário;
- botões semanticamente corretos;
- mensagens de erro compreensíveis;
- áreas de toque adequadas no mobile.

Não utilizar `div` clicável quando um `button` for semanticamente correto.

Não remover outline de foco sem fornecer alternativa acessível.

---

## 20. Componentização

Criar componentes quando houver:

- reutilização real;
- responsabilidade própria;
- complexidade que justifique separação.

Evitar componentes excessivamente pequenos sem benefício.

Exemplos possíveis:

```text
components/
  Header/
  ReportForm/
  PhotoUploader/
  PhotoCard/
  ReportList/
  SaveStatus/
```

Não criar abstrações apenas por abstrair.

Evitar componentes gigantes com múltiplas responsabilidades.

---

## 21. SCSS

Utilizar SCSS Modules para estilos de componentes.

Exemplo:

```text
Component/
  index.tsx
  styles.module.scss
```

Manter estilos globais apenas para:

- reset;
- tokens;
- tipografia base;
- body;
- elementos realmente globais.

Evitar classes globais desnecessárias.

Evitar duplicação de estilos.

---

## 22. Tokens visuais

Valores recorrentes devem ser centralizados quando fizer sentido:

- cores;
- espaçamentos;
- border-radius;
- sombras;
- breakpoints;
- largura máxima;
- tamanhos de fonte recorrentes.

Evitar números mágicos repetidos.

Não exagerar na criação de design system se o projeto ainda for pequeno.

---

## 23. TypeScript

Não utilizar `any` sem justificativa.

Preferir:

- tipos explícitos;
- interfaces;
- unions;
- generics quando realmente necessários.

Evitar type assertions desnecessárias.

Tipos compartilhados devem ficar preferencialmente em:

```text
src/types/
```

Evitar duplicação de tipos em componentes diferentes.

Manter contratos de dados consistentes em toda a aplicação.

---

## 24. Validação

Os formulários devem possuir validação consistente.

Pode ser utilizada uma solução como:

- React Hook Form;
- Zod.

Não adicionar bibliotecas antes de avaliar necessidade.

Mensagens de erro devem ser claras para o usuário.

Validar no mínimo:

- campos obrigatórios;
- formatos esperados;
- tamanho de arquivos;
- tipos de imagem suportados.

Evitar validações contraditórias entre interface e persistência.

---

## 25. Dependências

Antes de instalar nova dependência:

1. verificar se realmente é necessária;
2. verificar se existe solução nativa simples;
3. verificar manutenção do pacote;
4. verificar tamanho;
5. verificar compatibilidade com Next.js atual;
6. verificar compatibilidade com navegador mobile;
7. verificar impacto no bundle;
8. verificar se a dependência é realmente mantida.

Não adicionar biblioteca grande para resolver funcionalidade pequena.

Sempre informar quando uma nova dependência for adicionada.

Atualizar o README.md quando a dependência introduzir informação relevante de arquitetura, instalação ou uso.

---

## 26. Estrutura sugerida

Manter uma organização semelhante a:

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.scss
│   │
│   ├── relatorios/
│   │   ├── novo/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   └── configuracoes/
│       └── page.tsx
│
├── components/
│
├── lib/
│   ├── db/
│   ├── images/
│   └── pdf/
│
├── types/
│
└── styles/
```

A estrutura pode evoluir conforme necessidade real.

Não criar dezenas de diretórios antecipadamente.

Não alterar a estrutura existente sem justificativa técnica.

---

## 27. Performance

Sempre considerar especialmente:

- tamanho do bundle;
- processamento de imagens;
- memória ao manipular várias fotos;
- geração do PDF;
- carregamento mobile;
- IndexedDB;
- PWA.

Evitar manter múltiplas versões grandes da mesma fotografia em memória.

Liberar Object URLs quando não forem mais necessários:

```ts
URL.revokeObjectURL()
```

Evitar memory leaks.

Evitar reprocessar imagens sem necessidade.

Evitar carregar bibliotecas pesadas na página inicial quando puderem ser carregadas sob demanda.

Considerar lazy loading quando realmente fizer diferença.

---

## 28. Segurança

O projeto inicialmente trabalha majoritariamente com dados locais.

Mesmo assim:

- validar uploads;
- aceitar apenas formatos esperados;
- limitar tamanhos quando necessário;
- evitar executar conteúdo externo;
- sanitizar conteúdo quando aplicável.

Nunca confiar apenas na extensão do arquivo.

Validar MIME type quando possível.

Não inserir HTML vindo de entrada do usuário sem sanitização.

---

## 29. Privacidade

Como as fotos são de obras, preferir processamento local.

Por padrão:

- fotografias não devem ser enviadas para servidor;
- relatórios não devem ser enviados automaticamente;
- dados permanecem no dispositivo.

Se futuramente existir sincronização em nuvem, isso deve ser uma decisão arquitetural explícita.

Não adicionar telemetria, analytics ou upload automático sem solicitação.

---

## 30. PWA e modo offline

O sistema deve ser preparado para funcionar como PWA.

Objetivos:

- instalação no celular;
- instalação no notebook;
- instalação no Windows;
- funcionamento offline;
- carregamento rápido;
- abertura semelhante a aplicativo.

Depois do primeiro carregamento ou instalação, o usuário deve conseguir, mesmo sem internet:

- abrir o sistema;
- criar relatório;
- editar relatório;
- tirar fotos;
- selecionar fotos;
- salvar localmente;
- visualizar dados;
- gerar PDF.

O modo offline deve ser considerado parte central da arquitetura.

Não introduzir dependência obrigatória de API externa para o fluxo principal.

Verificar compatibilidade da estratégia PWA com a versão atual do Next.js antes de implementar.

---

## 31. README.md

O README.md faz parte obrigatória da manutenção do projeto.

Sempre que uma alteração introduzir informação relevante, atualizar o README.md.

Considerar relevante:

- nova funcionalidade;
- alteração importante de arquitetura;
- nova dependência;
- nova configuração;
- variável de ambiente;
- alteração no processo de execução;
- alteração no build;
- alteração no funcionamento offline;
- alteração na PWA;
- alteração na IndexedDB;
- alteração na geração de PDF;
- nova estrutura de pastas importante;
- decisão técnica relevante;
- instrução necessária para outro desenvolvedor;
- mudança significativa no fluxo do usuário.

Não atualizar o README por mudanças triviais de:

- margem;
- cor;
- texto pequeno;
- ajuste isolado de CSS;
- correções que não alteram entendimento do projeto.

O README deve permanecer objetivo, técnico e atualizado.

---

## 32. Antes de alterar código

Antes de implementar uma solicitação:

1. analisar os arquivos relacionados;
2. entender a implementação atual;
3. identificar impactos;
4. verificar se já existe componente ou utilitário reutilizável;
5. evitar duplicação;
6. verificar este AGENTS.md;
7. preservar funcionalidades existentes;
8. verificar se a mudança afeta mobile;
9. verificar se a mudança afeta desktop;
10. verificar se a mudança afeta offline.

Não alterar arquivos não relacionados sem necessidade.

Não fazer refatorações grandes apenas por preferência pessoal.

---

## 33. Durante a implementação

Ao implementar:

- fazer alterações focadas;
- preservar padrões existentes;
- evitar refatorações grandes não solicitadas;
- não remover funcionalidades sem justificativa;
- não alterar contratos existentes silenciosamente;
- manter tipagem;
- manter responsividade;
- considerar mobile e desktop;
- considerar funcionamento offline;
- manter o código simples;
- evitar duplicação;
- evitar overengineering.

Se identificar problema fora do escopo, informar ao final sem necessariamente corrigir, a menos que seja necessário para a tarefa.

---

## 34. Depois da implementação

Ao terminar uma tarefa:

1. revisar os arquivos alterados;
2. verificar TypeScript;
3. verificar lint;
4. verificar imports;
5. verificar possíveis erros de runtime;
6. verificar mobile;
7. verificar desktop;
8. verificar impacto offline quando aplicável;
9. atualizar README.md se houver informação relevante;
10. informar objetivamente o que foi alterado.

Sempre que possível executar:

```bash
npm run lint
```

e:

```bash
npm run build
```

Se existirem testes automatizados relacionados à alteração, executá-los.

Se algum comando não puder ser executado, informar claramente.

Não afirmar que uma validação passou sem realmente executá-la.

---

## 35. Resposta final do Codex

Ao concluir uma tarefa, responder de forma objetiva contendo:

### Alterações realizadas

Lista resumida dos pontos implementados.

### Arquivos principais alterados

Informar arquivos relevantes.

### Validação

Informar:

- lint;
- build;
- testes executados;
- validações manuais relevantes.

### README

Informar se o README.md foi atualizado e por quê.

Se não houve necessidade:

> README.md não alterado: a mudança não introduziu informação relevante de arquitetura, configuração ou uso.

### Observações

Informar apenas:

- riscos;
- limitações;
- incompatibilidades;
- próximos passos realmente relevantes.

Evitar respostas excessivamente longas.

---

## 36. Não fazer sem solicitação

Não implementar por iniciativa própria:

- autenticação;
- API;
- banco remoto;
- Supabase;
- Firebase;
- servidor Node;
- VPS;
- Docker;
- sistema multiusuário;
- sincronização em nuvem;
- dashboard complexo;
- ERP de obra;
- notificações push;
- geolocalização obrigatória;
- câmera customizada;
- funcionalidades administrativas extensas.

Essas funcionalidades só devem ser adicionadas após decisão explícita.

---

## 37. Evolução futura

A arquitetura deve permitir evolução futura, mas sem implementar antecipadamente.

Possibilidades futuras:

- sincronização;
- armazenamento em nuvem;
- usuários;
- compartilhamento centralizado;
- cadastro de obras;
- histórico corporativo;
- assinatura;
- relatórios adicionais;
- empacotamento desktop.

Preparar o código para evolução não significa implementar essas funcionalidades agora.

Evitar criar interfaces, serviços ou abstrações para recursos futuros que ainda não existem.

---

## 38. Regra principal

Sempre escolher a solução:

> mais simples, robusta e sustentável que atenda corretamente ao requisito atual.

Evitar overengineering.

Priorizar:

- manutenção simples;
- boa experiência de uso;
- funcionamento offline;
- compatibilidade entre celular e notebook;
- qualidade do relatório;
- baixo custo de infraestrutura;
- código previsível e bem organizado.
