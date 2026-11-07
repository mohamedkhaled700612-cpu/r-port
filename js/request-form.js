import { REQUEST_TYPES, validateRequestInput, isDuplicateSubmission, createRequest } from "./requests.js";
import { validateUploadFile, uploadAttachment, ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_BYTES } from "./cloudinary.js";
import { escapeHtml, setButtonLoading, showToast } from "./ui.js";

const $ = (id) => document.getElementById(id);

const FIELD_IDS = ["fullName", "contactInfo", "requestType", "description", "attachment"];

export function initRequestForm() {
  const form = $("requestForm");
  const submitButton = $("requestSubmit");
  const statusBox = $("requestStatus");
  const confirmation = $("requestConfirmation");
  let submitting = false;

  $("requestType").innerHTML += REQUEST_TYPES.map(
    (type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`,
  ).join("");

  const description = $("description");
  description.addEventListener("input", () => {
    $("descriptionCount").textContent = String(description.value.length);
  });

  function setFieldError(name, message) {
    const element = form.querySelector(`[data-error-for="${name}"]`);
    if (element) element.textContent = message || "";
    const input = $(name);
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function clearErrors() {
    FIELD_IDS.forEach((name) => setFieldError(name, ""));
    statusBox.hidden = true;
    statusBox.textContent = "";
    statusBox.classList.remove("is-error");
  }

  function showStatus(message) {
    statusBox.hidden = false;
    statusBox.textContent = message;
    statusBox.classList.add("is-error");
  }

  $("attachment").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFieldError("attachment", "");
      return;
    }
    const error = validateUploadFile(file, ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_BYTES);
    setFieldError("attachment", error || "");
    if (error) event.target.value = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    clearErrors();

    const values = {
      fullName: $("fullName").value,
      contactInfo: $("contactInfo").value,
      requestType: $("requestType").value,
      description: $("description").value,
    };
    const { errors, value } = validateRequestInput(values);
    const file = $("attachment").files[0];
    const attachmentError = file ? validateUploadFile(file, ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_BYTES) : null;
    if (attachmentError) errors.attachment = attachmentError;

    Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
    if (Object.keys(errors).length > 0) {
      showStatus("Please correct the highlighted fields.");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    if (isDuplicateSubmission(value)) {
      showStatus("This request was already received a few minutes ago. Please wait before sending it again.");
      return;
    }

    submitting = true;
    setButtonLoading(submitButton, true, "Sending...");
    try {
      let attachmentUrl = null;
      if (file) {
        setButtonLoading(submitButton, true, "Uploading attachment...");
        const uploaded = await uploadAttachment(file);
        attachmentUrl = uploaded.secureUrl;
      }
      setButtonLoading(submitButton, true, "Sending...");
      await createRequest(value, attachmentUrl);
      form.reset();
      $("descriptionCount").textContent = "0";
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
      showToast("Your request has been sent.");
    } catch (error) {
      showStatus(error.message || "Your request could not be sent. Please try again.");
    } finally {
      submitting = false;
      setButtonLoading(submitButton, false);
    }
  });

  $("newRequest").addEventListener("click", () => {
    confirmation.hidden = true;
    form.hidden = false;
    clearErrors();
    $("fullName").focus();
  });
}
