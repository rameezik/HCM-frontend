// Legacy password recommendations do not block account access. Only the
// explicit, current server policy can require a password change.
export function requiresPasswordChange(user) {
  return user?.mustChangePassword === true && user?.passwordChangeEnforced === true;
}
