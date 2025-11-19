# User GraphQL Mutations

This directory contains GraphQL mutations for User CRUD operations. These mutations are designed for future use and require backend implementation in WordPress.

## 📁 Files

- **`userQueries.ts`** - GraphQL queries for reading user data (already implemented)
- **`userMutations.ts`** - GraphQL mutations for user CRUD operations (requires backend)
- **`userMutations.types.ts`** - TypeScript types for mutation inputs/outputs
- **`index.ts`** - Barrel export for easy imports

## 🚀 Available Mutations

### 1. CREATE_USER
Creates a new user account.

```typescript
import { CREATE_USER } from '@/app/graphql/User';
import { CreateUserInput, CreateUserResponse } from '@/app/graphql/User/userMutations.types';
import client from '@/app/graphql/client';

const createUser = async (input: CreateUserInput) => {
  const result = await client.mutate<CreateUserResponse>({
    mutation: CREATE_USER,
    variables: { input }
  });
  return result.data?.createUser;
};
```

**Input Fields:**
- `email` (required) - User email address
- `username` (required) - Username
- `password` (optional) - Password (not required for OAuth users)
- `birthdate` (optional) - User birthdate
- `gender` (optional) - User gender
- `customGender` (optional) - Custom gender option
- `pronoun` (optional) - User pronoun
- `palates` (optional) - Array of palate preferences
- `profileImage` (optional) - Profile image URL or base64
- `aboutMe` (optional) - About me text
- `isGoogleUser` (optional) - Boolean flag for Google OAuth users
- `googleToken` (optional) - Google OAuth token

### 2. UPDATE_USER
Updates user profile information.

```typescript
import { UPDATE_USER } from '@/app/graphql/User';
import { UpdateUserInput } from '@/app/graphql/User/userMutations.types';

const updateUser = async (input: UpdateUserInput) => {
  const result = await client.mutate({
    mutation: UPDATE_USER,
    variables: { input }
  });
  return result.data?.updateUser;
};
```

**Input Fields:**
- `userId` (required) - User ID to update
- All other fields are optional (email, username, birthdate, etc.)

### 3. UPDATE_USER_PROFILE
Updates specific profile fields (image, about me, palates).

```typescript
import { UPDATE_USER_PROFILE } from '@/app/graphql/User';

const updateProfile = async (userId: number, profileImage?: string, aboutMe?: string) => {
  const result = await client.mutate({
    mutation: UPDATE_USER_PROFILE,
    variables: {
      input: {
        userId,
        profileImage,
        aboutMe
      }
    }
  });
  return result.data?.updateUserProfile;
};
```

### 4. UPDATE_USER_PASSWORD
Updates user password.

```typescript
import { UPDATE_USER_PASSWORD } from '@/app/graphql/User';

const updatePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  const result = await client.mutate({
    mutation: UPDATE_USER_PASSWORD,
    variables: {
      input: {
        userId,
        currentPassword,
        newPassword
      }
    }
  });
  return result.data?.updateUserPassword;
};
```

### 5. DELETE_USER
Deletes a user account (destructive operation).

```typescript
import { DELETE_USER } from '@/app/graphql/User';

const deleteUser = async (userId: number, password?: string) => {
  const result = await client.mutate({
    mutation: DELETE_USER,
    variables: {
      input: {
        userId,
        password // Optional confirmation password
      }
    }
  });
  return result.data?.deleteUser;
};
```

### 6. REGISTER_USER_WITH_GOOGLE
Creates a new user account via Google OAuth.

**Minimal registration** - only requires `idToken`. Email and username are optional and auto-generated if not provided.

```typescript
import { REGISTER_USER_WITH_GOOGLE } from '@/app/graphql/User';

// Minimal usage - only idToken required
const registerWithGoogle = async (idToken: string) => {
  const result = await client.mutate({
    mutation: REGISTER_USER_WITH_GOOGLE,
    variables: {
      input: {
        idToken, // Required - backend extracts email from token
        // email: optional - override token email if needed
        // username: optional - auto-generated from email if not provided
      }
    }
  });
  return result.data?.registerUserWithGoogle;
};

// With optional custom username
const registerWithCustomUsername = async (idToken: string, username: string) => {
  const result = await client.mutate({
    mutation: REGISTER_USER_WITH_GOOGLE,
    variables: {
      input: {
        idToken,
        username, // Custom username instead of auto-generated
      }
    }
  });
  return result.data?.registerUserWithGoogle;
};
```

### 7. UPDATE_USER_META
Updates WordPress user meta fields (custom fields).

```typescript
import { UPDATE_USER_META } from '@/app/graphql/User';

const updateUserMeta = async (userId: number, meta: Array<{key: string, value: any}>) => {
  const result = await client.mutate({
    mutation: UPDATE_USER_META,
    variables: {
      input: {
        userId,
        meta
      }
    }
  });
  return result.data?.updateUserMeta;
};
```

