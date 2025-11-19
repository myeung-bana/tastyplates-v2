<?php
/** Require the JWT library. */
use Tmeister\Firebase\JWT\JWT;

/*
Plugin Name: Tastyplates User REST API Plugin
Description: Unified REST API for user registration, login, Google OAuth, JWT, profile management, and password reset.
Version: 3.0
Author: Tastyplates
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

add_action('graphql_register_types', function () {
	register_graphql_field('RootQuery', 'userCommentCount', [
		'type' => 'ID',
		'args' => [
			'userId' => [
				'type' => 'ID',
			],
		],
		'resolve' => function ($root, $args) {
			global $wpdb;
			if (empty($args['userId']))
				return 0;

			return (int) $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $wpdb->comments WHERE user_id = %d AND comment_type = 'listing'",
				$args['userId']
			));
		},
	]);

	// ============================================
	// GRAPHQL MUTATIONS FOR USER OPERATIONS
	// ============================================

	/**
	 * CREATE_USER Mutation
	 * Creates a new user account (manual registration)
	 */
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
			'birthdate' => [
				'type' => 'String',
				'description' => 'User birthdate',
			],
			'gender' => [
				'type' => 'String',
			],
			'customGender' => [
				'type' => 'String',
			],
			'pronoun' => [
				'type' => 'String',
			],
			'palates' => [
				'type' => ['list_of' => 'String'],
			],
			'profileImage' => [
				'type' => 'String',
				'description' => 'Profile image URL or base64',
			],
			'aboutMe' => [
				'type' => 'String',
			],
			'isGoogleUser' => [
				'type' => 'Boolean',
			],
			'googleToken' => [
				'type' => 'String',
			],
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
			// Get plugin instance
			$plugin = new TastyPlates_User_REST_API_Plugin();
			
			// Create a mock REST request with GraphQL input
			$request = new WP_REST_Request('POST', '/wp/v2/api/users');
			
			// Map GraphQL input to REST API format
			$request->set_param('email', $input['email'] ?? '');
			$request->set_param('username', $input['username'] ?? '');
			$request->set_param('password', $input['password'] ?? '');
			$request->set_param('birthdate', $input['birthdate'] ?? '');
			$request->set_param('gender', $input['gender'] ?? '');
			$request->set_param('custom_gender', $input['customGender'] ?? '');
			$request->set_param('pronoun', $input['pronoun'] ?? '');
			$request->set_param('palates', isset($input['palates']) ? implode(',', $input['palates']) : '');
			$request->set_param('profile_image', $input['profileImage'] ?? '');
			$request->set_param('about_me', $input['aboutMe'] ?? '');
			$request->set_param('is_google_user', $input['isGoogleUser'] ?? false);
			$request->set_param('google_token', $input['googleToken'] ?? '');
			
			// Call existing REST API create_item method
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
			
			// Extract user ID from response
			$response_data = $result->get_data();
			$user_id = $response_data['id'] ?? null;
			if (!$user_id) {
				return [
					'user' => null,
					'userId' => null,
					'token' => null,
					'success' => false,
					'message' => 'User created but ID not found',
				];
			}
			
			// Generate JWT token using existing method
			$token_request = new WP_REST_Request('POST', '/wp/v2/api/users/unified-token');
			$token_request->set_param('user_id', $user_id);
			$token_request->set_param('email', $input['email']);
			$token_result = $plugin->generateUnifiedToken($token_request);
			
			$token_data = $token_result->get_data();
			
			// Get user object for GraphQL
			$user = get_user_by('id', $user_id);
			
			return [
				'user' => $user,
				'userId' => $user_id,
				'token' => $token_data['token'] ?? null,
				'success' => true,
				'message' => 'User created successfully',
			];
		},
	]);

	/**
	 * REGISTER_USER_WITH_GOOGLE Mutation
	 * Creates a new user account via Google OAuth
	 */
	register_graphql_mutation('registerUserWithGoogle', [
		'inputFields' => [
			'idToken' => [
				'type' => 'String',
				'description' => 'Google ID token (required for verification)',
			],
			'email' => [
				'type' => 'String',
				'description' => 'User email (optional, extracted from token if not provided)',
			],
			'username' => [
				'type' => 'String',
				'description' => 'Username (optional, auto-generated from email if not provided)',
			],
		],
		'outputFields' => [
			'user' => [
				'type' => 'User',
				'resolve' => function ($payload, $args, $context, $info) {
					if (empty($payload['userId'])) {
						return null;
					}
					// Resolve User type from ID using core WP_User object
					// WPGraphQL can serialize WP_User instances into the User type
					$user = get_user_by('id', $payload['userId']);
					if (!$user || is_wp_error($user)) {
						return null;
					}
					return $user;
				},
			],
			'userId' => [
				'type' => 'Int',
			],
			'token' => [
				'type' => 'String',
			],
			'success' => [
				'type' => 'Boolean',
			],
			'message' => [
				'type' => 'String',
			],
		],
		'mutateAndGetPayload' => function ($input) {
			try {
				$plugin = new TastyPlates_User_REST_API_Plugin();
				
				// Validate input
				if (empty($input['idToken'])) {
					error_log('[GraphQL registerUserWithGoogle] Missing idToken');
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => 'Google ID token is required',
					];
				}
				
				// Get Google client ID
				$google_client_id = get_option('google_oauth_client_id', '');
				if (empty($google_client_id)) {
					$google_client_id = defined('GOOGLE_CLIENT_ID') ? GOOGLE_CLIENT_ID : '';
				}
				
				if (empty($google_client_id)) {
					error_log('[GraphQL registerUserWithGoogle] Google OAuth not configured');
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => 'Google OAuth not configured',
					];
				}
				
				// Verify Google token
				$token_data = $plugin->verifyGoogleToken($input['idToken'], $google_client_id);
				if (!$token_data || !isset($token_data['email'])) {
					error_log('[GraphQL registerUserWithGoogle] Invalid Google token');
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => 'Invalid Google token',
					];
				}
				
				$email = $input['email'] ?? $token_data['email'];
				
				// Check if user already exists
				$existing_user = get_user_by('email', $email);
				if ($existing_user) {
					error_log('[GraphQL registerUserWithGoogle] User already exists: ' . $email);
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => 'User already exists. Please use login instead.',
					];
				}
				
				// Auto-generate username if not provided
				$username = $input['username'] ?? '';
				if (empty($username)) {
					$email_parts = explode('@', $email);
					$base_username = sanitize_user($email_parts[0], true);
					$username = $base_username;
					$counter = 1;
					while (username_exists($username)) {
						$username = $base_username . $counter;
						$counter++;
					}
				}
				
				// Create user via REST API endpoint (same as manual registration)
				// This ensures both manual and Google OAuth use the same registration flow
				error_log('[GraphQL registerUserWithGoogle] Creating user via REST API: ' . $email);
				
				$api_url = site_url('/wp-json/wp/v2/api/users');
				$response = wp_remote_post($api_url, [
					'headers' => [
						'Content-Type' => 'application/json',
					],
					'body' => json_encode([
						'email' => $email,
						'username' => $username,
						'is_google_user' => true,
						// Password auto-generated by backend when is_google_user=true
						// profile_image omitted - optional field
					]),
					'timeout' => 30,
					'sslverify' => false, // Set to true in production
				]);
				
				if (is_wp_error($response)) {
					error_log('[GraphQL registerUserWithGoogle] HTTP request error: ' . $response->get_error_message());
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => 'Failed to create user: ' . $response->get_error_message(),
					];
				}
				
				$http_code = wp_remote_retrieve_response_code($response);
				$body = wp_remote_retrieve_body($response);
				$response_data = json_decode($body, true);
				
				if ($http_code !== 200 && $http_code !== 201) {
					$error_message = $response_data['message'] ?? 'Failed to create user';
					error_log('[GraphQL registerUserWithGoogle] REST API error: HTTP ' . $http_code . ' - ' . $error_message);
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => $error_message,
					];
				}
				
				$user_id = $response_data['id'] ?? null;
				
				if (!$user_id) {
					error_log('[GraphQL registerUserWithGoogle] User created but ID not found. Response: ' . print_r($response_data, true));
					return [
						'userId' => null,
						'token' => null,
						'success' => false,
						'message' => 'User created but ID not found in response',
					];
				}
				
				error_log('[GraphQL registerUserWithGoogle] User created successfully via REST API. ID: ' . $user_id);
				
				// Generate JWT token via REST API endpoint (same approach for consistency)
				error_log('[GraphQL registerUserWithGoogle] Generating JWT token via REST API for user: ' . $user_id);
				
				$token_api_url = site_url('/wp-json/wp/v2/api/users/unified-token');
				$token_response = wp_remote_post($token_api_url, [
					'headers' => [
						'Content-Type' => 'application/json',
					],
					'body' => json_encode([
						'user_id' => $user_id,
						'email' => $email,
					]),
					'timeout' => 30,
					'sslverify' => false, // Set to true in production
				]);
				
				if (is_wp_error($token_response)) {
					error_log('[GraphQL registerUserWithGoogle] Token HTTP request error: ' . $token_response->get_error_message());
					return [
						'userId' => $user_id,
						'token' => null,
						'success' => false,
						'message' => 'User created but token generation failed: ' . $token_response->get_error_message(),
					];
				}
				
				$token_http_code = wp_remote_retrieve_response_code($token_response);
				$token_body = wp_remote_retrieve_body($token_response);
				$token_data = json_decode($token_body, true);
				
				if ($token_http_code !== 200 && $token_http_code !== 201) {
					$error_message = $token_data['message'] ?? 'Failed to generate token';
					error_log('[GraphQL registerUserWithGoogle] Token REST API error: HTTP ' . $token_http_code . ' - ' . $error_message);
					return [
						'userId' => $user_id,
						'token' => null,
						'success' => false,
						'message' => 'User created but token generation failed: ' . $error_message,
					];
				}
				
				$token = $token_data['token'] ?? null;
				
				if (!$token) {
					error_log('[GraphQL registerUserWithGoogle] Token generation returned no token. Response: ' . print_r($token_data, true));
					return [
						'userId' => $user_id,
						'token' => null,
						'success' => false,
						'message' => 'User created but token not found in response',
					];
				}
				
				error_log('[GraphQL registerUserWithGoogle] Registration successful. User ID: ' . $user_id . ', Token generated');
				
				// Return user ID (GraphQL will resolve the User type from ID)
				return [
					'userId' => $user_id,
					'token' => $token,
					'success' => true,
					'message' => 'User registered successfully via Google OAuth',
				];
			} catch (Exception $e) {
				error_log('[GraphQL registerUserWithGoogle] Exception: ' . $e->getMessage());
				error_log('[GraphQL registerUserWithGoogle] Stack trace: ' . $e->getTraceAsString());
				return [
					'userId' => null,
					'token' => null,
					'success' => false,
					'message' => 'An error occurred during registration: ' . $e->getMessage(),
				];
			}
		},
	]);

	/**
	 * UPDATE_USER Mutation
	 * Updates user profile information
	 */
	register_graphql_mutation('updateUser', [
		'inputFields' => [
			'userId' => [
				'type' => 'Int',
				'description' => 'User ID to update',
			],
			'email' => [
				'type' => 'String',
			],
			'username' => [
				'type' => 'String',
			],
			'birthdate' => [
				'type' => 'String',
			],
			'gender' => [
				'type' => 'String',
			],
			'customGender' => [
				'type' => 'String',
			],
			'pronoun' => [
				'type' => 'String',
			],
			'palates' => [
				'type' => ['list_of' => 'String'],
			],
			'profileImage' => [
				'type' => 'String',
			],
			'aboutMe' => [
				'type' => 'String',
			],
			'language' => [
				'type' => 'String',
			],
		],
		'outputFields' => [
			'user' => [
				'type' => 'User',
			],
			'success' => [
				'type' => 'Boolean',
			],
			'message' => [
				'type' => 'String',
			],
		],
		'mutateAndGetPayload' => function ($input) {
			$plugin = new TastyPlates_User_REST_API_Plugin();
			
			// Create REST request for update_user_fields
			$request = new WP_REST_Request('PUT', '/wp/v2/api/users/update-fields');
			
			// Map GraphQL input to REST API format
			if (isset($input['email'])) {
				$request->set_param('email', $input['email']);
			}
			if (isset($input['username'])) {
				$request->set_param('username', $input['username']);
			}
			if (isset($input['birthdate'])) {
				$request->set_param('birthdate', $input['birthdate']);
			}
			if (isset($input['language'])) {
				$request->set_param('language', $input['language']);
			}
			if (isset($input['palates'])) {
				$request->set_param('palates', implode(',', $input['palates']));
			}
			if (isset($input['profileImage'])) {
				$request->set_param('profile_image', $input['profileImage']);
			}
			if (isset($input['aboutMe'])) {
				$request->set_param('about_me', $input['aboutMe']);
			}
			
			// Set current user context (required for update_user_fields)
			$user_id = $input['userId'] ?? get_current_user_id();
			if ($user_id) {
				wp_set_current_user($user_id);
			}
			
			$result = $plugin->update_user_fields($request);
			
			if (is_wp_error($result)) {
				return [
					'user' => null,
					'success' => false,
					'message' => $result->get_error_message(),
				];
			}
			
			$user = get_user_by('id', $user_id);
			
			return [
				'user' => $user,
				'success' => true,
				'message' => 'User updated successfully',
			];
		},
	]);

	/**
	 * UPDATE_USER_PROFILE Mutation
	 * Updates specific profile fields (image, about me, palates)
	 */
	register_graphql_mutation('updateUserProfile', [
		'inputFields' => [
			'userId' => [
				'type' => 'Int',
				'description' => 'User ID to update',
			],
			'profileImage' => [
				'type' => 'String',
			],
			'aboutMe' => [
				'type' => 'String',
			],
			'palates' => [
				'type' => ['list_of' => 'String'],
			],
		],
		'outputFields' => [
			'user' => [
				'type' => 'User',
			],
			'success' => [
				'type' => 'Boolean',
			],
			'message' => [
				'type' => 'String',
			],
		],
		'mutateAndGetPayload' => function ($input) {
			$plugin = new TastyPlates_User_REST_API_Plugin();
			
			$request = new WP_REST_Request('PUT', '/wp/v2/api/users/update-fields');
			
			if (isset($input['profileImage'])) {
				$request->set_param('profile_image', $input['profileImage']);
			}
			if (isset($input['aboutMe'])) {
				$request->set_param('about_me', $input['aboutMe']);
			}
			if (isset($input['palates'])) {
				$request->set_param('palates', implode(',', $input['palates']));
			}
			
			$user_id = $input['userId'] ?? get_current_user_id();
			if ($user_id) {
				wp_set_current_user($user_id);
			}
			
			$result = $plugin->update_user_fields($request);
			
			if (is_wp_error($result)) {
				return [
					'user' => null,
					'success' => false,
					'message' => $result->get_error_message(),
				];
			}
			
			$user = get_user_by('id', $user_id);
			
			return [
				'user' => $user,
				'success' => true,
				'message' => 'Profile updated successfully',
			];
		},
	]);

	/**
	 * UPDATE_USER_PASSWORD Mutation
	 * Updates user password
	 */
	register_graphql_mutation('updateUserPassword', [
		'inputFields' => [
			'userId' => [
				'type' => 'Int',
				'description' => 'User ID',
			],
			'currentPassword' => [
				'type' => 'String',
				'description' => 'Current password for verification',
			],
			'newPassword' => [
				'type' => 'String',
				'description' => 'New password',
			],
		],
		'outputFields' => [
			'success' => [
				'type' => 'Boolean',
			],
			'message' => [
				'type' => 'String',
			],
		],
		'mutateAndGetPayload' => function ($input) {
			$plugin = new TastyPlates_User_REST_API_Plugin();
			
			$user_id = $input['userId'] ?? get_current_user_id();
			if (!$user_id) {
				return [
					'success' => false,
					'message' => 'User ID is required',
				];
			}
			
			// Verify current password
			$validate_request = new WP_REST_Request('POST', '/wp/v2/api/users/validate-password');
			$validate_request->set_param('password', $input['currentPassword']);
			wp_set_current_user($user_id);
			
			$validate_result = $plugin->validate_current_password($validate_request);
			$validate_data = $validate_result->get_data();
			
			if (!$validate_data['valid']) {
				return [
					'success' => false,
					'message' => 'Current password is incorrect',
				];
			}
			
			// Update password
			$update_request = new WP_REST_Request('PUT', '/wp/v2/api/users/update-fields');
			$update_request->set_param('password', $input['newPassword']);
			
			$result = $plugin->update_user_fields($update_request);
			
			if (is_wp_error($result)) {
				return [
					'success' => false,
					'message' => $result->get_error_message(),
				];
			}
			
			return [
				'success' => true,
				'message' => 'Password updated successfully',
			];
		},
	]);

	/**
	 * DELETE_USER Mutation
	 * Deletes a user account (destructive operation)
	 */
	register_graphql_mutation('deleteUser', [
		'inputFields' => [
			'userId' => [
				'type' => 'Int',
				'description' => 'User ID to delete',
			],
			'password' => [
				'type' => 'String',
				'description' => 'Confirmation password (optional)',
			],
			'reassignTo' => [
				'type' => 'Int',
				'description' => 'User ID to reassign content to',
			],
		],
		'outputFields' => [
			'success' => [
				'type' => 'Boolean',
			],
			'message' => [
				'type' => 'String',
			],
			'deletedUserId' => [
				'type' => 'Int',
			],
		],
		'mutateAndGetPayload' => function ($input) {
			$plugin = new TastyPlates_User_REST_API_Plugin();
			
			$user_id = $input['userId'] ?? get_current_user_id();
			if (!$user_id) {
				return [
					'success' => false,
					'message' => 'User ID is required',
					'deletedUserId' => null,
				];
			}
			
			// Verify password if provided
			if (!empty($input['password'])) {
				$validate_request = new WP_REST_Request('POST', '/wp/v2/api/users/validate-password');
				$validate_request->set_param('password', $input['password']);
				wp_set_current_user($user_id);
				
				$validate_result = $plugin->validate_current_password($validate_request);
				$validate_data = $validate_result->get_data();
				
				if (!$validate_data['valid']) {
					return [
						'success' => false,
						'message' => 'Password verification failed',
						'deletedUserId' => null,
					];
				}
			}
			
			// Delete user via REST API
			$request = new WP_REST_Request('DELETE', '/wp/v2/api/users/' . $user_id);
			$request->set_param('id', $user_id);
			$request->set_param('force', true);
			if (isset($input['reassignTo'])) {
				$request->set_param('reassign', $input['reassignTo']);
			}
			
			$result = $plugin->delete_item($request);
			
			if (is_wp_error($result)) {
				return [
					'success' => false,
					'message' => $result->get_error_message(),
					'deletedUserId' => null,
				];
			}
			
			return [
				'success' => true,
				'message' => 'User deleted successfully',
				'deletedUserId' => $user_id,
			];
		},
	]);

	/**
	 * UPDATE_USER_META Mutation
	 * Updates WordPress user meta fields (custom fields)
	 */
	register_graphql_mutation('updateUserMeta', [
		'inputFields' => [
			'userId' => [
				'type' => 'Int',
				'description' => 'User ID',
			],
			'meta' => [
				'type' => ['list_of' => 'MetaInput'],
				'description' => 'Array of meta key-value pairs',
			],
		],
		'outputFields' => [
			'success' => [
				'type' => 'Boolean',
			],
			'message' => [
				'type' => 'String',
			],
			'meta' => [
				'type' => ['list_of' => 'MetaOutput'],
			],
		],
		'mutateAndGetPayload' => function ($input) {
			$user_id = $input['userId'] ?? get_current_user_id();
			if (!$user_id) {
				return [
					'success' => false,
					'message' => 'User ID is required',
					'meta' => [],
				];
			}
			
			$updated_meta = [];
			foreach ($input['meta'] ?? [] as $meta_item) {
				$key = $meta_item['key'] ?? '';
				$value = $meta_item['value'] ?? '';
				
				if (!empty($key)) {
					update_user_meta($user_id, $key, $value);
					$updated_meta[] = [
						'key' => $key,
						'value' => $value,
					];
				}
			}
			
			return [
				'success' => true,
				'message' => 'User meta updated successfully',
				'meta' => $updated_meta,
			];
		},
	]);
});

