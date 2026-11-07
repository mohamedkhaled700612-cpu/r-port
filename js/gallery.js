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
  where,
} from "firebase/firestore";
import { db } from "./firebase-config.js";
import { isCloudinaryUrl, requestAssetDeletion, responsiveSrcset, deliveryUrl } from "./cloudinary.js";
import { getCurrentIdToken } from "./auth.js";
import { escapeHtml } from "./ui.js";

const galleryRef = collection(db, "gallery");

export function validateGalleryInput(values) {
  const errors = {};
  const title = values.title?.trim() ?? "";
  const description = values.description?.trim() ?? "";
  const category = values.category?.trim() ?? "";

  if (title.length < 1 || title.length > 150) errors.title = "Please enter a title (1 to 150 characters).";
  if (description.length > 2000) errors.description = "Description must be under 2000 characters.";
  if (category.length < 1 || category.length > 60) errors.category = "Please enter a category (1 to 60 characters).";

  return { errors, value: { title, description, category, isPublished: values.isPublished === true } };
}

export function subscribePublishedGallery(callback, onError) {
  const publishedQuery = query(galleryRef, where("isPublished", "==", true), orderBy("createdAt", "desc"));
  return onSnapshot(
    publishedQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function subscribeAllGallery(callback, onError) {
  const allQuery = query(galleryRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    allQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function addGalleryItem(value, image) {
  if (!isCloudinaryUrl(image.secureUrl)) throw new Error("Image must come from Cloudinary.");
  return addDoc(galleryRef, {
    title: value.title,
    description: value.description,
    category: value.category,
    imageUrl: image.secureUrl,
    cloudinaryPublicId: image.publicId,
    isPublished: value.isPublished,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateGalleryItem(id, value, replacementImage = null) {
  const changes = {
    title: value.title,
    description: value.description,
    category: value.category,
    isPublished: value.isPublished,
    updatedAt: serverTimestamp(),
  };
  if (replacementImage) {
    if (!isCloudinaryUrl(replacementImage.secureUrl)) throw new Error("Image must come from Cloudinary.");
    changes.imageUrl = replacementImage.secureUrl;
    changes.cloudinaryPublicId = replacementImage.publicId;
  }
  return updateDoc(doc(db, "gallery", id), changes);
}

export function setGalleryPublished(id, isPublished) {
  return updateDoc(doc(db, "gallery", id), { isPublished, updatedAt: serverTimestamp() });
}

export async function deleteGalleryItem(item) {
  const idToken = await getCurrentIdToken();
  await requestAssetDeletion(item.cloudinaryPublicId, idToken);
  await deleteDoc(doc(db, "gallery", item.id));
}

export async function deleteReplacedAsset(publicId) {
  const idToken = await getCurrentIdToken();
  await requestAssetDeletion(publicId, idToken);
}

export function renderGalleryCards(items) {
  return items
    .map(
      (item, index) => `
      <article class="gallery-card reveal" data-index="${index}" data-category="${escapeHtml(item.category)}" tabindex="0" role="button" aria-label="View ${escapeHtml(item.title)}">
        <div class="gallery-card__media">
          <img src="${escapeHtml(deliveryUrl(item.cloudinaryPublicId, { width: 900 }))}"
               srcset="${escapeHtml(responsiveSrcset(item.cloudinaryPublicId))}"
               sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
               alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" />
          <span class="gallery-card__overlay">View</span>
        </div>
        <div class="gallery-card__info">
          <span class="gallery-card__category">${escapeHtml(item.category)}</span>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
      </article>`,
    )
    .join("");
}
