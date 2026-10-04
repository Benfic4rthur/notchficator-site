# Notchficator.app

Site responsivo em português brasileiro, com ícone oficial, vídeo ilustrativo original e demonstrações interativas do notch. HTML, CSS e JavaScript sem dependências de produção. Os arquivos publicados estão em `dist/`.

## Prévia local

Execute `npm run dev` e abra http://127.0.0.1:4173. Para conferir a sintaxe, execute `npm run check`.

## Ativar o download

Em `dist/config.js`, preencha `downloadUrl` com o endereço HTTPS real do instalador. Todos os botões passam a apontar para esse endereço. Também é possível hospedar o instalador em `dist/` e usar seu caminho, como `/downloads/Notchficator.dmg`, quando o arquivo real existir.

Enquanto o endereço estiver vazio, os botões abrem uma mensagem informando que o instalador ainda não está disponível. Nenhum link de download é inventado e nenhum e-mail é coletado.

## Hospedagem

O site pode ser servido por qualquer hospedagem estática usando `dist/`. A primeira publicação de revisão usa Sites com acesso privado. O domínio exibido é Notchficator.app; conectar esse domínio e torná-lo público são configurações de lançamento separadas.

## Demonstrações

As cenas são reconstruções ilustrativas, identificadas na página. O mini vídeo é um loop original de paisagem, sem áudio. Ao clicar na prévia, a janela de origem aparece e a mídia do notch se recolhe. Ao voltar ao trabalho, ela reaparece. O player complementar expande ao passar o mouse ou tocar, e oferece anterior, próximo, pausa e progresso, com troca entre vídeo e três músicas fornecidas pelo usuário. Avisos de volume, brilho, AirPods, bateria e Foco aparecem por alguns segundos e também podem ser acionados pelo botão Avisos. O site respeita a preferência do sistema por movimento reduzido.

A aparência do notch é baseada nas referências do aplicativo enviadas pelo usuário. As capturas originais com conteúdo pessoal não são publicadas.

## Músicas reais

Mountain Pulse, Sunlit Sway e Morning Ripples foram integradas com suas capas originais, extraídas dos MP3. Os arquivos completos permanecem em `dist/assets/`. A configuração está em `dist/config.js`. Para cada faixa, preencha `title`, `artist`, `cover` e `audioUrl`. Hospede os MP3 em `dist/assets/` e use caminhos como `assets/minha-musica.mp3`. O site mede a duração real, permite buscar no progresso, pausar e trocar de faixa. As músicas só começam depois de um clique em play; a troca de faixa mantém a reprodução depois desse consentimento inicial. Antes dos arquivos chegarem, a interface identifica as capas como prévias sem áudio. Use apenas músicas com autorização de uso no site.

O volume das músicas fica fixo em 1% do volume atual do aparelho. Não há ajuste de volume no site; o visitante pode pausar a reprodução. As barras respondem ao áudio da própria demonstração, sem acesso ao microfone.

A apresentação começa no mini vídeo ilustrativo. A navegação também inclui as três músicas fornecidas, que podem ser selecionadas pelo botão Música ou pelo próximo do player.

## Repositório

Fonte completa em https://github.com/Benfic4rthur/notchficator-site. Na hospedagem escolhida, publique o diretório `dist/`. O projeto não exige instalação de dependências para servir a página. O domínio Notchficator.app pode ser conectado nessa hospedagem pelo proprietário.