class TastyPlates_User_REST_API_Plugin extends WP_REST_Controller {
	protected $namespace;
	protected $rest_base;
	protected $meta;
	protected $schema;

	/**
	 * Retrieve the JWT secret key used for encoding/decoding tokens.
	 *
	 * Preference order:
	 * 1. GRAPHQL_JWT_AUTH_SECRET_KEY (GraphQL-specific secret)
	 * 2. JWT_AUTH_SECRET_KEY (standard JWT Auth plugin secret)
	 *
	 * This allows you to define only GRAPHQL_JWT_AUTH_SECRET_KEY in wp-config.php
	 * and still keep backward compatibility if JWT_AUTH_SECRET_KEY is present.
	 *
	 * @return string Secret key or empty string if none defined.
	 */
	protected function get_jwt_secret_key() {
		if ( defined( 'GRAPHQL_JWT_AUTH_SECRET_KEY' ) && GRAPHQL_JWT_AUTH_SECRET_KEY ) {
			return GRAPHQL_JWT_AUTH_SECRET_KEY;
		}

		if ( defined( 'JWT_AUTH_SECRET_KEY' ) && JWT_AUTH_SECRET_KEY ) {
			return JWT_AUTH_SECRET_KEY;
		}

		return '';
	}

	public function __construct() {
		$this->namespace = 'wp/v2/api';
		$this->rest_base = 'users';
		$this->meta = new WP_REST_User_Meta_Fields();
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Log debug information for user registration and login
	 * 
	 * @param string $action Action being performed (e.g., 'registration', 'login', 'oauth')
	 * @param string $status Status of the action ('success', 'error', 'validation_error')
	 * @param array $data Additional data to log (will exclude sensitive fields like passwords)
	 * @param WP_Error|null $error Error object if action failed
	 */
	private function log_user_action( $action, $status, $data = array(), $error = null ) {
		// Get client IP address
		$ip_address = '';
		if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			$ip_address = $_SERVER['HTTP_CLIENT_IP'];
		} elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
		} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip_address = $_SERVER['REMOTE_ADDR'];
		}

		// Sanitize data - remove sensitive information
		$sanitized_data = $data;
		unset( $sanitized_data['password'] );
		unset( $sanitized_data['user_pass'] );
		if ( isset( $sanitized_data['id_token'] ) ) {
			$sanitized_data['id_token'] = substr( $sanitized_data['id_token'], 0, 20 ) . '...';
		}
		if ( isset( $sanitized_data['token'] ) ) {
			$sanitized_data['token'] = substr( $sanitized_data['token'], 0, 20 ) . '...';
		}

		// Build log message
		$log_message = sprintf(
			'[TastyPlates User API] %s - %s | IP: %s | Time: %s',
			strtoupper( $action ),
			strtoupper( $status ),
			$ip_address,
			current_time( 'mysql' )
		);

		// Add data to log
		if ( ! empty( $sanitized_data ) ) {
			$log_message .= ' | Data: ' . wp_json_encode( $sanitized_data, JSON_UNESCAPED_SLASHES );
		}

		// Add error details if present
		if ( $error && is_wp_error( $error ) ) {
			$error_messages = array();
			foreach ( $error->get_error_codes() as $code ) {
				$error_messages[ $code ] = $error->get_error_message( $code );
			}
			$log_message .= ' | Error: ' . wp_json_encode( $error_messages, JSON_UNESCAPED_SLASHES );
		}

		// Write to error log
		error_log( $log_message );
	}

	/**
	 * Registers the routes for users.
	 *
	 * @since 4.7.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => '__return_true', // Allow public user registration
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/google-check',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'checkGoogleUser'),
					'permission_callback' => '__return_true',
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/google-token',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'generateGoogleUserToken'),
					'permission_callback' => '__return_true',
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/unified-token',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'generateUnifiedToken'),
					'permission_callback' => '__return_true',
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/google-oauth',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'handleGoogleOAuth'),
					'permission_callback' => '__return_true',
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/check-email',
			array(
				array(
					'methods'  => WP_REST_Server::CREATABLE,
					'callback' => array( $this, 'check_email_exists' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/check-username',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array($this, 'check_username_exists'),
					'args'                => array(
						'username' => array(
							'required'          => true,
							'type'             => 'string',
							'description'       => __('Username to check.'),
							'validate_callback' => function($param) {
								return is_string($param) && !empty($param);
							}
						)
					)
				),
				'schema' => array($this, 'get_public_item_schema')
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/current',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_current_user' ),
					'permission_callback' => array( $this, 'get_current_user_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/update-fields',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array($this, 'update_user_fields'),
					'permission_callback' => function () {
						return is_user_logged_in(); // Only allow authenticated users
					},
					'args'                => array(
						'username' => array(
							'type'     => 'string',
							'required' => false,
						),
						'email'    => array(
							'type'     => 'string',
							'required' => false,
						),
						'password' => array(
							'type'     => 'string',
							'required' => false,
						),
						'birthdate' => array(
							'type'     => 'string',
							'required' => false,
						),
						'language' => array(
							'type'     => 'string',
							'required' => false,
						),
						'palates' => array(
							'type'     => 'string',
							'required' => false,
						),
						'profile_image' => array(
							'type'     => 'string',
							'required' => false,
							'description' => __('URL of the profile image to update.'),
						),
					),
				)
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/validate-password',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array($this, 'validate_current_password'),
					'permission_callback' => function() {
						return is_user_logged_in();
					},
					'args'               => array(
						'password' => array(
							'required'          => true,
							'type'             => 'string',
							'description'       => __('Current user password to validate.'),
							'validate_callback' => function($param) {
								return is_string($param) && !empty($param);
							}
						)
					)
				)
			)
		);

		register_rest_route($this->namespace, '/' . $this->rest_base . '/forgot-password', array(
			'methods'  			  => WP_REST_Server::CREATABLE,
			'callback'            => array($this, 'forgotPasswordEmail'),
			'permission_callback' => '__return_true'
		));

		register_rest_route($this->namespace, '/' . $this->rest_base .  '/verify-reset-token', array(
			'methods'  => 'GET',
			'callback' => array($this, 'verifyResetToken'),
			'permission_callback' => '__return_true'
		));	

		register_rest_route($this->namespace, '/' . $this->rest_base . '/reset-password', array(
			'methods'             => WP_REST_Server::EDITABLE, // PATCH or POST
			'callback'            => array($this, 'resetPassword'),
			'permission_callback' => '__return_true'
		));
	}

	public function forgotPasswordEmail( WP_REST_Request $request)  {
		$email        = sanitize_email($request->get_param('email'));
		$frontend_url = esc_url_raw($request->get_param('url'));

		$logo_url = 'https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/wp-content/uploads/2024/07/TastyPlates_Logo_Colour.png';

		$user = get_user_by('email', $email);
		if (!$user) {
			return new WP_REST_Response([
				'status' => false,
				'message' => "Sorry, couldn't find this email"
			], 404);
		}

		$user_id   = $user->ID;
		$first_name = $user->first_name;

		// ✅ Check if user is a Google user
		$is_google_user = get_user_meta( $user_id, 'is_google_user', true );

		if ( $is_google_user === '1' ) {
			return new WP_REST_Response( [
				'status'  => false,
				'message' => 'Sorry, password reset is not available for Google login accounts.'
			], 403 );
		}
		
		// Fallback to user meta if first_name is empty
		if (empty($first_name)) {
			$first_name = get_user_meta($user_id, 'first_name', true);
		}
		
		// Final fallback to email username if still empty
		if (empty($first_name)) {
			$email_parts = explode('@', $email);
			$first_name = $email_parts[0];
		}
	
		$token     = bin2hex(random_bytes(32)); // ✅ Generate secure token in backend
		$expiresAt = time() + 3600; // 1 hour

		// Store token and expiration in user meta
		update_user_meta($user_id, 'reset_token', $token);
		update_user_meta($user_id, 'reset_expires_at', $expiresAt);

		// Build reset URL using frontend's origin
		$resetLink = "{$frontend_url}/reset-password?token={$token}";

		$subject = 'Reset your Password';
		$message = "<img src='{$logo_url}' alt='Logo' style='max-width:200px; height:auto;'/>
			<p style='font-size: 14px;'>Hi {$first_name},</p>
            <p style='font-size: 14px;'>We've received a request to reset your password.</p>
            <p style='font-size: 14px;'>If you didn't make the request, just ignore this message. Otherwise, you can reset your password.</p>
            <a href='{$resetLink}'
				style='
					display: inline-block;
					background: #E36B00;
					border-radius: 12px;
					color: white;
					padding: 10px 20px;
					font-weight: 500;
					font-size: 14px;
					text-decoration: none;
					border: none;
					cursor: pointer;
				'>
				Reset Your Password
            </a>";

		$headers = array('Content-Type: text/html; charset=UTF-8');
		// Send email
		wp_mail($email, $subject, $message, $headers);

		return new WP_REST_Response([
			'status' => true,
			'data' => $logo_url,
			'message' => 'Password reset email sent.'
		], 200);
	}

	public function verifyResetToken( WP_REST_Request $request ) {
		$token = sanitize_text_field($request->get_param('token'));
	
		if (empty($token)) {
			return new WP_REST_Response([
				'status'  => false,
				'message' => 'Missing token'
			], 400);
		}
	
		// Find user by meta value (reset_token)
		$user_query = new WP_User_Query(array(
			'meta_key'   => 'reset_token',
			'meta_value' => $token,
			'number'     => 1,
			'count_total' => false,
		));
	
		$users = $user_query->get_results();
		if (empty($users)) {
			return new WP_REST_Response([
				'status'  => false,
				'message' => 'Invalid or expired token'
			], 401);
		}
	
		$user      = $users[0];
		$user_id   = $user->ID;
		$expires_at = intval(get_user_meta($user_id, 'reset_expires_at', true));
		$current_time = time();
	
		if ($current_time > $expires_at) {
			return new WP_REST_Response([
				'status'  => false,
				'message' => 'Token expired'
			], 401);
		}
	
		return new WP_REST_Response([
			'status'  => true,
			'message' => 'Token is valid',
		], 200);
	}
	public function resetPassword( WP_REST_Request $request ) {
		$token       = sanitize_text_field( $request->get_param( 'token' ) );
		$newPassword = $request->get_param( 'password' );
	
		if ( empty( $token ) || empty( $newPassword ) ) {
			return new WP_REST_Response( [
				'status'  => false,
				'message' => 'Token and new password are required.'
			], 400 );
		}
	
		// Look up user by token
		$user_query = new WP_User_Query( [
			'meta_key'   => 'reset_token',
			'meta_value' => $token,
			'number'     => 1,
			'count_total'=> false,
		] );
	
		$users = $user_query->get_results();
		if ( empty( $users ) ) {
			return new WP_REST_Response( [
				'status'  => false,
				'message' => 'Invalid or expired token.'
			], 401 );
		}
	
		$user        = $users[0];
		$user_id     = $user->ID;
		$expires_at  = intval( get_user_meta( $user_id, 'reset_expires_at', true ) );
		$currentTime = time();
	
		if ( $currentTime > $expires_at ) {
			return new WP_REST_Response( [
				'status'  => false,
				'message' => 'Token has expired.'
			], 401 );
		}
	
		// Update password
		wp_set_password( $newPassword, $user_id );
	
		// Clean up reset token data
		delete_user_meta( $user_id, 'reset_token' );
		delete_user_meta( $user_id, 'reset_expires_at' );
	
		return new WP_REST_Response( [
			'status'  => true,
			'message' => 'Password has been successfully updated.'
		], 200 );
	}	

	/**
	 * Check if Google user exists and return user info (no token generation)
	 * Token generation is handled by generateGoogleUserToken() using JWT Auth plugin
	 */
	public function checkGoogleUser( $request ) {
		global $wpdb;

		// Accept email from POST body or query param
		$email = $request->get_param('email');
		if (empty($email)) {
			$params = $request->get_json_params();
			$email = isset($params['email']) ? $params['email'] : '';
		}

		if (empty($email)) {
			return new WP_REST_Response(array(
				'message' => 'Email parameter is required.',
				'status' => 400,
			), 400);
		}

		// Query user by email
		$user = get_user_by('email', $email);
		if (!$user) {
			return new WP_REST_Response(array(
				'message' => 'Sorry, this account does not exist.',
				'status' => 404,
			), 404);
		}

		// Check is_google_user column in wp_users table
		$is_google_user = $wpdb->get_var( $wpdb->prepare(
			"SELECT is_google_user FROM {$wpdb->users} WHERE ID = %d",
			$user->ID
		) );

		// If not found or falsey in users table, check usermeta.
		if ( empty($is_google_user) ) {
			$is_google_user = get_user_meta( $user->ID, 'is_google_user', true );
		}

		if ($is_google_user == 1) {
			// Return user info only - token will be generated via JWT Auth plugin
			return new WP_REST_Response([
				'id' => $user->ID,
				'user_login' => $user->user_login,
				'user_email' => $user->user_email,
				'display_name' => $user->display_name,
				'message' => 'Google user verified.',
				'status' => 200,
			], 200);
		} else {
			return new WP_REST_Response( array(
				'message' => 'Email already exists by another account.',
				'status' => 409,
			), 409 );
		}
	}

	/**
	 * Unified token generation endpoint
	 * Works for both manual login (with password) and Google OAuth (without password)
	 * Uses JWT Auth plugin's exact token structure and secret key
	 * Token structure matches JWT Auth plugin: data.user.ID
	 */
	public function generateUnifiedToken( $request ) {
		global $wpdb;

		// Accept parameters from POST body
		$user_id = $request->get_param('user_id');
		$email = $request->get_param('email');
		$password = $request->get_param('password'); // Optional - only for manual login
		
		if (empty($user_id) && empty($email)) {
			$params = $request->get_json_params();
			$user_id = isset($params['user_id']) ? $params['user_id'] : null;
			$email = isset($params['email']) ? $params['email'] : null;
			$password = isset($params['password']) ? $params['password'] : null;
		}

		// Log login attempt
		$login_type = ! empty( $password ) ? 'manual' : 'oauth';
		$this->log_user_action( 'login', 'attempt', array(
			'type' => $login_type,
			'email' => $email,
			'user_id' => $user_id,
		) );

		if (empty($user_id) && empty($email)) {
			$error = new WP_Error(
				'rest_missing_params',
				'User ID or email parameter is required.',
				array( 'status' => 400 )
			);
			$this->log_user_action( 'login', 'validation_error', array(
				'type' => $login_type,
			), $error );
			return new WP_REST_Response(array(
				'message' => 'User ID or email parameter is required.',
				'status' => 400,
			), 400);
		}

		// Get user by ID or email
		if ($user_id) {
			$user = get_user_by('id', $user_id);
		} else {
			$user = get_user_by('email', $email);
		}

		if (!$user) {
			$error = new WP_Error(
				'rest_user_not_found',
				'User not found.',
				array( 'status' => 404 )
			);
			$this->log_user_action( 'login', 'error', array(
				'type' => $login_type,
				'email' => $email,
				'user_id' => $user_id,
			), $error );
			return new WP_REST_Response(array(
				'message' => 'User not found.',
				'status' => 404,
			), 404);
		}

		// Authentication verification
		if (!empty($password)) {
			// Manual login: verify password
			if (!wp_check_password($password, $user->user_pass, $user->ID)) {
				$error = new WP_Error(
					'rest_invalid_password',
					'Invalid password.',
					array( 'status' => 401 )
				);
				$this->log_user_action( 'login', 'error', array(
					'type' => 'manual',
					'user_id' => $user->ID,
					'email' => $user->user_email,
				), $error );
				return new WP_REST_Response(array(
					'message' => 'Invalid password.',
					'status' => 401,
				), 401);
			}
		} else {
			// Google OAuth: verify it's a Google user
			$is_google_user = $wpdb->get_var( $wpdb->prepare(
				"SELECT is_google_user FROM {$wpdb->users} WHERE ID = %d",
				$user->ID
			) );

			if ( empty($is_google_user) ) {
				$is_google_user = get_user_meta( $user->ID, 'is_google_user', true );
			}

			if ($is_google_user != 1) {
				$error = new WP_Error(
					'rest_not_google_user',
					'User is not a Google OAuth user.',
					array( 'status' => 403 )
				);
				$this->log_user_action( 'login', 'error', array(
					'type' => 'oauth',
					'user_id' => $user->ID,
					'email' => $user->user_email,
				), $error );
				return new WP_REST_Response(array(
					'message' => 'User is not a Google OAuth user.',
					'status' => 403,
				), 403);
			}
		}

		// Set WordPress user session for compatibility
		wp_set_current_user( $user->ID );

		// Generate JWT token using JWT Auth plugin's standard structure
		// This matches the token format used by manual login via JWT Auth plugin
		$secret_key = $this->get_jwt_secret_key();
		if ( empty( $secret_key ) ) {
			return new WP_REST_Response( array(
				'message' => 'JWT secret key not configured.',
				'status' => 500,
			), 500 );
		}

		$issuedAt = time();
		$expire = $issuedAt + ( DAY_IN_SECONDS * 7 );
		
		// Use JWT Auth plugin's standard token structure (matches manual login)
		$token = array(
			'iss' => get_bloginfo( 'url' ),
			'iat' => $issuedAt,
			'nbf' => $issuedAt,
			'exp' => $expire,
			'data' => array(
				'user' => array(
					'ID' => $user->ID,
					'user_login' => $user->user_login,
					'user_email' => $user->user_email,
					'user_nicename' => $user->user_nicename,
					'display_name' => $user->display_name,
				)
			)
		);

		$jwt = JWT::encode( $token, $secret_key, 'HS256' );

		// Log successful login
		$this->log_user_action( 'login', 'success', array(
			'type' => $login_type,
			'user_id' => $user->ID,
			'email' => $user->user_email,
			'username' => $user->user_login,
		) );

		return new WP_REST_Response( array(
			'token' => $jwt,
			'user_email' => $user->user_email,
			'user_nicename' => $user->user_nicename,
			'user_display_name' => $user->display_name,
			'id' => $user->ID,
			'status' => 200,
		), 200 );
	}

	/**
	 * Handle Google OAuth authentication
	 * Accepts Google ID token, verifies it with Google, and returns JWT token
	 * This unifies OAuth with manual login - both return JWT tokens from WordPress
	 */
	public function handleGoogleOAuth( $request ) {
		global $wpdb;
		
		// Get Google ID token from request
		$id_token = $request->get_param('id_token');
		if (empty($id_token)) {
			$params = $request->get_json_params();
			$id_token = isset($params['id_token']) ? $params['id_token'] : null;
		}
		
		// Log OAuth attempt
		$this->log_user_action( 'oauth', 'attempt', array(
			'has_id_token' => ! empty( $id_token ),
		) );
		
		if (empty($id_token)) {
			$error = new WP_Error(
				'rest_missing_id_token',
				'Google ID token is required.',
				array( 'status' => 400 )
			);
			$this->log_user_action( 'oauth', 'validation_error', array(), $error );
			return new WP_REST_Response(array(
				'message' => 'Google ID token is required.',
				'status' => 400,
			), 400);
		}
		
		// Verify Google ID token with Google's API
		// Get client ID from WordPress options or constant
		$google_client_id = get_option('google_oauth_client_id', '');
		if (empty($google_client_id)) {
			$google_client_id = defined('GOOGLE_CLIENT_ID') ? GOOGLE_CLIENT_ID : '';
		}
		
		if (empty($google_client_id)) {
			$error = new WP_Error(
				'rest_oauth_not_configured',
				'Google OAuth not configured.',
				array( 'status' => 500 )
			);
			$this->log_user_action( 'oauth', 'error', array(), $error );
			return new WP_REST_Response(array(
				'message' => 'Google OAuth not configured.',
				'status' => 500,
			), 500);
		}
		
		// Verify token with Google
		$token_data = $this->verifyGoogleToken($id_token, $google_client_id);
		if (!$token_data || !isset($token_data['email'])) {
			$error = new WP_Error(
				'rest_invalid_google_token',
				'Invalid Google token.',
				array( 'status' => 401 )
			);
			$this->log_user_action( 'oauth', 'error', array(
				'token_verified' => false,
			), $error );
			return new WP_REST_Response(array(
				'message' => 'Invalid Google token.',
				'status' => 401,
			), 401);
		}
		
		$email = $token_data['email'];
		$name = $token_data['name'] ?? '';
		$google_id = $token_data['sub'] ?? '';
		
		// Check if user exists
		$user = get_user_by('email', $email);
		
		if (!$user) {
			// User doesn't exist - return error (registration should happen separately)
			$error = new WP_Error(
				'rest_user_not_found',
				'User not found. Please register first.',
				array( 'status' => 404 )
			);
			$this->log_user_action( 'oauth', 'error', array(
				'email' => $email,
			), $error );
			return new WP_REST_Response(array(
				'message' => 'User not found. Please register first.',
				'status' => 404,
			), 404);
		}
		
		// Verify it's a Google user
		$is_google_user = $wpdb->get_var( $wpdb->prepare(
			"SELECT is_google_user FROM {$wpdb->users} WHERE ID = %d",
			$user->ID
		) );
		
		if ( empty($is_google_user) ) {
			$is_google_user = get_user_meta( $user->ID, 'is_google_user', true );
		}
		
		if ($is_google_user != 1) {
			$error = new WP_Error(
				'rest_not_google_user',
				'User is not a Google OAuth user.',
				array( 'status' => 403 )
			);
			$this->log_user_action( 'oauth', 'error', array(
				'user_id' => $user->ID,
				'email' => $email,
			), $error );
			return new WP_REST_Response(array(
				'message' => 'User is not a Google OAuth user.',
				'status' => 403,
			), 403);
		}
		
		// Set WordPress user session
		wp_set_current_user( $user->ID );
		
		// Generate JWT token using JWT Auth plugin's standard structure
		$secret_key = $this->get_jwt_secret_key();
		if ( empty( $secret_key ) ) {
			return new WP_REST_Response( array(
				'message' => 'JWT secret key not configured.',
				'status' => 500,
			), 500 );
		}
		
		$issuedAt = time();
		$expire = $issuedAt + ( DAY_IN_SECONDS * 7 );
		
		$token = array(
			'iss' => get_bloginfo( 'url' ),
			'iat' => $issuedAt,
			'nbf' => $issuedAt,
			'exp' => $expire,
			'data' => array(
				'user' => array(
					'ID' => $user->ID,
					'user_login' => $user->user_login,
					'user_email' => $user->user_email,
					'user_nicename' => $user->user_nicename,
					'display_name' => $user->display_name,
				)
			)
		);
		
		$jwt = JWT::encode( $token, $secret_key, 'HS256' );
		
		// Log successful OAuth login
		$this->log_user_action( 'oauth', 'success', array(
			'user_id' => $user->ID,
			'email' => $user->user_email,
			'username' => $user->user_login,
		) );
		
		return new WP_REST_Response( array(
			'token' => $jwt,
			'user_email' => $user->user_email,
			'user_nicename' => $user->user_nicename,
			'user_display_name' => $user->display_name,
			'id' => $user->ID,
			'status' => 200,
		), 200 );
	}

	/**
	 * Verify Google ID token with Google's tokeninfo endpoint
	 * Made public for use in GraphQL mutations
	 */
	public function verifyGoogleToken($id_token, $client_id) {
		// Use Google's tokeninfo endpoint to verify the ID token
		$url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($id_token);
		
		$response = wp_remote_get($url, array(
			'timeout' => 10,
			'sslverify' => true,
		));
		
		if (is_wp_error($response)) {
			error_log('Google token verification error: ' . $response->get_error_message());
			return false;
		}
		
		$body = wp_remote_retrieve_body($response);
		$data = json_decode($body, true);
		
		if (!$data || isset($data['error'])) {
			error_log('Google token verification failed: ' . ($data['error'] ?? 'Unknown error'));
			return false;
		}
		
		// Verify audience matches our client ID
		if (!isset($data['aud']) || $data['aud'] !== $client_id) {
			error_log('Google token audience mismatch. Expected: ' . $client_id . ', Got: ' . ($data['aud'] ?? 'none'));
			return false;
		}
		
		// Verify token hasn't expired
		if (isset($data['exp']) && $data['exp'] < time()) {
			error_log('Google token has expired');
			return false;
		}
		
		return $data;
	}

	/**
	 * Generate JWT token for Google OAuth user (DEPRECATED - use generateUnifiedToken instead)
	 * Uses JWT Auth plugin's exact token structure and secret key
	 * Note: JWT Auth plugin requires password, so we generate token here for Google users
	 * Token structure matches JWT Auth plugin: data.user.ID
	 */
	public function generateGoogleUserToken( $request ) {
		global $wpdb;

		// Accept user ID or email from POST body
		$user_id = $request->get_param('user_id');
		$email = $request->get_param('email');
		
		if (empty($user_id) && empty($email)) {
			$params = $request->get_json_params();
			$user_id = isset($params['user_id']) ? $params['user_id'] : null;
			$email = isset($params['email']) ? $params['email'] : null;
		}

		if (empty($user_id) && empty($email)) {
			return new WP_REST_Response(array(
				'message' => 'User ID or email parameter is required.',
				'status' => 400,
			), 400);
		}

		// Get user by ID or email
		if ($user_id) {
			$user = get_user_by('id', $user_id);
		} else {
			$user = get_user_by('email', $email);
		}

		if (!$user) {
			return new WP_REST_Response(array(
				'message' => 'User not found.',
				'status' => 404,
			), 404);
		}

		// Verify this is a Google user
		$is_google_user = $wpdb->get_var( $wpdb->prepare(
			"SELECT is_google_user FROM {$wpdb->users} WHERE ID = %d",
			$user->ID
		) );

		if ( empty($is_google_user) ) {
			$is_google_user = get_user_meta( $user->ID, 'is_google_user', true );
		}

		if ($is_google_user != 1) {
			return new WP_REST_Response(array(
				'message' => 'User is not a Google OAuth user.',
				'status' => 403,
			), 403);
		}

		// Generate JWT token using JWT Auth plugin's standard structure
		// This matches the token format used by manual login
		$secret_key = $this->get_jwt_secret_key();
		if ( empty( $secret_key ) ) {
			return new WP_REST_Response( array(
				'message' => 'JWT secret key not configured.',
				'status' => 500,
			), 500 );
		}

		$issuedAt = time();
		$expire = $issuedAt + ( DAY_IN_SECONDS * 7 );
		
		// Use JWT Auth plugin's standard token structure (matches manual login)
		$token = array(
			'iss' => get_bloginfo( 'url' ),
			'iat' => $issuedAt,
			'nbf' => $issuedAt,
			'exp' => $expire,
			'data' => array(
				'user' => array(
					'ID' => $user->ID,
					'user_login' => $user->user_login,
					'user_email' => $user->user_email,
					'user_nicename' => $user->user_nicename,
					'display_name' => $user->display_name,
				)
			)
		);

		$jwt = JWT::encode( $token, $secret_key, 'HS256' );

		return new WP_REST_Response( array(
			'token' => $jwt,
			'user_email' => $user->user_email,
			'user_nicename' => $user->user_nicename,
			'user_display_name' => $user->display_name,
			'id' => $user->ID,
			'status' => 200,
		), 200 );
	}
	
	public function check_email_exists( $request ) {
		// Accept email from POST body or query param
		$email = $request->get_param('email');
		if (empty($email)) {
			$params = $request->get_json_params();
			$email = isset($params['email']) ? $params['email'] : '';
		}
	
		if (empty($email)) {
			return new WP_REST_Response(array(
				'exists' => false,
				'message' => 'Email parameter is required.',
				'status' => 400,
			), 400);
		}
	
		if ( email_exists( $email ) ) {
			return new WP_REST_Response(array(
				'exists' => true,
				'message' => 'Sorry, Email already exists.',
				'status' => 200,
			), 200);
		} else {
			return new WP_REST_Response(array(
				'exists' => false,
				'message' => 'Email is available.',
				'status' => 200,
			), 200);
		}
	}

	/**
	 * Check if username already exists
	 * 
	 * @param WP_REST_Request $request Request object containing 'username' parameter
	 * @return WP_REST_Response Response object with exists status
	 */
	public function check_username_exists($request) {
		// Accept username from POST body or query param
		$username = $request->get_param('username');
		if (empty($username)) {
			$params = $request->get_json_params();
			$username = isset($params['username']) ? $params['username'] : '';
		}

		if (empty($username)) {
			return new WP_REST_Response(array(
				'exists' => false,
				'message' => 'Username parameter is required.',
				'status' => 400
			), 400);
		}

		if (username_exists($username)) {
			return new WP_REST_Response(array(
				'exists' => true,
				'message' => 'Sorry, this username already exists.',
				'status' => 200
			), 200);
		}

		return new WP_REST_Response(array(
			'exists' => false,
			'message' => 'Username is available.',
			'status' => 200
		), 200);
	}

	/**
	 * Permissions check for getting all users.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, otherwise WP_Error object.
	 */
	public function get_items_permissions_check( $request ) {
		// Check if roles is specified in GET request and if user can list users.
		if ( ! empty( $request['roles'] ) && ! current_user_can( 'list_users' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to filter users by role.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// Check if capabilities is specified in GET request and if user can list users.
		if ( ! empty( $request['capabilities'] ) && ! current_user_can( 'list_users' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to filter users by capability.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( 'edit' === $request['context'] && ! current_user_can( 'list_users' ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to list users.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( in_array( $request['orderby'], array( 'email', 'registered_date' ), true ) && ! current_user_can( 'list_users' ) ) {
			return new WP_Error(
				'rest_forbidden_orderby',
				__( 'Sorry, you are not allowed to order users by this parameter.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( 'authors' === $request['who'] ) {
			$types = get_post_types( array( 'show_in_rest' => true ), 'objects' );

			foreach ( $types as $type ) {
				if ( post_type_supports( $type->name, 'author' )
					&& current_user_can( $type->cap->edit_posts ) ) {
					return true;
				}
			}

			return new WP_Error(
				'rest_forbidden_who',
				__( 'Sorry, you are not allowed to query users by this parameter.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Permission check for getting current user.
	 * Accepts both JWT tokens (manual login and Google OAuth) and WordPress sessions.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error True if authenticated, WP_Error otherwise.
	 */
	public function get_current_user_permissions_check( $request ) {
		// Check JWT token first (works for both manual and Google OAuth)
		// Try both lowercase and capitalized header names (WordPress may normalize)
		$auth_header = $request->get_header( 'authorization' );
		if ( empty( $auth_header ) ) {
			$auth_header = $request->get_header( 'Authorization' );
		}
		
		// Also check $_SERVER directly as fallback
		if ( empty( $auth_header ) && isset( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
			$auth_header = $_SERVER['HTTP_AUTHORIZATION'];
		}
		
		if ( $auth_header && preg_match( '/Bearer\s+(.*)$/i', $auth_header, $matches ) ) {
			$token = trim( $matches[1] );
			if ( empty( $token ) ) {
				return new WP_Error(
					'rest_not_authenticated',
					'Empty authentication token.',
					array( 'status' => 401 )
				);
			}
			
			$user_id = $this->validate_jwt_token( $token );
			if ( $user_id ) {
				// Valid JWT token - set user session for WordPress compatibility
				wp_set_current_user( $user_id );
				return true;
			}
			// JWT token was provided but is invalid - return 401 Unauthorized
			return new WP_Error(
				'rest_not_authenticated',
				'Invalid or expired authentication token.',
				array( 'status' => 401 )
			);
		}
		
		// No Authorization header provided - check WordPress session
		if ( is_user_logged_in() ) {
			return true;
		}
		
		// Not authenticated - return 401 Unauthorized
		return new WP_Error(
			'rest_not_authenticated',
			'Authentication required.',
			array( 'status' => 401 )
		);
	}

	/**
	 * Validates JWT token from Authorization header and returns user ID if valid.
	 *
	 * @param string|null $token Optional JWT token string. If not provided, reads from Authorization header.
	 * @return int|false User ID if token is valid, false otherwise.
	 */
	private function validate_jwt_token( $token = null ) {
		// If token not provided, try to get from Authorization header
		if ( $token === null ) {
			// Check various header formats
			$auth_header = '';
			if ( isset( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
				$auth_header = $_SERVER['HTTP_AUTHORIZATION'];
			} elseif ( isset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
				$auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
			} elseif ( function_exists( 'apache_request_headers' ) ) {
				$headers = apache_request_headers();
				if ( isset( $headers['Authorization'] ) ) {
					$auth_header = $headers['Authorization'];
				}
			}

			if ( empty( $auth_header ) || ! preg_match( '/Bearer\s+(.*)$/i', $auth_header, $matches ) ) {
				return false;
			}

			$token = $matches[1];
		}

		if ( empty( $token ) ) {
			return false;
		}

		try {
			$secret_key = $this->get_jwt_secret_key();
			if ( empty( $secret_key ) ) {
				return false;
			}

			// Decode JWT token
			$decoded = JWT::decode( $token, $secret_key, array( 'HS256' ) );

			// Extract user ID from token payload - JWT Auth plugin standard structure
			// JWT Auth plugin uses: data.user.ID (uppercase) or data.user.id (lowercase)
			if ( isset( $decoded->data->user->ID ) ) {
				return intval( $decoded->data->user->ID );
			}
			if ( isset( $decoded->data->user->id ) ) {
				return intval( $decoded->data->user->id );
			}

			return false;
		} catch ( Exception $e ) {
			error_log( 'JWT validation error: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Retrieves the query params for the collection.
	 *
	 * @since 4.7.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_current_user() {
		// First, try to get user from JWT token (works for both manual and Google OAuth)
		$jwt_user_id = $this->validate_jwt_token();
		
		if ( $jwt_user_id ) {
			// JWT token is valid, use that user
			$user = get_userdata( $jwt_user_id );
			if ( ! $user || ! $user->ID ) {
				return new WP_Error(
					'rest_user_not_found',
					'User not found for the provided token.',
					array( 'status' => 404 )
				);
			}
			// Set WordPress current user for compatibility
			wp_set_current_user( $user->ID );
		} else {
			// Fall back to WordPress session (backward compatibility)
			$user = wp_get_current_user();
			if ( ! $user || ! $user->ID ) {
				return new WP_Error(
					'rest_not_authenticated',
					'User not authenticated',
					array( 'status' => 401 )
				);
			}
		}	
	
		// Get custom profile image from user meta
		$attachment_id = get_user_meta( $user->ID, 'profile_image', true );
		$profileImage = '';
	
		if ( $attachment_id && is_numeric($attachment_id) ) {
			$image_url = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
			if ( $image_url ) {
				$profileImage = $image_url;
			}
		}
	
		// Optionally, return only safe public data
		return array(
			'ID'            => $user->ID,
			'user_login'    => $user->user_login,
			'user_email'    => $user->user_email,
			'display_name'  => $user->display_name,
			'profile_image' => $profileImage,
			'birthdate'    => get_user_meta( $user->ID, 'birthdate', true ),
			'language'     => get_user_meta( $user->ID, 'language', true ),
			'palates'      => get_user_meta( $user->ID, 'palates', true ),
			'about_me'    => get_user_meta( $user->ID, 'about_me', true ),
		);
	}	
	
	/**
	 * Retrieves all users.
	 *
	 * @since 4.7.0
	 * @since 6.8.0 Added support for the search_columns query param.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();

		/*
		 * This array defines mappings between public API query parameters whose
		 * values are accepted as-passed, and their internal WP_Query parameter
		 * name equivalents (some are the same). Only values which are also
		 * present in $registered will be set.
		 */
		$parameter_mappings = array(
			'exclude'      => 'exclude',
			'include'      => 'include',
			'order'        => 'order',
			'per_page'     => 'number',
			'search'       => 'search',
			'roles'        => 'role__in',
			'capabilities' => 'capability__in',
			'slug'         => 'nicename__in',
		);

		$prepared_args = array();

		/*
		 * For each known parameter which is both registered and present in the request,
		 * set the parameter's value on the query $prepared_args.
		 */
		foreach ( $parameter_mappings as $api_param => $wp_param ) {
			if ( isset( $registered[ $api_param ], $request[ $api_param ] ) ) {
				$prepared_args[ $wp_param ] = $request[ $api_param ];
			}
		}

		// Ensure 'number' has a default value if not set
		if ( ! isset( $prepared_args['number'] ) ) {
			$prepared_args['number'] = isset( $registered['per_page']['default'] ) 
				? $registered['per_page']['default'] 
				: 10; // WordPress default
		}

		// Ensure 'page' has a default value if not set
		$page = isset( $request['page'] ) ? (int) $request['page'] : 1;

		if ( isset( $registered['offset'] ) && ! empty( $request['offset'] ) ) {
			$prepared_args['offset'] = $request['offset'];
		} else {
			$prepared_args['offset'] = ( $page - 1 ) * $prepared_args['number'];
		}

		if ( isset( $registered['orderby'] ) && isset( $request['orderby'] ) ) {
			$orderby_possibles        = array(
				'id'              => 'ID',
				'include'         => 'include',
				'name'            => 'display_name',
				'registered_date' => 'registered',
				'slug'            => 'user_nicename',
				'include_slugs'   => 'nicename__in',
				'email'           => 'user_email',
				'url'             => 'user_url',
			);
			if ( isset( $orderby_possibles[ $request['orderby'] ] ) ) {
				$prepared_args['orderby'] = $orderby_possibles[ $request['orderby'] ];
			}
		}

		if ( isset( $registered['who'] ) && ! empty( $request['who'] ) && 'authors' === $request['who'] ) {
			$prepared_args['who'] = 'authors';
		} elseif ( ! current_user_can( 'list_users' ) ) {
			$prepared_args['has_published_posts'] = get_post_types( array( 'show_in_rest' => true ), 'names' );
		}

		if ( ! empty( $request['has_published_posts'] ) ) {
			$prepared_args['has_published_posts'] = ( true === $request['has_published_posts'] )
				? get_post_types( array( 'show_in_rest' => true ), 'names' )
				: (array) $request['has_published_posts'];
		}

		if ( ! empty( $prepared_args['search'] ) ) {
			if ( ! current_user_can( 'list_users' ) ) {
				$prepared_args['search_columns'] = array( 'ID', 'user_login', 'user_nicename', 'display_name' );
			}
			$search_columns         = $request->get_param( 'search_columns' );
			$valid_columns          = isset( $prepared_args['search_columns'] )
				? $prepared_args['search_columns']
				: array( 'ID', 'user_login', 'user_nicename', 'user_email', 'display_name' );
			$search_columns_mapping = array(
				'id'       => 'ID',
				'username' => 'user_login',
				'slug'     => 'user_nicename',
				'email'    => 'user_email',
				'name'     => 'display_name',
			);
			$search_columns         = array_map(
				static function ( $column ) use ( $search_columns_mapping ) {
					return $search_columns_mapping[ $column ];
				},
				$search_columns
			);
			$search_columns         = array_intersect( $search_columns, $valid_columns );
			if ( ! empty( $search_columns ) ) {
				$prepared_args['search_columns'] = $search_columns;
			}
			$prepared_args['search'] = '*' . $prepared_args['search'] . '*';
		}

		$is_head_request = $request->is_method( 'HEAD' );
		if ( $is_head_request ) {
			// Force the 'fields' argument. For HEAD requests, only user IDs are required.
			$prepared_args['fields'] = 'id';
		}
		/**
		 * Filters WP_User_Query arguments when querying users via the REST API.
		 *
		 * @link https://developer.wordpress.org/reference/classes/wp_user_query/
		 *
		 * @since 4.7.0
		 *
		 * @param array           $prepared_args Array of arguments for WP_User_Query.
		 * @param WP_REST_Request $request       The REST API request.
		 */
		$prepared_args = apply_filters( 'rest_user_query', $prepared_args, $request );

		$query = new WP_User_Query( $prepared_args );

		if ( ! $is_head_request ) {
			$users = array();

			foreach ( $query->get_results() as $user ) {
				$data    = $this->prepare_item_for_response( $user, $request );
				$users[] = $this->prepare_response_for_collection( $data );
			}
		}

		$response = $is_head_request ? new WP_REST_Response( array() ) : rest_ensure_response( $users );

		// Store pagination values for headers then unset for count query.
		$per_page = (int) $prepared_args['number'];
		$page     = isset( $page ) ? $page : (int) ceil( ( ( (int) $prepared_args['offset'] ) / $per_page ) + 1 );

		$prepared_args['fields'] = 'ID';

		$total_users = $query->get_total();

		if ( $total_users < 1 ) {
			// Out-of-bounds, run the query again without LIMIT for total count.
			unset( $prepared_args['number'], $prepared_args['offset'] );
			$count_query = new WP_User_Query( $prepared_args );
			$total_users = $count_query->get_total();
		}

		$response->header( 'X-WP-Total', (int) $total_users );

		$max_pages = (int) ceil( $total_users / $per_page );

		$response->header( 'X-WP-TotalPages', $max_pages );

		$base = add_query_arg( urlencode_deep( $request->get_query_params() ), rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ) );
		if ( $page > 1 ) {
			$prev_page = $page - 1;

			if ( $prev_page > $max_pages ) {
				$prev_page = $max_pages;
			}

			$prev_link = add_query_arg( 'page', $prev_page, $base );
			$response->link_header( 'prev', $prev_link );
		}
		if ( $max_pages > $page ) {
			$next_page = $page + 1;
			$next_link = add_query_arg( 'page', $next_page, $base );

			$response->link_header( 'next', $next_link );
		}

		return $response;
	}

	/**
	 * Updates specific user fields if provided in request
	 */
	public function update_user_fields($request) {
		$user = wp_get_current_user();
		$user_id = $user->ID;

		if (is_wp_error($user)) {
			return $user;
		}

		global $wpdb;
		$update_users = array();
		$update_usermeta = array();

		// 1. Username updates (user_login, user_nicename, display_name, nickname)
		if (!empty($request['username'])) {
			$username = sanitize_user($request['username']);
			
			// Check if username exists (excluding current user)
			$existing_user = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT ID FROM {$wpdb->users} WHERE user_login = %s AND ID != %d",
					$username,
					$user_id
				)
			);

			if ($existing_user) {
				return new WP_Error(
					'username_exists',
					__('This username is already in use.'),
					array('status' => 400)
				);
			}

			$update_users['user_login'] = $username;
			$update_users['user_nicename'] = sanitize_title($username);
			$update_users['display_name'] = $username;
			$update_usermeta['nickname'] = $username;
		}

		// 2. Birthdate update
		if (isset($request['birthdate'])) {
			$update_usermeta['birthdate'] = sanitize_text_field($request['birthdate']);
		}

		// 3. Email update
		if (!empty($request['email'])) {
			$email = sanitize_email($request['email']);
			
			// Check if email exists (excluding current user)
			$existing_email = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT ID FROM {$wpdb->users} WHERE user_email = %s AND ID != %d",
					$email,
					$user_id
				)
			);

			if ($existing_email) {
				return new WP_Error(
					'email_exists',
					__('This email is already in use.'),
					array('status' => 400)
				);
			}

			$update_users['user_email'] = $email;
		}

		// 4. Language update
		if (isset($request['language'])) {
			$update_usermeta['language'] = sanitize_text_field($request['language']);
		}

		// 5. Password update
		if (!empty($request['password'])) {
			$update_users['user_pass'] = wp_hash_password($request['password']);
		}

		// 6. Profile image update
		if (isset($request['profile_image'])) {
			$this->update_profile_image($user_id, $request['profile_image']);
		}

		// 7. Palates update
		if (isset($request['palates'])) {
			$update_usermeta['palates'] = sanitize_text_field($request['palates']);
		}

		// 8. About me update
		if (isset($request['about_me'])) {
			$update_usermeta['about_me'] = sanitize_textarea_field($request['about_me']);
		}

		// Perform updates if there are changes
		if (!empty($update_users)) {
			$wpdb->update(
				$wpdb->users,
				$update_users,
				array('ID' => $user_id)
			);
		}

		if (!empty($update_usermeta)) {
			foreach ($update_usermeta as $meta_key => $meta_value) {
				update_user_meta($user_id, $meta_key, $meta_value);
			}
		}

		$profile_image = '';
		$attachment_id = get_user_meta( $user->ID, 'profile_image', true );
		if ( $attachment_id && is_numeric($attachment_id) ) {
			$image_url = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
			if ( $image_url ) {
				$profile_image = $image_url;
			}
		}

		// Return updated user data
		return array(
			'id' => $user_id,
			'username' => $update_users['user_login'] ?? $user->user_login,
			'email' => $update_users['user_email'] ?? $user->user_email,
			'birthdate' => get_user_meta($user_id, 'birthdate', true),
			'language' => get_user_meta($user_id, 'language', true),
			'profile_image' => $profile_image,
			'message' => __('User updated successfully.'),
			'status' => 200
		);
	}

	/**
	 * Validates the current user's password
	 * 
	 * @param WP_REST_Request $request Request object containing 'password' parameter
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error on failure
	 */
	public function validate_current_password($request) {
		// Check if user is logged in
		if (!is_user_logged_in()) {
			return new WP_Error(
				'rest_not_logged_in',
				__('You must be logged in to validate password.'),
				array('status' => 401)
			);
		}

		$password = $request->get_param('password');
		
		if (empty($password)) {
			return new WP_Error(
				'rest_missing_password',
				__('Password is required.'),
				array('status' => 400)
			);
		}

		$user = wp_get_current_user();
		
		// Check if password is correct using wp_check_password()
		if (wp_check_password($password, $user->user_pass, $user->ID)) {
			return new WP_REST_Response(
				array(
					'valid' => true,
					'message' => __('Password is valid.'),
					'status' => 200
				),
				200
			);
		}

		return new WP_REST_Response(
			array(
				'valid' => false,
				'message' => __('Invalid password.'),
				'status' => 200
			),
			200
		);
	}

	/**
	 * Get the user, if the ID is valid.
	 *
	 * @since 4.7.2
	 *
	 * @param int $id Supplied ID.
	 * @return WP_User|WP_Error True if ID is valid, WP_Error otherwise.
	 */
	protected function get_user( $id ) {
		$error = new WP_Error(
			'rest_user_invalid_id',
			__( 'Invalid user ID.' ),
			array( 'status' => 404 )
		);

		if ( (int) $id <= 0 ) {
			return $error;
		}

		$user = get_userdata( (int) $id );
		if ( empty( $user ) || ! $user->exists() ) {
			return $error;
		}

		if ( is_multisite() && ! is_user_member_of_blog( $user->ID ) ) {
			return $error;
		}

		return $user;
	}

	/**
	 * Checks if a given request has access to read a user.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, otherwise WP_Error object.
	 */
	public function get_item_permissions_check( $request ) {
		$user = $this->get_user( $request['id'] );
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		$types = get_post_types( array( 'show_in_rest' => true ), 'names' );

		if ( get_current_user_id() === $user->ID ) {
			return true;
		}

		if ( 'edit' === $request['context'] && ! current_user_can( 'list_users' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to list users.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		} elseif ( ! count_user_posts( $user->ID, $types ) && ! current_user_can( 'edit_user', $user->ID ) && ! current_user_can( 'list_users' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to list users.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Checks if a given request has access create users.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {

		if ( ! current_user_can( 'create_users' ) ) {
			return new WP_Error(
				'rest_cannot_create_user',
				__( 'Sorry, you are not allowed to create new users.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Creates a single user.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		// Log registration attempt
		$request_data = array(
			'email' => $request->get_param( 'email' ),
			'username' => $request->get_param( 'username' ),
			'is_google_user' => $request->get_param( 'is_google_user' ),
			'has_password' => ! empty( $request->get_param( 'password' ) ),
		);
		$this->log_user_action( 'registration', 'attempt', $request_data );

		if ( ! empty( $request['id'] ) ) {
			$error = new WP_Error(
				'rest_user_exists',
				__( 'Cannot create existing user.' ),
				array( 'status' => 400 )
			);
			$this->log_user_action( 'registration', 'error', $request_data, $error );
			return $error;
		}

		// Validate required fields before processing
		if ( empty( $request['email'] ) || ! is_email( $request['email'] ) ) {
			$error = new WP_Error(
				'rest_invalid_email',
				__( 'Invalid or missing email address.' ),
				array( 'status' => 400 )
			);
			$this->log_user_action( 'registration', 'validation_error', $request_data, $error );
			return $error;
		}
		
		// Ensure username is present; auto-generate if missing/empty
		if ( empty( $request['username'] ) || ! is_string( $request['username'] ) || trim( $request['username'] ) === '' ) {
			// Derive a base username from email or fallback
			$email      = isset( $request['email'] ) ? sanitize_email( $request['email'] ) : '';
			$email_part = $email ? current( explode( '@', $email ) ) : '';
			$base_username = sanitize_user( $email_part, true );

			if ( empty( $base_username ) ) {
				$base_username = 'user';
			}

			$username = $base_username;
			$counter  = 1;

			// Ensure uniqueness
			while ( username_exists( $username ) ) {
				$username = $base_username . $counter;
				$counter++;
			}

			// Set the generated username back on the request and log data
			$request['username']      = $username;
			$request_data['username'] = $username;
		}

		// Validate password for non-OAuth users
		$is_oauth_user = ! empty( $request['is_google_user'] ) || ! empty( $request['google_token'] );
		if ( ! $is_oauth_user && ( empty( $request['password'] ) || trim( $request['password'] ) === '' ) ) {
			$error = new WP_Error(
				'rest_invalid_password',
				__( 'Password is required for non-OAuth users.' ),
				array( 'status' => 400 )
			);
			$this->log_user_action( 'registration', 'validation_error', $request_data, $error );
			return $error;
		}

		$schema = $this->get_item_schema();

		if ( ! empty( $request['roles'] ) && ! empty( $schema['properties']['roles'] ) ) {
			$check_permission = $this->check_role_update( 0, $request['roles'] );

			if ( is_wp_error( $check_permission ) ) {
				return $check_permission;
			}
		}

		$user = $this->prepare_item_for_database( $request );

		if ( is_multisite() ) {
			$ret = wpmu_validate_user_signup( $user->user_login, $user->user_email );

			if ( is_wp_error( $ret['errors'] ) && $ret['errors']->has_errors() ) {
				$error = new WP_Error(
					'rest_invalid_param',
					__( 'Invalid user parameter(s).' ),
					array( 'status' => 400 )
				);

				foreach ( $ret['errors']->errors as $code => $messages ) {
					foreach ( $messages as $message ) {
						$error->add( $code, $message );
					}

					$error_data = $error->get_error_data( $code );

					if ( $error_data ) {
						$error->add_data( $error_data, $code );
					}
				}
				$this->log_user_action( 'registration', 'validation_error', array(
					'email' => $user->user_email,
					'username' => $user->user_login,
				), $error );
				return $error;
			}
		}

		if ( is_multisite() ) {
			$user_id = wpmu_create_user( $user->user_login, $user->user_pass, $user->user_email );

			if ( ! $user_id ) {
				$error = new WP_Error(
					'rest_user_create',
					__( 'Error creating new user.' ),
					array( 'status' => 500 )
				);
				$this->log_user_action( 'registration', 'error', array(
					'email' => $user->user_email,
					'username' => $user->user_login,
				), $error );
				return $error;
			}

			$user->ID = $user_id;
			$user_id  = wp_update_user( wp_slash( (array) $user ) );

			if ( is_wp_error( $user_id ) ) {
				$this->log_user_action( 'registration', 'error', array(
					'email' => $user->user_email,
					'username' => $user->user_login,
				), $user_id );
				return $user_id;
			}

			$result = add_user_to_blog( get_site()->id, $user_id, '' );
			if ( is_wp_error( $result ) ) {
				$this->log_user_action( 'registration', 'error', array(
					'email' => $user->user_email,
					'username' => $user->user_login,
					'user_id' => $user_id,
				), $result );
				return $result;
			}
		} else {
			$user_id = $this->wp_insert_user( wp_slash( (array) $user ) );

			if ( is_wp_error( $user_id ) ) {
				$this->log_user_action( 'registration', 'error', array(
					'email' => $user->user_email,
					'username' => $user->user_login,
				), $user_id );
				return $user_id;
			}
		}

		$user = get_user_by( 'id', $user_id );

		/**
		 * Fires immediately after a user is created or updated via the REST API.
		 *
		 * @since 4.7.0
		 *
		 * @param WP_User         $user     Inserted or updated user object.
		 * @param WP_REST_Request $request  Request object.
		 * @param bool            $creating True when creating a user, false when updating.
		 */
		do_action( 'rest_insert_user', $user, $request, true );

		if ( ! empty( $request['roles'] ) && ! empty( $schema['properties']['roles'] ) ) {
			array_map( array( $user, 'add_role' ), $request['roles'] );
		}

		if ( ! empty( $schema['properties']['meta'] ) && isset( $request['meta'] ) ) {
			$meta_update = $this->meta->update_value( $request['meta'], $user_id );

			if ( is_wp_error( $meta_update ) ) {
				return $meta_update;
			}
		}

		$user          = get_user_by( 'id', $user_id );
		$fields_update = $this->update_additional_fields_for_object( $user, $request );

		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', 'edit' );

		/**
		 * Fires after a user is completely created or updated via the REST API.
		 *
		 * @since 5.0.0
		 *
		 * @param WP_User         $user     Inserted or updated user object.
		 * @param WP_REST_Request $request  Request object.
		 * @param bool            $creating True when creating a user, false when updating.
		 */
		do_action( 'rest_after_insert_user', $user, $request, true );

		$response = $this->prepare_item_for_response( $user, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $user_id ) ) );

		// Log successful registration
		$this->log_user_action( 'registration', 'success', array(
			'user_id' => $user_id,
			'email' => $user->user_email,
			'username' => $user->user_login,
			'is_google_user' => $is_oauth_user,
		) );

		return $response;
	}

	/**
	 * Checks if a given request has access to update a user.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		$user = $this->get_user( $request['id'] );
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		if ( ! empty( $request['roles'] ) ) {
			if ( ! current_user_can( 'promote_user', $user->ID ) ) {
				return new WP_Error(
					'rest_cannot_edit_roles',
					__( 'Sorry, you are not allowed to edit roles of this user.' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			$request_params = array_keys( $request->get_params() );
			sort( $request_params );
			/*
			 * If only 'id' and 'roles' are specified (we are only trying to
			 * edit roles), then only the 'promote_user' cap is required.
			 */
			if ( array( 'id', 'roles' ) === $request_params ) {
				return true;
			}
		}

		if ( ! current_user_can( 'edit_user', $user->ID ) ) {
			return new WP_Error(
				'rest_cannot_edit',
				__( 'Sorry, you are not allowed to edit this user.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Updates a single user.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$user = $this->get_user( $request['id'] );
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		$id = $user->ID;

		$owner_id = false;
		if ( is_string( $request['email'] ) ) {
			$owner_id = email_exists( $request['email'] );
		}

		if ( $owner_id && $owner_id !== $id ) {
			return new WP_Error(
				'rest_user_invalid_email',
				__( 'Invalid email address.' ),
				array( 'status' => 400 )
			);
		}

		if ( ! empty( $request['username'] ) && $request['username'] !== $user->user_login ) {
			return new WP_Error(
				'rest_user_invalid_argument',
				__( 'Username is not editable.' ),
				array( 'status' => 400 )
			);
		}

		if ( ! empty( $request['slug'] ) && $request['slug'] !== $user->user_nicename && get_user_by( 'slug', $request['slug'] ) ) {
			return new WP_Error(
				'rest_user_invalid_slug',
				__( 'Invalid slug.' ),
				array( 'status' => 400 )
			);
		}

		if ( ! empty( $request['roles'] ) ) {
			$check_permission = $this->check_role_update( $id, $request['roles'] );

			if ( is_wp_error( $check_permission ) ) {
				return $check_permission;
			}
		}

		$user = $this->prepare_item_for_database( $request );

		// Ensure we're operating on the same user we already checked.
		$user->ID = $id;

		$user_id = wp_update_user( wp_slash( (array) $user ) );

		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$user = get_user_by( 'id', $user_id );

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-users-controller.php */
		do_action( 'rest_insert_user', $user, $request, false );

		if ( ! empty( $request['roles'] ) ) {
			array_map( array( $user, 'add_role' ), $request['roles'] );
		}

		$schema = $this->get_item_schema();

		if ( ! empty( $schema['properties']['meta'] ) && isset( $request['meta'] ) ) {
			$meta_update = $this->meta->update_value( $request['meta'], $id );

			if ( is_wp_error( $meta_update ) ) {
				return $meta_update;
			}
		}

		$user          = get_user_by( 'id', $user_id );
		$fields_update = $this->update_additional_fields_for_object( $user, $request );

		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', 'edit' );

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-users-controller.php */
		do_action( 'rest_after_insert_user', $user, $request, false );

		$response = $this->prepare_item_for_response( $user, $request );
		$response = rest_ensure_response( $response );

		return $response;
	}

	/**
	 * Checks if a given request has access delete a user.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$user = $this->get_user( $request['id'] );
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		if ( ! current_user_can( 'delete_user', $user->ID ) ) {
			return new WP_Error(
				'rest_user_cannot_delete',
				__( 'Sorry, you are not allowed to delete this user.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Deletes a single user.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		// We don't support delete requests in multisite.
		if ( is_multisite() ) {
			return new WP_Error(
				'rest_cannot_delete',
				__( 'The user cannot be deleted.' ),
				array( 'status' => 501 )
			);
		}

		$user = $this->get_user( $request['id'] );

		if ( is_wp_error( $user ) ) {
			return $user;
		}

		$id       = $user->ID;
		$reassign = false === $request['reassign'] ? null : absint( $request['reassign'] );
		$force    = isset( $request['force'] ) ? (bool) $request['force'] : false;

		// We don't support trashing for users.
		if ( ! $force ) {
			return new WP_Error(
				'rest_trash_not_supported',
				/* translators: %s: force=true */
				sprintf( __( "Users do not support trashing. Set '%s' to delete." ), 'force=true' ),
				array( 'status' => 501 )
			);
		}

		if ( ! empty( $reassign ) ) {
			if ( $reassign === $id || ! get_userdata( $reassign ) ) {
				return new WP_Error(
					'rest_user_invalid_reassign',
					__( 'Invalid user ID for reassignment.' ),
					array( 'status' => 400 )
				);
			}
		}

		$request->set_param( 'context', 'edit' );

		$previous = $this->prepare_item_for_response( $user, $request );

		// Include user admin functions to get access to wp_delete_user().
		require_once ABSPATH . 'wp-admin/includes/user.php';

		$result = wp_delete_user( $id, $reassign );

		if ( ! $result ) {
			return new WP_Error(
				'rest_cannot_delete',
				__( 'The user cannot be deleted.' ),
				array( 'status' => 500 )
			);
		}

		$response = new WP_REST_Response();
		$response->set_data(
			array(
				'deleted'  => true,
				'previous' => $previous->get_data(),
			)
		);

		/**
		 * Fires immediately after a user is deleted via the REST API.
		 *
		 * @since 4.7.0
		 *
		 * @param WP_User          $user     The user data.
		 * @param WP_REST_Response $response The response returned from the API.
		 * @param WP_REST_Request  $request  The request sent to the API.
		 */
		do_action( 'rest_delete_user', $user, $response, $request );

		return $response;
	}

	/**
	 * Prepares a single user output for response.
	 *
	 * @since 4.7.0
	 * @since 5.9.0 Renamed `$user` to `$item` to match parent class for PHP 8 named parameter support.
	 *
	 * @param WP_User         $item    User object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$user = $item;

		// Don't prepare the response body for HEAD requests.
		if ( $request->is_method( 'HEAD' ) ) {
			/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-users-controller.php */
			return apply_filters( 'rest_prepare_user', new WP_REST_Response( array() ), $user, $request );
		}

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( in_array( 'id', $fields, true ) ) {
			$data['id'] = $user->ID;
		}

		if ( in_array( 'username', $fields, true ) ) {
			$data['username'] = $user->user_login;
		}

		if ( in_array( 'name', $fields, true ) ) {
			$data['name'] = $user->display_name;
		}

		if ( in_array( 'first_name', $fields, true ) ) {
			$data['first_name'] = $user->first_name;
		}

		if ( in_array( 'last_name', $fields, true ) ) {
			$data['last_name'] = $user->last_name;
		}

		if ( in_array( 'email', $fields, true ) ) {
			$data['email'] = $user->user_email;
		}

		if ( in_array( 'url', $fields, true ) ) {
			$data['url'] = $user->user_url;
		}

		if ( in_array( 'description', $fields, true ) ) {
			$data['description'] = $user->description;
		}

		if ( in_array( 'link', $fields, true ) ) {
			$data['link'] = get_author_posts_url( $user->ID, $user->user_nicename );
		}

		if ( in_array( 'locale', $fields, true ) ) {
			$data['locale'] = get_user_locale( $user );
		}

		if ( in_array( 'nickname', $fields, true ) ) {
			$data['nickname'] = $user->nickname;
		}

		if ( in_array( 'slug', $fields, true ) ) {
			$data['slug'] = $user->user_nicename;
		}

		if ( in_array( 'roles', $fields, true ) ) {
			// Defensively call array_values() to ensure an array is returned.
			$data['roles'] = array_values( $user->roles );
		}

		if ( in_array( 'registered_date', $fields, true ) ) {
			$data['registered_date'] = gmdate( 'c', strtotime( $user->user_registered ) );
		}

		if ( in_array( 'capabilities', $fields, true ) ) {
			$data['capabilities'] = (object) $user->allcaps;
		}

		if ( in_array( 'extra_capabilities', $fields, true ) ) {
			$data['extra_capabilities'] = (object) $user->caps;
		}

		if ( in_array( 'avatar_urls', $fields, true ) ) {
			$data['avatar_urls'] = rest_get_avatar_urls( $user );
		}

		if ( in_array( 'meta', $fields, true ) ) {
			$data['meta'] = $this->meta->get_value( $user->ID, $request );
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'embed';

		$data = $this->add_additional_fields_to_object( $data, $request );
		$data = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$response->add_links( $this->prepare_links( $user ) );
		}

		/**
		 * Filters user data returned from the REST API.
		 *
		 * @since 4.7.0
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param WP_User          $user     User object used to create response.
		 * @param WP_REST_Request  $request  Request object.
		 */
		return apply_filters( 'rest_prepare_user', $response, $user, $request );
	}

	/**
	 * Prepares links for the user request.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_User $user User object.
	 * @return array Links for the given user.
	 */
	protected function prepare_links( $user ) {
		$links = array(
			'self'       => array(
				'href' => rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $user->ID ) ),
			),
			'collection' => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
		);

		return $links;
	}

	/**
	 * Prepares a single user for creation or update.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return object User object.
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared_user = new stdClass();

		$schema = $this->get_item_schema();

		// Required arguments.
		if ( isset( $request['email'] ) && ! empty( $schema['properties']['email'] ) ) {
			$prepared_user->user_email = sanitize_email( $request['email'] );
		}

		if ( isset( $request['username'] ) && ! empty( $schema['properties']['username'] ) && ! empty( trim( $request['username'] ) ) ) {
			$prepared_user->user_login = sanitize_user( trim( $request['username'] ), true );
		}

		// Handle password - generate random password for OAuth users if empty
		if ( isset( $request['password'] ) && ! empty( $schema['properties']['password'] ) ) {
			if ( ! empty( trim( $request['password'] ) ) ) {
				$prepared_user->user_pass = $request['password'];
			} elseif ( ! empty( $request['is_google_user'] ) || ! empty( $request['google_token'] ) ) {
				// Generate random password for OAuth users
				$prepared_user->user_pass = wp_generate_password( 24, true, true );
			}
		} elseif ( ! empty( $request['is_google_user'] ) || ! empty( $request['google_token'] ) ) {
			// Generate random password for OAuth users if password field is not set
			$prepared_user->user_pass = wp_generate_password( 24, true, true );
		}

		// Optional arguments.
		if ( isset( $request['id'] ) ) {
			$prepared_user->ID = absint( $request['id'] );
		}

		if ( isset( $request['name'] ) && ! empty( $schema['properties']['name'] ) ) {
			$prepared_user->display_name = $request['name'];
		}

		if ( isset( $request['first_name'] ) && ! empty( $schema['properties']['first_name'] ) ) {
			$prepared_user->first_name = $request['first_name'];
		}

		if ( isset( $request['last_name'] ) && ! empty( $schema['properties']['last_name'] ) ) {
			$prepared_user->last_name = $request['last_name'];
		}

		if ( isset( $request['nickname'] ) && ! empty( $schema['properties']['nickname'] ) ) {
			$prepared_user->nickname = $request['nickname'];
		}

		if ( isset( $request['slug'] ) && ! empty( $schema['properties']['slug'] ) ) {
			$prepared_user->user_nicename = $request['slug'];
		}

		if ( isset( $request['description'] ) && ! empty( $schema['properties']['description'] ) ) {
			$prepared_user->description = $request['description'];
		}

		if ( isset( $request['url'] ) && ! empty( $schema['properties']['url'] ) ) {
			$prepared_user->user_url = $request['url'];
		}

		if ( isset( $request['locale'] ) && ! empty( $schema['properties']['locale'] ) ) {
			$prepared_user->locale = $request['locale'];
		}

		if ( isset( $request['birthdate'] ) && ! empty( $schema['properties']['birthdate'] ) ) {
			$prepared_user->birthdate = $request['birthdate'];
		}

		if ( isset( $request['gender'] ) && ! empty( $schema['properties']['gender'] ) ) {
			$prepared_user->gender = $request['gender'];
		}

		if ( isset( $request['custom_gender'] ) && ! empty( $schema['properties']['custom_gender'] ) ) {
			$prepared_user->custom_gender = $request['custom_gender'];
		}

		if ( isset( $request['pronoun'] ) && ! empty( $schema['properties']['pronoun'] ) ) {
			$prepared_user->pronoun = $request['pronoun'];
		}

		if ( isset( $request['palates'] ) && ! empty( $schema['properties']['palates'] ) ) {
			$prepared_user->palates = $request['palates'];
		}

		if ( isset( $request['profile_image'] ) && ! empty( $schema['properties']['profile_image'] ) ) {
			$prepared_user->profile_image = $request['profile_image'];
		}

		if ( isset( $request['about_me'] ) && ! empty( $schema['properties']['about_me'] ) ) {
			$prepared_user->about_me = $request['about_me'];
		}

		if ( isset( $request['is_google_user'] ) && ! empty( $schema['properties']['is_google_user'] ) ) {
			$prepared_user->is_google_user = $request['is_google_user'];
		}

		if ( isset( $request['roles'] ) ) {
			$prepared_user->role = false;
		}

		/**
		 * Filters user data before insertion via the REST API.
		 *
		 * @since 4.7.0
		 *
		 * @param object          $prepared_user User object.
		 * @param WP_REST_Request $request       Request object.
		 */
		return apply_filters( 'rest_pre_insert_user', $prepared_user, $request );
	}

	/**
	 * Determines if the current user is allowed to make the desired roles change.
	 *
	 * @since 4.7.0
	 *
	 * @global WP_Roles $wp_roles WordPress role management object.
	 *
	 * @param int   $user_id User ID.
	 * @param array $roles   New user roles.
	 * @return true|WP_Error True if the current user is allowed to make the role change,
	 *                       otherwise a WP_Error object.
	 */
	protected function check_role_update( $user_id, $roles ) {
		global $wp_roles;

		foreach ( $roles as $role ) {

			if ( ! isset( $wp_roles->role_objects[ $role ] ) ) {
				return new WP_Error(
					'rest_user_invalid_role',
					/* translators: %s: Role key. */
					sprintf( __( 'The role %s does not exist.' ), $role ),
					array( 'status' => 400 )
				);
			}

			$potential_role = $wp_roles->role_objects[ $role ];

			/*
			 * Don't let anyone with 'edit_users' (admins) edit their own role to something without it.
			 * Multisite super admins can freely edit their blog roles -- they possess all caps.
			 */
			if ( ! ( is_multisite()
				&& current_user_can( 'manage_sites' ) )
				&& get_current_user_id() === $user_id
				&& ! $potential_role->has_cap( 'edit_users' )
			) {
				return new WP_Error(
					'rest_user_invalid_role',
					__( 'Sorry, you are not allowed to give users that role.' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			// Include user admin functions to get access to get_editable_roles().
			require_once ABSPATH . 'wp-admin/includes/user.php';

			// The new role must be editable by the logged-in user.
			$editable_roles = get_editable_roles();

			if ( empty( $editable_roles[ $role ] ) ) {
				return new WP_Error(
					'rest_user_invalid_role',
					__( 'Sorry, you are not allowed to give users that role.' ),
					array( 'status' => 403 )
				);
			}
		}

		return true;
	}

	/**
	 * Check a username for the REST API.
	 *
	 * Performs a couple of checks like edit_user() in wp-admin/includes/user.php.
	 *
	 * @since 4.7.0
	 *
	 * @param string          $value   The username submitted in the request.
	 * @param WP_REST_Request $request Full details about the request.
	 * @param string          $param   The parameter name.
	 * @return string|WP_Error The sanitized username, if valid, otherwise an error.
	 */
	public function check_username( $value, $request, $param ) {
		$username = (string) $value;

		if ( ! validate_username( $username ) ) {
			return new WP_Error(
				'rest_user_invalid_username',
				__( 'This username is invalid because it uses illegal characters. Please enter a valid username.' ),
				array( 'status' => 400 )
			);
		}

		/** This filter is documented in wp-includes/user.php */
		$illegal_logins = (array) apply_filters( 'illegal_user_logins', array() );

		if ( in_array( strtolower( $username ), array_map( 'strtolower', $illegal_logins ), true ) ) {
			return new WP_Error(
				'rest_user_invalid_username',
				__( 'Sorry, that username is not allowed.' ),
				array( 'status' => 400 )
			);
		}

		return $username;
	}

	/**
	 * Retrieves the user's schema, conforming to JSON Schema.
	 *
	 * @since 4.7.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'user',
			'type'       => 'object',
			'properties' => array(
				'id'                 => array(
					'description' => __( 'Unique identifier for the user.' ),
					'type'        => 'integer',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'username'           => array(
					'description' => __( 'Login name for the user.' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => array( $this, 'check_username' ),
					),
				),
				'name'               => array(
					'description' => __( 'Display name for the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'first_name'         => array(
					'description' => __( 'First name for the user.' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'last_name'          => array(
					'description' => __( 'Last name for the user.' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'email'              => array(
					'description' => __( 'The email address for the user.' ),
					'type'        => 'string',
					'format'      => 'email',
					'context'     => array( 'edit' ),
					'required'    => true,
				),
				'url'                => array(
					'description' => __( 'URL of the user.' ),
					'type'        => 'string',
					'format'      => 'uri',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'description'        => array(
					'description' => __( 'Description of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'link'               => array(
					'description' => __( 'Author URL of the user.' ),
					'type'        => 'string',
					'format'      => 'uri',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'locale'             => array(
					'description' => __( 'Locale for the user.' ),
					'type'        => 'string',
					'enum'        => array_merge( array( '', 'en_US' ), get_available_languages() ),
					'context'     => array( 'edit' ),
				),
				'nickname'           => array(
					'description' => __( 'The nickname for the user.' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'slug'               => array(
					'description' => __( 'An alphanumeric identifier for the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => array( $this, 'sanitize_slug' ),
					),
				),
				'registered_date'    => array(
					'description' => __( 'Registration date for the user.' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'roles'              => array(
					'description' => __( 'Roles assigned to the user.' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
					'context'     => array( 'edit' ),
				),
				'password'           => array(
					'description' => __( 'Password for the user (never included).' ),
					'type'        => 'string',
					'context'     => array(), // Password is never displayed.
					'required'    => true,
					// 'arg_options' => array(
					// 	'sanitize_callback' => array( $this, 'check_user_password' ),
					// ),
				),
				'birthdate'         => array(
					'description' => __( 'Birthdate for the user.' ),
					'type'        => 'string',
					'format'      => 'date',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'gender'          => array(
					'description' => __( 'Gender of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'custom_gender'          => array(
					'description' => __( 'Custom Gender of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'pronoun'         => array(
					'description' => __( 'Pronoun of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'palates'         => array(
					'description' => __( 'Palated of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'profile_image'   => array(
					'description' => __( 'Profile Image of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'about_me'   => array(
					'description' => __( 'About me of the user.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'is_google_user'   => array(
					'description' => __( 'Is Google User of the user.' ),
					'type'        => 'boolean',
					'context'     => array( 'edit' ),
				),
				'capabilities'       => array(
					'description' => __( 'All capabilities assigned to the user.' ),
					'type'        => 'object',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'extra_capabilities' => array(
					'description' => __( 'Any extra capabilities assigned to the user.' ),
					'type'        => 'object',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
			),
		);

		if ( get_option( 'show_avatars' ) ) {
			$avatar_properties = array();

			$avatar_sizes = rest_get_avatar_sizes();

			foreach ( $avatar_sizes as $size ) {
				$avatar_properties[ $size ] = array(
					/* translators: %d: Avatar image size in pixels. */
					'description' => sprintf( __( 'Avatar URL with image size of %d pixels.' ), $size ),
					'type'        => 'string',
					'format'      => 'uri',
					'context'     => array( 'embed', 'view', 'edit' ),
				);
			}

			$schema['properties']['avatar_urls'] = array(
				'description' => __( 'Avatar URLs for the user.' ),
				'type'        => 'object',
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
				'properties'  => $avatar_properties,
			);
		}

		$schema['properties']['meta'] = $this->meta->get_field_schema();

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for collections.
	 *
	 * @since 4.7.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['context']['default'] = 'view';

		// Ensure per_page has a default value
		if ( ! isset( $query_params['per_page']['default'] ) ) {
			$query_params['per_page']['default'] = 10;
		}

		$query_params['exclude'] = array(
			'description' => __( 'Ensure result set excludes specific IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['include'] = array(
			'description' => __( 'Limit result set to specific IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['offset'] = array(
			'description' => __( 'Offset the result set by a specific number of items.' ),
			'type'        => 'integer',
		);

		$query_params['order'] = array(
			'default'     => 'asc',
			'description' => __( 'Order sort attribute ascending or descending.' ),
			'enum'        => array( 'asc', 'desc' ),
			'type'        => 'string',
		);

		$query_params['orderby'] = array(
			'default'     => 'name',
			'description' => __( 'Sort collection by user attribute.' ),
			'enum'        => array(
				'id',
				'include',
				'name',
				'registered_date',
				'slug',
				'include_slugs',
				'email',
				'url',
			),
			'type'        => 'string',
		);

		$query_params['slug'] = array(
			'description' => __( 'Limit result set to users with one or more specific slugs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		$query_params['roles'] = array(
			'description' => __( 'Limit result set to users matching at least one specific role provided. Accepts csv list or single role.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		$query_params['capabilities'] = array(
			'description' => __( 'Limit result set to users matching at least one specific capability provided. Accepts csv list or single capability.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		$query_params['who'] = array(
			'description' => __( 'Limit result set to users who are considered authors.' ),
			'type'        => 'string',
			'enum'        => array(
				'authors',
			),
		);

		$query_params['has_published_posts'] = array(
			'description' => __( 'Limit result set to users who have published posts.' ),
			'type'        => array( 'boolean', 'array' ),
			'items'       => array(
				'type' => 'string',
				'enum' => get_post_types( array( 'show_in_rest' => true ), 'names' ),
			),
		);

		$query_params['search_columns'] = array(
			'default'     => array(),
			'description' => __( 'Array of column names to be searched.' ),
			'type'        => 'array',
			'items'       => array(
				'enum' => array( 'email', 'name', 'id', 'username', 'slug' ),
				'type' => 'string',
			),
		);

		/**
		 * Filters REST API collection parameters for the users controller.
		 *
		 * This filter registers the collection parameter, but does not map the
		 * collection parameter to an internal WP_User_Query parameter.  Use the
		 * `rest_user_query` filter to set WP_User_Query arguments.
		 *
		 * @since 4.7.0
		 *
		 * @param array $query_params JSON Schema-formatted collection parameters.
		 */
		return apply_filters( 'rest_user_collection_params', $query_params );
	}

	protected function wp_insert_user( $userdata ) {
		global $wpdb;
	
		if ( $userdata instanceof stdClass ) {
			$userdata = get_object_vars( $userdata );
		} elseif ( $userdata instanceof WP_User ) {
			$userdata = $userdata->to_array();
		}
	
		// Are we updating or creating?
		if ( ! empty( $userdata['ID'] ) ) {
			$user_id       = (int) $userdata['ID'];
			$update        = true;
			$old_user_data = get_userdata( $user_id );
	
			if ( ! $old_user_data ) {
				return new WP_Error( 'invalid_user_id', __( 'Invalid user ID.' ) );
			}
	
			// Slash current user email to compare it later with slashed new user email.
			$old_user_data->user_email = wp_slash( $old_user_data->user_email );
	
			// Hashed in wp_update_user(), plaintext if called directly.
			$user_pass = ! empty( $userdata['user_pass'] ) ? $userdata['user_pass'] : $old_user_data->user_pass;
		} else {
			$update = false;
			$user_pass = wp_hash_password( $userdata['user_pass'] );
		}
	
		$sanitized_user_login = sanitize_user( $userdata['user_login'], true );
		$pre_user_login = apply_filters( 'pre_user_login', $sanitized_user_login );
		$user_login = trim( $pre_user_login );
	
		// user_login must be between 0 and 60 characters.
		if ( empty( $user_login ) ) {
			return new WP_Error( 'empty_user_login', __( 'Cannot create a user with an empty login name.' ) );
		} elseif ( mb_strlen( $user_login ) > 60 ) {
			return new WP_Error( 'user_login_too_long', __( 'Username may not be longer than 60 characters.' ) );
		}
	
		if ( ! $update && username_exists( $user_login ) ) {
			return new WP_Error( 'existing_user_login', __( 'Sorry, that username already exists!' ) );
		}
	
		$illegal_logins = (array) apply_filters( 'illegal_user_logins', array() );
	
		if ( in_array( strtolower( $user_login ), array_map( 'strtolower', $illegal_logins ), true ) ) {
			return new WP_Error( 'invalid_username', __( 'Sorry, that username is not allowed.' ) );
		}
	
		/*
		 * If a nicename is provided, remove unsafe user characters before using it.
		 * Otherwise build a nicename from the user_login.
		 */
		if ( ! empty( $userdata['user_nicename'] ) ) {
			$user_nicename = sanitize_user( $userdata['user_nicename'], true );
		} else {
			$user_nicename = mb_substr( $user_login, 0, 50 );
		}
	
		$user_nicename = sanitize_title( $user_nicename );
	
		/**
		 * Filters a user's nicename before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $user_nicename The user's nicename.
		 */
		$user_nicename = apply_filters( 'pre_user_nicename', $user_nicename );
	
		if ( mb_strlen( $user_nicename ) > 50 ) {
			return new WP_Error( 'user_nicename_too_long', __( 'Nicename may not be longer than 50 characters.' ) );
		}
	
		$user_nicename_check = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->users WHERE user_nicename = %s AND user_login != %s LIMIT 1", $user_nicename, $user_login ) );
	
		if ( $user_nicename_check ) {
			$suffix = 2;
			while ( $user_nicename_check ) {
				// user_nicename allows 50 chars. Subtract one for a hyphen, plus the length of the suffix.
				$base_length         = 49 - mb_strlen( $suffix );
				$alt_user_nicename   = mb_substr( $user_nicename, 0, $base_length ) . "-$suffix";
				$user_nicename_check = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->users WHERE user_nicename = %s AND user_login != %s LIMIT 1", $alt_user_nicename, $user_login ) );
				++$suffix;
			}
			$user_nicename = $alt_user_nicename;
		}
	
		$raw_user_email = empty( $userdata['user_email'] ) ? '' : $userdata['user_email'];
	
		/**
		 * Filters a user's email before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $raw_user_email The user's email.
		 */
		$user_email = apply_filters( 'pre_user_email', $raw_user_email );
	
		/*
		 * If there is no update, just check for `email_exists`. If there is an update,
		 * check if current email and new email are the same, and check `email_exists`
		 * accordingly.
		 */
		if ( ( ! $update || ( ! empty( $old_user_data ) && 0 !== strcasecmp( $user_email, $old_user_data->user_email ) ) )
			&& ! defined( 'WP_IMPORTING' )
			&& email_exists( $user_email )
		) {
			return new WP_Error( 'existing_user_email', __( 'Sorry, that email address is already used!' ) );
		}
	
		$raw_user_url = empty( $userdata['user_url'] ) ? '' : $userdata['user_url'];
	
		/**
		 * Filters a user's URL before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $raw_user_url The user's URL.
		 */
		$user_url = apply_filters( 'pre_user_url', $raw_user_url );
	
		if ( mb_strlen( $user_url ) > 100 ) {
			return new WP_Error( 'user_url_too_long', __( 'User URL may not be longer than 100 characters.' ) );
		}
	
		$user_registered = empty( $userdata['user_registered'] ) ? gmdate( 'Y-m-d H:i:s' ) : $userdata['user_registered'];
	
		$user_activation_key = empty( $userdata['user_activation_key'] ) ? '' : $userdata['user_activation_key'];
	
		if ( ! empty( $userdata['spam'] ) && ! is_multisite() ) {
			return new WP_Error( 'no_spam', __( 'Sorry, marking a user as spam is only supported on Multisite.' ) );
		}
	
		$spam = empty( $userdata['spam'] ) ? 0 : (bool) $userdata['spam'];
	
		// Store values to save in user meta.
		$meta = array();
	
		$nickname = empty( $userdata['nickname'] ) ? $user_login : $userdata['nickname'];
	
		/**
		 * Filters a user's nickname before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $nickname The user's nickname.
		 */
		$meta['nickname'] = apply_filters( 'pre_user_nickname', $nickname );
	
		$first_name = empty( $userdata['first_name'] ) ? '' : $userdata['first_name'];
	
		/**
		 * Filters a user's first name before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $first_name The user's first name.
		 */
		$meta['first_name'] = apply_filters( 'pre_user_first_name', $first_name );
	
		$last_name = empty( $userdata['last_name'] ) ? '' : $userdata['last_name'];
	
		/**
		 * Filters a user's last name before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $last_name The user's last name.
		 */
		$meta['last_name'] = apply_filters( 'pre_user_last_name', $last_name );
	
		if ( empty( $userdata['display_name'] ) ) {
			if ( $update ) {
				$display_name = $user_login;
			} elseif ( $meta['first_name'] && $meta['last_name'] ) {
				$display_name = sprintf(
					/* translators: 1: User's first name, 2: Last name. */
					_x( '%1$s %2$s', 'Display name based on first name and last name' ),
					$meta['first_name'],
					$meta['last_name']
				);
			} elseif ( $meta['first_name'] ) {
				$display_name = $meta['first_name'];
			} elseif ( $meta['last_name'] ) {
				$display_name = $meta['last_name'];
			} else {
				$display_name = $user_login;
			}
		} else {
			$display_name = $userdata['display_name'];
		}
	
		/**
		 * Filters a user's display name before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $display_name The user's display name.
		 */
		$display_name = apply_filters( 'pre_user_display_name', $display_name );
	
		$description = empty( $userdata['description'] ) ? '' : $userdata['description'];
	
		/**
		 * Filters a user's description before the user is created or updated.
		 *
		 * @since 2.0.3
		 *
		 * @param string $description The user's description.
		 */
		$meta['description'] = apply_filters( 'pre_user_description', $description );
	
		$meta['rich_editing'] = empty( $userdata['rich_editing'] ) ? 'true' : $userdata['rich_editing'];
	
		$meta['syntax_highlighting'] = empty( $userdata['syntax_highlighting'] ) ? 'true' : $userdata['syntax_highlighting'];
	
		$meta['comment_shortcuts'] = empty( $userdata['comment_shortcuts'] ) || 'false' === $userdata['comment_shortcuts'] ? 'false' : 'true';
	
		$admin_color         = empty( $userdata['admin_color'] ) ? 'fresh' : $userdata['admin_color'];
		$meta['admin_color'] = preg_replace( '|[^a-z0-9 _.\-@]|i', '', $admin_color );
	
		$meta['use_ssl'] = empty( $userdata['use_ssl'] ) ? '0' : '1';
	
		$meta['show_admin_bar_front'] = empty( $userdata['show_admin_bar_front'] ) ? 'true' : $userdata['show_admin_bar_front'];
	
		$meta['locale'] = isset( $userdata['locale'] ) ? $userdata['locale'] : '';
	
		$birthdate = empty( $userdata['birthdate'] ) ? '' : $userdata['birthdate'];
		$gender = empty( $userdata['gender'] ) ? '' : $userdata['gender'];
		$custom_gender = empty( $userdata['custom_gender'] ) ? '' : $userdata['custom_gender'];
		$pronoun = empty( $userdata['pronoun'] ) ? '' : $userdata['pronoun'];
		$palates = empty( $userdata['palates'] ) ? '' : $userdata['palates'];
		$profile_image = empty( $userdata['profile_image'] ) ? '' : $userdata['profile_image'];
		$about_me = empty( $userdata['about_me'] ) ? '' : $userdata['about_me'];
		$is_google_user = empty( $userdata['is_google_user'] ) ? '' : $userdata['is_google_user'];
	
		$compacted = compact(
			'user_pass',
			'user_nicename',
			'user_email',
			'user_url',
			'user_registered',
			'user_activation_key',
			'display_name',
			'birthdate',
			'gender',
			'custom_gender',
			'pronoun',
			'palates',
			'profile_image',
			'about_me',
			'is_google_user'
		);
		$data = wp_unslash( $compacted );
	
		if ( ! $update ) {
			$data = $data + compact( 'user_login' );
		}
	
		if ( is_multisite() ) {
			$data = $data + compact( 'spam' );
		}
	
		$data = apply_filters( 'wp_pre_insert_user_data', $data, $update, ( $update ? $user_id : null ), $userdata );
	
		if ( empty( $data ) || ! is_array( $data ) ) {
			return new WP_Error( 'empty_data', __( 'Not enough data to create this user.' ) );
		}
	
		$acf_fields = [
			'birthdate',
			'gender',
			'custom_gender',
			'pronoun',
			'palates',
			'about_me',
			'is_google_user'
		];
		
		foreach ( $acf_fields as $acf_field ) {
			// Special handling for 'palates'
			if ($acf_field === 'palates' && !empty($userdata[$acf_field])) {
				// Split by comma, trim spaces, capitalize, and join with |
				$palates_array = array_map('trim', explode(',', $userdata[$acf_field]));
				$palates_array = array_map('ucfirst', $palates_array);
				$userdata[$acf_field] = implode(' | ', $palates_array);
			}
			unset( $data[ $acf_field ] );
		}
		unset( $data['profile_image'] );

		if ( $update ) {
			if ( $user_email !== $old_user_data->user_email || $user_pass !== $old_user_data->user_pass ) {
				$data['user_activation_key'] = '';
			}
			$wpdb->update( $wpdb->users, $data, array( 'ID' => $user_id ) );
		} else {
		$wpdb->insert($wpdb->users, $data);
		$user_id = (int) $wpdb->insert_id;

		// Save custom fields as user meta (ACF fields).
		foreach ($acf_fields as $acf_field) {
			// Special handling for is_google_user: ACF boolean fields require '1' or '0' as strings
			if ($acf_field === 'is_google_user' && isset($userdata[$acf_field])) {
				// Convert any truthy value to string '1', falsy to string '0'
				$value = ($userdata[$acf_field] === true || $userdata[$acf_field] === 'true' || $userdata[$acf_field] === 1 || $userdata[$acf_field] === '1') ? '1' : '0';
				update_user_meta($user_id, $acf_field, $value);
				error_log("[TastyPlates] Saved is_google_user as: '{$value}' for user {$user_id}");
			} elseif (!empty($userdata[$acf_field])) {
				update_user_meta($user_id, $acf_field, $userdata[$acf_field]);
			}
		}

		// Handle profile_image separately
		if (!empty($userdata['profile_image'])) {
			$this->update_profile_image($user_id, $userdata['profile_image']);
		}			
	}
	
		$user = new WP_User( $user_id );
	
		$meta = apply_filters( 'insert_user_meta', $meta, $user, $update, $userdata );
	
		$custom_meta = array();
		if ( array_key_exists( 'meta_input', $userdata ) && is_array( $userdata['meta_input'] ) && ! empty( $userdata['meta_input'] ) ) {
			$custom_meta = $userdata['meta_input'];
		}
	
		$custom_meta = apply_filters( 'insert_custom_user_meta', $custom_meta, $user, $update, $userdata );
	
		$meta = array_merge( $meta, $custom_meta );
	
		if ( $update ) {
			// Update user meta.
			foreach ( $meta as $key => $value ) {
				update_user_meta( $user_id, $key, $value );
			}
		} else {
			// Add user meta.
			foreach ( $meta as $key => $value ) {
				add_user_meta( $user_id, $key, $value );
			}
		}
	
		foreach ( wp_get_user_contact_methods( $user ) as $key => $value ) {
			if ( isset( $userdata[ $key ] ) ) {
				update_user_meta( $user_id, $key, $userdata[ $key ] );
			}
		}
	
		if ( isset( $userdata['role'] ) ) {
			$user->set_role( $userdata['role'] );
		} elseif ( ! $update ) {
			$user->set_role( get_option( 'default_role' ) );
		}
	
		clean_user_cache( $user_id );
	
		if ( $update ) {
			do_action( 'profile_update', $user_id, $old_user_data, $userdata );
	
			if ( isset( $userdata['spam'] ) && $userdata['spam'] !== $old_user_data->spam ) {
				if ( '1' === $userdata['spam'] ) {
					do_action( 'make_spam_user', $user_id );
				} else {
					do_action( 'make_ham_user', $user_id );
				}
			}
		} else {
			do_action( 'user_register', $user_id, $userdata );
		}
	
		return $user_id;
	}

	protected function update_profile_image($user_id, $profile_image)
	{
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		// Delete existing profile image if it exists
		$existing_image_id = get_user_meta($user_id, 'profile_image', true);
		if ($existing_image_id) {
			wp_delete_attachment($existing_image_id, true); // true = force delete, skip trash
			delete_user_meta($user_id, 'profile_image');
		}

		// Check if it's base64 encoded data (data:image/...;base64,...)
		if (preg_match('/^data:image\/(\w+);base64,/', $profile_image, $type)) {
			$image_data = substr($profile_image, strpos($profile_image, ',') + 1);
			$image_data = base64_decode($image_data);

			if ($image_data === false) {
				// base64 decode failed
				return;
			}

			$extension = strtolower($type[1]); // jpg, png, gif, etc.
			$filename = 'profile_image_' . time() . '.' . $extension;

			// Save to temporary file
			$tmp_file = wp_tempnam($filename);
			file_put_contents($tmp_file, $image_data);

			$file_array = [
				'name' => $filename,
				'tmp_name' => $tmp_file,
			];

			$attachment_id = media_handle_sideload($file_array, 0);

			if (!is_wp_error($attachment_id)) {
				update_user_meta($user_id, 'profile_image', $attachment_id);
			}

			@unlink($tmp_file);
		} else {
			// It's a normal URL
			$tmp = download_url($profile_image);

			if (!is_wp_error($tmp)) {
				$file_array = [
					'name' => basename($profile_image),
					'tmp_name' => $tmp,
				];

				$attachment_id = media_handle_sideload($file_array, 0);

				if (!is_wp_error($attachment_id)) {
					update_user_meta($user_id, 'profile_image', $attachment_id);
				}

				@unlink($tmp);
			}
		}
	}
}

new TastyPlates_User_REST_API_Plugin();