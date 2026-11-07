import { subscribePublishedGallery, renderGalleryCards } from "./gallery.js";
import { deliveryUrl } from "./cloudinary.js";
import { escapeHtml, observeReveals } from "./ui.js";

const $ = (id) => document.getElementById(id);

export function initPublicGallery() {
  const grid = $("galleryGrid");
  const filters = $("galleryFilters");
  const status = $("galleryStatus");
  const lightbox = $("lightbox");

  let items = [];
  let visible = [];
  let activeCategory = "All";
  let lightboxIndex = 0;

  function categoriesOf(list) {
    return ["All", ...new Set(list.map((item) => item.category))];
  }

  function renderFilters() {
    const categories = categoriesOf(items);
    filters.hidden = categories.length <= 1;
    filters.innerHTML = categories
      .map(
        (category) => `<button type="button" class="filter-btn ${category === activeCategory ? "is-active" : ""}" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`,
      )
      .join("");
  }

  function renderGrid() {
    visible = activeCategory === "All" ? items : items.filter((item) => item.category === activeCategory);
    if (items.length === 0) {
      status.hidden = false;
      status.textContent = "The collection is being curated. New pieces will appear here soon.";
    } else {
      status.hidden = true;
    }
    grid.innerHTML = renderGalleryCards(visible);
    observeReveals(grid);
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderFilters();
    renderGrid();
  });

  function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.body.classList.add("no-scroll");
    $("lightboxClose").focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => {
      lightbox.hidden = true;
    }, 300);
  }

  function updateLightbox() {
    const item = visible[lightboxIndex];
    if (!item) return;
    $("lightboxImage").src = deliveryUrl(item.cloudinaryPublicId, { width: 1600 });
    $("lightboxImage").alt = item.title;
    $("lightboxCaption").innerHTML = `<strong>${escapeHtml(item.title)}</strong>${item.description ? `<span>${escapeHtml(item.description)}</span>` : ""}`;
    const single = visible.length < 2;
    $("lightboxPrev").hidden = single;
    $("lightboxNext").hidden = single;
  }

  function step(delta) {
    if (visible.length === 0) return;
    lightboxIndex = (lightboxIndex + delta + visible.length) % visible.length;
    updateLightbox();
  }

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".gallery-card");
    if (card) openLightbox(Number(card.dataset.index));
  });
  grid.addEventListener("keydown", (event) => {
    const card = event.target.closest(".gallery-card");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openLightbox(Number(card.dataset.index));
    }
  });

  $("lightboxClose").addEventListener("click", closeLightbox);
  $("lightboxPrev").addEventListener("click", () => step(-1));
  $("lightboxNext").addEventListener("click", () => step(1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lightbox__figure")) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });

  status.textContent = "Loading the collection...";
  subscribePublishedGallery(
    (list) => {
      items = list;
      if (!categoriesOf(items).includes(activeCategory)) activeCategory = "All";
      renderFilters();
      renderGrid();
    },
    () => {
      status.hidden = false;
      status.textContent = "The gallery could not be loaded. Please refresh the page.";
    },
  );
}
