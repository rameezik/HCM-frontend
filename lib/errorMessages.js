const statusMessages = {
  400: "Unable to process your request. Please try again.",
  401: "Authentication required. Please sign in again.",
  403: "Access denied. You do not have permission to perform this action.",
  404: "The requested item was not found.",
  408: "The request timed out. Please try again.",
  409: "Unable to complete this request. Refresh the page and try again.",
  413: "The selected file or request is too large.",
  422: "Please review the information you entered.",
  429: "Too many attempts. Please wait and try again.",
  500: "Something went wrong. Please try again.",
  502: "Connection unavailable. Please try again.",
  503: "Service unavailable. Please try again later.",
  504: "The request timed out. Check your changes before trying again.",
};

const technicalMessage =
  /API_INTERNAL_URL|NEXT_PUBLIC_|MONGODB_|JWT_SECRET|BIOMETRIC_|SMTP_|AUTH_APP_URL|ECONNREFUSED|ENOTFOUND|npm run|\b(?:backend|Express|Mongoose|JSON)\b/i;

function fieldLabel(field) {
  const labels = {
    "company.name": "Company name",
    name: "Full name",
    currentPassword: "Current password",
    confirmPassword: "Confirm password",
  };
  if (labels[field]) return labels[field];
  return String(field || "Field")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function requestErrorMessage(status, message, details = []) {
  if (!status)
    return "Connection error. Check your internet connection and try again.";

  const fallback =
    statusMessages[status] || "Request unsuccessful. Please try again.";
  const safeMessage =
    typeof message === "string" &&
    message.trim() &&
    !technicalMessage.test(message);
  const summary = status >= 500 || !safeMessage ? fallback : message.trim();
  const reasons =
    status < 500 && Array.isArray(details)
      ? details
          .filter(
            (detail) =>
              typeof detail?.reason === "string" &&
              !technicalMessage.test(detail.reason),
          )
          .map((detail) => `${fieldLabel(detail.field)}: ${detail.reason}`)
      : [];

  return `${status} · ${[summary, ...reasons].join(" ")}`;
}
