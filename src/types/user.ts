// Centralized User Type Definitions
// This file consolidates all user-related types from across the codebase

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string
  password?: string
  googleToken?: string
}

/**
 * JWT Response
 */
export interface JWTResponse {
  id?: number
  token?: string
  user_email?: string
  user_nicename?: string
  user_display_name?: string
}

/**
 * User Registration Data
 */
export interface RegisterData {
  username: string
  email: string
  password: string
  birthdate?: string
  gender?: string
  customGender?: string
  pronoun?: string
  palates?: string[]
  profileImage?: string
  aboutMe?: string
  is_google_user?: boolean
  googleToken: string
  googleAuth: string
}

/**
 * User Update Data
 */
export interface UserUpdate {
  username: string
  email: string
  birthdate: string
  language: string
  password: string
  palates: string
  profile_image: string
  about_me: string
}

/**
 * User Update Response
 */
export interface UserUpdateResponse {
  id: number
  username: string
  email: string
  birthdate: string
  language: string
  profile_image: string
  message: string
  status: number
  code?: string | number
  data?: {
    status?: number
  }
}

/**
 * Check Google User Response
 */
export interface CheckGoogleUserResponse {
  status: number
  message?: string
  token?: string
  id?: number
  user_login?: string
  user_email?: string
  display_name?: string
  user_display_name?: string
}

/**
 * Current User Response
 */
export interface CurrentUserResponse {
  id?: number
  ID?: number
  user_login?: string
  user_email: string
  display_name?: string
  profile_image?: string
  birthdate?: string
  language?: string
  palates?: string
  about_me?: string
}

/**
 * Check Email Exist Response
 */
export interface CheckEmailExistResponse {
  exists: boolean
  status: number
  message?: string
}

/**
 * Follow User Response
 */
export interface FollowUserResponse {
  result: string
  following: number | string
  followers: number | string
  status?: number
  message?: string
}

/**
 * Is Following User Response
 */
export interface IsFollowingUserResponse {
  is_following: boolean
  status?: number
  message?: string
}

// Legacy interface names for backward compatibility (type aliases)
// Note: Using 'I' prefix to distinguish from interfaces
export type ILoginCredentials = LoginCredentials
export type IJWTResponse = JWTResponse
export type IRegisterData = RegisterData
export type IUserUpdate = UserUpdate
export type IUserUpdateResponse = UserUpdateResponse
export type IFollowUserResponse = FollowUserResponse
export type IIsFollowingUserResponse = IsFollowingUserResponse
