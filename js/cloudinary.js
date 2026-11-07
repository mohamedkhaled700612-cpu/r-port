export const CLOUDINARY_CLOUD_NAME = "fkmbapdm";
export const CLOUDINARY_UPLOAD_PRESET = "rk-fashion";
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
export const CLOUDINARY_AUTO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
export const CLOUDINARY_DELIVERY_PREFIX = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/`;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ATTACHMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DELETE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/delete-cloudinary-image` : null;

export function validateUploadFile(file, allowedTypes, maxBytes) {
  if (!file) return "Please choose a file.";
  if (!allowedTypes.includes(file.type)) return "This file type is not supported.";
  if (file.size > maxBytes) return `File must be smaller than ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  return null;
}

export function validateImageFile(file) {
  return validateUploadFile(file, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES);
}

export async function uploadToCloudinary(file, { endpoint = CLOUDINARY_UPLOAD_URL, folder } = {}) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  if (folder) form.append("folder", folder);

  let response;
  try {
    response = await fetch(endpoint, { method: "POST", body: form });
  } catch {
    throw new Error("Upload failed. Please check your connection and try again.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.secure_url || !body?.public_id) {
    throw new Error("The image could not be uploaded. Please try a different file.");
  }
  return { secureUrl: body.secure_url, publicId: body.public_id, resourceType: body.resource_type };
}

export function uploadImage(file) {
  return uploadToCloudinary(file, { endpoint: CLOUDINARY_UPLOAD_URL });
}

export function uploadAttachment(file) {
  return uploadToCloudinary(file, { endpoint: CLOUDINARY_AUTO_UPLOAD_URL });
}

export function deliveryUrl(publicId, { width, crop = "limit" } = {}) {
  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`, `c_${crop}`);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms.join(",")}/${publicId}`;
}

export function responsiveSrcset(publicId, widths = [480, 900, 1400]) {
  return widths.map((w) => `${deliveryUrl(publicId, { width: w })} ${w}w`).join(", ");
}

export function isCloudinaryUrl(value) {
  return typeof value === "string" && value.startsWith(CLOUDINARY_DELIVERY_PREFIX);
}

export async function requestAssetDeletion(publicId, idToken) {
  if (!DELETE_FUNCTION_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Image deletion is not configured yet. Ask the site owner to finish the server setup.");
  }

  let response;
  try {
    response = await fetch(DELETE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        Apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ publicId }),
    });
  } catch {
    throw new Error("Could not reach the image service. Please try again.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.deleted !== true) {
    throw new Error(body?.error || "The image could not be deleted from Cloudinary.");
  }
}
