const readinessMessages = {
  BIOMETRIC_PYTHON_PATH: {
    title: "Python interpreter",
    message:
      "The server cannot find the face-recognition interpreter. Check BIOMETRIC_PYTHON_PATH and use the deployed Python environment that has OpenCV and NumPy installed.",
  },
  BIOMETRIC_MODEL_DIR: {
    title: "Model directory",
    message:
      "Set BIOMETRIC_MODEL_DIR to the deployed directory containing both verified ONNX model files.",
  },
  "face_detection_yunet_2023mar.onnx": {
    title: "Face detection model",
    message:
      "The YuNet model is missing or unreadable. Install the verified model in the deployed model directory.",
  },
  "face_recognition_sface_2021dec.onnx": {
    title: "Face recognition model",
    message:
      "The SFace model is missing or unreadable. Install the verified model in the deployed model directory.",
  },
  BIOMETRIC_TEMPLATE_KEY: {
    title: "Biometric encryption key",
    message:
      "Set BIOMETRIC_TEMPLATE_KEY to the base64 encoding of exactly 32 random bytes. Preserve the existing key when face templates are already enrolled.",
  },
  BIOMETRIC_MATCH_THRESHOLD: {
    title: "Private verification threshold",
    message: "BIOMETRIC_MATCH_THRESHOLD must be a number from 0.363 to 0.99.",
  },
  BIOMETRIC_RETENTION_DAYS: {
    title: "Template retention",
    message: "BIOMETRIC_RETENTION_DAYS must be a whole number from 1 to 365.",
  },
  KIOSK_MATCH_THRESHOLD: {
    title: "Terminal matching threshold",
    message: "KIOSK_MATCH_THRESHOLD must be a number from 0.55 to 0.99.",
  },
  KIOSK_MATCH_MARGIN: {
    title: "Identity ambiguity margin",
    message: "KIOSK_MATCH_MARGIN must be a number from 0.05 to 0.5.",
  },
  KIOSK_SCAN_COOLDOWN_SECONDS: {
    title: "Scan cooldown",
    message:
      "KIOSK_SCAN_COOLDOWN_SECONDS must be a whole number from 5 to 300.",
  },
  BIOMETRIC_RUNTIME: {
    title: "Face inference runtime",
    message:
      "The model files were found, but the recognition runtime is not ready. Check the deployed interpreter, its OpenCV and NumPy packages, and the Render runtime logs.",
  },
};

const unknownIssue = {
  code: "BIOMETRIC_CONFIGURATION",
  title: "Recognition service",
  message:
    "The recognition service is unavailable. Check the Render runtime configuration and logs, then recheck readiness.",
};

export function getReadinessIssues(missingConfiguration) {
  if (!Array.isArray(missingConfiguration) || !missingConfiguration.length) {
    return [unknownIssue];
  }

  const issues = [];
  for (const code of new Set(missingConfiguration)) {
    if (typeof code === "string" && Object.hasOwn(readinessMessages, code)) {
      issues.push({ code, ...readinessMessages[code] });
    } else if (!issues.some((issue) => issue.code === unknownIssue.code)) {
      issues.push(unknownIssue);
    }
  }
  return issues;
}
