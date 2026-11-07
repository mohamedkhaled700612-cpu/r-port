import { watchAdminSession, signInAdmin, signOutAdmin, describeAuthError, ADMIN_STATES } from "./auth.js";
import { subscribeRequests } from "./requests.js";
import { subscribeAllGallery } from "./gallery.js";
import { initRequestsView } from "./admin-requests.js";
import { initGalleryView } from "./admin-gallery.js";
import { initProfileView, initContactView } from "./admin-content.js";
import { setButtonLoading, showToast } from "./ui.js";

const $ = (id) => document.getElementById(id);

const SCREENS = ["loginView", "checkingView", "deniedView", "errorView", "dashboardView"];

function showScreen(screenId) {
  for (const id of SCREENS) $(id).hidden = id !== screenId;
}

function showView(name) {
  document.querySelectorAll(".admin-view").forEach((section) => {
    section.hidden = section.id !== `view-${name}`;
    section.classList.toggle("is-active", section.id === `view-${name}`);
  });
  document.querySelectorAll(".sidebar__link").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  $("viewTitle").textContent = $(`view-${name}`).dataset.title;
  $("sidebar").classList.remove("is-open");
  $("sidebarToggle").setAttribute("aria-expanded", "false");
}

function initNavigation() {
  document.querySelectorAll(".sidebar__link").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
  const toggle = $("sidebarToggle");
  toggle.addEventListener("click", () => {
    const open = $("sidebar").classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function computeStats(requests, gallery) {
  const count = (status) => requests.filter((request) => request.status === status).length;
  return {
    total: requests.length,
    pending: count("Pending"),
    approved: count("Approved"),
    rejected: count("Rejected"),
    gallery: gallery.length,
  };
}

function renderStats(stats) {
  for (const [key, value] of Object.entries(stats)) {
    const element = document.querySelector(`[data-stat="${key}"]`);
    if (element) element.textContent = String(value);
  }
}

let stopDashboard = null;
let dashboardUid = null;

function startDashboard(user) {
  if (dashboardUid === user.uid) return;
  stopDashboard?.();
  dashboardUid = user.uid;

  $("adminEmail").textContent = user.email || "Administrator";
  showScreen("dashboardView");

  let requests = null;
  let gallery = null;
  const requestsView = initRequestsView();
  const galleryView = initGalleryView();

  const unsubscribeRequests = subscribeRequests(
    (list) => {
      requests = list;
      requestsView.render(list);
      if (gallery) renderStats(computeStats(requests, gallery));
    },
    () => requestsView.showError("Requests could not be loaded. Check your connection and refresh the page."),
  );
  const unsubscribeGallery = subscribeAllGallery(
    (list) => {
      gallery = list;
      galleryView.render(list);
      if (requests) renderStats(computeStats(requests, gallery));
    },
    () => galleryView.showError("The gallery could not be loaded. Check your connection and refresh the page."),
  );
  const unsubscribeProfile = initProfileView();
  const unsubscribeContact = initContactView();

  stopDashboard = () => {
    unsubscribeRequests();
    unsubscribeGallery();
    unsubscribeProfile();
    unsubscribeContact();
    requestsView.destroy();
    galleryView.destroy();
    dashboardUid = null;
    stopDashboard = null;
  };
}

function initLogin() {
  const form = $("loginForm");
  const submit = $("loginSubmit");
  const status = $("loginStatus");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;
    status.hidden = true;

    const emailError = email ? "" : "Please enter your email.";
    const passwordError = password ? "" : "Please enter your password.";
    form.querySelector('[data-error-for="loginEmail"]').textContent = emailError;
    form.querySelector('[data-error-for="loginPassword"]').textContent = passwordError;
    if (emailError || passwordError) return;

    setButtonLoading(submit, true, "Signing in...");
    try {
      await signInAdmin(email, password);
      $("loginPassword").value = "";
    } catch (error) {
      status.hidden = false;
      status.textContent = describeAuthError(error);
    } finally {
      setButtonLoading(submit, false);
    }
  });
}

function initAccountActions() {
  $("logoutButton").addEventListener("click", () => signOutAdmin());
  $("deniedSignOut").addEventListener("click", () => signOutAdmin());
  $("errorSignOut").addEventListener("click", () => signOutAdmin());
  $("errorRetry").addEventListener("click", () => window.location.reload());
}

initNavigation();
initLogin();
initAccountActions();
showView("overview");

watchAdminSession(({ state, user }) => {
  switch (state) {
    case ADMIN_STATES.SIGNED_OUT:
      stopDashboard?.();
      showScreen("loginView");
      break;
    case ADMIN_STATES.CHECKING:
      showScreen("checkingView");
      break;
    case ADMIN_STATES.ADMIN:
      startDashboard(user);
      break;
    case ADMIN_STATES.NOT_ADMIN:
      stopDashboard?.();
      showScreen("deniedView");
      break;
    case ADMIN_STATES.ERROR:
      stopDashboard?.();
      showScreen("errorView");
      showToast("We could not verify your access.", "error");
      break;
    default:
      break;
  }
});
