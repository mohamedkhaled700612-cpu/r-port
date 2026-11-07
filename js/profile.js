import { safeHttpUrl, escapeHtml, observeReveals } from "./ui.js";
import { parseEntries, parseLines, parseSkills, parseSocialLinks } from "./content.js";

const $ = (id) => document.getElementById(id);

function setText(id, text) {
  const element = $(id);
  if (element) element.textContent = text || "";
  if (element) element.hidden = !text;
}

function renderTimeline(listId, blockId, entries) {
  const block = $(blockId);
  const list = $(listId);
  const items = parseEntries(entries);
  block.hidden = items.length === 0;
  list.innerHTML = items
    .map(
      (item) => `
      <li>
        <p class="timeline__period">${escapeHtml(item.period)}</p>
        <h4>${escapeHtml(item.title)}</h4>
        <p class="timeline__org">${escapeHtml(item.organization)}</p>
      </li>`,
    )
    .join("");
}

function renderList(listId, blockId, text) {
  const block = $(blockId);
  const items = parseLines(text);
  block.hidden = items.length === 0;
  $(listId).innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

export function renderProfile(profile) {
  setText("heroIntro", profile.heroIntro);
  setText("bioText", profile.bio);

  const personal = [
    ["Location", profile.location],
    ["Languages", profile.languages],
  ].filter(([, value]) => value);
  $("personalInfo").innerHTML = personal
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
  $("personalInfo").hidden = personal.length === 0;

  const skills = parseSkills(profile.skills);
  $("skillsBlock").hidden = skills.length === 0;
  $("skillsList").innerHTML = skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("");

  renderTimeline("educationList", "educationBlock", profile.education);
  renderTimeline("experienceList", "experienceBlock", profile.experience);
  renderList("achievementsList", "achievementsBlock", profile.achievements);
  renderList("certificatesList", "certificatesBlock", profile.certificates);

  const cvUrl = safeHttpUrl(profile.cvUrl);
  const cvButton = $("cvDownload");
  cvButton.hidden = !cvUrl;
  if (cvUrl) cvButton.href = cvUrl;
}

export function renderContact(contact) {
  const items = [];
  if (contact.email) items.push({ label: "Email", value: contact.email, href: `mailto:${contact.email}` });
  if (contact.phone) items.push({ label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, "")}` });
  if (contact.whatsapp) {
    const digits = contact.whatsapp.replace(/\D/g, "");
    if (digits) items.push({ label: "WhatsApp", value: contact.whatsapp, href: `https://wa.me/${digits}` });
  }
  if (contact.instagram) {
    const handle = contact.instagram.replace(/^@/, "").trim();
    if (handle) items.push({ label: "Instagram", value: `@${handle}`, href: `https://instagram.com/${encodeURIComponent(handle)}` });
  }
  for (const link of parseSocialLinks(contact.socialLinks)) {
    const href = safeHttpUrl(link.url);
    if (href) items.push({ label: link.label, value: link.label, href });
  }

  $("contactEmpty").hidden = items.length > 0;
  $("contactGrid").innerHTML = items
    .map(
      (item) => `
      <a class="contact-card reveal" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">
        <span class="contact-card__label">${escapeHtml(item.label)}</span>
        <span class="contact-card__value">${escapeHtml(item.value)}</span>
      </a>`,
    )
    .join("");
  observeReveals($("contactGrid"));
}
