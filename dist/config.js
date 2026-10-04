// Configuração do instalador, comando de instalação e músicas da demonstração.
// Use o endereço real HTTPS ou o caminho de um arquivo hospedado junto ao site.
// Sem downloadUrl, os botões exibem o aviso de indisponibilidade.
// Sem audioUrl, as faixas são identificadas como prévias ilustrativas sem áudio.
window.NOTCHFICATOR_CONFIG = Object.freeze({
  downloadUrl: "",
  // Comando de instalação validado, exibido e copiado como texto. Nunca é executado pelo site.
  installationCommand: "",
  tracks: [
    { title: "Mountain Pulse", duration: 204.22, description: "Entre picos e céu aberto.", cover: "assets/cover-mountains.jpg", audioUrl: "assets/mountain-pulse.mp3" },
    { title: "Sunlit Sway", duration: 200.02, description: "Um pouco de sol. Um pouco de mar.", cover: "assets/cover-beach.jpg", audioUrl: "assets/sunlit-sway.mp3" },
    { title: "Morning Ripples", duration: 195.65, description: "Calma à beira do lago.", cover: "assets/cover-lake.jpg", audioUrl: "assets/morning-ripples.mp3" }
  ]
});
