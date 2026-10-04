# Notchficator.app

Site responsivo em português brasileiro, com ícone oficial, vídeo ilustrativo original e demonstrações interativas do notch. HTML, CSS e JavaScript sem dependências de produção. Os arquivos publicados estão em `dist/`.

## Prévia local

Execute `npm run dev` e abra http://127.0.0.1:4173. Para conferir a sintaxe, execute `npm run check`.

## Download da última versão

Os botões usam o endereço real `https://github.com/Benfic4rthur/notchficator-Releases/releases/latest/download/Notchficator-Instalador.dmg`. O GitHub redireciona para o instalador da última release publicada. Cada nova release deve incluir o asset com o mesmo nome `Notchficator-Instalador.dmg`, além de eventuais arquivos com a versão no nome. A configuração fica em `dist/config.js`.

## Instalação

A seção de download inclui instruções expansíveis e informa que esta versão é de um desenvolvedor independente e ainda não tem assinatura da Apple. O comando fornecido pelo desenvolvedor já está em `installationCommand` em `dist/config.js` e aparece com um botão para copiar. A página orienta mover o app para Aplicativos, executar o comando no Terminal e informar a senha de administrador quando solicitada. O comando remove a marca de quarentena somente de `/Applications/Notchficator.app`. O site exibe e copia o comando como texto; não o executa.

## Hospedagem

O site público usa GitHub Pages, com publicação automática a partir de `main` pela ação `.github/workflows/pages.yml`. O workflow confere o JavaScript e publica apenas `dist/`. O domínio personalizado configurado é `notchficator.app`, com HTTPS e DNS mantido na Hostinger.

DNS: quatro registros A para `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. O CNAME de `www` aponta para `benfic4rthur.github.io`.

## Demonstrações

As cenas são reconstruções ilustrativas, identificadas na página. O mini vídeo é um loop original de paisagem, sem áudio. Ao clicar na prévia, a janela de origem aparece e a mídia do notch se recolhe. Ao voltar ao trabalho, ela reaparece. O player complementar expande ao passar o mouse ou tocar, e oferece anterior, próximo, pausa e progresso, com troca entre vídeo e três músicas fornecidas pelo usuário. Avisos de volume, brilho, AirPods, bateria e Foco aparecem por alguns segundos e também podem ser acionados pelo botão Avisos. O site respeita a preferência do sistema por movimento reduzido.

O ícone do Notchficator na dock abre uma reconstrução das preferências, com cabeçalho e rodapé fixos, conteúdo rolável, switches e seleção Capa/Vídeo ao vivo. Essas opções só mudam o estado visual da prévia; não alteram o computador nem solicitam autorizações reais. A janela é identificada como demonstração ilustrativa.

A aparência do notch é baseada nas referências do aplicativo enviadas pelo usuário. As capturas originais com conteúdo pessoal não são publicadas.

## Músicas reais

Mountain Pulse, Sunlit Sway e Morning Ripples foram integradas com suas capas originais, extraídas dos MP3. Os arquivos completos permanecem em `dist/assets/`. A configuração está em `dist/config.js`. Para cada faixa, preencha `title`, `artist`, `cover` e `audioUrl`. Hospede os MP3 em `dist/assets/` e use caminhos como `assets/minha-musica.mp3`. O site mede a duração real, permite buscar no progresso, pausar e trocar de faixa. As músicas só começam depois de um clique em play; a troca de faixa mantém a reprodução depois desse consentimento inicial. Antes dos arquivos chegarem, a interface identifica as capas como prévias sem áudio. Use apenas músicas com autorização de uso no site.

O botão de som na barra superior do Mac da demonstração abre um controle de volume de 0 a 100%. Essa escala corresponde a `audio.volume` de 0 a 0,5: no máximo, metade do volume atual do aparelho. O ajuste inicial é 2% na escala, preservando o volume de reprodução de 1%. O volume escolhido continua ao trocar de faixa e pausar; o controle funciona também com toque e teclado. As barras respondem ao áudio da própria demonstração, sem acesso ao microfone.

A apresentação começa no mini vídeo ilustrativo. A navegação também inclui as três músicas fornecidas, que podem ser selecionadas pelo botão Música ou pelo próximo do player.

## Repositório

Fonte completa em https://github.com/Benfic4rthur/notchficator-site. A publicação é automática ao atualizar `main`. O projeto não exige instalação de dependências para servir a página.
