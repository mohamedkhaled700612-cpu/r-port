import "./firebase-config.js";
import { subscribeSiteContent, CONTENT_DOC_IDS } from "./content.js";
import { renderProfile, renderContact } from "./profile.js";
import { initPublicGallery } from "./public-gallery.js";
import { initRequestForm } from "./request-form.js";
import { observeReveals, showToast } from "./ui.js";

const $ = (id) => document.getElementById(id);

function initHeader() {
  const header = $("siteHeader");
  const toggle = $("menuToggle");
  const nav = $("siteNav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
}

function initContent() {
  subscribeSiteContent(
    CONTENT_DOC_IDS.profile,
    (profile) => {
      renderProfile(profile);
      observeReveals();
    },
    () => showToast("Profile details could not be loaded.", "error"),
  );
  subscribeSiteContent(
    CONTENT_DOC_IDS.contact,
    (contact) => renderContact(contact),
    () => showToast("Contact details could not be loaded.", "error"),
  );
}

$("year").textContent = String(new Date().getFullYear());
initHeader();
observeReveals();
initContent();
initPublicGallery();
initRequestForm();
