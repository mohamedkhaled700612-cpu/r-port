import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase-config.js";
import { isCloudinaryUrl } from "./cloudinary.js";

export const REQUEST_TYPES = [
  "Custom Design",
  "Bridal Collection",
  "Collaboration",
  "Styling & Photoshoot",
  "Press & Media",
  "General Inquiry",
];

export const REQUEST_STATUSES = ["Pending", "Approved", "Rejected"];

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const LAST_SUBMISSION_KEY = "rk-fashion:last-request";

const requestsRef = collection(db, "requests");

export function validateRequestInput(values) {
  const errors = {};
  const fullName = values.fullName?.trim() ?? "";
  const contactInfo = values.contactInfo?.trim() ?? "";
  const requestType = values.requestType?.trim() ?? "";
  const description = values.description?.trim() ?? "";

  if (fullName.length < 2 || fullName.length > 100) errors.fullName = "Please enter your full name (2 to 100 characters).";
  if (contactInfo.length < 3 || contactInfo.length > 200) errors.contactInfo = "Please enter an email address or phone number.";
  if (!REQUEST_TYPES.includes(requestType)) errors.requestType = "Please select a request type.";
  if (description.length < 10 || description.length > 3000) errors.description = "Please describe your request (10 to 3000 characters).";

  return {
    errors,
    value: { fullName, contactInfo, requestType, description },
  };
}

function fingerprintOf(value) {
  return [value.fullName, value.contactInfo, value.requestType, value.description]
    .join("|")
    .toLowerCase();
}

export function isDuplicateSubmission(value) {
  try {
    const last = JSON.parse(localStorage.getItem(LAST_SUBMISSION_KEY) || "null");
    if (!last) return false;
    return last.fingerprint === fingerprintOf(value) && Date.now() - last.at < DUPLICATE_WINDOW_MS;
  } catch {
    return false;
  }
}

function rememberSubmission(value) {
  try {
    localStorage.setItem(LAST_SUBMISSION_KEY, JSON.stringify({ fingerprint: fingerprintOf(value), at: Date.now() }));
  } catch {
    // Storage can be unavailable in private browsing; the in-form submit lock still applies.
  }
}

export async function createRequest(value, attachmentUrl) {
  const docRef = await addDoc(requestsRef, {
    fullName: value.fullName,
    contactInfo: value.contactInfo,
    requestType: value.requestType,
    description: value.description,
    attachmentUrl: isCloudinaryUrl(attachmentUrl) ? attachmentUrl : null,
    status: "Pending",
    adminNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  rememberSubmission(value);
  return docRef.id;
}

export function subscribeRequests(callback, onError) {
  const requestsQuery = query(requestsRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    requestsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function updateRequestStatus(id, status) {
  if (!REQUEST_STATUSES.includes(status)) throw new Error("Invalid status.");
  return updateDoc(doc(db, "requests", id), { status, updatedAt: serverTimestamp() });
}

export function updateRequestNotes(id, adminNotes) {
  return updateDoc(doc(db, "requests", id), { adminNotes, updatedAt: serverTimestamp() });
}

export function deleteRequest(id) {
  return deleteDoc(doc(db, "requests", id));
}
