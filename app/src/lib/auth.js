/**
 * Custom Authentication System
 * 
 * Handles user authentication without Supabase Auth
 * Uses bcrypt for password hashing
 */

import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

// Session storage key
const SESSION_KEY = 'user_session'

/**
 * Hash a password
 */
export async function hashPassword(password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

/**
 * Sign up a new user
 */
export async function signUp(userData) {
  const { email, password, firstName, lastName, phoneNumber, birthday, gender, roleId } = userData

  try {
    // Hash the password
    const passwordHash = await hashPassword(password)

    // Insert user into database
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          birthday,
          gender,
          role_id: roleId,
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create session (without password hash)
    const { password_hash, ...userWithoutPassword } = data
    createSession(userWithoutPassword)

    return {
      success: true,
      user: userWithoutPassword,
    }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

/**
 * Sign in a user
 */
export async function signIn(email, password) {
  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*, roles(name)')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Create session (without password hash)
    const { password_hash, ...userWithoutPassword } = user
    createSession(userWithoutPassword)

    return {
      success: true,
      user: userWithoutPassword,
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

/**
 * Sign out current user
 */
export function signOut() {
  localStorage.removeItem(SESSION_KEY)
  return { success: true }
}

/**
 * Get current user from session
 */
export function getCurrentUser() {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) return null

    const session = JSON.parse(sessionData)
    
    // Check if session is expired (24 hours)
    const now = Date.now()
    if (now - session.timestamp > 24 * 60 * 60 * 1000) {
      signOut()
      return null
    }

    return session.user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return getCurrentUser() !== null
}

/**
 * Check if user has a specific role
 */
export function hasRole(roleName) {
  const user = getCurrentUser()
  if (!user) return false
  return user.roles?.name === roleName
}

/**
 * Check if user is admin
 */
export function isAdmin() {
  return hasRole('Admin')
}

/**
 * Create a session
 */
function createSession(user) {
  const session = {
    user,
    timestamp: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

/**
 * Update current user in session
 */
export function updateSession(user) {
  createSession(user)
}