## 🔧 Backend Implementation Required

These mutations require backend implementation in WordPress. You need to register them in your WordPress plugin:

### Example Backend Implementation

```php
// In tastyplates-user-rest-api-plugin.php

add_action('graphql_register_types', function () {
    // Register createUser mutation
    register_graphql_mutation('createUser', [
        'inputFields' => [
            'email' => [
                'type' => 'String',
                'description' => 'User email address',
            ],
            'username' => [
                'type' => 'String',
                'description' => 'Username',
            ],
            'password' => [
                'type' => 'String',
                'description' => 'Password (optional for OAuth users)',
            ],
            // ... other fields
        ],
        'outputFields' => [
            'user' => [
                'type' => 'User',
                'description' => 'The created user',
            ],
            'userId' => [
                'type' => 'Int',
                'description' => 'The created user ID',
            ],
            'token' => [
                'type' => 'String',
                'description' => 'JWT token for the user',
            ],
            'success' => [
                'type' => 'Boolean',
                'description' => 'Whether the operation was successful',
            ],
            'message' => [
                'type' => 'String',
                'description' => 'Response message',
            ],
        ],
        'mutateAndGetPayload' => function ($input) {
            // Reuse existing create_item logic from REST API
            $plugin = new TastyPlates_User_REST_API_Plugin();
            $request = new WP_REST_Request('POST', '/wp/v2/api/users');
            $request->set_body_params($input);
            
            $result = $plugin->create_item($request);
            
            if (is_wp_error($result)) {
                return [
                    'user' => null,
                    'userId' => null,
                    'token' => null,
                    'success' => false,
                    'message' => $result->get_error_message(),
                ];
            }
            
            // Generate JWT token
            $user_id = $result->data['id'];
            $token_result = $plugin->generateUnifiedToken($user_id, $input['email']);
            
            return [
                'user' => get_user_by('id', $user_id),
                'userId' => $user_id,
                'token' => $token_result['token'] ?? null,
                'success' => true,
                'message' => 'User created successfully',
            ];
        },
    ]);
    
    // Register other mutations similarly...
});
```

## 📝 Current Status

### ✅ Implemented
- GraphQL queries for reading user data (`GET_USER_BY_ID`)
- Mutation definitions and TypeScript types
- Type-safe interfaces for all mutations

### ⚠️ Pending Backend Implementation
- All mutations require WordPress backend registration
- Currently, user creation uses REST API (`POST /wp-json/wp/v2/api/users`)

## 🔄 Migration Path

To migrate from REST API to GraphQL:

1. **Backend**: Register all mutations in WordPress plugin
2. **Repository**: Update `UserRepository.registerUser()` to use GraphQL
3. **Service**: Update `UserService.registerUser()` if needed
4. **Testing**: Test all mutations thoroughly
5. **Deprecation**: Mark REST API endpoints as deprecated (optional)

## 📚 Usage Examples

### Complete Example: User Registration

```typescript
import client from '@/app/graphql/client';
import { CREATE_USER } from '@/app/graphql/User';
import { CreateUserInput, CreateUserResponse } from '@/app/graphql/User/userMutations.types';

export const registerUserWithGraphQL = async (userData: CreateUserInput) => {
  try {
    const result = await client.mutate<CreateUserResponse>({
      mutation: CREATE_USER,
      variables: {
        input: {
          email: userData.email,
          username: userData.username,
          password: userData.password,
          birthdate: userData.birthdate,
          palates: userData.palates,
          profileImage: userData.profileImage,
          aboutMe: userData.aboutMe,
          isGoogleUser: userData.isGoogleUser,
        }
      }
    });

    if (result.data?.createUser.success) {
      return {
        success: true,
        user: result.data.createUser.user,
        token: result.data.createUser.token,
      };
    }

    return {
      success: false,
      message: result.data?.createUser.message || 'Registration failed',
    };
  } catch (error) {
    console.error('GraphQL mutation error:', error);
    return {
      success: false,
      message: 'An error occurred during registration',
    };
  }
};
```

## 🎯 Benefits of Using GraphQL Mutations

1. **Type Safety**: Full TypeScript support with generated types
2. **Consistency**: Same API pattern as queries
3. **Flexibility**: Request only needed fields
4. **Single Endpoint**: All operations through GraphQL
5. **Better DX**: Improved developer experience with autocomplete

## ⚠️ Important Notes

- These mutations are **not yet functional** - they require backend implementation
- Current user creation still uses REST API
- Backend mutations should reuse existing REST API logic for consistency
- All mutations require proper authentication/authorization checks
- Consider rate limiting for mutations to prevent abuse

