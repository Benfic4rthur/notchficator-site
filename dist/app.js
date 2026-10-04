(() => {
  "use strict";
  const videos = [...document.querySelectorAll(".demo-video")];
  const primaryVideo = videos[0];
  const featureVideo = document.querySelector(".feature-video");
  const sourceVideo = document.querySelector(".source-video");
  const sourceMusic = document.querySelector(".source-music");
  const audio = document.querySelector("#demo-audio");
  audio.preload = "none";
  audio.volume = 0.01;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const player = document.querySelector('[data-player="secondary"]');
  const trigger = player.querySelector(".player-trigger");
  const expandedPanel = document.querySelector("#expanded-player");
  const heroNotch = document.querySelector('[data-player="hero"]');
  const sourceWindow = document.querySelector(".source-window");
  const announcement = document.querySelector("#demo-announcement");
  const progress = document.querySelector("#demo-progress");
  const downloadDialog = document.querySelector("#download-dialog");
  const settingsDialog = document.querySelector("#settings-dialog");
  const settingsTrigger = document.querySelector("#dock-settings");
  const smallScreen = window.matchMedia("(max-width: 700px)");
  const configuredTracks = window.NOTCHFICATOR_CONFIG?.tracks || [];
  const tracks = [
    { title: "Entre montanhas e mar", subtitle: "Vídeo de demonstração", cover: "assets/coast.jpg", kind: "video", duration: 8 },
    ...configuredTracks.map(track => ({ ...track, kind: "music", duration: track.duration || 60 }))
  ];
  let pinned = false;
  let playing = !motionPreference.matches;
  let sourceActive = false;
  let trackIndex = 0;
  let illustrationTime = 0;
  let audioUnlocked = false;
  let lastDownloadTrigger;
  let noticeTimer;
  let noticeIndex = 0;
  let pendingSeek = null;
  let audioContext, analyser, spectrum, audioSource;
  let reactiveFrame;
  let playRequest = 0;

  function safeUrl(value) {
    try {
      const configured = value?.trim();
      if (!configured) return "";
      const url = new URL(configured, window.location.href);
      return url.protocol === "https:" || (url.origin === window.location.origin && url.protocol === "http:") ? url.href : "";
    } catch { return ""; }
  }
  function currentTrack() { return tracks[trackIndex]; }
  function isMusic() { return currentTrack().kind === "music"; }
  function hasAudio() { return isMusic() && Boolean(safeUrl(currentTrack().audioUrl)); }
  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  function expandPlayer(expanded) {
    player.classList.toggle("is-expanded", expanded);
    trigger.setAttribute("aria-expanded", String(expanded));
    trigger.setAttribute("aria-label", `${expanded ? "Recolher" : "Expandir"} player de demonstração`);
    expandedPanel.inert = !expanded;
  }
  function setPlaying(value, userInitiated = false) {
    if (userInitiated && value) audioUnlocked = true;
    const requestId = ++playRequest;
    const expectedTrack = trackIndex;
    playing = value;
    document.body.classList.toggle("demo-paused", !value);
    videos.forEach(video => {
      video.autoplay = false;
      if (value && !isMusic() && (video !== sourceVideo || sourceActive) && !document.hidden) {
        video.play().catch(error => { if (error.name !== "AbortError" && requestId === playRequest && video === primaryVideo && !isMusic()) setPlaying(false); });
      } else video.pause();
    });
    if (hasAudio() && value && audioUnlocked && !document.hidden) {
      startAudioAnalysis();
      audio.play().catch(error => {
        if (error.name === "AbortError" || requestId !== playRequest || expectedTrack !== trackIndex) return;
        setPlaying(false);
        announcement.textContent = "Não foi possível reproduzir esta faixa. Tente novamente.";
      });
    } else { audio.pause(); stopAudioAnalysis(); }
    document.querySelectorAll(".play-toggle").forEach(button => {
      button.setAttribute("aria-label", `${value ? "Pausar" : "Reproduzir"} demonstração`);
      button.querySelector("use").setAttribute("href", value ? "#i-pause" : "#i-play");
    });
  }
  function mediaTime() { return isMusic() ? (hasAudio() ? audio.currentTime : illustrationTime) : primaryVideo.currentTime; }
  function mediaDuration() {
    const measured = isMusic() ? (hasAudio() ? audio.duration : currentTrack().duration) : primaryVideo.duration;
    return Number.isFinite(measured) && measured > 0 ? measured : currentTrack().duration;
  }
  function syncTime() {
    const duration = mediaDuration();
    const time = mediaTime() || 0;
    document.querySelectorAll(".elapsed").forEach(item => item.textContent = formatTime(time));
    document.querySelectorAll(".duration").forEach(item => item.textContent = formatTime(duration));
    progress.max = duration;
    if (document.activeElement !== progress) progress.value = time;
    const percent = `${Math.max(0, Math.min(100, (time / duration) * 100))}%`;
    progress.style.setProperty("--progress", percent);
    document.querySelector(".progress-track > span").style.width = percent;
  }
  function seek(time) {
    const bounded = Math.max(0, Math.min(mediaDuration(), time));
    if (isMusic()) {
      if (hasAudio()) {
        if (audio.readyState > 0) audio.currentTime = bounded;
        else { pendingSeek = bounded; if (audio.networkState !== HTMLMediaElement.NETWORK_LOADING) audio.load(); }
      } else illustrationTime = bounded;
    } else videos.forEach(video => { if (video.readyState > 0) video.currentTime = bounded; });
    syncTime();
  }
  function selectTrack(index, announce = true) {
    const wasPlaying = playing;
    clearNotice();
    audio.pause();
    trackIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    illustrationTime = 0;
    pendingSeek = null;
    const track = currentTrack();
    const music = isMusic();
    document.querySelectorAll(".hero-track strong,.track-row strong,.source-music strong").forEach(item => item.textContent = track.title);
    const subtitle = music ? (hasAudio() ? track.description || track.artist || "Música de demonstração" : "Prévia ilustrativa · sem áudio") : track.subtitle;
    document.querySelectorAll(".hero-track > span,.track-row > div > span,.source-music > span").forEach(item => item.textContent = subtitle);
    document.querySelectorAll(".mini-cover,.track-row img,.source-music img").forEach(image => {
      image.src = safeUrl(track.cover) || "assets/coast.jpg";
      image.alt = music ? `Capa ilustrativa de ${track.title}` : "Paisagem do vídeo ilustrativo";
    });
    document.querySelectorAll(".mini-cover").forEach(image => image.hidden = !music);
    document.querySelectorAll(".mini-preview video,.small-preview video").forEach(video => video.hidden = music);
    sourceVideo.hidden = music;
    sourceMusic.hidden = !music;
    document.querySelector(".source-window .window-topbar > span").textContent = track.title;
    document.querySelector("#desktop-status-text").textContent = sourceActive ? "Na origem, o notch se recolhe." : music ? "Sua música, por perto." : "Seu vídeo, em segundo plano.";
    audio.removeAttribute("src");
    if (hasAudio()) audio.src = safeUrl(track.audioUrl);
    else audio.load();
    if (!music) seek(0);
    const shouldPlay = hasAudio() ? wasPlaying && audioUnlocked : wasPlaying;
    setPlaying(shouldPlay);
    document.querySelectorAll(".demo-option").forEach(button => {
      const active = button.dataset.demo === (music ? "music" : "video");
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    syncTime();
    if (announce) announcement.textContent = `Demonstração: ${track.title}. ${subtitle}.`;
  }
  function setSourceVisible(visible) {
    clearNotice();
    sourceActive = visible;
    sourceWindow.hidden = !visible;
    heroNotch.classList.toggle("source-active", visible);
    heroNotch.classList.remove("is-expanded");
    document.querySelector("#desktop-status-text").textContent = visible ? "Na origem, o notch se recolhe." : isMusic() ? "Sua música, por perto." : "Seu vídeo, em segundo plano.";
    announcement.textContent = visible ? "Demonstração: a janela de origem está em primeiro plano. A mídia no notch se esconde." : "Demonstração: outro aplicativo está em primeiro plano. A mídia reaparece no notch.";
    if (visible) {
      if (!isMusic()) {
        if (sourceVideo.readyState > 0) sourceVideo.currentTime = primaryVideo.currentTime;
        else sourceVideo.addEventListener("loadedmetadata", () => { sourceVideo.currentTime = primaryVideo.currentTime; }, { once: true });
        if (playing) sourceVideo.play().catch(() => {});
      }
      document.querySelector("#return-to-work").focus({preventScroll:true});
    } else {
      sourceVideo.pause();
      document.querySelector("#source-toggle").focus({preventScroll:true});
    }
  }
  const notices = [
    { icon:"volume", title:"Volume", description:"Ajuste no notch", value:"100%", level:100, layout:"hud" },
    { icon:"airpods", title:"AirPods Pro", description:"Conectado", value:"", level:null, layout:"device" },
    { icon:"airpods", title:"AirPods Pro", description:"Desconectado", value:"", level:null, layout:"device" },
    { icon:"brightness", title:"Brilho", description:"Ajuste no notch", value:"100%", level:100, layout:"hud" },
    { icon:"battery-level", title:"Bateria", description:"Alimentação desconectada", value:"80%", level:null, layout:"battery" },
    { icon:"lightning", title:"Bateria", description:"Alimentação conectada", value:"80%", level:null, layout:"battery" },
    { icon:"focus-on", title:"Foco", description:"Ativado", value:"On", level:null, layout:"focus" },
    { icon:"focus", title:"Foco", description:"Desativado", value:"Off", level:null, layout:"focus" }
  ];
  function clearNotice() {
    clearTimeout(noticeTimer);
    heroNotch.classList.remove("showing-notice", "device-notice", "focus-notice", "battery-notice", "hud-notice");
    const button = document.querySelector('[data-demo="notices"]');
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  }
  function showNotice(manual = false) {
    if (sourceActive) { if (!manual) return; setSourceVisible(false); }
    if (!manual && (heroNotch.matches(":hover") || heroNotch.contains(document.activeElement) || downloadDialog.open || settingsDialog?.open)) return;
    clearNotice();
    heroNotch.classList.remove("is-expanded");
    const notice = notices[noticeIndex++ % notices.length];
    heroNotch.classList.toggle("device-notice", notice.layout === "device");
    heroNotch.classList.toggle("focus-notice", notice.layout === "focus");
    heroNotch.classList.toggle("battery-notice", notice.layout === "battery");
    heroNotch.classList.toggle("hud-notice", notice.layout === "hud");
    const content = document.querySelector(".notch-notice-content");
    content.querySelector("use").setAttribute("href", `#i-${notice.icon}`);
    content.querySelector("strong").textContent = notice.title;
    content.querySelector(".notice-description").textContent = notice.description;
    content.querySelector(".notice-value").textContent = notice.value;
    content.querySelector(".notice-level").hidden = notice.level === null;
    content.querySelector(".notice-level > span").style.width = `${notice.level ?? 0}%`;
    const row = content.querySelector(".focus-media-row");
    row.querySelector("img").src = currentTrack().cover;
    row.querySelector("strong").textContent = currentTrack().title;
    row.querySelector("span").textContent = `${playing ? "Reproduzindo" : "Pausado"} · Demonstração`;
    row.querySelector("use").setAttribute("href", playing ? "#i-pause" : "#i-play");
    heroNotch.classList.add("showing-notice");
    const button = document.querySelector('[data-demo="notices"]');
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    if (manual) announcement.textContent = `Aviso ilustrativo: ${notice.title}. ${notice.description}. ${notice.value}`;
    noticeTimer = setTimeout(clearNotice, 2800);
  }
  player.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") expandPlayer(true); });
  player.addEventListener("pointerleave", event => { if (event.pointerType === "mouse" && !pinned && !player.contains(document.activeElement)) expandPlayer(false); });
  player.addEventListener("focusout", () => { requestAnimationFrame(() => { if (!pinned && !player.matches(":hover") && !player.contains(document.activeElement)) expandPlayer(false); }); });
  trigger.addEventListener("click", () => { pinned = !player.classList.contains("is-expanded"); expandPlayer(pinned); });
  player.addEventListener("keydown", event => { if (event.key === "Escape") { pinned = false; expandPlayer(false); trigger.focus(); } });
  heroNotch.addEventListener("pointerenter", event => { if (event.pointerType === "mouse" && !sourceActive) { clearNotice(); heroNotch.classList.add("is-expanded"); } });
  heroNotch.addEventListener("pointerleave", () => { if (!heroNotch.contains(document.activeElement)) heroNotch.classList.remove("is-expanded"); });
  heroNotch.addEventListener("focusin", () => { if (!sourceActive) { clearNotice(); heroNotch.classList.add("is-expanded"); } });
  heroNotch.addEventListener("focusout", () => { requestAnimationFrame(() => { if (!heroNotch.contains(document.activeElement)) heroNotch.classList.remove("is-expanded"); }); });
  document.querySelector("#source-toggle").addEventListener("click", () => setSourceVisible(true));
  document.querySelector("#return-to-work").addEventListener("click", () => setSourceVisible(false));
  document.querySelector("#work-button").addEventListener("click", () => setSourceVisible(false));
  sourceWindow.addEventListener("keydown", event => { if (event.key === "Escape") setSourceVisible(false); });
  document.querySelectorAll(".play-toggle").forEach(button => button.addEventListener("click", () => setPlaying(!playing, true)));
  document.querySelectorAll(".previous-track").forEach(button => button.addEventListener("click", () => selectTrack(trackIndex - 1)));
  document.querySelectorAll(".next-track").forEach(button => button.addEventListener("click", () => selectTrack(trackIndex + 1)));
  document.querySelectorAll(".demo-option").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.demo === "video") selectTrack(0);
    else if (button.dataset.demo === "music" && tracks.length > 1) { selectTrack(isMusic() ? trackIndex : 1); expandPlayer(true); pinned = true; }
    else if (button.dataset.demo === "notices") showNotice(true);
  }));
  progress.addEventListener("input", () => seek(Number(progress.value)));
  primaryVideo.addEventListener("timeupdate", () => { if (!isMusic()) syncTime(); });
  primaryVideo.addEventListener("loadedmetadata", syncTime);
  audio.addEventListener("timeupdate", syncTime);
  audio.addEventListener("loadedmetadata", () => {
    const resumeAfterSeek = pendingSeek !== null && playing && audioUnlocked;
    if (pendingSeek !== null) { audio.currentTime = Math.min(audio.duration, pendingSeek); pendingSeek = null; }
    syncTime();
    if (resumeAfterSeek) setPlaying(true);
  });
  audio.addEventListener("ended", () => selectTrack(trackIndex >= tracks.length - 1 ? 1 : trackIndex + 1));
  audio.addEventListener("error", () => {
    if (hasAudio()) { setPlaying(false); announcement.textContent = "Não foi possível carregar esta música."; }
  });
  primaryVideo.addEventListener("error", () => { if (!isMusic()) { setPlaying(false); document.querySelector("#desktop-status-text").textContent = "Prévia ilustrativa do notch."; } });
  motionPreference.addEventListener("change", event => { if (event.matches) setPlaying(false); else if (!hasAudio()) setPlaying(true); manageFeatureVideo(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { videos.forEach(video => video.pause()); audio.pause(); stopAudioAnalysis(); }
    else if (playing) setPlaying(true);
    manageFeatureVideo();
  });
  setInterval(() => {
    if (isMusic() && !hasAudio() && playing && !document.hidden) { illustrationTime = (illustrationTime + 0.25) % mediaDuration(); syncTime(); }
  }, 250);
  setInterval(() => { if (!motionPreference.matches && !document.hidden) showNotice(); }, 16000);
  setPlaying(playing);


  function stopAudioAnalysis() {
    cancelAnimationFrame(reactiveFrame);
    document.body.classList.remove("audio-reactive");
    document.querySelectorAll(".audio-bars i").forEach(bar => { bar.style.height = ""; });
  }
  function startAudioAnalysis() {
    try {
      if (!audioContext) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        audioContext = new Context();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
        spectrum = new Uint8Array(analyser.frequencyBinCount);
      }
      audioContext.resume().catch(() => {});
      cancelAnimationFrame(reactiveFrame);
      document.body.classList.add("audio-reactive");
      const draw = () => {
        if (!playing || !hasAudio() || document.hidden) { stopAudioAnalysis(); return; }
        analyser.getByteFrequencyData(spectrum);
        document.querySelectorAll(".audio-bars").forEach(group => {
          [...group.children].forEach((bar,index) => {
            const start = index * 5 + 1;
            let energy = 0;
            for (let i = start; i < start + 5; i++) energy += spectrum[i];
            bar.style.height = (3 + energy / (5 * 255) * 19) + "px";
          });
        });
        reactiveFrame = requestAnimationFrame(draw);
      };
      reactiveFrame = requestAnimationFrame(draw);
    } catch { stopAudioAnalysis(); }
  }

  function manageFeatureVideo() {
    if (!featureVideo) return;
    featureVideo.autoplay = false;
    if (motionPreference.matches || document.hidden) featureVideo.pause();
    else featureVideo.play().catch(() => {});
  }
  manageFeatureVideo();

  if (settingsDialog) {
    function openSettings() {
      if (settingsDialog.open) return;
      clearNotice();
      heroNotch.classList.remove("is-expanded");
      if (smallScreen.matches) settingsDialog.showModal();
      else settingsDialog.show();
      settingsTrigger.setAttribute("aria-expanded", "true");
      requestAnimationFrame(updateSettingsScrollbar);
      announcement.textContent = "Prévia ilustrativa das configurações do Notchficator. As opções alteram apenas esta janela.";
    }
    const settingsScroll = settingsDialog.querySelector(".settings-scroll");
    const settingsTrack = settingsDialog.querySelector(".settings-scroll-track");
    function updateSettingsScrollbar() {
      const max = settingsScroll.scrollHeight - settingsScroll.clientHeight;
      settingsTrack.hidden = max <= 0;
      if (max <= 0) return;
      const height = settingsTrack.clientHeight;
      const thumb = Math.min(height, Math.max(40, height * settingsScroll.clientHeight / settingsScroll.scrollHeight));
      settingsTrack.style.setProperty("--thumb-size", `${thumb}px`);
      settingsTrack.style.setProperty("--thumb-offset", `${max > 0 ? settingsScroll.scrollTop / max * (height - thumb) : 0}px`);
      settingsTrack.hidden = max <= 0;
    }
    settingsScroll.addEventListener("scroll", updateSettingsScrollbar, { passive: true });
    new ResizeObserver(updateSettingsScrollbar).observe(settingsScroll);
    let scrollDrag;
    settingsTrack.addEventListener("pointerdown", event => {
      const bounds = settingsTrack.getBoundingClientRect();
      const thumb = settingsTrack.firstElementChild.getBoundingClientRect();
      const max = settingsScroll.scrollHeight - settingsScroll.clientHeight;
      const travel = bounds.height - thumb.height;
      if (travel <= 0) return;
      if (event.target === settingsTrack) settingsScroll.scrollTop = Math.max(0, Math.min(1, (event.clientY - bounds.top - thumb.height / 2) / travel)) * max;
      scrollDrag = { y: event.clientY, position: settingsScroll.scrollTop, scale: max / travel };
      settingsTrack.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    settingsTrack.addEventListener("pointermove", event => {
      if (scrollDrag) settingsScroll.scrollTop = scrollDrag.position + (event.clientY - scrollDrag.y) * scrollDrag.scale;
    });
    const stopScrollDrag = () => { scrollDrag = null; };
    settingsTrack.addEventListener("pointerup", stopScrollDrag);
    settingsTrack.addEventListener("pointercancel", stopScrollDrag);
    settingsTrack.addEventListener("lostpointercapture", stopScrollDrag);
    settingsTrigger.addEventListener("click", openSettings);
    settingsDialog.querySelectorAll("[data-settings-close]").forEach(button => button.addEventListener("click", () => settingsDialog.close()));
    settingsDialog.addEventListener("close", () => {
      if (settingsDialog.open) return;
      settingsTrigger.setAttribute("aria-expanded", "false");
      settingsTrigger.focus({ preventScroll: true });
    });
    settingsDialog.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); settingsDialog.close(); }
    });
    settingsDialog.querySelectorAll("[data-setting]").forEach(button => button.addEventListener("click", () => {
      button.setAttribute("aria-checked", String(button.getAttribute("aria-checked") !== "true"));
    }));
    settingsDialog.querySelectorAll("[data-settings-view]").forEach(button => button.addEventListener("click", () => {
      settingsDialog.querySelectorAll("[data-settings-view]").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    }));
    settingsDialog.querySelectorAll("[data-preview-action]").forEach(button => button.addEventListener("click", () => {
      const feedback = settingsDialog.querySelector("#settings-feedback");
      feedback.textContent = "Esta é uma prévia. As autorizações e os ajustes são feitos no aplicativo instalado.";
    }));
    smallScreen.addEventListener("change", () => {
      if (!settingsDialog.open) return;
      const scroll = settingsDialog.querySelector(".settings-scroll");
      const position = scroll.scrollTop;
      settingsDialog.close();
      openSettings();
      scroll.scrollTop = position;
    });

  }
  const installationCommand = window.NOTCHFICATOR_CONFIG?.installationCommand?.trim();
  if (installationCommand) {
    document.querySelector(".installation-command").hidden = false;
    document.querySelector("#installation-release-description").textContent = "Este comando remove a marca de quarentena do Notchficator na pasta Aplicativos, permitindo a primeira abertura desta versão sem assinatura.";
    document.querySelector("#installation-command-text").textContent = installationCommand;
    document.querySelector("#copy-installation-command").addEventListener("click", async () => {
      const status = document.querySelector("#installation-copy-status");
      try { await navigator.clipboard.writeText(installationCommand); status.textContent = "Comando copiado."; }
      catch { status.textContent = "Selecione o comando e copie manualmente."; }
    });
  }

  const downloadUrl = safeUrl(window.NOTCHFICATOR_CONFIG?.downloadUrl);
  document.querySelectorAll("[data-download]").forEach(link => {
    if (downloadUrl) {
      link.href = downloadUrl;
      link.setAttribute("aria-label", "Baixar o instalador do Notchficator para Mac");
    } else {
      link.setAttribute("aria-haspopup", "dialog");
      link.addEventListener("click", event => { event.preventDefault(); lastDownloadTrigger = link; downloadDialog.showModal(); });
    }
  });
  downloadDialog.querySelectorAll(".dialog-close,.dialog-done").forEach(button => button.addEventListener("click", () => downloadDialog.close()));
  downloadDialog.addEventListener("click", event => {
    const rect = downloadDialog.getBoundingClientRect();
    if (event.target === downloadDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) downloadDialog.close();
  });
  downloadDialog.addEventListener("close", () => lastDownloadTrigger?.focus({preventScroll:true}));
})();
