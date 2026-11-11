const enrollmentErrors = {
  BIOMETRIC_TEMPLATE_UNREADABLE: {
    message:
      "The current encryption key cannot read an existing face record. Restore the original BIOMETRIC_TEMPLATE_KEY used for enrollment. Do not generate another key or delete employee records.",
    refreshReadiness: false,
  },
  BIOMETRIC_KEY_VERSION_MISMATCH: {
    message:
      "The encryption key version does not match existing face records. Restore the original BIOMETRIC_TEMPLATE_KEY_ID together with its original BIOMETRIC_TEMPLATE_KEY.",
    refreshReadiness: false,
  },
  BIOMETRIC_NOT_CONFIGURED: {
    message:
      "Face attendance is not ready on the server. Recheck readiness and resolve the listed settings before trying again.",
    refreshReadiness: true,
  },
};

export function getEnrollmentError(failure) {
  const status = failure?.status;
  const serverError =
    Number.isInteger(status) && status >= 500 && status <= 599;
  if (serverError && Object.hasOwn(enrollmentErrors, failure?.code)) {
    const diagnostic = enrollmentErrors[failure.code];
    return {
      message: `${status} · ${diagnostic.message} (${failure.code})`,
      refreshReadiness: diagnostic.refreshReadiness,
    };
  }

  if (serverError) {
    return {
      message: `${status} · Unable to update face attendance. Please try again or contact your administrator.`,
      refreshReadiness: false,
    };
  }

  return {
    message:
      typeof failure?.message === "string" && Number.isInteger(status)
        ? failure.message
        : "Unable to update face attendance. Please try again.",
    refreshReadiness: false,
  };
}
