import type { User } from "@supabase/supabase-js"

export const ALLOWED_RIMS_ROLES = ["desk-manager", "manager", "admin"] as const

export type RimsAllowedRole = (typeof ALLOWED_RIMS_ROLES)[number]

export function isAllowedRimsRole(
  role: string | null | undefined
): role is RimsAllowedRole {
  if (!role) {
    return false
  }

  return ALLOWED_RIMS_ROLES.includes(role as RimsAllowedRole)
}

export function getRoleFromUserMetadata(user: User | null): string | null {
  if (!user) {
    return null
  }

  const metadataRole = user.user_metadata?.role
  return typeof metadataRole === "string" ? metadataRole : null
}
