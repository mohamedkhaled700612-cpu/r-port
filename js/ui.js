export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function safeHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function formatDate(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "Just now";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "Just now";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function observeReveals(root = document) {
  const items = root.querySelectorAll(".reveal:not(.is-visible)");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  items.forEach((item) => observer.observe(item));
}

export function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 4500);
}

export function setButtonLoading(button, isLoading, loadingLabel = "Please wait...") {
  if (!button) return;
  if (isLoading) {
    if (!button.dataset.originalLabel) button.dataset.originalLabel = button.innerHTML;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${escapeHtml(loadingLabel)}`;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    if (button.dataset.originalLabel) {
      button.innerHTML = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

export function openModal(contentHtml, { wide = false } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal ${wide ? "modal--wide" : ""}" role="dialog" aria-modal="true">
      <button type="button" class="modal__close" aria-label="Close">&times;</button>
      <div class="modal__body">${contentHtml}</div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  const previouslyFocused = document.activeElement;
  const close = () => {
    overlay.classList.remove("is-visible");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector(".modal-overlay")) document.body.classList.remove("no-scroll");
      previouslyFocused?.focus?.();
    }, 250);
  };
  const onKey = (event) => {
    if (event.key === "Escape") close();
  };

  overlay.querySelector(".modal__close").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", onKey);
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  overlay.querySelector("input, textarea, select, button:not(.modal__close)")?.focus();

  return { overlay, close };
}
