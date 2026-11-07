import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase-config.js";

export const PROFILE_FIELDS = [
  "heroIntro",
  "bio",
  "location",
  "languages",
  "skills",
  "education",
  "experience",
  "achievements",
  "certificates",
  "cvUrl",
  "cvPublicId",
];

export const CONTACT_FIELDS = ["email", "phone", "whatsapp", "instagram", "socialLinks"];

const FIELD_LIMITS = {
  heroIntro: 500,
  bio: 5000,
  location: 200,
  languages: 300,
  skills: 2000,
  education: 3000,
  experience: 3000,
  achievements: 3000,
  certificates: 3000,
  cvUrl: 500,
  cvPublicId: 200,
  email: 200,
  phone: 50,
  whatsapp: 50,
  instagram: 300,
  socialLinks: 2000,
};

export const CONTENT_DOC_IDS = { profile: "profile", contact: "contact" };

export function subscribeSiteContent(docId, callback, onError) {
  return onSnapshot(
    doc(db, "siteContent", docId),
    (snapshot) => callback(snapshot.exists() ? snapshot.data() : {}),
    onError,
  );
}

export function emptyFields(fields) {
  return Object.fromEntries(fields.map((field) => [field, ""]));
}

export function validateContentFields(values, fields) {
  const errors = {};
  const cleaned = {};
  for (const field of fields) {
    const text = (values[field] ?? "").trim();
    if (text.length > FIELD_LIMITS[field]) {
      errors[field] = `Must be ${FIELD_LIMITS[field]} characters or fewer.`;
    }
    cleaned[field] = text;
  }
  return { errors, value: cleaned };
}

export function saveSiteContent(docId, value) {
  return setDoc(doc(db, "siteContent", docId), { ...value, updatedAt: serverTimestamp() });
}

export function parseLines(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseEntries(text) {
  return parseLines(text).map((line) => {
    const [title = "", organization = "", period = ""] = line.split("|").map((part) => part.trim());
    return { title, organization, period };
  });
}

export function parseSocialLinks(text) {
  return parseLines(text)
    .map((line) => {
      const [label = "", url = ""] = line.split("|").map((part) => part.trim());
      return { label, url };
    })
    .filter((link) => link.label && link.url);
}

export function parseSkills(text) {
  return (text || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}
