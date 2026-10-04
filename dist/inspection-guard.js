(() => {
  "use strict";

  // Desencoraja a inspeção casual; o código entregue ao navegador continua público.
  const notice = document.querySelector("#inspection-notice");
  if (!notice) return;
  const message = "Ah, para de vir mexer aqui, ô metida hacker. 😅";
  let dismissalTimer;
  let previousFocus;

  function hideNotice() {
    clearTimeout(dismissalTimer);
    const restoreFocus = notice.contains(document.activeElement);
    notice.hidden = true;
    if (restoreFocus) {
      let target = previousFocus;
      if (target && (!target.getClientRects().length || target.closest("[inert]"))) {
        const panel = target.closest("[hidden], [inert]");
        target = panel?.id ? document.querySelector(`[aria-controls="${CSS.escape(panel.id)}"]`) : null;
      }
      if (target?.isConnected) target.focus({ preventScroll: true });
    }
  }

  function scheduleDismissal() {
    clearTimeout(dismissalTimer);
    dismissalTimer = setTimeout(() => {
      if (notice.matches(":hover") || notice.contains(document.activeElement)) scheduleDismissal();
      else hideNotice();
    }, 8000);
  }

  function showNotice() {
    if (!notice.contains(document.activeElement)) previousFocus = document.activeElement;
    // Dentro de um modal, o aviso também precisa continuar acessível.
    const parent = document.querySelector("dialog:modal") || document.body;
    if (notice.parentElement !== parent) parent.append(notice);
    notice.hidden = false;
    scheduleDismissal();
  }

  notice.querySelector("button").addEventListener("click", hideNotice);
  document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("close", hideNotice));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") hideNotice();
  });

  document.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.isComposing) return;
    const key = event.key.toLowerCase();
    const macTools = event.metaKey && event.altKey && ["i", "j", "c", "k", "u"].includes(key);
    const otherTools = event.ctrlKey && event.shiftKey && !event.altKey && ["i", "j", "c", "k"].includes(key);
    const pageAction = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && ["u", "s"].includes(key);
    if (key === "f12" || macTools || otherTools || pageAction) {
      event.preventDefault();
      if (!event.repeat) showNotice();
    }
  }, { capture: true });

  document.addEventListener("contextmenu", event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const usefulMenu = target.closest("a, input, textarea, select, label, summary, pre, code, [contenteditable], .installation-command");
    const plainButton = target.closest("button") && !target.closest("img, video");
    if (usefulMenu || plainButton) return;
    event.preventDefault();
    showNotice();
  });

  document.addEventListener("dragstart", event => {
    if (event.target instanceof Element && event.target.closest("img, video")) event.preventDefault();
  });

  console.info(message);
})();
