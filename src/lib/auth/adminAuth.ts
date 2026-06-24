import { isTokenValid } from '@/lib/tokenUtils';

/**
 * In-memory store for active admin tokens
 * Maps token -> { email, expiresAt, createdAt }
 */
const adminTokenStore = new Map<string, {
  email: string;
  expiresAt: number;
  createdAt: number;
}>();

/**
 * Register a new admin token
 * Called after successful admin login
 */
export function registerAdminToken(
  token: string,
  email: string,
  expiresAt: number,
  createdAt: number
): void {
  adminTokenStore.set(token, {
    email,
    expiresAt,
    createdAt,
  });
}

/**
 * Verify and retrieve admin user from token
 * Returns admin user object if valid, null if expired or invalid
 */
export async function verifyAdminToken(
  token: string
): Promise<{ email: string; role: string; isAdmin: boolean } | null> {
  if (!token) {
    return null;
  }

  const tokenData = adminTokenStore.get(token);

  if (!tokenData) {
    return null;
  }

  // Check if token has expired
  if (!isTokenValid(tokenData.expiresAt)) {
    // Clean up expired token
    adminTokenStore.delete(token);
    return null;
  }

  // Return admin user object
  return {
    email: tokenData.email,
    role: 'admin',
    isAdmin: true,
  };
}

/**
 * Revoke an admin token (logout)
 */
export function revokeAdminToken(token: string): void {
  adminTokenStore.delete(token);
}

/**
 * Clear all expired tokens (cleanup)
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of adminTokenStore.entries()) {
    if (now >= data.expiresAt) {
      adminTokenStore.delete(token);
    }
  }
}

/**
 * Get all active tokens count (for monitoring)
 */
export function getActiveTokenCount(): number {
  cleanupExpiredTokens();
  return adminTokenStore.size;
}
