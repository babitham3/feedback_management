// src/utils/roles.js
export function userHasRole(user, roleName) {
  if (!user) return false;

  // If you included 'groups' as a list of names or objects in /auth/me
  const groups = user.groups || [];

  // handle group objects [{name: "Moderator"}] or strings ["Moderator"]
  for (const g of groups) {
    if (!g) continue;
    if (typeof g === "string" && g.toLowerCase() === roleName.toLowerCase()) return true;
    if (typeof g === "object" && (g.name || g.id) && String(g.name).toLowerCase() === roleName.toLowerCase()) return true;
  }

  // fallback booleans you might have on user object
  if (roleName.toLowerCase() === "admin" && (user.is_superuser || user.is_staff || user.is_admin)) return true;
  if (roleName.toLowerCase() === "moderator" && (user.is_moderator || user.is_staff)) return true;

  return false;
}