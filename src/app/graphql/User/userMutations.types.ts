/**
 * TypeScript types for User GraphQL Mutations
 * 
 * These types correspond to the GraphQL mutation inputs and outputs
 * defined in userMutations.ts
 */

/**
 * Input type for CREATE_USER mutation
 */
export interface CreateUserInput {
  email: string;
  username: string;
  password?: string; // Optional for OAuth users
  birthdate?: string;
  gender?: string;
  customGender?: string;
  pronoun?: string;
  palates?: string[];
  profileImage?: string; // URL or base64
  aboutMe?: string;
  isGoogleUser?: boolean;
  googleToken?: string;
}

/**
 * Output type for CREATE_USER mutation
 */
export interface CreateUserResponse {
  createUser: {
    user: {
      id: string;
      databaseId: number;
      name: string;
      email: string;
      username: string;
      nicename: string;
    };
    userId: number;
    token: string;
    success: boolean;
    message?: string;
  };
}

/**
 * Input type for UPDATE_USER mutation
 */
export interface UpdateUserInput {
  userId: number;
  email?: string;
  username?: string;
  birthdate?: string;
  gender?: string;
  customGender?: string;
  pronoun?: string;
  palates?: string[];
  profileImage?: string;
  aboutMe?: string;
  language?: string;
}

/**
 * Output type for UPDATE_USER mutation
 */
export interface UpdateUserResponse {
  updateUser: {
    user: {
      id: string;
      databaseId: number;
      name: string;
      email: string;
      username: string;
      nicename: string;
      userProfile: {
        palates: string[];
        aboutMe: string;
        profileImage: {
          node: {
            mediaItemUrl: string;
          };
        };
      };
    };
    success: boolean;
    message?: string;
  };
}

/**
 * Input type for UPDATE_USER_PROFILE mutation
 */
export interface UpdateUserProfileInput {
  userId: number;
  profileImage?: string;
  aboutMe?: string;
  palates?: string[];
}

/**
 * Output type for UPDATE_USER_PROFILE mutation
 */
export interface UpdateUserProfileResponse {
  updateUserProfile: {
    user: {
      id: string;
      databaseId: number;
      userProfile: {
        palates: string[];
        aboutMe: string;
        profileImage: {
          node: {
            mediaItemUrl: string;
          };
        };
      };
    };
    success: boolean;
    message?: string;
  };
}

/**
 * Input type for UPDATE_USER_PASSWORD mutation
 */
export interface UpdateUserPasswordInput {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

/**
 * Output type for UPDATE_USER_PASSWORD mutation
 */
export interface UpdateUserPasswordResponse {
  updateUserPassword: {
    success: boolean;
    message?: string;
  };
}

/**
 * Input type for DELETE_USER mutation
 */
export interface DeleteUserInput {
  userId: number;
  password?: string; // Confirmation password
  reassignTo?: number; // User ID to reassign content to
}

/**
 * Output type for DELETE_USER mutation
 */
export interface DeleteUserResponse {
  deleteUser: {
    success: boolean;
    message?: string;
    deletedUserId?: number;
  };
}

/**
 * Input type for REGISTER_USER_WITH_GOOGLE mutation
 * Minimal fields required for Google OAuth registration
 */
export interface RegisterGoogleUserInput {
  idToken: string; // Google ID token (required for verification)
  email?: string; // Optional - extracted from token if not provided
  username?: string; // Optional - auto-generated from email if not provided
}

/**
 * Output type for REGISTER_USER_WITH_GOOGLE mutation
 */
export interface RegisterGoogleUserResponse {
  registerUserWithGoogle: {
    user: {
      id: string;
      databaseId: number;
      name: string;
      email: string;
      username: string;
      nicename: string;
      userProfile: {
        palates: string[];
        aboutMe: string;
        profileImage: {
          node: {
            mediaItemUrl: string;
          };
        };
      };
    };
    userId: number;
    token: string;
    success: boolean;
    message?: string;
  };
}

/**
 * Input type for UPDATE_USER_META mutation
 */
export interface UpdateUserMetaInput {
  userId: number;
  meta: Array<{
    key: string;
    value: string | number | boolean;
  }>;
}

/**
 * Output type for UPDATE_USER_META mutation
 */
export interface UpdateUserMetaResponse {
  updateUserMeta: {
    success: boolean;
    message?: string;
    meta?: Array<{
      key: string;
      value: string | number | boolean;
    }>;
  };
}

