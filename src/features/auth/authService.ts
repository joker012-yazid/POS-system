import { db, now } from '@/services/storage/db';
import { verifyPassword, hashPassword } from './password';
import { getSession, setSession, clearSession } from './session';
import { seedDatabase } from '@/services/storage/seed';
import type { SessionUser, User } from '@/services/storage/types';
import { AuthenticationError } from '@/lib/errors';

/**
 * Initialize auth system - seed default data if needed
 */
export async function initializeAuth(): Promise<void> {
  await seedDatabase();
}

/**
 * Attempt to log in with username and password
 */
export async function login(username: string, password: string): Promise<SessionUser> {
  const normalizedUsername = username.toLowerCase().trim();

  const user = await db.users.where('username').equals(normalizedUsername).first();

  if (!user) {
    throw new AuthenticationError();
  }

  if (!user.isActive) {
    throw new AuthenticationError('Akaun ini telah dinyahaktifkan');
  }

  const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);

  if (!isValid) {
    throw new AuthenticationError();
  }

  // Update last login time
  await db.users.update(user.id, { lastLoginAt: now() });

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    name: user.displayName,
    role: user.role,
  };

  setSession(sessionUser);

  return sessionUser;
}

/**
 * Log out current user
 */
export function logout(): void {
  clearSession();
}

/**
 * Get current session user
 */
export function getCurrentUser(): SessionUser | null {
  return getSession();
}

/**
 * Check if user is logged in
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  const user = getSession();
  return user?.role === 'admin';
}

/**
 * Create a new user (admin only)
 */
export async function createUser(
  username: string,
  displayName: string,
  password: string,
  role: 'admin' | 'user'
): Promise<User> {
  const normalizedUsername = username.toLowerCase().trim();

  // Check for duplicate username
  const existing = await db.users.where('username').equals(normalizedUsername).first();
  if (existing) {
    throw new Error('Nama pengguna sudah digunakan');
  }

  const { hash, salt } = await hashPassword(password);
  const timestamp = now();

  const user: User = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName,
    role,
    isActive: true,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.users.add(user);

  return user;
}

/**
 * Reset user password (admin only)
 */
export async function resetPassword(userId: string, newPassword: string): Promise<void> {
  const { hash, salt } = await hashPassword(newPassword);

  await db.users.update(userId, {
    passwordHash: hash,
    passwordSalt: salt,
    updatedAt: now(),
  });
}

/**
 * Toggle user active status (admin only)
 */
export async function toggleUserActive(userId: string): Promise<void> {
  const user = await db.users.get(userId);
  if (!user) throw new Error('Pengguna tidak dijumpai');

  await db.users.update(userId, {
    isActive: !user.isActive,
    updatedAt: now(),
  });
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  return db.users.toArray();
}
