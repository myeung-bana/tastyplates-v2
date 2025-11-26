<?php
/*
Plugin Name: Dev Chrono Plugin
Description: Developer Chrono Custom Plugin for WordPress.
Version: 1.0
Author: Chrono Developer Plugins
*/

if (!defined('ABSPATH')) {
    exit;
}

// Load JWT library if available (from JWT Authentication for WP-API plugin)
// The JWT Auth plugin should autoload the JWT library, but we check here as a fallback
if (!class_exists('Tmeister\Firebase\JWT\JWT')) {
    // Try to load autoloader from JWT Auth plugin if available
    $autoloader_path = ABSPATH . 'wp-content/plugins/jwt-auth/vendor/autoload.php';
    if (file_exists($autoloader_path)) {
        require_once $autoloader_path;
    } elseif (file_exists(ABSPATH . 'wp-content/plugins/jwt-auth/vendor/firebase/php-jwt/src/JWT.php')) {
        // Fallback: try to load JWT.php directly (may not work if dependencies are missing)
        require_once ABSPATH . 'wp-content/plugins/jwt-auth/vendor/firebase/php-jwt/src/JWT.php';
    }
}

/**
 * ============================================================================
 * SYNCHRONIZED JWT AUTHENTICATION FUNCTIONS
 * ============================================================================
 * 
 * These functions are synchronized with tastyplates-user-rest-api-plugin.php
 * to ensure consistent JWT validation across both plugins.
 * 
 * ⚠️ IMPORTANT: When modifying these functions, ensure changes are also
 *    applied to tastyplates-user-rest-api-plugin.php to maintain synchronization.
 * 
 * Related files:
 * - tastyplates-user-rest-api-plugin.php: Contains tastyplates_validate_jwt_token()
 *   and determine_current_user filter that should match this logic
 * 
 * ============================================================================
 */

/**
 * Ensure JWT Authentication for WP-API plugin sets user session early.
 * This hook runs before REST API permission callbacks to ensure JWT tokens are processed.
 * 
 * SYNCHRONIZED WITH: tastyplates-user-rest-api-plugin.php (determine_current_user filter)
 * 
 * @param int $user_id Current user ID (may be 0 if not set).
 * @return int User ID if JWT token is valid, otherwise returns $user_id unchanged.
 */
add_filter('determine_current_user', function($user_id) {
    // If user is already set, return it
    if ($user_id) {
        return $user_id;
    }
    
    // Check for JWT token in Authorization header
    $auth_header = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $auth_header = $headers['authorization'];
        }
    }
    
    // Extract and validate JWT token
    if (!empty($auth_header) && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
        $token = trim($matches[1]);
        if (!empty($token)) {
            // Validate JWT token and get user ID
            $jwt_user_id = dev_chrono_validate_jwt_token($token);
            if ($jwt_user_id && $jwt_user_id > 0) {
                $user = get_userdata($jwt_user_id);
                if ($user) {
                    // Set WordPress current user early - this makes is_user_logged_in() work
                    wp_set_current_user($jwt_user_id);
                    return $jwt_user_id; // ✅ Return user ID
                }
            }
        }
    }
    
    // No valid JWT token - return existing user_id (let other plugins handle it)
    return $user_id;
}, 10); // Priority 10 to run early, before permission callbacks

/**
 * Validates JWT token and returns user ID if valid.
 * 
 * SYNCHRONIZED WITH: tastyplates-user-rest-api-plugin.php::tastyplates_validate_jwt_token()
 * 
 * ⚠️ When updating this function, ensure tastyplates-user-rest-api-plugin.php is also updated
 *    to maintain consistent validation logic. The only difference should be:
 *    - Function name: dev_chrono_validate_jwt_token() vs tastyplates_validate_jwt_token()
 *    - Both should check GRAPHQL_JWT_AUTH_SECRET_KEY first, then JWT_AUTH_SECRET_KEY
 * 
 * @param string|null $token Optional JWT token string. If not provided, reads from Authorization header.
 * @return int|false User ID if token is valid, false otherwise.
 */
function dev_chrono_validate_jwt_token($token = null) {
    // If token not provided, try to get from Authorization header
    if ($token === null) {
        // Check various header formats
        $auth_header = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $auth_header = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $auth_header = $headers['authorization'];
            }
        }
        
        if (empty($auth_header) || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('dev_chrono_validate_jwt_token: No Authorization header found');
            }
            return false;
        }
        
        $token = trim($matches[1]);
    }
    
    if (empty($token)) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('dev_chrono_validate_jwt_token: Empty token provided');
        }
        return false;
    }
    
    try {
        // Check if JWT class is available (from JWT Authentication for WP-API plugin or Composer)
        if (!class_exists('Tmeister\Firebase\JWT\JWT')) {
            // Try to load autoloader first (preferred method)
            $autoloader_path = ABSPATH . 'wp-content/plugins/jwt-auth/vendor/autoload.php';
            if (file_exists($autoloader_path)) {
                require_once $autoloader_path;
            }
            
            // If still not available, try loading JWT.php directly (fallback)
            if (!class_exists('Tmeister\Firebase\JWT\JWT')) {
                $jwt_path = ABSPATH . 'wp-content/plugins/jwt-auth/vendor/firebase/php-jwt/src/JWT.php';
                if (file_exists($jwt_path)) {
                    require_once $jwt_path;
                }
            }
            
            // Verify class is now available
            if (!class_exists('Tmeister\Firebase\JWT\JWT')) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('dev_chrono_validate_jwt_token: JWT library not found. Please ensure JWT Authentication for WP-API plugin is installed.');
                }
                return false;
            }
        }
        
        // Get secret key from wp-config.php
        // SYNCHRONIZED: Matches tastyplates-user-rest-api-plugin.php secret key priority
        // Checks GRAPHQL_JWT_AUTH_SECRET_KEY first, then JWT_AUTH_SECRET_KEY
        $secret_key = '';
        if (defined('GRAPHQL_JWT_AUTH_SECRET_KEY') && GRAPHQL_JWT_AUTH_SECRET_KEY) {
            $secret_key = GRAPHQL_JWT_AUTH_SECRET_KEY;
        } elseif (defined('JWT_AUTH_SECRET_KEY') && JWT_AUTH_SECRET_KEY) {
            $secret_key = JWT_AUTH_SECRET_KEY;
        }
        
        if (empty($secret_key)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('dev_chrono_validate_jwt_token: JWT secret key not defined in wp-config.php (checked GRAPHQL_JWT_AUTH_SECRET_KEY and JWT_AUTH_SECRET_KEY)');
            }
            return false;
        }
        
        // Decode JWT token using fully qualified class name
        // Note: JWT::decode may throw exceptions for invalid tokens, expired tokens, etc.
        $decoded = \Tmeister\Firebase\JWT\JWT::decode($token, $secret_key, array('HS256'));
        
        // Extract user ID from token payload - JWT Auth plugin standard structure
        // Token structure from tastyplates-user-rest-api-plugin.php: data.user.ID (uppercase)
        if (isset($decoded->data->user->ID)) {
            $user_id = intval($decoded->data->user->ID);
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('dev_chrono_validate_jwt_token: Valid token for user ID ' . $user_id);
            }
            return $user_id;
        }
        if (isset($decoded->data->user->id)) {
            $user_id = intval($decoded->data->user->id);
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('dev_chrono_validate_jwt_token: Valid token for user ID ' . $user_id);
            }
            return $user_id;
        }
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('dev_chrono_validate_jwt_token: Token decoded but user ID not found in payload');
        }
        return false;
    } catch (Exception $e) {
        // Handle various JWT errors (expired, invalid signature, malformed token, etc.)
        $error_message = $e->getMessage();
        if (defined('WP_DEBUG') && WP_DEBUG) {
            if (strpos($error_message, 'expired') !== false || strpos($error_message, 'ExpiredException') !== false) {
                error_log('dev_chrono_validate_jwt_token: Token expired - ' . $error_message);
            } elseif (strpos($error_message, 'signature') !== false || strpos($error_message, 'SignatureInvalidException') !== false) {
                error_log('dev_chrono_validate_jwt_token: Invalid token signature - ' . $error_message);
            } else {
                error_log('dev_chrono_validate_jwt_token: JWT validation error - ' . $error_message);
            }
        }
        return false;
    }
}

/**
 * Permission callback for public profile endpoints.
 * Allows public access but validates user_id parameter if provided.
 * These endpoints (following-list, followers-list, favorites, checkins) are public profile data.
 * 
 * @param WP_REST_Request $request Request object.
 * @return bool Always returns true (public access).
 */
function dev_chrono_public_profile_auth($request = null) {
    // Always allow public access - these are public profile endpoints
    // The callback function will validate user_id parameter
    return true;
}

/**
 * Helper permission callback that validates JWT tokens or falls back to WordPress session.
 * Used by follow, wishlist, and check-ins endpoints that require authentication.
 * 
 * SYNCHRONIZED WITH: tastyplates-user-rest-api-plugin.php::get_current_user_permissions_check() (lines 1986-2034)
 * 
 * ⚠️ When updating this function, ensure the logic matches get_current_user_permissions_check()
 *    in tastyplates-user-rest-api-plugin.php, except for the return type:
 *    - This function returns bool (for permission callbacks)
 *    - get_current_user_permissions_check() returns bool|WP_Error (for REST API)
 * 
 * @param WP_REST_Request $request Request object.
 * @return bool True if authenticated, false otherwise.
 */
function dev_chrono_check_auth($request = null) {
    // Get token from request or headers
    $token = null;
    
    // First, try to get token from request object (WordPress REST API)
    if ($request instanceof WP_REST_Request) {
        // Try to get from request header (WordPress may normalize to lowercase)
        $auth_header = $request->get_header('authorization');
        if (empty($auth_header)) {
            $auth_header = $request->get_header('Authorization');
        }
        
        if (!empty($auth_header) && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            $token = trim($matches[1]);
        }
    }
    
    // If token not found in request, try $_SERVER as fallback
    // This handles cases where headers aren't passed through the request object
    if (empty($token)) {
        $auth_header = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $auth_header = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $auth_header = $headers['authorization'];
            }
        }
        
        if (!empty($auth_header) && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            $token = trim($matches[1]);
        }
    }
    
    // Validate JWT token if we have one
    if (!empty($token)) {
        $user_id = dev_chrono_validate_jwt_token($token);
        if ($user_id && $user_id > 0) {
            // Verify user exists before setting session
            $user = get_userdata($user_id);
            if ($user) {
                // Valid JWT token - set user session for WordPress compatibility
                wp_set_current_user($user_id);
                return true; // ✅ JWT validated - return immediately
            } else {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('dev_chrono_check_auth: User ID ' . $user_id . ' from token does not exist');
                }
            }
        }
        // Invalid token - return false (don't fallback)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('dev_chrono_check_auth: JWT token validation failed');
        }
        return false;
    }
    
    // No token provided - check if user was set by determine_current_user filter
    // This handles cases where determine_current_user already validated the token
    if (is_user_logged_in()) {
        return true;
    }
    
    // Not authenticated - return false (WordPress will return 403)
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('dev_chrono_check_auth: Authentication failed - no valid token');
    }
    return false;
}

// Different functions for enhancing the plugin functionality
/**
 * Creates a new 'listing' custom post type.
 * Assumes ACF fields are used for custom data and frontend sends FormData.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response
 */

 function create_listing(WP_REST_Request $request)
{
    global $wpdb;

    $params = $request->get_params();

    $wpdb->query('START TRANSACTION');

    try {
        // Create or update listing
        $listing_params = $params['listing'] ?? [];
        if (is_string($listing_params)) {
            $listing_params = json_decode($listing_params, true) ?? [];
        }

        $review_params = $params['review'] ?? [];
        if (is_string($review_params)) {
            $review_params = json_decode($review_params, true) ?? [];
        }
        // var_dump($listing_params);
        $listing_id = isset($listing_params['id']) && $listing_params['id'] > 0
            ? update_listing_logic(intval($listing_params['id']), $listing_params)
            : create_listing_logic($listing_params, $request);

        if (is_wp_error($listing_id)) {
            throw new Exception($listing_id->get_error_message());
        }

        // Create review if provided
        $review_params = $params['review'] ?? [];
        $comment_id = null;

        if (!empty($review_params)) {
            $comment_id = create_review_with_images($listing_id, $review_params);
        }

        $wpdb->query('COMMIT');

        return new WP_REST_Response([
            'listing' => [
                'id'         => $listing_id,
                'name'       => get_the_title($listing_id),
                'slug'       => get_post_field('post_name', $listing_id),
                'categories' => wp_get_object_terms($listing_id, 'listingCategories', ['fields' => 'ids']),
                'palates'    => wp_get_object_terms($listing_id, 'palate', ['fields' => 'ids']),
            ],
            'review' => $comment_id ? [
                'id'     => $comment_id,
                'stars'  => floatval(get_comment_meta($comment_id, 'review_stars', true)),
                'title'  => get_comment_meta($comment_id, 'review_main_title', true),
                'images' => get_comment_meta($comment_id, 'review_images_idz', true),
            ] : null,
        ], 201);

    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return new WP_REST_Response(['error' => $e->getMessage()], 500);
    }
}

function create_review_with_images($listing_id, $review_params)
{
    $comment_data = [
        'comment_post_ID' => $listing_id,
        'comment_content' => wp_kses_post($review_params['content'] ?? ''),
        'comment_type'    => 'listing_draft',
        'comment_approved'=> ($review_params['mode'] === 'publish') ? 1 : 0,
        'user_id'        => get_current_user_id(),
    ];

    $comment_id = wp_insert_comment($comment_data);

    if (is_wp_error($comment_id)) {
        throw new Exception($comment_id->get_error_message());
    }

    $stars = isset($review_params['review_stars']) ? floatval($review_params['review_stars']) : 0;
    update_comment_meta($comment_id, 'review_stars', $stars);
    update_comment_meta($comment_id, 'review_main_title', sanitize_text_field($review_params['review_main_title'] ?? ''));
    update_comment_meta($comment_id, 'recognitions', $review_params['recognitions'] ?? []);

    // Handle review images (your enhanced logic)
    if (!empty($review_params['review_images_idz']) && is_array($review_params['review_images_idz'])) {
        $uploaded_image_ids = upload_review_images($review_params['review_images_idz']);

        if (!empty($uploaded_image_ids)) {
            // Save to ACF field (if ACF is configured)
            if (function_exists('update_field')) {
                update_field('review_images', $uploaded_image_ids, 'comment_' . $comment_id);
            }
            // Also save to comment meta as backup during transition
            update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
            
            if (!has_post_thumbnail($listing_id)) {
                set_post_thumbnail($listing_id, $uploaded_image_ids[0]);
            }
        }
    }

    return $comment_id;
}

function upload_review_images($images)
{
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $uploaded_image_ids = [];

    foreach ($images as $image_data_raw) {
        $attachment_id = null;

        if (preg_match('/^data:image\/(\w+);base64,/', $image_data_raw, $type)) {
            $extension = strtolower($type[1]);
            $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            if (!in_array($extension, $allowed_extensions, true)) continue;

            $image_data = base64_decode(substr($image_data_raw, strpos($image_data_raw, ',') + 1));
            if ($image_data === false) continue;

            $filename = 'review_' . uniqid() . '.' . $extension;
            $tmp_file = wp_tempnam($filename);
            if (!$tmp_file) continue;

            file_put_contents($tmp_file, $image_data);

            $file_array = [
                'name'     => $filename,
                'tmp_name' => $tmp_file,
            ];

            $attachment_id = media_handle_sideload($file_array, 0);
            @unlink($tmp_file);
        } else {
            $tmp = download_url($image_data_raw);
            if (!is_wp_error($tmp)) {
                $file_array = [
                    'name'     => sanitize_file_name(basename($image_data_raw)),
                    'tmp_name' => $tmp,
                ];
                $attachment_id = media_handle_sideload($file_array, 0);
                @unlink($tmp);
            }
        }

        if (!is_wp_error($attachment_id) && $attachment_id) {
            $uploaded_image_ids[] = $attachment_id;
        }
    }

    return $uploaded_image_ids;
}


function create_listing_logic(array $params, WP_REST_Request $request)
{
    // Sanitize required fields

    $name = sanitize_text_field($params['name'] ?? '');
    $content = wp_kses_post($params['content'] ?? '');
    $status = sanitize_text_field($params['status'] ?? 'draft');
    // var_dump($params);

    if (empty($name)) {
        return new WP_Error('missing_name', 'Name is required.', ['status' => 400]);
    }

    // Generate unique slug
    $base_slug = sanitize_title($name);
    $slug = $base_slug;
    $i = 1;
    while (get_page_by_path($slug, OBJECT, 'listing')) {
        $slug = $base_slug . '-' . $i++;
    }

    // Insert the post
    $post_id = wp_insert_post([
        'post_title'   => $name,
        'post_content' => $content,
        'post_type'    => 'listing',
        'post_status'  => $status,
        'post_name'    => $slug,
    ]);

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    // Save meta and taxonomies
    save_listing_meta_and_terms($post_id, $params, $request);

    return $post_id;
}

function update_listing_logic(int $listing_id, array $params)
{
    if (!get_post($listing_id) || get_post_type($listing_id) !== 'listing') {
        return new WP_Error('invalid_listing', 'Listing not found or invalid.', ['status' => 404]);
    }

    $name = sanitize_text_field($params['name'] ?? '');
    $content = wp_kses_post($params['content'] ?? '');
    $status = sanitize_text_field($params['status'] ?? 'draft');

    wp_update_post([
        'ID'           => $listing_id,
        'post_title'   => $name,
        'post_content' => $content,
        'post_status'  => $status,
    ]);

    // Update meta and taxonomies
    save_listing_meta_and_terms($listing_id, $params);

    return $listing_id;
}

function save_listing_meta_and_terms(int $post_id, array $params, WP_REST_Request $request = null)
{
    // Meta fields
    update_post_meta($post_id, 'listing_street', sanitize_text_field($params['listingStreet'] ?? ''));
    update_post_meta($post_id, 'phone', sanitize_text_field($params['phone'] ?? ''));
    update_post_meta($post_id, 'opening_hours', sanitize_text_field($params['openingHours'] ?? ''));
    update_post_meta($post_id, 'menu_url', esc_url_raw($params['menuUrl'] ?? ''));

    // Price range
    if (!empty($params['priceRange'])) {
        $price = is_array($params['priceRange'])
            ? array_map('sanitize_text_field', $params['priceRange'])
            : sanitize_text_field($params['priceRange']);
        update_post_meta($post_id, 'price_range', $price);
    }

    // Location
    update_post_meta($post_id, 'google_map_url', [
        'address' => sanitize_text_field($params['streetAddress'] ?? ''),
        'lat'     => floatval($params['latitude'] ?? 0),
        'lng'     => floatval($params['longitude'] ?? 0),
    ]);

    $street_address = sanitize_text_field($params['streetAddress'] ?? '');
    if (!empty($street_address)) {
        update_post_meta($post_id, 'street_address', $street_address);
    }

    // Taxonomies
    if (!empty($params['palates']) && is_array($params['palates'])) {
        $palates = array_map('sanitize_text_field', $params['palates']);
        wp_set_object_terms($post_id, $palates, 'palate');
    }

    if (!empty($params['categories']) && is_array($params['categories'])) {
        $categories = array_map('sanitize_text_field', $params['categories']);
        wp_set_object_terms($post_id, $categories, 'listingCategories');
    }

    // Handle gallery upload (if request has files)
    if ($request && $request->get_file_params()) {
        $uploaded_files = $request->get_file_params()['gallery'] ?? [];
        $image_ids = [];

        include_once ABSPATH . 'wp-admin/includes/image.php';
        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/media.php';

        if (!empty($uploaded_files)) {
            if (!isset($uploaded_files[0]) || !is_array($uploaded_files[0])) {
                $uploaded_files = [$uploaded_files];
            }

            foreach ($uploaded_files as $file) {
                if (!isset($file['tmp_name'])) continue;

                $upload = wp_handle_upload($file, ['test_form' => false]);

                if (!isset($upload['error'])) {
                    $attachment = [
                        'post_mime_type' => $upload['type'],
                        'post_title'     => sanitize_file_name($file['name']),
                        'post_status'    => 'inherit',
                    ];

                    $attach_id = wp_insert_attachment($attachment, $upload['file'], $post_id);

                    if (!is_wp_error($attach_id)) {
                        $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
                        wp_update_attachment_metadata($attach_id, $attach_data);
                        $image_ids[] = $attach_id;
                    }
                }
            }

            if (!empty($image_ids)) {
                set_post_thumbnail($post_id, $image_ids[0]);
                update_post_meta($post_id, 'gallery', $image_ids);
            }
        }
    }
}


/**
 * Updates an existing 'listing' custom post type.
 * Assumes ACF fields are used for custom data and frontend sends FormData.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response
 */
function update_listing(WP_REST_Request $request)
{
    $id = $request['id'];
    $params = $request->get_params(); // Changed to get_params() for FormData
    $files = $request->get_file_params();

    // Verify that the post exists and is a 'listing' post type
    $post = get_post($id);
    if (!$post || $post->post_type !== 'listing') {
        return new WP_REST_Response(['error' => 'Listing not found or invalid ID.'], 404);
    }

    // Prepare data for wp_update_post
    $post_update_args = [
        'ID'           => $id,
        'post_title'   => isset($params['name']) ? sanitize_text_field($params['name']) : $post->post_title,
        'post_content' => isset($params['content']) ? wp_kses_post($params['content']) : $post->post_content,
    ];

    // Allow updating post status
    if (isset($params['status'])) {
        $post_update_args['post_status'] = sanitize_text_field($params['status']);
    }

    $updated_post_id = wp_update_post($post_update_args);

    if (is_wp_error($updated_post_id)) {
        return new WP_REST_Response(['error' => $updated_post_id->get_error_message()], 500);
    }

    // --- Update Custom Fields using ACF's update_field ---
    if (function_exists('update_field')) {
        if (isset($params['listingStreet'])) {
            update_field('field_listing_street', sanitize_text_field($params['listingStreet']), $id);
        }
        if (isset($params['phone'])) {
            update_field('field_phone', sanitize_text_field($params['phone']), $id);
        }
        if (isset($params['openingHours'])) {
            update_field('field_opening_hours', sanitize_text_field($params['openingHours']), $id);
        }
        if (isset($params['menuUrl'])) {
            update_field('field_menu_url', esc_url_raw($params['menuUrl']), $id);
        }

        // Price range
        if (isset($params['priceRange'])) {
            $price = $params['priceRange'];
            if (is_array($price)) {
                $price = array_map('sanitize_text_field', $price);
            } else {
                $price = sanitize_text_field($price);
            }
            update_field('field_price_range', $price, $id);
        }

        // Location - ACF Google Map field expects an array
        // Reconstruct the array for the ACF Google Map field if parameters are sent
        if (isset($params['streetAddress']) || isset($params['latitude']) || isset($params['longitude'])) {
            $google_map_data = [
                'address' => sanitize_text_field($params['streetAddress'] ?? get_field('field_google_map_url', $id)['address']),
                'lat'     => floatval($params['latitude'] ?? get_field('field_google_map_url', $id)['lat']),
                'lng'     => floatval($params['longitude'] ?? get_field('field_google_map_url', $id)['lng']),
            ];
            update_field('field_google_map_url', $google_map_data, $id);
        }
        // If latitude and longitude are separate ACF fields:
        if (isset($params['latitude'])) {
            update_field('field_latitude', floatval($params['latitude']), $id);
        }
        if (isset($params['longitude'])) {
            update_field('field_longitude', floatval($params['longitude']), $id);
        }
    } else {
        // Fallback to update_post_meta if ACF is not active
        if (isset($params['listingStreet'])) {
            update_post_meta($id, 'listing_street', sanitize_text_field($params['listingStreet']));
        }
        if (isset($params['phone'])) {
            update_post_meta($id, 'phone', sanitize_text_field($params['phone']));
        }
        if (isset($params['openingHours'])) {
            update_post_meta($id, 'opening_hours', sanitize_text_field($params['openingHours']));
        }
        if (isset($params['menuUrl'])) {
            update_post_meta($id, 'menu_url', esc_url_raw($params['menuUrl']));
        }
        if (isset($params['priceRange'])) {
            $price = is_array($params['priceRange']) ? array_map('sanitize_text_field', $params['priceRange']) : sanitize_text_field($params['priceRange']);
            update_post_meta($id, 'price_range', $price);
        }
        if (isset($params['streetAddress']) || isset($params['latitude']) || isset($params['longitude'])) {
            // Retrieve existing data if not provided in current request
            $existing_map_data = get_post_meta($id, 'google_map_url', true);
            $google_map_data = [
                'address' => sanitize_text_field($params['streetAddress'] ?? ($existing_map_data['address'] ?? '')),
                'lat'     => floatval($params['latitude'] ?? ($existing_map_data['lat'] ?? 0)),
                'lng'     => floatval($params['longitude'] ?? ($existing_map_data['lng'] ?? 0)),
            ];
            update_post_meta($id, 'google_map_url', $google_map_data);
        }
        if (isset($params['latitude'])) {
            update_post_meta($id, 'latitude', floatval($params['latitude']));
        }
        if (isset($params['longitude'])) {
            update_post_meta($id, 'longitude', floatval($params['longitude']));
        }
    }


    // --- Update Taxonomies ---
    // Palates
    if (isset($params['palates']) && is_array($params['palates'])) {
        $palates = array_map('sanitize_text_field', $params['palates']);
        wp_set_object_terms($id, $palates, 'palate', false); // Replace existing terms
    } elseif (isset($params['palates']) && empty($params['palates'])) {
        // If an empty array is sent, remove all terms
        wp_set_object_terms($id, [], 'palate', false);
    }

    // Listing Categories
    if (isset($params['categories'])) {
        // Assume categories is a single string (name) from frontend, as in create_listing
        $categories = [sanitize_text_field($params['categories'])];
        wp_set_object_terms($id, $categories, 'listingCategories', false); // Replace existing terms
    } elseif (isset($params['categories']) && empty($params['categories'])) {
        // If an empty string/null is sent, remove all terms
        wp_set_object_terms($id, [], 'listingCategories', false);
    }


    // --- Handle Image Updates/Additions ---
    // This section assumes that the frontend sends new image files to be added.
    // If the frontend also sends existing image IDs to be removed, additional logic
    // would be needed to handle deletion of attachments.
    $uploaded_files = $files['gallery'] ?? [];
    $current_gallery_ids = get_field('field_listing_gallery_images', $id) ?: []; // Get existing ACF gallery IDs
    // Or if not ACF: get_post_meta($id, 'listing_gallery_images', true) ?: [];

    $new_image_ids = [];
    $new_image_urls = [];

    if (!function_exists('wp_handle_upload')) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
    }

    if (!empty($uploaded_files) && is_array($uploaded_files)) {
        if (isset($uploaded_files['name']) && !is_array($uploaded_files['name'])) {
            $uploaded_files = [$uploaded_files];
        } else {
            $normalized_files = [];
            foreach ($uploaded_files['name'] as $key => $name) {
                if (isset($uploaded_files['tmp_name'][$key]) && !empty($uploaded_files['tmp_name'][$key])) {
                    $normalized_files[] = [
                        'name'     => $uploaded_files['name'][$key],
                        'type'     => $uploaded_files['type'][$key],
                        'tmp_name' => $uploaded_files['tmp_name'][$key],
                        'error'    => $uploaded_files['error'][$key],
                        'size'     => $uploaded_files['size'][$key],
                    ];
                }
            }
            $uploaded_files = $normalized_files;
        }

        foreach ($uploaded_files as $file) {
            if (!isset($file['tmp_name']) || empty($file['tmp_name'])) continue;

            $upload_overrides = ['test_form' => false];
            $upload = wp_handle_upload($file, $upload_overrides);

            if (isset($upload['error'])) {
                error_log('Listing update image upload error: ' . $upload['error']);
                continue;
            }

            $attachment = [
                'post_mime_type' => $upload['type'],
                'post_title'     => sanitize_file_name($file['name']),
                'post_content'   => '',
                'post_status'    => 'inherit',
            ];

            $attach_id = wp_insert_attachment($attachment, $upload['file'], $id);

            if (!is_wp_error($attach_id)) {
                $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
                wp_update_attachment_metadata($attach_id, $attach_data);
                $new_image_ids[] = $attach_id;
                $new_image_urls[] = wp_get_attachment_url($attach_id);
            } else {
                error_log('Listing update insert attachment error: ' . $attach_id->get_error_message());
            }
        }

        // Combine existing and new image IDs for the gallery
        $final_gallery_ids = array_merge($current_gallery_ids, $new_image_ids);
        if (!empty($final_gallery_ids)) {
            update_field('field_listing_gallery_images', $final_gallery_ids, $id); // Update ACF Gallery field
            // Or if not ACF: update_post_meta($id, 'listing_gallery_images', $final_gallery_ids);
        }

        // Optionally, update featured image. If the first image in the new set
        // should always be the featured image, or if a specific one is selected.
        // For simplicity, we'll keep the existing featured image unless a new one is explicitly chosen or if there was none.
        if (empty(get_post_thumbnail_id($id)) && !empty($new_image_ids)) {
            set_post_thumbnail($id, $new_image_ids[0]);
        }
    }

    // Prepare response data
    $response_data = [
        'id'            => $id,
        'name'          => get_the_title($id),
        'slug'          => get_post_field('post_name', $id),
        'phone'         => get_field('field_phone', $id),
        'openingHours'  => get_field('field_opening_hours', $id),
        'priceRange'    => get_field('field_price_range', $id),
        'menuUrl'       => get_field('field_menu_url', $id),
        'googleMapUrl'  => get_field('field_google_map_url', $id),
        'latitude'      => get_field('field_latitude', $id),
        'longitude'     => get_field('field_longitude', $id),
        'listingStreet' => get_field('field_listing_street', $id),
        'categories'    => wp_get_object_terms($id, 'listingCategories', ['fields' => 'names']),
        'palates'       => wp_get_object_terms($id, 'palate', ['fields' => 'names']),
        'featuredImage' => get_the_post_thumbnail_url($id, 'full'),
        'galleryImages' => [],
        'post_status'   => get_post_status($id),
    ];

    if (function_exists('get_field') && $gallery_field = get_field('field_listing_gallery_images', $id)) {
        foreach ($gallery_field as $image_id) {
            $response_data['galleryImages'][] = wp_get_attachment_url($image_id);
        }
    }

    return new WP_REST_Response($response_data); // 200 OK for update
}

function delete_listing($request)
{
    $id = $request['id'];

    $deleted = wp_delete_post($id, true);

    if (!$deleted) {
        return new WP_Error('delete_failed', 'Failed to delete listing', ['status' => 500]);
    }

    return ['success' => true, 'deleted' => $id];
}

function register_category_taxonomy()
{
    register_taxonomy('listingCategories', ['listing'], [
        'labels' => [
            'name' => 'Listing Categories',
            'singular_name' => 'Listing Category',
        ],
        'public' => true,
        'show_in_rest' => true,
        'hierarchical' => true,
        'show_ui' => true,
        'rewrite' => ['slug' => 'listingCategories'],
        'show_in_menu' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'listingCategory',
        'graphql_plural_name' => 'listingCategories',
    ]);
}

function register_palate_taxonomy()
{
    register_taxonomy('palate', ['listing'], [
        'labels' => [
            'name' => 'Palates',
            'singular_name' => 'Palate',
        ],
        'public' => true,
        'show_in_rest' => true,
        'hierarchical' => true, // now supports parent-child
        'show_ui' => true,
        'rewrite' => ['slug' => 'palate'],
        'show_in_graphql' => true,
        'graphql_single_name' => 'palate',
        'graphql_plural_name' => 'palates',
    ]);
}

function update_listing_average_rating($post_id)
{
    global $wpdb;

    $ratings = $wpdb->get_col($wpdb->prepare("
        SELECT cm.meta_value
        FROM {$wpdb->comments} c
        INNER JOIN {$wpdb->commentmeta} cm ON c.comment_ID = cm.comment_id
        WHERE c.comment_post_ID = %d
          AND cm.meta_key = 'review_stars'
          AND c.comment_approved = 1
          AND c.comment_type = 'listing'
    ", $post_id));

    if (empty($ratings)) {
        delete_post_meta($post_id, '_average_rating');
        return;
    }

    $ratings = array_map('floatval', $ratings);
    $validRatings = array_filter($ratings, fn($val) => $val >= 0 && $val <= 5);

    if (count($validRatings) === 0) {
        delete_post_meta($post_id, '_average_rating');
        return;
    }

    $average = round(array_sum($validRatings) / count($validRatings), 2);
    update_post_meta($post_id, '_average_rating', $average);
}

function get_recognition_counts_for_restaurant($post_id)
{
    global $wpdb;

    $results = $wpdb->get_col(
        $wpdb->prepare(
            "
            SELECT cm.meta_value
            FROM {$wpdb->commentmeta} cm
            INNER JOIN {$wpdb->comments} c ON cm.comment_id = c.comment_ID
            WHERE cm.meta_key = 'recognitions'
              AND c.comment_post_ID = %d
              AND c.comment_approved = '1'
              AND c.comment_type = 'listing'
            ",
            $post_id
        )
    );

    // Initialize counters
    $recognitionCounts = [
        'Must Revisit'     => 0,
        'Insta-Worthy'     => 0,
        'Value for Money'  => 0,
        'Best Service'     => 0,
    ];

    foreach ($results as $metaValue) {
        $recognitions = array_map('trim', explode(',', $metaValue));
        foreach ($recognitions as $recognition) {
            if (!empty($recognition) && isset($recognitionCounts[$recognition])) {
                $recognitionCounts[$recognition]++;
            }
        }
    }

    return $recognitionCounts;
}

function get_per_palate_stats($post_id)
{
    if (!is_user_logged_in()) return [];

    $current_user_id = get_current_user_id();
    $current_user_palates_raw = get_user_meta($current_user_id, 'palates', true);
    if (!$current_user_palates_raw) return [];

     $current_user_palates = array_map('strtolower', array_map('trim', explode('|', $current_user_palates_raw)));
    if (empty($current_user_palates)) return [];

    $comments = get_comments([
        'post_id' => $post_id,
        'status'  => 'approve',
        'type'    => 'listing',
        'number'  => 0,
    ]);

    $total_rating = 0;
    $review_count = 0;

    foreach ($comments as $comment) {
        $reviewer_id = $comment->user_id;

        // Skip current user's own reviews
        // if (!$reviewer_id || $reviewer_id == $current_user_id) continue;

        $reviewer_palates_raw = get_user_meta($reviewer_id, 'palates', true);
        if (!$reviewer_palates_raw) continue;

        $reviewer_palates = array_map('strtolower', array_map('trim', explode('|', $reviewer_palates_raw)));

        // Skip if no shared palates
        if (empty(array_intersect($current_user_palates, $reviewer_palates))) continue;

        $rating = floatval(get_comment_meta($comment->comment_ID, 'review_stars', true));
        if ($rating <= 0) continue;

        $total_rating += $rating;
        $review_count++;
    }

    return [[
        'name'  => 'My Preference',
        'avg'   => $review_count > 0 ? round($total_rating / $review_count, 2) : null,
        'count' => $review_count,
    ]];
}

function get_search_based_stats($post_id, $search_palates_string)
{
    if (empty($search_palates_string)) return null;

    $search_palates = array_map('strtolower', array_map('trim', explode(',', $search_palates_string)));

    $comments = get_comments([
        'post_id' => $post_id,
        'status' => 'approve',
        'type'   => 'listing',
        'number' => 0,
    ]);

    $total_rating = 0;
    $count = 0;

    foreach ($comments as $comment) {
        $user_id = $comment->user_id;
        if (!$user_id) continue;

        $user_palates_raw = get_user_meta($user_id, 'palates', true);
        if (!$user_palates_raw) continue;

        $user_palates = array_map('strtolower', array_map('trim', explode('|', $user_palates_raw)));
        if (!array_intersect($user_palates, $search_palates)) continue;

        $rating = floatval(get_comment_meta($comment->comment_ID, 'review_stars', true));
        if ($rating <= 0) continue;

        $total_rating += $rating;
        $count++;
    }

    return [
        'avg' => $count > 0 ? round($total_rating / $count, 2) : null,
        'count' => $count,
    ];
}

function tastyplates_follow_user_rest($request)
{
    // Support JSON body for user_id
    $user_id = intval($request->get_param('user_id'));
    if (!$user_id) {
        $body = json_decode($request->get_body(), true);
        if (isset($body['user_id'])) {
            $user_id = intval($body['user_id']);
        }
    }
    $follower_id = get_current_user_id(); // The logged-in user

    // Check both user_id and follower_id exist in wp_users
    if (!$user_id || !$follower_id || $user_id === $follower_id) {
        return new WP_Error('invalid_request', 'Invalid user IDs.', ['status' => 400]);
    }
    if (!get_userdata($user_id) || !get_userdata($follower_id)) {
        return new WP_Error('invalid_request', 'User does not exist', ['status' => 400]);
    }

    global $wpdb;
    $table = $wpdb->prefix . 'user_followers';

    // Prevent duplicate follows
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table WHERE user_id = %d AND follower_id = %d",
        $user_id,
        $follower_id
    ));
    if (!$exists) {
        $wpdb->insert($table, [
            'user_id' => $user_id,
            'follower_id' => $follower_id
        ]);
    }

    // Updated: following count is for the current user (follower_id)
    $countFollowing = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table WHERE follower_id = %d",
        $follower_id
    ));
    $countFollowers = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table WHERE user_id = %d",
        $user_id
    ));

    return rest_ensure_response([
        'result' => 'followed',
        'following' => intval($countFollowing),
        'followers' => intval($countFollowers)
    ]);
}

function tastyplates_unfollow_user_rest($request)
{
    // Support JSON body for user_id
    $user_id = intval($request->get_param('user_id'));
    if (!$user_id) {
        $body = json_decode($request->get_body(), true);
        if (isset($body['user_id'])) {
            $user_id = intval($body['user_id']);
        }
    }
    $follower_id = get_current_user_id();

    // Check both user_id and follower_id exist in wp_users
    if (!$user_id || !$follower_id || $user_id === $follower_id) {
        return new WP_Error('invalid_request', 'Invalid user IDs.', ['status' => 400]);
    }
    if (!get_userdata($user_id) || !get_userdata($follower_id)) {
        return new WP_Error('invalid_request', 'User does not exist', ['status' => 400]);
    }

    global $wpdb;
    $table = $wpdb->prefix . 'user_followers';
    $wpdb->delete($table, [
        'user_id' => $user_id,
        'follower_id' => $follower_id
    ]);

    // Updated: following count is for the current user (follower_id)
    $countFollowing = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table WHERE follower_id = %d",
        $follower_id
    ));
    $countFollowers = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table WHERE user_id = %d",
        $user_id
    ));

    return rest_ensure_response([
        'result' => 'unfollowed',
        'following' => intval($countFollowing),
        'followers' => intval($countFollowers)
    ]);
}

function get_following_list(WP_REST_Request $request)
{
    // Require user_id parameter (public endpoint - no authentication needed)
    $user_id = intval($request->get_param('user_id'));
    
    if (!$user_id) {
        return new WP_Error(
            'missing_user_id',
            'user_id parameter is required',
            ['status' => 400]
        );
    }
    
    // Verify user exists
    if (!get_userdata($user_id)) {
        return new WP_Error(
            'invalid_user',
            'User not found',
            ['status' => 404]
        );
    }
    global $wpdb;
    $table = $wpdb->prefix . 'user_followers';
    $following_ids = $wpdb->get_col($wpdb->prepare(
        "SELECT user_id FROM $table WHERE follower_id = %d",
        $user_id
    ));
    $users = [];
    foreach ($following_ids as $fid) {
        $user = get_userdata($fid);
        if ($user) {
            $palates = get_user_meta($fid, 'palates', true);
            if (is_string($palates)) {
                $palatesArr = preg_split('/[|,]/', $palates);
                $palatesArr = array_map('trim', $palatesArr);
                $palatesArr = array_filter($palatesArr, fn($v) => $v !== '');
            } elseif (is_array($palates)) {
                $palatesArr = array_map('trim', $palates);
            } else {
                $palatesArr = [];
            }
            $avatar_url = get_avatar_url($fid);
            $users[] = [
                'id' => $user->ID,
                'name' => $user->display_name,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'palates' => array_values($palatesArr),
                'image' => $avatar_url,
            ];
        }
    }
    return $users;
}

function get_followers_list(WP_REST_Request $request)
{
    // Require user_id parameter (public endpoint - no authentication needed)
    $user_id = intval($request->get_param('user_id'));
    
    if (!$user_id) {
        return new WP_Error(
            'missing_user_id',
            'user_id parameter is required',
            ['status' => 400]
        );
    }
    
    // Verify user exists
    if (!get_userdata($user_id)) {
        return new WP_Error(
            'invalid_user',
            'User not found',
            ['status' => 404]
        );
    }
    global $wpdb;
    $table = $wpdb->prefix . 'user_followers';
    $follower_ids = $wpdb->get_col($wpdb->prepare(
        "SELECT follower_id FROM $table WHERE user_id = %d",
        $user_id
    ));
    $users = [];
    foreach ($follower_ids as $fid) {
        $user = get_userdata($fid);
        if ($user) {
            $palates = get_user_meta($fid, 'palates', true);
            if (is_string($palates)) {
                $palatesArr = preg_split('/[|,]/', $palates);
                $palatesArr = array_map('trim', $palatesArr);
                $palatesArr = array_filter($palatesArr, fn($v) => $v !== '');
            } elseif (is_array($palates)) {
                $palatesArr = array_map('trim', $palates);
            } else {
                $palatesArr = [];
            }
            $avatar_url = get_avatar_url($fid);
            $users[] = [
                'id' => $user->ID,
                'name' => $user->display_name,
                'palates' => array_values($palatesArr),
                'image' => $avatar_url,
                'username' => $user->user_login,
                'email' => $user->user_email,
            ];
        }
    }
    return $users;
}

function get_following_reviews(WP_REST_Request $request)
{
    $user_id = get_current_user_id();
    if (!$user_id) {
        return new WP_REST_Response(['error' => 'User not authenticated'], 401);
    }
    
    $page = intval($request->get_param('page')) ?: 1;
    $per_page = intval($request->get_param('per_page')) ?: 10;
    $offset = ($page - 1) * $per_page;
    
    global $wpdb;
    $table = $wpdb->prefix . 'user_followers';
    
    // Get followed user IDs
    $following_ids = $wpdb->get_col($wpdb->prepare(
        "SELECT user_id FROM $table WHERE follower_id = %d",
        $user_id
    ));
    
    if (empty($following_ids)) {
        return new WP_REST_Response(['reviews' => [], 'has_more' => false], 200);
    }
    
    // Get reviews from followed users
    $placeholders = implode(',', array_fill(0, count($following_ids), '%d'));
    $query_params = array_merge($following_ids, [$per_page + 1, $offset]);
    
    $reviews = $wpdb->get_results($wpdb->prepare(
        "SELECT c.*, p.post_title as restaurant_name, p.ID as restaurant_id,
                u.display_name, u.user_login, u.user_email
         FROM {$wpdb->comments} c 
         JOIN {$wpdb->posts} p ON c.comment_post_ID = p.ID 
         JOIN {$wpdb->users} u ON c.user_id = u.ID
         WHERE c.user_id IN ($placeholders) 
         AND c.comment_approved = 1 
         AND c.comment_type = 'listing'
         ORDER BY c.comment_date DESC 
         LIMIT %d OFFSET %d",
        $query_params
    ));
    
    $has_more = count($reviews) > $per_page;
    if ($has_more) {
        array_pop($reviews); // Remove the extra record
    }
    
    // Format reviews with metadata
    $formatted_reviews = [];
    foreach ($reviews as $review) {
        $review_stars = get_comment_meta($review->comment_ID, 'review_stars', true);
        $review_title = get_comment_meta($review->comment_ID, 'review_main_title', true);
        $review_images = get_comment_meta($review->comment_ID, 'review_images_idz', true);
        $image_urls = [];
        if ($review_images) {
            $images_data = json_decode($review_images, true);
            if (is_array($images_data)) {
                foreach ($images_data as $img) {
                    if (is_array($img) && isset($img['sourceUrl'])) {
                        // Handle case where image is already an object with sourceUrl
                        $image_urls[] = $img['sourceUrl'];
                    } elseif (is_string($img)) {
                        // Handle case where image is already a URL string
                        $image_urls[] = $img;
                    } elseif (is_numeric($img)) {
                        // Handle case where image is an attachment ID - convert to URL
                        $attachment_url = wp_get_attachment_url($img);
                        if ($attachment_url) {
                            $image_urls[] = $attachment_url;
                        }
                    }
                }
            } elseif (is_numeric($review_images)) {
                // Handle case where review_images_idz is a single attachment ID
                $attachment_url = wp_get_attachment_url($review_images);
                if ($attachment_url) {
                    $image_urls[] = $attachment_url;
                }
            }
        }
        
        $formatted_reviews[] = [
            'id' => $review->comment_ID,
            'content' => $review->comment_content,
            'date' => $review->comment_date,
            'stars' => floatval($review_stars),
            'title' => $review_title,
            'images' => $image_urls,
            'restaurant' => [
                'id' => $review->restaurant_id,
                'name' => $review->restaurant_name
            ],
            'author' => [
                'id' => $review->user_id,
                'username' => $review->user_login,
                'display_name' => $review->display_name,
                'avatar' => get_avatar_url($review->user_id)
            ]
        ];
    }
    
    return new WP_REST_Response([
        'reviews' => $formatted_reviews,
        'has_more' => $has_more
    ], 200);
}

function get_suggested_users(WP_REST_Request $request)
{
    $user_id = get_current_user_id();
    if (!$user_id) {
        return new WP_REST_Response(['error' => 'User not authenticated'], 401);
    }
    
    global $wpdb;
    $table = $wpdb->prefix . 'user_followers';
    
    // Get users already being followed
    $following_ids = $wpdb->get_col($wpdb->prepare(
        "SELECT user_id FROM $table WHERE follower_id = %d",
        $user_id
    ));
    
    $exclude_ids = array_merge($following_ids, [$user_id]);
    $exclude_placeholders = implode(',', array_fill(0, count($exclude_ids), '%d'));
    $query_params = array_merge($exclude_ids, [5]); // Limit to 5 suggestions
    
    // Get users with most followers (excluding already followed and self)
    $suggested = $wpdb->get_results($wpdb->prepare(
        "SELECT u.ID, u.user_login, u.display_name, u.user_email,
                COUNT(f.follower_id) as follower_count,
                (SELECT COUNT(*) FROM {$wpdb->comments} c 
                 WHERE c.user_id = u.ID AND c.comment_approved = 1 
                 AND c.comment_type = 'listing_draft') as review_count
         FROM {$wpdb->users} u
         LEFT JOIN $table f ON u.ID = f.user_id
         WHERE u.ID NOT IN ($exclude_placeholders)
         AND u.ID != 1
         GROUP BY u.ID
         HAVING review_count > 0
         ORDER BY follower_count DESC, review_count DESC
         LIMIT %d",
        $query_params
    ));
    
    // Format suggested users
    $formatted_suggestions = [];
    foreach ($suggested as $user) {
        $formatted_suggestions[] = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'display_name' => $user->display_name,
            'avatar' => get_avatar_url($user->ID),
            'follower_count' => intval($user->follower_count),
            'review_count' => intval($user->review_count)
        ];
    }
    
    return new WP_REST_Response(['suggested_users' => $formatted_suggestions], 200);
}

$posts = get_posts(['post_type' => 'listing', 'numberposts' => -1]);
foreach ($posts as $post) {
    update_listing_average_rating($post->ID);
}


// Add Action Hooks
add_action('init', 'register_category_taxonomy');
add_action('init', 'register_palate_taxonomy');
add_action(
    'graphql_register_types',
    function () {
        ### All about for registering custom GraphQL fields ###
        register_graphql_field(
            'Listing',
            'price',
            [
                'type' => 'Float',
                'description' => __('Listing price', 'listing-post-type'),
                'resolve' => function ($post) {
                    return (float) get_post_meta($post->ID, 'price', true);
                },
            ]
        );

        register_graphql_field('RootQueryToListingConnectionWhereArgs', 'palateReviewedBy', [
        'type' => 'String',
        'description' => 'Return listings that have reviews from users with the given palate (e.g. "japanese").',
         ]);

        register_graphql_field(
            'Listing',
            'price_range',
            [
                'type' => 'String',
                'description' => __(
                    'Value from price_range',
                    'listing-post-type'
                ),
                'resolve' => function ($post) {
                    return get_post_meta($post->ID, 'price_range', true);
                },
            ]
        );

        register_graphql_field(
            'Listing',
            'listingStreet',
            [
                'type' => 'String',
                'description' => __(
                    'Street address from dwt_listing_listing_street post_meta',
                    'listing-post-type'
                ),
                'resolve' => function ($post) {
                    return get_post_meta(
                        $post->ID,
                        'dwt_listing_listing_street',
                        true
                    );
                },
            ]
        );

        register_graphql_field(
            'Listing',
            'listingTotalAverage',
            [
                'type' => 'Float',
                'description' => __(
                    'Average rating for the listing',
                    'listing-post-type'
                ),
                'resolve' => function ($post) {
                    return (float) get_post_meta(
                        $post->ID,
                        'listing_total_average',
                        true
                    );
                },
            ]
        );

        register_graphql_field('Listing', 'averageRating', [
            'type' => 'Float',
            'description' => 'Average star rating from stored postmeta',
            'resolve' => function ($post) {
                return (float) get_post_meta($post->ID, '_average_rating', true);
            }
        ]);

        register_graphql_field('RootQueryToListingConnectionWhereArgs', 'minAverageRating', [
            'type' => 'Float',
            'description' => 'Filter listings by stored average rating',
        ]);

        register_graphql_field('Listing', 'recognitions', [
            'type' => ['list_of' => 'String'],
            'description' => 'All recognition badges collected from comments on this listing',
            'resolve' => function ($post) {
                $comments = get_comments([
                    'post_id' => $post->ID,
                    'status' => 'approve',
                    'meta_key' => 'recognitions',
                ]);

                $badges = [];

                foreach ($comments as $comment) {
                    $raw = get_comment_meta($comment->comment_ID, 'recognitions', true);
                    if ($raw) {
                        $recognitions = array_map('trim', explode(',', $raw));
                        $badges = array_merge($badges, $recognitions);
                    }
                }
                return array_values(array_unique($badges));
            },
        ]);

        register_graphql_field('RootQueryToListingConnectionWhereArgs', 'priceRange', [
            'type' => 'String',
            'description' => 'Filter listings by priceRange',
        ]);

        register_graphql_field('RootQueryToListingConnectionWhereArgs', 'recognition', [
            'type' => 'String',
            'description' => 'Filter listings by a recognition badge from comment meta',
        ]);

        register_graphql_field('RootQueryToListingConnectionWhereArgs', 'recognitionSort', [
            'type' => 'String',
            'description' => 'Sort listings by recognition count (ASC or DESC)',
        ]);

        register_graphql_field('Listing', 'recognitionCount', [
            'type' => 'Int',
            'description' => 'Number of recognitions for a given badge',
            'resolve' => function ($post) {
                $recognition = $_GET['recognition_filter'] ?? null;
                if (!$recognition) return 0;

                global $wpdb;

                return (int) $wpdb->get_var($wpdb->prepare("
                SELECT COUNT(*) FROM {$wpdb->comments} c
                INNER JOIN {$wpdb->commentmeta} cm ON c.comment_ID = cm.comment_id
                WHERE c.comment_post_ID = %d
                  AND cm.meta_key = 'recognitions'
                  AND cm.meta_value LIKE %s
                  AND c.comment_approved = 1
                    AND c.comment_type = 'listing'
            ", $post->ID, '%' . $wpdb->esc_like($recognition) . '%'));
            }
        ]);

        register_graphql_field('RootQueryToListingConnectionWhereArgs', 'streetAddress', [
            'type' => 'String',
            'description' => 'Filter listings by Google Map street address',
        ]);

        register_graphql_field('Comment', 'reviewMainTitle', [
            'type'        => 'String',
            'description' => __('The review main title (from comment meta)', 'listing-post-type'),
            'resolve'     => function ($comment) {
                if (isset($comment->comment_ID)) {
                    $cid = $comment->comment_ID;
                } elseif (isset($comment->ID)) {
                    $cid = $comment->ID;
                } elseif (isset($comment->databaseId)) {
                    $cid = $comment->databaseId;
                } else {
                    return null;
                }
                return get_comment_meta($cid, 'review_main_title', true);
            },
        ]);

        register_graphql_field('Comment', 'reviewStars', [
            'type'        => 'Float',
            'description' => __('The review star rating (from comment meta)', 'listing-post-type'),
            'resolve'     => function ($comment) {
                $cid = $comment->comment_ID ?? $comment->ID ?? $comment->databaseId ?? null;
                if (! $cid) return null;
                return (float) get_comment_meta($cid, 'review_stars', true);
            },
        ]);

        register_graphql_field('Comment', 'palates', [
            'type'        => 'String',
            'description' => __('Palates from user_meta if user_id is set', 'your-text-domain'),
            'resolve'     => function ($comment) {
                $user_id = null;
                if (isset($comment->user_id)) {
                    $user_id = $comment->user_id;
                } elseif (isset($comment->userId)) {
                    $user_id = $comment->userId;
                } elseif (isset($comment->comment_author_user_id)) {
                    $user_id = $comment->comment_author_user_id;
                }
                if ($user_id) {
                    return get_user_meta($user_id, 'palates', true);
                }
                return null;
            },
        ]);

        register_graphql_field('Guest', 'palates', [
            'type'        => 'String',
            'description' => __('Palates for guests (always null)', 'your-text-domain'),
            'resolve'     => function ($guest) {
                return null;
            },
        ]);

        register_graphql_field('Comment', 'reviewImages', [
            'type'        => ['list_of' => 'MediaItem'],
            'description' => __('Review images from ACF or fallback to meta', 'your-text-domain'),
            'resolve' => function ($comment, $args, $context) {
                $image_ids = [];
                
                // Try ACF field first (new reviews) - only if ACF is active
                if (function_exists('get_field')) {
                    $acf_images = get_field('review_images', 'comment_' . $comment->commentId);
                    
                    if (!empty($acf_images) && is_array($acf_images)) {
                        // ACF returns attachment IDs (can be array of IDs or array of objects)
                        $image_ids = is_array($acf_images[0]) 
                            ? array_map(function($img) { return isset($img['ID']) ? $img['ID'] : $img; }, $acf_images)
                            : $acf_images;
                    }
                }
                
                // Fallback to comment meta (existing reviews or if ACF not configured)
                if (empty($image_ids)) {
                    $image_ids_raw = get_comment_meta($comment->commentId, 'review_images_idz', true);
                    
                    if (empty($image_ids_raw)) {
                        return [];
                    }
                    
                    $image_ids = is_array($image_ids_raw)
                        ? array_map('intval', $image_ids_raw)
                        : array_map('intval', explode(',', $image_ids_raw));
                }
                
                // Convert IDs to MediaItem objects
                $media_items = array_filter(array_map(function ($id) use ($context) {
                    $post = get_post($id);
                    if ($post instanceof WP_Post && $post->post_type === 'attachment') {
                        return \WPGraphQL\Data\DataSource::resolve_post_object($id, $context);
                    }
                    return null;
                }, $image_ids));
                
                return $media_items;
            }
        ]);

        register_graphql_field('Comment', 'commentLikes', [
            'type' => 'Int',
            'description' => __('Number of likes for the comment (from comment meta)', 'listing-post-type'),
            'resolve' => function ($comment) {
                $cid = $comment->comment_ID ?? $comment->ID ?? $comment->databaseId ?? null;
                if (!$cid) {
                    return null;
                }
                $likes = get_comment_meta($cid, '_comment_likes', true);
                return is_array($likes) ? count($likes) : 0;
            },
        ]);

        register_graphql_field('Comment', 'userLiked', [
            'type' => 'Boolean',
            'resolve' => function ($comment) {
                $cid = $comment->comment_ID ?? $comment->ID ?? $comment->databaseId ?? null;
                if (!$cid) return false;
                $likes = get_comment_meta($cid, '_comment_likes', true);
                $likes = is_array($likes) ? $likes : [];
                $user_id = get_current_user_id();
                return in_array($user_id, $likes);
            },
        ]);

        register_graphql_field('Comment', 'userAvatar', [
            'type' => 'String',
            'description' => 'Custom profile image URL from user meta (profile_image)',
            'resolve'     => function ($comment) {
                $user_id = null;
                if (isset($comment->user_id)) {
                    $user_id = $comment->user_id;
                } elseif (isset($comment->userId)) {
                    $user_id = $comment->userId;
                } elseif (isset($comment->comment_author_user_id)) {
                    $user_id = $comment->comment_author_user_id;
                }
                if ($user_id) {
                    $profile_image_id = get_user_meta($user_id, 'profile_image', true);
                    if ($profile_image_id) {
                        $url = wp_get_attachment_url($profile_image_id);
                        return $url ? $url : null;
                    }
                }
                return null;
            },
        ]);

        // GraphQL field to expose hashtags as an array of strings
        register_graphql_field('Comment', 'hashtags', [
            'type'        => ['list_of' => 'String'],
            'description' => __('Hashtags extracted from comment content or stored in meta', 'listing-post-type'),
            'resolve'     => function ($comment) {
                $cid = $comment->comment_ID ?? $comment->ID ?? $comment->databaseId ?? null;
                if (! $cid) return [];

                // Prefer stored meta (string of comma-separated hashtags)
                $stored = get_comment_meta($cid, 'hashtags', true);
                if (is_string($stored) && strlen($stored) > 0) {
                    $parts = array_map('trim', explode(',', strtolower($stored)));
                    $parts = array_filter($parts, fn($p) => $p !== '');
                    return array_values(array_unique($parts));
                }

                // Fallback: extract from content
                $content = '';
                if (isset($comment->comment_content)) {
                    $content = $comment->comment_content;
                } elseif (isset($comment->content)) {
                    $content = $comment->content;
                }
                if (!is_string($content) || $content === '') {
                    return [];
                }

                // Match hashtags: letters, numbers, underscore and common CJK ranges
                preg_match_all('/#[\w\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]+/u', $content, $matches);
                $tags = [];
                foreach ($matches[0] as $tag) {
                    $clean = strtolower(trim(ltrim($tag, '#')));
                    if ($clean !== '' && strlen($clean) <= 100) {
                        $tags[] = $clean;
                    }
                }
                return array_values(array_unique($tags));
            },
        ]);

        register_graphql_field('Comment', 'userId', [
            'type'        => 'Int',
            'description' => __('User ID of the comment author (from wp_users)', 'listing-post-type'),
            'resolve'     => function ($comment) {
                // Try all possible keys for user ID
                $user_id = null;

                if (isset($comment->user_id)) {
                    $user_id = (int) $comment->user_id;
                } elseif (isset($comment->userId)) {
                    $user_id = (int) $comment->userId;
                } elseif (isset($comment->comment_author_user_id)) {
                    $user_id = (int) $comment->comment_author_user_id;
                }

                // Check if user exists in wp_users
                if ($user_id && get_userdata($user_id)) {
                    return $user_id;
                }

                return null;
            },
        ]);

        register_graphql_field('Comment', 'recognitions', [
            'type'        => ['list_of' => 'String'],
            'description' => __('Recognitions from comment meta', 'your-text-domain'),
            'resolve'     => function ($comment) {
                $cid = $comment->comment_ID ?? $comment->ID ?? $comment->databaseId ?? null;
                if (! $cid) return null;

                $raw = get_comment_meta($cid, 'recognitions', true);

                if (is_array($raw)) return $raw;

                // Try to decode JSON if stored that way
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) return $decoded;

                // Fallback to comma-separated string
                return array_map('trim', explode(',', $raw));
            },
        ]);

        register_graphql_field('RootQueryToCommentConnectionWhereArgs', 'commentApproved', [
            'type'        => 'Int',
            'description' => __('Filter comments by approval status. 1 = approved, 0 = pending, "spam", "trash", etc.', 'textdomain'),
        ]);

        register_graphql_field('ListingToCommentConnectionWhereArgs', 'commentApproved', [
            'type'        => 'Int',
            'description' => __('Filter comments by approval status. 1 = approved, 0 = pending, etc.', 'textdomain'),
        ]);

        register_graphql_field('RootQuery', 'currentUser', [
            'type' => 'User',
            'description' => __('Current logged-in user', 'your-textdomain'),
            'resolve' => function () {
                $user = wp_get_current_user();
                if ($user && $user->ID !== 0) {
                    return $user;
                }
                return null;
            }
        ]);

        register_graphql_field('User', 'recentlyVisited', [
            'type' => ['list_of' => 'Int'],
            'description' => __('Recently visited listings for user', 'your-theme'),
            'resolve' => function ($user) {
                $visited = get_user_meta($user->ID, 'recently_visited', true);
                return is_array($visited) ? $visited : [];
            }
        ]);

        register_graphql_field('RootMutation', 'addRecentlyVisited', [
            'type' => 'Boolean',
            'args' => [
                'postId' => ['type' => 'Int'],
            ],
            'resolve' => function ($root, $args, $context) {
                $user = wp_get_current_user();
                if (!$user || 0 === $user->ID) {
                    throw new \GraphQL\Error\UserError(__('Not logged in.'));
                }

                $visited = get_user_meta($user->ID, 'recently_visited', true);
                $visited = is_array($visited) ? $visited : [];

                // Remove if already exists, then prepend
                $visited = array_filter($visited, fn($id) => $id !== $args['postId']);
                array_unshift($visited, $args['postId']);
                $visited = array_slice($visited, 0, 4); // Limit to 4

                update_user_meta($user->ID, 'recently_visited', $visited);
                return true;
            }
        ]);

        register_graphql_object_type('RecognitionCounts', [
            'description' => 'Counts for each recognition type from related comments',
            'fields' => [
                'mustRevisit'    => ['type' => 'Int'],
                'instaWorthy'    => ['type' => 'Int'],
                'valueForMoney'  => ['type' => 'Int'],
                'bestService'    => ['type' => 'Int'],
            ],
        ]);

        register_graphql_field('Listing', 'recognitionCounts', [
            'type' => 'RecognitionCounts',
            'description' => __('Counts of each recognition type based on approved comments related to the listing', 'your-textdomain'),
            'resolve' => function ($post) {
                if (!isset($post->ID)) {
                    return null;
                }

                $counts = get_recognition_counts_for_restaurant($post->ID);

                return [
                    'mustRevisit'    => $counts['Must Revisit'],
                    'instaWorthy'    => $counts['Insta-Worthy'],
                    'valueForMoney'  => $counts['Value for Money'],
                    'bestService'    => $counts['Best Service'],
                ];
            }
        ]);

        register_graphql_object_type('PalateStat', [
            'description' => 'Stats per palate',
            'fields' => [
                'name' => ['type' => 'String'],
                'avg' => ['type' => 'Float'],
                'count' => ['type' => 'Int'],
            ],
        ]);

        register_graphql_field('Listing', 'palateStats', [
            'type' => ['list_of' => 'PalateStat'], // or use 'JSON' if unstructured
            'resolve' => function ($post) {
                return get_per_palate_stats($post->ID);
            },
        ]);

        register_graphql_object_type('SearchPalateStat', [
            'description' => 'Search-based palate stats',
            'fields' => [
                'avg' => ['type' => 'Float'],
                'count' => ['type' => 'Int'],
            ],
        ]);

        register_graphql_field('Listing', 'searchPalateStats', [
            'type' => 'SearchPalateStat',
            'args' => [
                'palates' => [
                    'type' => 'String',
                    'description' => 'Palate from search param',
                ],
            ],
            'resolve' => function ($post, $args) {
                $raw_palates_input = $args['palates'] ?? '';
                $processed_palates_string = '';

                // Define your palate groups here (or retrieve from a global/constant if available)
                $palate_groups = [
                    'East Asian' => ['Japanese', 'Korean', 'Chinese', 'Taiwanese'],
                    'South Asian' => ['Nepalese', 'Bangladesh', 'Sri Lankan', 'Maldivian', 'Indian', 'Pakistani'],
                    'South East Asian' => ['Malaysian', 'Filipino', 'Singaporean', 'Indonesian'],
                    'Middle Eastern' => ['Armenian', 'East Arabian', 'Lebanese', 'Caucasian', 'Iranian', 'Turkish'],
                    'African' => ['Angolan', 'Congolese', 'Ethiopian', 'Kenyan', 'Zimbabwean', 'Egyptian', 'Algerian', 'Ghanaian', 'Nigerian'],
                    'North American' => ['Canadian', 'Mexican', 'American'],
                    'European' => ['British', 'Spanish', 'Italian', 'French', 'German', 'Russian', 'Danish', 'Finnish', 'Swedish', 'Romanian', 'Greek', 'Portugese'],
                    'Oceanic' => ['Australian', 'Polynesian'],
                ];

                // Apply the same group expansion logic
                if (isset($palate_groups[$raw_palates_input])) {
                    $processed_palates_string = implode(',', $palate_groups[$raw_palates_input]);
                } else {
                    $processed_palates_string = $raw_palates_input;
                }

                // Pass the processed string to get_search_based_stats
                return get_search_based_stats($post->ID, $processed_palates_string);
            },
        ]);

        register_graphql_field('Listing', 'isFavorite', [
            'type' => 'Boolean',
            'description' => __('Whether the current user has favorited this restaurant', 'tastyplates'),
            'resolve' => function ($listing) {
                $user_id = get_current_user_id();
                if (!$user_id) return false;
                $listing_id = $listing->databaseId ?? $listing->ID ?? null;
                if (!$listing_id) return false;
                $meta_key = "dwt_listing_fav_listing_id_" . $listing_id;
                return get_user_meta($user_id, $meta_key, true) ? true : false;
            }
        ]);

        register_graphql_field('Listing', 'ratingsCount', [
            'type' => 'Int',
            'description' => __('The number of reviews for this listing', 'tastyplates'),
            'resolve' => function ($listing) {
                $post_id = $listing->databaseId ?? $listing->ID ?? null;
                if (!$post_id) return 0;
                $args = [
                    'post_id' => $post_id,
                    'count'   => true,
                    'status'  => 'approve',
                    'type'    => 'listing',
                ];
                return get_comments($args);
            }
        ]);
    }
);

add_action('comment_post', function ($comment_ID) {
    $comment = get_comment($comment_ID);
    update_listing_average_rating($comment->comment_post_ID);
});

add_action('edit_comment', function ($comment_ID) {
    $comment = get_comment($comment_ID);
    update_listing_average_rating($comment->comment_post_ID);
});

add_action('wp_set_comment_status', function ($comment_ID, $status) {
    $comment = get_comment($comment_ID);
    update_listing_average_rating($comment->comment_post_ID);
}, 10, 2);

add_action('deleted_comment', function ($comment_ID) {
    $comment = get_comment($comment_ID);
    update_listing_average_rating($comment->comment_post_ID);
});

add_action('admin_init', function () {
    $roles_to_grant_caps = ['administrator', 'editor', 'author', 'subscriber'];

    foreach ($roles_to_grant_caps as $role_name) {
        $role = get_role($role_name);
        if ($role) {
            $role->add_cap('edit_listing');
            $role->add_cap('read_listing');
            $role->add_cap('delete_listing');
            $role->add_cap('edit_listings');
            $role->add_cap('edit_others_listings');
            $role->add_cap('publish_listings');
            $role->add_cap('read_private_listings');
        }
    }
});

// add_action('transition_post_status', function ($new_status, $old_status, $post) {
//     if ($post->post_type !== 'listing') {
//         return;
//     }

//     // Only trigger when the post is published
//     if ($old_status !== 'publish' && $new_status === 'publish') {
//         $comments = get_comments([
//             'post_id' => $post->ID,
//             'status'  => 'hold',
//             'type'    => '',
//         ]);

//         foreach ($comments as $comment) {
//             wp_set_comment_status($comment->comment_ID, 'approve');
//         }
//     }
// }, 10, 3);

add_action('save_post_listing', function ($post_id) {
    $map = get_field('google_map_url', $post_id);

    if (!empty($map['address'])) {
        update_post_meta($post_id, 'street_address', $map['address']);
    }
});

add_action(
    'rest_api_init',
    function () {
        register_rest_route(
            'custom/v1',
            '/listing',
            [
                'methods' => 'POST',
                'callback' => 'create_listing',
                'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            ]
        );

        register_rest_route(
            'custom/v1',
            '/listing/(?P<id>\d+)',
            [
                'methods' => ['PUT', 'OPTIONS'],
                'callback' => 'update_listing',
                'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            ]
        );

        register_rest_route(
            'custom/v1',
            '/listing/(?P<id>\d+)',
            [
                'methods' => 'DELETE',
                'callback' => 'delete_listing',
                'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            ]
        );

        ### FAVORITES ENDPOINTS ###
        // Save/Unsave/Check a favorite restaurant
        register_rest_route('restaurant/v1', '/favorite/', [
            'methods' => 'POST',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }
                $restaurant_slug = isset($request['restaurant_slug']) ? sanitize_title($request['restaurant_slug']) : '';
                $action = isset($request['action']) ? $request['action'] : '';
                $listing = get_page_by_path($restaurant_slug, OBJECT, 'listing');
                if (!$listing || $listing->post_type !== 'listing') {
                    return new WP_Error('rest_invalid_param', 'Invalid or non-existent listing slug', ['status' => 400]);
                }
                $listing_id = $listing->ID;
                $meta_key = 'dwt_listing_fav_listing_id_' . $listing_id;
                if ($action === 'save') {
                    if (!get_user_meta($user_id, $meta_key, true)) {
                        add_user_meta($user_id, $meta_key, $listing_id);
                    }
                    return ['status' => 'saved', 'listing_id' => $listing_id];
                } elseif ($action === 'unsave') {
                    delete_user_meta($user_id, $meta_key, $listing_id);
                    return ['status' => 'unsaved', 'listing_id' => $listing_id];
                } elseif ($action === 'check') {
                    $is_fav = get_user_meta($user_id, $meta_key, true);
                    return ['status' => $is_fav ? 'saved' : 'unsaved', 'listing_id' => $listing_id];
                } else {
                    return new WP_Error('rest_invalid_param', 'Invalid action', ['status' => 400]);
                }
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            'args' => [
                'restaurant_slug' => ['required' => true, 'type' => 'string'],
                'action' => ['required' => true, 'type' => 'string', 'enum' => ['save', 'unsave', 'check']],
            ],
        ]);

        // List all favorite restaurant IDs for a user (public endpoint)
        register_rest_route('restaurant/v1', '/favorites/', [
            'methods' => 'GET',
            'callback' => function (WP_REST_Request $request) {
                // Require user_id parameter (public endpoint - no authentication needed)
                $user_id = intval($request->get_param('user_id'));
                
                if (!$user_id) {
                    return new WP_Error(
                        'missing_user_id',
                        'user_id parameter is required',
                        ['status' => 400]
                    );
                }
                
                // Verify user exists
                if (!get_userdata($user_id)) {
                    return new WP_Error(
                        'invalid_user',
                        'User not found',
                        ['status' => 404]
                    );
                }
                global $wpdb;
                $meta_key_like = $wpdb->esc_like('dwt_listing_fav_listing_id_') . '%';
                $results = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT meta_key, meta_value FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s",
                        $user_id,
                        $meta_key_like
                    )
                );
                $restaurant_ids = [];
                foreach ($results as $row) {
                    $restaurant_id = intval($row->meta_value);
                    if (get_post_type($restaurant_id) === 'listing') {
                        $restaurant_ids[] = $restaurant_id;
                    }
                }
                return [
                    'favorites' => $restaurant_ids,
                    'count' => count($restaurant_ids),
                    'user_id' => $user_id
                ];
            },
            'permission_callback' => 'dev_chrono_public_profile_auth',
            'args' => array(
                'user_id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && intval($param) > 0;
                    },
                    'sanitize_callback' => 'absint',
                ),
            ),
        ]);

        // List all users and their favorite restaurants (admin only)
        register_rest_route('restaurant/v1', '/all-user-favorites/', [
            'methods' => 'GET',
            'callback' => function () {
                if (!current_user_can('manage_options')) {
                    return new WP_Error('rest_forbidden', 'Only admins can access this endpoint.', ['status' => 403]);
                }
                $users = get_users(['fields' => ['ID', 'user_login', 'display_name', 'user_email']]);
                global $wpdb;
                $all = [];
                foreach ($users as $user) {
                    $meta_key_like = $wpdb->esc_like('dwt_listing_fav_listing_id_') . '%';
                    $results = $wpdb->get_results(
                        $wpdb->prepare(
                            "SELECT meta_value FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s",
                            $user->ID,
                            $meta_key_like
                        )
                    );
                    $restaurant_ids = [];
                    foreach ($results as $row) {
                        $restaurant_id = intval($row->meta_value);
                        if (get_post_type($restaurant_id) === 'listing') {
                            $restaurant_ids[] = $restaurant_id;
                        }
                    }
                    $all[] = [
                        'user_id' => $user->ID,
                        'user_login' => $user->user_login,
                        'display_name' => $user->display_name,
                        'user_email' => $user->user_email,
                        'favorites' => $restaurant_ids
                    ];
                }
                return $all;
            },
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);

        // Get current user details
        register_rest_route('restaurant/v1', '/current-user/', [
            'methods' => 'GET',
            'callback' => function () {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }
                $user = get_userdata($user_id);
                if (!$user) {
                    return new WP_Error('rest_user_invalid', 'User not found', ['status' => 404]);
                }
                return [
                    'ID' => $user->ID,
                    'user_login' => $user->user_login,
                    'user_email' => $user->user_email,
                    'display_name' => $user->display_name,
                    'user_registered' => $user->user_registered,
                    'roles' => $user->roles,
                ];
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
        ]);

        // Get user by username or email (for admin or public use)
        register_rest_route('v1', '/user/', [
            'methods' => 'GET',
            'callback' => function ($request) {
                $username = $request->get_param('username');
                $email = $request->get_param('email');
                if ($username) {
                    $user = get_user_by('login', $username);
                } elseif ($email) {
                    $user = get_user_by('email', $email);
                } else {
                    return new WP_Error('rest_invalid_param', 'Username or email required', ['status' => 400]);
                }
                if (!$user) {
                    return new WP_Error('rest_user_invalid', 'User not found', ['status' => 404]);
                }
                return [
                    'ID' => $user->ID,
                    'user_login' => $user->user_login,
                    'user_nicename' => $user->user_nicename,
                    'user_email' => $user->user_email,
                    'display_name' => $user->display_name,
                    'user_registered' => $user->user_registered,
                    'roles' => $user->roles,
                ];
            },
            'permission_callback' => '__return_true'
        ]);

        // Get user info from JWT token (using JWT plugin, no manual decode)
        register_rest_route('v1', '/token-user/', [
            'methods' => 'GET',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in or invalid token', ['status' => 401]);
                }
                $user = get_userdata($user_id);
                if (!$user) {
                    return new WP_Error('rest_user_invalid', 'User not found', ['status' => 404]);
                }
                return [
                    'ID' => $user->ID,
                    'user_login' => $user->user_login,
                    'user_nicename' => $user->user_nicename,
                    'user_email' => $user->user_email,
                    'display_name' => $user->display_name,
                    'user_registered' => $user->user_registered,
                    'roles' => $user->roles,
                ];
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
        ]);

        // Get user palates (cuisines/ethnicities) from usermeta
        register_rest_route('restaurant/v1', '/user-palates/', [
            'methods'  => 'GET',
            'callback' => function ($request) {
                $user_id = intval($request->get_param('user_id') ?: 0);
                if (! $user_id) {
                    return new WP_Error('rest_invalid_param', 'Missing user_id', ['status' => 400]);
                }
                $palates = get_user_meta($user_id, 'palates', true);
                if (is_string($palates)) {
                    $palatesArr = preg_split('/[|,]/', $palates);
                    $palatesArr = array_map('trim', $palatesArr);
                    $palatesArr = array_filter($palatesArr, fn($v) => $v !== '');
                } else {
                    $palatesArr = [];
                }
                return [
                    'user_id' => $user_id,
                    'palates' => array_values($palatesArr),
                ];
            },
            'permission_callback' => '__return_true',
            'args' => [
                'user_id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        // Get reviews for a restaurant (for modal)
        register_rest_route('restaurant/v1', '/reviews/', [
            'methods' => 'GET',
            'callback' => function ($request) {
                global $wpdb;
                $restaurant_id = intval($request->get_param('restaurantId'));
                if (!$restaurant_id) {
                    return new WP_Error('rest_invalid_param', 'Missing restaurantId', ['status' => 400]);
                }
                $comments = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM {$wpdb->comments} WHERE comment_post_ID = %d AND comment_approved = 1 AND comment_type = 'listing' ORDER BY comment_date DESC",
                    $restaurant_id
                ));
                $user_id = get_current_user_id();
                $reviews = [];
                foreach ($comments as $comment) {
                    $user = get_userdata($comment->user_id);
                    $author_name = $user ? $user->display_name : $comment->comment_author;
                    $profile_image = '';
                    if ($user) {
                        $attachment_id = get_user_meta($user->ID, 'profile_image', true);
                        if ($attachment_id && is_numeric($attachment_id)) {
                            $image_url = wp_get_attachment_image_url($attachment_id, 'thumbnail');
                            if ($image_url) {
                                $profile_image = $image_url;
                            }
                        }
                    }
                    $author_image = $profile_image ? $profile_image : ($user ? get_avatar_url($user->ID, ['size' => 96]) : '');
                    $palates = [];
                    if ($user) {
                        $palates_raw = get_user_meta($user->ID, 'palates', true);
                        if (is_string($palates_raw)) {
                            $palatesArr = preg_split('/[|,]/', $palates_raw);
                            $palatesArr = array_map('trim', $palatesArr);
                            $palatesArr = array_filter($palatesArr, fn($v) => $v !== '');
                            foreach ($palatesArr as $p) {
                                $palates[] = ['name' => $p];
                            }
                        }
                    }
                    $rating = intval(get_comment_meta($comment->comment_ID, 'review_stars', true));
                    $title = get_comment_meta($comment->comment_ID, 'review_main_title', true);
                    $likes = intval(get_comment_meta($comment->comment_ID, '_comment_likes', true));
                    $likes_users = get_comment_meta($comment->comment_ID, '_comment_likes_users', true);
                    $likes_users = is_array($likes_users) ? $likes_users : [];
                    $userHasLiked = $user_id && in_array($user_id, $likes_users);
                    $reviews[] = [
                        'id' => $comment->comment_ID,
                        'author' => [
                            'name' => $author_name,
                            'image' => $author_image,
                            'profile_image' => $profile_image,
                            'palates' => $palates,
                        ],
                        'rating' => $rating,
                        'date' => $comment->comment_date,
                        'title' => $title,
                        'comment' => $comment->comment_content,
                        'likes' => $likes,
                        'userHasLiked' => $userHasLiked,
                    ];
                }
                return ['reviews' => $reviews];
            },
            'permission_callback' => '__return_true',
            'args' => ['restaurantId' => ['type' => 'integer']],
        ]);

        ### FOLLOW/UNFOLLOW ENDPOINTS ###
        // Follow (toggle follow/unfollow)
        register_rest_route('v1', '/follow', [
            'methods' => 'POST',
            'callback' => 'tastyplates_follow_user_rest',
            'permission_callback' => 'dev_chrono_check_auth'
        ]);
        // Unfollow (explicit unfollow)
        register_rest_route('v1', '/unfollow', [
            'methods' => 'POST',
            'callback' => 'tastyplates_unfollow_user_rest',
            'permission_callback' => 'dev_chrono_check_auth'
        ]);
        // Add is-following endpoint
        register_rest_route('v1', '/is-following', [
            'methods' => 'POST',
            'callback' => function ($request) {
                $user_id = intval($request->get_param('user_id'));
                if (!$user_id) {
                    $body = json_decode($request->get_body(), true);
                    if (isset($body['user_id'])) {
                        $user_id = intval($body['user_id']);
                    }
                }
                $follower_id = get_current_user_id();
                if (!$user_id || !$follower_id) {
                    return new WP_Error('invalid_request', 'Invalid user IDs.', ['status' => 400]);
                }
                // Check if the user_id exists in wp_users
                if (!get_userdata($user_id)) {
                    return ['is_following' => false];
                }
                // Prevent self-checks from returning errors
                if ($user_id === $follower_id) {
                    return ['is_following' => false];
                }
                global $wpdb;
                $table_name = $wpdb->prefix . 'user_followers';
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $table_name WHERE user_id = %d AND follower_id = %d",
                    $user_id,
                    $follower_id
                ));
                return ['is_following' => !!$exists];
            },
            'permission_callback' => 'dev_chrono_check_auth'
        ]);

        ### FOLLOWING/FOLLOWERS LIST ENDPOINTS ###
        register_rest_route('v1', '/following-list', array(
            'methods' => 'GET',
            'callback' => 'get_following_list',
            'permission_callback' => 'dev_chrono_public_profile_auth',
            'args' => array(
                'user_id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && intval($param) > 0;
                    },
                    'sanitize_callback' => 'absint',
                ),
            ),
        ));

        register_rest_route('v1', '/followers-list', array(
            'methods' => 'GET',
            'callback' => 'get_followers_list',
            'permission_callback' => 'dev_chrono_public_profile_auth',
            'args' => array(
                'user_id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && intval($param) > 0;
                    },
                    'sanitize_callback' => 'absint',
                ),
            ),
        ));

        // Following reviews endpoint
        register_rest_route('v1', '/following-reviews', array(
            'methods' => 'GET',
            'callback' => 'get_following_reviews',
            'permission_callback' => 'dev_chrono_check_auth'
        ));

        // Suggested users endpoint
        register_rest_route('v1', '/suggested-users', array(
            'methods' => 'GET',
            'callback' => 'get_suggested_users',
            'permission_callback' => 'dev_chrono_check_auth'
        ));

        ### REVIEW META FIELDS FOR COMMENTS ###
        register_rest_field('comment', 'review_main_title', [
            'get_callback' => function ($comment_arr) {
                $meta = get_comment_meta($comment_arr['id'], 'review_main_title', true);
                return $meta ? $meta : '';
            },
            'schema' => [
                'description' => __('Review main title from commentmeta.'),
                'type'        => 'string',
                'context'     => ['view', 'edit'],
            ],
        ]);
        register_rest_field('comment', 'review_stars', [
            'get_callback' => function ($comment_arr) {
                $meta = get_comment_meta($comment_arr['id'], 'review_stars', true);
                return $meta ? floatval($meta) : 0.0;
            },
            'schema' => [
                'description' => __('Review stars from commentmeta.'),
                'type'        => 'number',
                'context'     => ['view', 'edit'],
            ],
        ]);

        ### COMMENT SUBMISSION ENDPOINT ###
        register_rest_route('v1', '/review', [
            'methods' => 'POST',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }

                $params = $request->get_json_params();
                $content = sanitize_textarea_field($params['content'] ?? '');
                $restaurant_id = intval($params['restaurantId'] ?? 0);
                $parent_id = intval($params['parent'] ?? 0);
                $author_id = intval($params['authorId'] ?? $user_id);

                if (empty($content)) {
                    return new WP_Error('rest_invalid_param', 'Content is required', ['status' => 400]);
                }

                if (!$restaurant_id && !$parent_id) {
                    return new WP_Error('rest_invalid_param', 'Either restaurantId or parent is required', ['status' => 400]);
                }

                // Determine the post ID - use restaurant_id for top-level comments, or get from parent
                $post_id = $restaurant_id;
                if ($parent_id && !$restaurant_id) {
                    $parent_comment = get_comment($parent_id);
                    if ($parent_comment) {
                        $post_id = $parent_comment->comment_post_ID;
                    } else {
                        return new WP_Error('rest_invalid_param', 'Invalid parent comment', ['status' => 400]);
                    }
                }

                // Check mode parameter to determine if this is a draft or published review
                $mode = isset($params['mode']) ? sanitize_text_field($params['mode']) : 'publish';
                $is_draft = $mode === 'draft';

                // Create comment data
                $comment_data = [
                    'comment_post_ID' => $post_id,
                    'comment_content' => $content,
                    'comment_type' => $is_draft ? 'listing_draft' : 'listing',
                    'comment_approved' => $is_draft ? 0 : 1, // Drafts are unapproved, published reviews are auto-approved
                    'user_id' => $author_id,
                    'comment_parent' => $parent_id, // 0 for top-level comments
                ];

                $comment_id = wp_insert_comment($comment_data);

                if (is_wp_error($comment_id)) {
                    return new WP_Error('rest_comment_failed', $comment_id->get_error_message(), ['status' => 500]);
                }

                // Auto-extract hashtags from content
                preg_match_all('/#[\w\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]+/u', $content, $matches);
                $tags = [];
                foreach ($matches[0] as $tag) {
                    $clean = strtolower(trim(ltrim($tag, '#')));
                    if ($clean !== '' && strlen($clean) <= 100) {
                        $tags[] = $clean;
                    }
                }
                if (!empty($tags)) {
                    update_comment_meta($comment_id, 'hashtags', implode(',', array_values(array_unique($tags))));
                }

                // Add review meta data if provided
                if (isset($params['review_stars'])) {
                    update_comment_meta($comment_id, 'review_stars', floatval($params['review_stars']));
                }
                if (isset($params['review_main_title'])) {
                    update_comment_meta($comment_id, 'review_main_title', sanitize_text_field($params['review_main_title']));
                }
                if (isset($params['recognitions']) && is_array($params['recognitions'])) {
                    update_comment_meta($comment_id, 'recognitions', $params['recognitions']);
                }
                // Handle new ACF field parameter
                if (isset($params['review_images']) && is_array($params['review_images'])) {
                    $uploaded_image_ids = upload_review_images($params['review_images']);
                    
                    if (!empty($uploaded_image_ids)) {
                        // Save to ACF field for new reviews (if ACF is configured)
                        if (function_exists('update_field')) {
                            update_field('review_images', $uploaded_image_ids, 'comment_' . $comment_id);
                        }
                        // Also save to comment meta as backup during transition
                        update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
                    }
                } 
                // Fallback: support old parameter name
                elseif (isset($params['review_images_idz']) && is_array($params['review_images_idz'])) {
                    $uploaded_image_ids = upload_review_images($params['review_images_idz']);
                    
                    if (!empty($uploaded_image_ids)) {
                        update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
                    }
                }

                return [
                    'status' => $is_draft ? 201 : 200, // 201 for draft created, 200 for published
                    'status_text' => $is_draft ? 'draft' : 'approved',
                    'comment_id' => $comment_id,
                    'message' => $is_draft ? 'Review saved as draft' : 'Comment submitted successfully'
                ];
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
        ]);

        ### REVIEW DRAFTS ENDPOINT ###
        register_rest_route('wp/v2/api', '/review-drafts', [
            'methods' => 'GET',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }

                global $wpdb;
                
                // Get all draft reviews for the current user
                $draft_comments = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM {$wpdb->comments} 
                     WHERE user_id = %d 
                     AND comment_type = 'listing_draft'
                     AND comment_approved = 0
                     ORDER BY comment_date DESC",
                    $user_id
                ));

                $drafts = [];
                foreach ($draft_comments as $comment) {
                    // Get review metadata
                    $review_stars = get_comment_meta($comment->comment_ID, 'review_stars', true);
                    $review_main_title = get_comment_meta($comment->comment_ID, 'review_main_title', true);
                    $recognitions = get_comment_meta($comment->comment_ID, 'recognitions', true);
                    
                    // Try ACF field first (if ACF is active)
                    $review_images_idz = [];
                    if (function_exists('get_field')) {
                        $acf_images = get_field('review_images', 'comment_' . $comment->comment_ID);
                        if (!empty($acf_images)) {
                            $review_images_idz = $acf_images;
                        }
                    }
                    // Fallback to comment meta
                    if (empty($review_images_idz)) {
                        $review_images_idz = get_comment_meta($comment->comment_ID, 'review_images_idz', true);
                    }
                    
                    // Get restaurant/post information
                    $post = get_post($comment->comment_post_ID);
                    
                    // Get author information
                    $user = get_userdata($comment->user_id);
                    $author_name = $user ? $user->display_name : $comment->comment_author;
                    
                    // Use same logic as GraphQL userAvatar field - get from user meta profile_image
                    $profile_image_id = get_user_meta($comment->user_id, 'profile_image', true);
                    $author_avatar = null;
                    if ($profile_image_id) {
                        $author_avatar = wp_get_attachment_url($profile_image_id);
                    }
                    
                    // Format review images - handle multiple ACF Gallery return formats
                    $review_images = [];
                    if (!empty($review_images_idz)) {
                        // Handle array format
                        if (is_array($review_images_idz)) {
                            foreach ($review_images_idz as $image_data) {
                                // Case 1: Already formatted object with id and sourceUrl
                                if (is_array($image_data) && isset($image_data['sourceUrl'])) {
                                    $review_images[] = $image_data;
                                }
                                // Case 2: ACF returns image object/array with ID and url
                                else if (is_array($image_data) && isset($image_data['ID'])) {
                                    $image_url = isset($image_data['url']) ? $image_data['url'] : wp_get_attachment_image_url($image_data['ID'], 'full');
                                    if ($image_url) {
                                        $review_images[] = [
                                            'id' => $image_data['ID'],
                                            'sourceUrl' => $image_url,
                                        ];
                                    }
                                }
                                // Case 3: Simple ID (number or numeric string)
                                else if (is_numeric($image_data)) {
                                    $image_id = intval($image_data);
                                    $image_url = wp_get_attachment_image_url($image_id, 'full');
                                    if ($image_url) {
                                        $review_images[] = [
                                            'id' => $image_id,
                                            'sourceUrl' => $image_url,
                                        ];
                                    }
                                }
                                // Case 4: Direct URL string (fallback)
                                else if (is_string($image_data) && filter_var($image_data, FILTER_VALIDATE_URL)) {
                                    $review_images[] = [
                                        'id' => 0,
                                        'sourceUrl' => $image_data,
                                    ];
                                }
                            }
                        }
                        // Handle single value (edge case)
                        else if (is_numeric($review_images_idz)) {
                            $image_url = wp_get_attachment_image_url(intval($review_images_idz), 'full');
                            if ($image_url) {
                                $review_images[] = [
                                    'id' => intval($review_images_idz),
                                    'sourceUrl' => $image_url,
                                ];
                            }
                        }
                    }

                    $drafts[] = [
                        'id' => $comment->comment_ID,
                        'post' => $comment->comment_post_ID,
                        'author' => $comment->user_id,
                        'author_name' => $author_name,
                        'author_avatar' => $author_avatar,
                        'content' => [
                            'rendered' => wp_kses_post($comment->comment_content),
                            'raw' => $comment->comment_content,
                        ],
                        'date' => $comment->comment_date,
                        'link' => get_permalink($comment->comment_post_ID),
                        'status' => $post ? $post->post_status : 'publish',
                        'type' => $comment->comment_type,
                        'review_main_title' => $review_main_title ?: '',
                        'review_stars' => $review_stars ?: '0',
                        'recognitions' => $recognitions ? (is_array($recognitions) ? $recognitions : []) : [],
                        'review_images' => $review_images,
                    ];
                }

                return $drafts;
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
        ]);

        ### GET SINGLE REVIEW DRAFT ENDPOINT ###
        register_rest_route('wp/v2/api', '/review-drafts/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }

                $comment_id = intval($request['id']);
                if (!$comment_id) {
                    return new WP_Error('rest_invalid_param', 'Missing comment ID', ['status' => 400]);
                }

                // Get the comment
                $comment = get_comment($comment_id);
                if (!$comment) {
                    return new WP_Error('rest_not_found', 'Comment not found', ['status' => 404]);
                }

                // Verify ownership
                if ($comment->user_id != $user_id) {
                    return new WP_Error('rest_forbidden', 'You can only access your own drafts', ['status' => 403]);
                }

                // Verify it's a draft
                if ($comment->comment_type !== 'listing_draft') {
                    return new WP_Error('rest_invalid_param', 'Can only access draft reviews', ['status' => 400]);
                }

                // Get review metadata
                $review_stars = get_comment_meta($comment->comment_ID, 'review_stars', true);
                $review_main_title = get_comment_meta($comment->comment_ID, 'review_main_title', true);
                $recognitions = get_comment_meta($comment->comment_ID, 'recognitions', true);
                
                // Try ACF field first (if ACF is active)
                $review_images_idz = [];
                if (function_exists('get_field')) {
                    $acf_images = get_field('review_images', 'comment_' . $comment->comment_ID);
                    if (!empty($acf_images)) {
                        $review_images_idz = $acf_images;
                    }
                }
                // Fallback to comment meta
                if (empty($review_images_idz)) {
                    $review_images_idz = get_comment_meta($comment->comment_ID, 'review_images_idz', true);
                }
                
                $hashtags = get_comment_meta($comment->comment_ID, 'hashtags', true);
                
                // Get restaurant/post information
                $post = get_post($comment->comment_post_ID);
                
                // Get author information
                $user = get_userdata($comment->user_id);
                $author_name = $user ? $user->display_name : $comment->comment_author;
                
                // Use same logic as GraphQL userAvatar field - get from user meta profile_image
                $profile_image_id = get_user_meta($comment->user_id, 'profile_image', true);
                $author_avatar = null;
                if ($profile_image_id) {
                    $author_avatar = wp_get_attachment_url($profile_image_id);
                }
                
                // Format review images with URLs - handle multiple ACF Gallery return formats
                $review_images = [];
                if (!empty($review_images_idz)) {
                    // Handle array format
                    if (is_array($review_images_idz)) {
                        foreach ($review_images_idz as $image_data) {
                            // Case 1: Already formatted object with id and sourceUrl
                            if (is_array($image_data) && isset($image_data['sourceUrl'])) {
                                $review_images[] = $image_data;
                            }
                            // Case 2: ACF returns image object/array with ID and url
                            else if (is_array($image_data) && isset($image_data['ID'])) {
                                $image_url = isset($image_data['url']) ? $image_data['url'] : wp_get_attachment_image_url($image_data['ID'], 'full');
                                if ($image_url) {
                                    $review_images[] = [
                                        'id' => $image_data['ID'],
                                        'sourceUrl' => $image_url,
                                    ];
                                }
                            }
                            // Case 3: Simple ID (number or numeric string)
                            else if (is_numeric($image_data)) {
                                $image_id = intval($image_data);
                                $image_url = wp_get_attachment_image_url($image_id, 'full');
                                if ($image_url) {
                                    $review_images[] = [
                                        'id' => $image_id,
                                        'sourceUrl' => $image_url,
                                    ];
                                }
                            }
                            // Case 4: Direct URL string (fallback)
                            else if (is_string($image_data) && filter_var($image_data, FILTER_VALIDATE_URL)) {
                                $review_images[] = [
                                    'id' => 0,
                                    'sourceUrl' => $image_data,
                                ];
                            }
                        }
                    }
                    // Handle single value (edge case)
                    else if (is_numeric($review_images_idz)) {
                        $image_url = wp_get_attachment_image_url(intval($review_images_idz), 'full');
                        if ($image_url) {
                            $review_images[] = [
                                'id' => intval($review_images_idz),
                                'sourceUrl' => $image_url,
                            ];
                        }
                    }
                }

                return [
                    'id' => $comment->comment_ID,
                    'post' => $comment->comment_post_ID,
                    'restaurantId' => $comment->comment_post_ID, // Alias for compatibility
                    'author' => $comment->user_id,
                    'author_name' => $author_name,
                    'author_avatar' => $author_avatar,
                    'content' => [
                        'rendered' => wp_kses_post($comment->comment_content),
                        'raw' => $comment->comment_content,
                    ],
                    'date' => $comment->comment_date,
                    'link' => get_permalink($comment->comment_post_ID),
                    'status' => $post ? $post->post_status : 'publish',
                    'type' => $comment->comment_type,
                    'review_main_title' => $review_main_title ?: '',
                    'review_stars' => $review_stars ?: '0',
                    'recognitions' => $recognitions ? (is_array($recognitions) ? $recognitions : []) : [],
                    'review_images' => $review_images,
                    'review_images_idz' => $review_images_idz ? (is_array($review_images_idz) ? $review_images_idz : []) : [],
                    'hashtags' => $hashtags ?: '',
                ];
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);

        ### UPDATE REVIEW DRAFT ENDPOINT ###
        register_rest_route('wp/v2/api', '/review-drafts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }

                $comment_id = intval($request['id']);
                if (!$comment_id) {
                    return new WP_Error('rest_invalid_param', 'Missing comment ID', ['status' => 400]);
                }

                // Get the comment
                $comment = get_comment($comment_id);
                if (!$comment) {
                    return new WP_Error('rest_not_found', 'Comment not found', ['status' => 404]);
                }

                // Verify ownership
                if ($comment->user_id != $user_id) {
                    return new WP_Error('rest_forbidden', 'You can only update your own drafts', ['status' => 403]);
                }

                // Verify it's a draft
                if ($comment->comment_type !== 'listing_draft') {
                    return new WP_Error('rest_invalid_param', 'Can only update draft reviews', ['status' => 400]);
                }

                $params = $request->get_json_params();

                // Update comment content if provided
                $update_data = [];
                if (isset($params['content'])) {
                    $update_data['comment_content'] = sanitize_textarea_field($params['content']);
                }
                
                if (!empty($update_data)) {
                    $update_data['comment_ID'] = $comment_id;
                    wp_update_comment($update_data);
                }

                // Update review metadata if provided
                if (isset($params['review_stars'])) {
                    update_comment_meta($comment_id, 'review_stars', floatval($params['review_stars']));
                }
                if (isset($params['review_main_title'])) {
                    update_comment_meta($comment_id, 'review_main_title', sanitize_text_field($params['review_main_title']));
                }
                if (isset($params['recognitions']) && is_array($params['recognitions'])) {
                    update_comment_meta($comment_id, 'recognitions', $params['recognitions']);
                }

                // Handle review images update
                if (isset($params['review_images']) && is_array($params['review_images'])) {
                    $uploaded_image_ids = upload_review_images($params['review_images']);
                    
                    if (!empty($uploaded_image_ids)) {
                        // Save to ACF field (if ACF is configured)
                        if (function_exists('update_field')) {
                            update_field('review_images', $uploaded_image_ids, 'comment_' . $comment_id);
                        }
                        // Also save to comment meta as backup during transition
                        update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
                    } else {
                        // Clear both ACF field and meta
                        if (function_exists('delete_field')) {
                            delete_field('review_images', 'comment_' . $comment_id);
                        }
                        delete_comment_meta($comment_id, 'review_images_idz');
                    }
                } elseif (isset($params['review_images_idz']) && is_array($params['review_images_idz'])) {
                    // Fallback for old parameter
                    $uploaded_image_ids = upload_review_images($params['review_images_idz']);
                    
                    if (!empty($uploaded_image_ids)) {
                        update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
                    } else {
                        // If empty array, clear the meta
                        delete_comment_meta($comment_id, 'review_images_idz');
                    }
                }

                // Auto-extract hashtags from content
                $content_for_tags = isset($params['content']) ? $params['content'] : $comment->comment_content;
                preg_match_all('/#[\w\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]+/u', $content_for_tags, $matches);
                $tags = [];
                foreach ($matches[0] as $tag) {
                    $clean = strtolower(trim(ltrim($tag, '#')));
                    if ($clean !== '' && strlen($clean) <= 100) {
                        $tags[] = $clean;
                    }
                }
                if (!empty($tags)) {
                    update_comment_meta($comment_id, 'hashtags', implode(',', array_values(array_unique($tags))));
                }

                // If mode is 'publish', convert draft to published review
                if (isset($params['mode']) && $params['mode'] === 'publish') {
                    wp_update_comment([
                        'comment_ID' => $comment_id,
                        'comment_type' => 'listing',
                        'comment_approved' => 1,
                    ]);
                }

                // Return updated review data (same format as GET)
                $updated_comment = get_comment($comment_id);
                $review_stars = get_comment_meta($comment_id, 'review_stars', true);
                $review_main_title = get_comment_meta($comment_id, 'review_main_title', true);
                $recognitions = get_comment_meta($comment_id, 'recognitions', true);
                $review_images_idz = get_comment_meta($comment_id, 'review_images_idz', true);
                $hashtags = get_comment_meta($comment_id, 'hashtags', true);
                $post = get_post($updated_comment->comment_post_ID);
                $user = get_userdata($updated_comment->user_id);
                $author_name = $user ? $user->display_name : $updated_comment->comment_author;
                
                // Format review images - handle multiple ACF Gallery return formats
                $review_images = [];
                if (!empty($review_images_idz)) {
                    // Handle array format
                    if (is_array($review_images_idz)) {
                        foreach ($review_images_idz as $image_data) {
                            // Case 1: Already formatted object with id and sourceUrl
                            if (is_array($image_data) && isset($image_data['sourceUrl'])) {
                                $review_images[] = $image_data;
                            }
                            // Case 2: ACF returns image object/array with ID and url
                            else if (is_array($image_data) && isset($image_data['ID'])) {
                                $image_url = isset($image_data['url']) ? $image_data['url'] : wp_get_attachment_image_url($image_data['ID'], 'full');
                                if ($image_url) {
                                    $review_images[] = [
                                        'id' => $image_data['ID'],
                                        'sourceUrl' => $image_url,
                                    ];
                                }
                            }
                            // Case 3: Simple ID (number or numeric string)
                            else if (is_numeric($image_data)) {
                                $image_id = intval($image_data);
                                $image_url = wp_get_attachment_image_url($image_id, 'full');
                                if ($image_url) {
                                    $review_images[] = [
                                        'id' => $image_id,
                                        'sourceUrl' => $image_url,
                                    ];
                                }
                            }
                            // Case 4: Direct URL string (fallback)
                            else if (is_string($image_data) && filter_var($image_data, FILTER_VALIDATE_URL)) {
                                $review_images[] = [
                                    'id' => 0,
                                    'sourceUrl' => $image_data,
                                ];
                            }
                        }
                    }
                    // Handle single value (edge case)
                    else if (is_numeric($review_images_idz)) {
                        $image_url = wp_get_attachment_image_url(intval($review_images_idz), 'full');
                        if ($image_url) {
                            $review_images[] = [
                                'id' => intval($review_images_idz),
                                'sourceUrl' => $image_url,
                            ];
                        }
                    }
                }

                return [
                    'status' => 200,
                    'message' => isset($params['mode']) && $params['mode'] === 'publish' ? 'Review published successfully' : 'Draft updated successfully',
                    'data' => [
                        'id' => $updated_comment->comment_ID,
                        'post' => $updated_comment->comment_post_ID,
                        'restaurantId' => $updated_comment->comment_post_ID,
                        'author' => $updated_comment->user_id,
                        'author_name' => $author_name,
                        'content' => [
                            'rendered' => wp_kses_post($updated_comment->comment_content),
                            'raw' => $updated_comment->comment_content,
                        ],
                        'date' => $updated_comment->comment_date,
                        'link' => get_permalink($updated_comment->comment_post_ID),
                        'status' => $post ? $post->post_status : 'publish',
                        'type' => $updated_comment->comment_type,
                        'review_main_title' => $review_main_title ?: '',
                        'review_stars' => $review_stars ?: '0',
                        'recognitions' => $recognitions ? (is_array($recognitions) ? $recognitions : []) : [],
                        'review_images' => $review_images,
                        'review_images_idz' => $review_images_idz ? (is_array($review_images_idz) ? $review_images_idz : []) : [],
                        'hashtags' => $hashtags ?: '',
                    ]
                ];
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);

        ### DELETE REVIEW DRAFT ENDPOINT ###
        register_rest_route('wp/v2/api', '/review-drafts/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }

                $comment_id = intval($request['id']);
                if (!$comment_id) {
                    return new WP_Error('rest_invalid_param', 'Missing comment ID', ['status' => 400]);
                }

                // Verify the comment belongs to the current user
                $comment = get_comment($comment_id);
                if (!$comment) {
                    return new WP_Error('rest_not_found', 'Comment not found', ['status' => 404]);
                }

                if ($comment->user_id != $user_id) {
                    return new WP_Error('rest_forbidden', 'You can only delete your own drafts', ['status' => 403]);
                }

                // Verify it's a draft
                if ($comment->comment_type !== 'listing_draft') {
                    return new WP_Error('rest_invalid_param', 'Can only delete draft reviews', ['status' => 400]);
                }

                // Delete the comment
                $result = wp_delete_comment($comment_id, true); // true = force delete (bypass trash)

                if ($result) {
                    return [
                        'success' => true,
                        'message' => 'Draft deleted successfully'
                    ];
                } else {
                    return new WP_Error('rest_delete_failed', 'Failed to delete draft', ['status' => 500]);
                }
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);

        ### COMMENT LIKE/UNLIKE ENDPOINT ###
        register_rest_route('restaurant/v1', '/comment-like', [
            'methods' => 'POST',
            'callback' => function ($request) {
                $comment_id = intval($request->get_param('comment_id'));
                $like = filter_var($request->get_param('like'), FILTER_VALIDATE_BOOLEAN);
                $user_id = get_current_user_id();
                if (!$comment_id || !$user_id) {
                    return new WP_Error('invalid_request', 'Missing comment_id or not logged in', ['status' => 400]);
                }
                $user_likes = get_comment_meta($comment_id, '_comment_likes_users', true);
                $user_likes = is_array($user_likes) ? $user_likes : [];
                $changed = false;
                if ($like) {
                    if (!in_array($user_id, $user_likes)) {
                        $user_likes[] = $user_id;
                        $changed = true;
                    }
                } else {
                    $key = array_search($user_id, $user_likes);
                    if ($key !== false) {
                        unset($user_likes[$key]);
                        $changed = true;
                    }
                }
                if ($changed) {
                    update_comment_meta($comment_id, '_comment_likes_users', array_values($user_likes));
                    update_comment_meta($comment_id, '_comment_likes', count($user_likes));
                }
                return [
                    'success' => true,
                    'likes' => count($user_likes),
                    'userHasLiked' => $like
                ];
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
        ]);

        ### CHECK-IN ENDPOINTS ###
        // Check-In/Uncheck/Check status for a restaurant
        register_rest_route('restaurant/v1', '/checkin/', [
            'methods' => 'POST',
            'callback' => function ($request) {
                $user_id = get_current_user_id();
                if (!$user_id) {
                    return new WP_Error('rest_forbidden', 'Not logged in', ['status' => 401]);
                }
                $restaurant_slug = isset($request['restaurant_slug']) ? sanitize_title($request['restaurant_slug']) : '';
                $action = isset($request['action']) ? $request['action'] : '';
                $listing = get_page_by_path($restaurant_slug, OBJECT, 'listing');
                if (!$listing || $listing->post_type !== 'listing') {
                    return new WP_Error('rest_invalid_param', 'Invalid or non-existent listing slug', ['status' => 400]);
                }
                $listing_id = $listing->ID;
                $meta_key = 'dwt_listing_checkin_listing_id_' . $listing_id;
                if ($action === 'checkin') {
                    if (!get_user_meta($user_id, $meta_key, true)) {
                        update_user_meta($user_id, $meta_key, $listing_id);
                    }
                    return ['status' => 'checkedin', 'listing_id' => $listing_id];
                } elseif ($action === 'uncheckin') {
                    delete_user_meta($user_id, $meta_key, $listing_id);
                    return ['status' => 'uncheckedin', 'listing_id' => $listing_id];
                } elseif ($action === 'check') {
                    $is_checkin = get_user_meta($user_id, $meta_key, true);
                    return ['status' => $is_checkin ? 'checkedin' : 'uncheckedin', 'listing_id' => $listing_id];
                } else {
                    return new WP_Error('rest_invalid_param', 'Invalid action', ['status' => 400]);
                }
            },
            'permission_callback' => 'dev_chrono_check_auth', // JWT-aware permission check
            'args' => [
                'restaurant_slug' => ['required' => true, 'type' => 'string'],
                'action' => ['required' => true, 'type' => 'string', 'enum' => ['checkin', 'uncheckin', 'check']],
            ],
        ]);

        // List all checked-in restaurant IDs for a user (public endpoint)
        register_rest_route('restaurant/v1', '/checkins/', [
            'methods' => 'GET',
            'callback' => function (WP_REST_Request $request) {
                // Require user_id parameter (public endpoint - no authentication needed)
                $user_id = intval($request->get_param('user_id'));
                
                if (!$user_id) {
                    return new WP_Error(
                        'missing_user_id',
                        'user_id parameter is required',
                        ['status' => 400]
                    );
                }
                
                // Verify user exists
                if (!get_userdata($user_id)) {
                    return new WP_Error(
                        'invalid_user',
                        'User not found',
                        ['status' => 404]
                    );
                }
                global $wpdb;
                $meta_key_like = $wpdb->esc_like('dwt_listing_checkin_listing_id_') . '%';
                $results = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT meta_value FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s",
                        $user_id,
                        $meta_key_like
                    )
                );
                $restaurant_ids = [];
                foreach ($results as $row) {
                    $restaurant_id = intval($row->meta_value);
                    if (get_post_type($restaurant_id) === 'listing') {
                        $restaurant_ids[] = $restaurant_id;
                    }
                }
                return [
                    'checkins' => $restaurant_ids,
                    'count' => count($restaurant_ids),
                    'user_id' => $user_id
                ];
            },
            'permission_callback' => 'dev_chrono_public_profile_auth',
            'args' => array(
                'user_id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && intval($param) > 0;
                    },
                    'sanitize_callback' => 'absint',
                ),
            ),
        ]);
    }
);

add_action('wp_set_comment_status', function ($comment_id, $comment_status) {
    $comment = get_comment($comment_id);
    $post = get_post($comment->comment_post_ID);

    // Only for 'listing' post type
    if ($post && $post->post_type === 'listing') {
        // If comment is approved and post is NOT published, keep comment_type as 'listing_draft' and comment_approved as 0
        if ($comment_status === 'approve' && get_post_status($post->ID) !== 'publish') {
            wp_update_comment([
                'comment_ID'      => $comment_id,
                'comment_type'    => 'listing_draft',
                'comment_approved'=> 0,
            ]);
        }

        // If comment_type is 'listing' and comment is unapproved, set type to 'listing_draft' and approved to 0
        if ($comment_status === 'hold' && $comment->comment_type === 'listing') {
            wp_update_comment([
                'comment_ID'      => $comment_id,
                'comment_type'    => 'listing_draft',
                'comment_approved'=> 0,
            ]);
        }

        // If comment_type is 'listing_draft' and comment is approved, and post is published, set type to 'listing'
        if ($comment_status === 'approve' && $comment->comment_type === 'listing_draft') {
            if ($post->post_status === 'publish') {
                wp_update_comment([
                    'comment_ID'   => $comment_id,
                    'comment_type' => 'listing',
                ]);
            }
            // else: do nothing, keep as 'listing_draft'
        }
    }
}, 10, 2);

add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'listing') {
        return;
    }

    // When post is published, set comment_type to 'listing'
    if ($new_status === 'publish' && $old_status !== 'publish') {
        $comments = get_comments([
            'post_id' => $post->ID,
            'type'    => 'listing_draft',
            // 'status'  => 'approve',
        ]);
        foreach ($comments as $comment) {
            wp_update_comment([
                'comment_ID'   => $comment->comment_ID,
                'comment_type' => 'listing',
            ]);
        }
    }

    // When post is set to draft or pending, set comment_type to 'listing_draft' for ALL comments for that post
    if (in_array($new_status, ['draft', 'pending']) && $old_status === 'publish') {
        $all_comments = get_comments([
            'post_id' => $post->ID,
            // No 'type' or 'status' filter, so all comments for this post
        ]);
        foreach ($all_comments as $comment) {
            wp_update_comment([
                'comment_ID'   => $comment->comment_ID,
                'comment_approved' => 0,
                'comment_type' => 'listing_draft',
            ]);
        }
    }
 
    // Only trigger when the post is published
    if ($old_status !== 'publish' && $new_status === 'publish') {
        $comments = get_comments([
            'post_id' => $post->ID,
            'status'  => 'hold',
            'type'    => '',
        ]);

        foreach ($comments as $comment) {
            wp_set_comment_status($comment->comment_ID, 'approve');
        }
    }
}, 10, 3);

add_action('pre_get_comments', function ($query) {
    // Skip admin or non-GraphQL requests
    if (is_admin() || !defined('GRAPHQL_REQUEST') || !GRAPHQL_REQUEST) {
        return;
    }

    $query->query_vars['status'] = 'approve';
    unset($query->query_vars['include_unapproved']);
});

// Automatically extract and store hashtags when comments are created or updated
add_action('comment_post', function ($comment_ID) {
    $comment = get_comment($comment_ID);
    if (!$comment) return;
    if ($comment->comment_type !== 'listing' && $comment->comment_type !== 'listing_draft') return;

    $content = is_string($comment->comment_content) ? $comment->comment_content : '';
    if ($content === '') return;

    preg_match_all('/#[\w\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]+/u', $content, $matches);
    $tags = [];
    foreach ($matches[0] as $tag) {
        $clean = strtolower(trim(ltrim($tag, '#')));
        if ($clean !== '' && strlen($clean) <= 100) {
            $tags[] = $clean;
        }
    }
    if (!empty($tags)) {
        update_comment_meta($comment_ID, 'hashtags', implode(',', array_values(array_unique($tags))));
    }
});

add_action('edit_comment', function ($comment_ID) {
    $comment = get_comment($comment_ID);
    if (!$comment) return;
    if ($comment->comment_type !== 'listing' && $comment->comment_type !== 'listing_draft') return;

    $content = is_string($comment->comment_content) ? $comment->comment_content : '';
    if ($content === '') return;

    preg_match_all('/#[\w\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]+/u', $content, $matches);
    $tags = [];
    foreach ($matches[0] as $tag) {
        $clean = strtolower(trim(ltrim($tag, '#')));
        if ($clean !== '' && strlen($clean) <= 100) {
            $tags[] = $clean;
        }
    }
    if (!empty($tags)) {
        update_comment_meta($comment_ID, 'hashtags', implode(',', array_values(array_unique($tags))));
    }
});

add_action('init', function () {
    $labels = [
        'name'          => __('Listings'),
        'singular_name' => __('Listing'),
    ];

    register_post_type('listing', [
        'labels'                => $labels,
        'public'                => true,
        'publicly_queryable'    => true,
        'show_in_rest'          => true,
        'rest_base'             => 'listings',
        'show_in_graphql'       => true,
        'graphql_single_name'   => 'Listing',
        'graphql_plural_name'   => 'Listings',
        'has_archive'           => true,
        'supports'              => ['title', 'editor', 'thumbnail', 'author'],
        // 'menu_icon'             => 'dashicons-location-alt',
        'rewrite'               => ['slug' => 'listing'],
        'capability_type'       => 'post',
        'map_meta_cap'          => true,
        'capabilities'          => [
            'read_post'          => 'read_listing',
            'delete_post'        => 'delete_listing',
            'edit_posts'         => 'edit_listings',
            'publish_posts'      => 'publish_listings',
            'read_private_posts' => 'read_private_listings',
        ],

    ]);

    // Assign terms to the custom taxonomy 'listingCategories'
    $listings = get_posts([
        'post_type' => 'listing',
        'posts_per_page' => -1,
    ]);

    foreach ($listings as $listing) {
        $raw = get_post_meta($listing->ID, 'field_multi_check_89', true);
        if (!$raw) continue;

        $categories = array_map('trim', explode('|', $raw));
        wp_set_object_terms($listing->ID, $categories, 'listingCategories');
    }
    // enhance_set_featured_images_from_reviews();

    register_taxonomy(
        'l_location',
        'listing',
        [
            'label' => 'Country',
            'public' => true,
            'show_in_rest' => true,
            'show_in_graphql' => true,
            'graphql_single_name' => 'country',
            'graphql_plural_name' => 'countries',
        ]
    );

    // Register comment meta for review main title
    register_meta('comment', 'review_main_title', [
        'type' => 'string',
        'single' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'ReviewMainTitle',
        'description' => __('Main title for the review comment', 'listing-post-type'),
    ]);

    // Register comment meta for  review stars
    register_meta('comment', 'review_stars', [
        'type' => 'number',
        'single' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'ReviewStars',
        'description' => __('Star rating for the review', 'listing-post-type'),
    ]);

    // Register user meta for palates
    register_meta('comment', 'palates', [
        'type' => 'string',
        'single' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'Palates',
        'description' => __('Plates for user', 'listing-post-type'),
    ]);

    // Register comment meta for review images
    register_meta('comment', 'review_images_idz', [
        'type' => 'string',
        'single' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'reviewImagesIdz',
        'description' => __('Image IDs for review comment', 'listing-post-type'),
    ]);

    // Register comment meta for recognitions
    register_meta('comment', 'recognitions', [
        'type' => 'array',
        'single' => true,
        'show_in_rest' => [
            'schema' => [
                'type' => 'array',
                'items' => [
                    'type' => 'string',
                ],
            ],
        ],
        'show_in_graphql' => true,
        'graphql_single_name' => 'CommentRecognition',
        'description' => __('Recognition term IDs for the comment', 'listing-post-type'),
        'auth_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

        // Register comment meta for hashtags (stored as comma-separated string for efficient LIKE queries)
        register_meta('comment', 'hashtags', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'show_in_graphql' => true,
            'graphql_single_name' => 'CommentHashtags',
            'description' => __('Hashtags for the comment (comma-separated)', 'listing-post-type'),
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

    // Register comment meta for comment likes
    register_meta('comment', '_comment_likes', [
        'type' => 'integer',
        'single' => true,
        'show_in_rest' => true, // enable REST API exposure
        'show_in_graphql' => true,
        'graphql_single_name' => 'CommentLikes',
        'description' => __('Number of likes for the comment', 'listing-post-type'),
        'auth_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);
});


// Add Filter Hooks
add_filter('rest_listing_query', function ($args, $request) {
    if (is_user_logged_in() && isset($request['status'])) {
        $args['post_status'] = $request['status'];
    }
    return $args;
}, 10, 2);

add_filter('graphql_input_fields', function ($fields, $type_name) {
    if ($type_name === 'RootQueryToListingConnectionWhereArgs') {
        $fields['statusIn'] = [
            'type' => ['list_of' => 'PostStatusEnum'],
            'description' => __('Filter listings by multiple post statuses', 'your-text-domain'),
        ];
    }
    return $fields;
}, 10, 2);

add_filter('graphql_post_object_connection_query_args', function ($query_args, $source, $args, $context, $info) {
    if (!empty($args['where']['statusIn'])) {
        $query_args['post_status'] = $args['where']['statusIn'];
    }
    $query_args['perm'] = 'any';
    return $query_args;
}, 10, 5);

add_filter('graphql_post_object_connection_query_args', function ($query_args, $source, $input_args, $context, $info) {
    if (
        $info->fieldName === 'listings' &&
        !empty($input_args['where']['minAverageRating'])
    ) {
        $query_args['meta_query'][] = [
            'key' => '_average_rating',
            'value' => floatval($input_args['where']['minAverageRating']),
            'compare' => '>=',
            'type' => 'NUMERIC',
        ];
    }

    return $query_args;
}, 10, 5);

add_filter('graphql_post_object_connection_query_args', function ($query_args, $source, $input_args, $context, $info) {
    if ($info->fieldName === 'listings' && !empty($input_args['where']['priceRange'])) {
        $query_args['meta_query'][] = [
            'key' => 'price_range', // Ensure this matches the meta key used in your listings
            'value' => $input_args['where']['priceRange'],
            'compare' => 'LIKE', // or '=' for exact match
        ];
    }

    return $query_args;
}, 10, 5);

add_filter('graphql_post_object_connection_query_args', function ($query_args, $source, $input_args, $context, $info) {
    if ($info->fieldName === 'listings' && !empty($input_args['where']['recognition'])) {
        global $wpdb;

        $recognition = esc_sql($input_args['where']['recognition']);
        $_GET['recognition_filter'] = $recognition;

        $order = strtoupper($input_args['where']['recognitionSort'] ?? 'DESC');
        $order = in_array($order, ['ASC', 'DESC']) ? $order : 'DESC';

        $results = $wpdb->get_results("
            SELECT c.comment_post_ID as post_id, COUNT(*) as recognition_count
            FROM {$wpdb->comments} c
            INNER JOIN {$wpdb->commentmeta} cm ON c.comment_ID = cm.comment_id
            WHERE cm.meta_key = 'recognitions'
              AND cm.meta_value LIKE '%$recognition%'
              AND c.comment_approved = 1
                AND c.comment_type = 'listing'
            GROUP BY c.comment_post_ID
            ORDER BY recognition_count $order
        ");

        $post_ids = wp_list_pluck($results, 'post_id');

        $query_args['post__in'] = !empty($post_ids) ? $post_ids : [0];
        $query_args['orderby'] = 'post__in';
    }

    return $query_args;
}, 10, 5);
add_filter('graphql_post_object_connection_query_args', function ($query_args, $source, $input_args, $context, $info) {
    // Define your palate groups here, perhaps outside the filter for better organization
    // but placing it here for a self-contained example.
    $palate_groups = [
        'East Asian' => ['Japanese', 'Korean', 'Chinese', 'Taiwanese'],
        'South Asian' => ['Nepalese', 'Bangladesh', 'Sri Lankan', 'Maldivian', 'Indian', 'Pakistani'],
        'South East Asia' => ['Malaysian', 'Filipino', 'Singaporean', 'Indonesian'],
        'Middle Eastern' => ['Armenian', 'East Arabian', 'Lebanese', 'Caucasian', 'Iranian', 'Turkish'],
        'African' => ['Angolan', 'Congolese', 'Ethiopian', 'Kenyan', 'Zimbabwean', 'Egyptian', 'Algerian', 'Ghanaian', 'Nigerian'],
        'North American' => ['Canadian', 'Mexican', 'American'],
        'European' => ['British', 'Spanish', 'Italian', 'French', 'German', 'Russian', 'Danish', 'Finnish', 'Swedish', 'Romanian', 'Greek', 'Portugese'],
        'Oceanic' => ['Australian', 'Polynesian'],
    ];

    if (
        $info->fieldName === 'listings' &&
        !empty($input_args['where']['palateReviewedBy'])
    ) {
        $raw_search_palate_input = $input_args['where']['palateReviewedBy'];
        $search_palates_string = '';

        // Check if the input is a palate group
        if (isset($palate_groups[$raw_search_palate_input])) {
            // If it's a group, use its children as the search palates
            $search_palates_string = implode(',', $palate_groups[$raw_search_palate_input]);
        } else {
            // Otherwise, retain the original logic (assume it's a comma-separated list of individual palates)
            $search_palates_string = $raw_search_palate_input;
        }

        // The rest of your existing logic remains the same
        $all_listing_ids = get_posts([
            'post_type' => 'listing',
            'post_status' => 'publish',
            'numberposts' => -1,
            'fields' => 'ids',
        ]);

        $listing_avg_map = [];

        foreach ($all_listing_ids as $listing_id) {
            $stats = get_search_based_stats($listing_id, $search_palates_string);

            if ($stats && $stats['count'] > 0) {
                $listing_avg_map[$listing_id] = $stats['avg'];
            }
        }

        if (!empty($listing_avg_map)) {
            arsort($listing_avg_map); // Sort by avg DESC

            $query_args['post__in'] = array_keys($listing_avg_map);
            $query_args['orderby'] = 'post__in';
        } else {
            $query_args['post__in'] = [0]; // no matches
        }
    }

    return $query_args;
}, 10, 5);



add_filter('graphql_post_object_connection_query_args', function ($query_args, $source, $input_args, $context, $info) {
    if ($info->fieldName === 'listings' && !empty($input_args['where']['streetAddress'])) {
        $query_args['meta_query'][] = [
            'key'     => 'street_address', // or use 'google_map_url_address' if that's what ACF uses
            'value'   => $input_args['where']['streetAddress'],
            'compare' => 'LIKE',
        ];
    }

    return $query_args;
}, 10, 5);

add_filter('pre_comment_approved', function ($approved, $commentdata) {
    if (!empty($commentdata['comment_type'])) {
        if ($commentdata['comment_type'] === 'listing') {
            // Approve listing type
            return 1;
        } elseif ($commentdata['comment_type'] === 'listing_draft') {
            // Keep listing_draft on hold
            return 0;
        }
    }
    return $approved;
}, 10, 2);

add_filter('graphql_comment_query_args', function ($query_args, $source, $args, $context, $info) {
    // Block GraphQL from including unapproved comments, even for the author
    unset($query_args['include_unapproved']);

    // Force only approved comments
    $query_args['status'] = 'approve';

    return $query_args;
}, 10, 5);

// Allow filtering comments by hashtag and parent via GraphQL where args
add_filter('graphql_input_fields', function ($fields, $type_name) {
    if ($type_name === 'RootQueryToCommentConnectionWhereArgs') {
        $fields['hashtag'] = [
            'type' => 'String',
            'description' => __('Filter comments by hashtag (without #)', 'listing-post-type'),
        ];
        $fields['parent'] = [
            'type' => 'Int',
            'description' => __('Filter comments by parent comment ID (0 for top-level comments)', 'listing-post-type'),
        ];
    }
    return $fields;
}, 10, 2);

add_filter('graphql_comment_query_args', function ($query_args, $source, $args, $context, $info) {
    if (!empty($args['where']['hashtag'])) {
        global $wpdb;
        $tag = sanitize_text_field(strtolower($args['where']['hashtag']));
        // Use a meta query to match the comma-separated string
        $query_args['meta_query'][] = [
            'key'     => 'hashtags',
            'value'   => $tag,
            'compare' => 'LIKE',
        ];
    }
    
    if (isset($args['where']['parent'])) {
        $parent_id = intval($args['where']['parent']);
        $query_args['parent'] = $parent_id;
    }
    
    return $query_args;
}, 10, 5);



add_filter('user_has_cap', function ($allcaps, $caps, $args, $user) {
    $allcaps['list_users'] = true;
    return $allcaps;
}, 10, 4);


// Custom REST API endpoint to get the latest Privacy Policy
add_action('rest_api_init', function () {
    register_rest_route('v1', '/privacy-policy', [
        'methods' => 'GET',
        'callback' => function () {
            $args = [
                'post_type' => ['post', 'page'], // include both if needed
                'posts_per_page' => -1, // get all so we can search them
                'orderby' => 'modified', // sort by post_modified
                'order' => 'DESC',
                'suppress_filters' => false,
            ];

            $posts = get_posts($args);
            $policy_post = null;

            foreach ($posts as $post) {
                if (strtolower(trim($post->post_title)) === 'privacy policy') {
                    $policy_post = $post;
                    break;
                }
            }

            if (!$policy_post) {
                return new WP_Error('not_found', 'Privacy Policy not found', ['status' => 404]);
            }

            return new WP_REST_Response([
                'id' => $policy_post->ID,
                'title' => $policy_post->post_title,
                'content' => apply_filters('the_content', $policy_post->post_content),
                'date' => $policy_post->post_date,
                'modified' => $policy_post->post_modified,
            ], 200);
        },
        'permission_callback' => '__return_true',
    ]);
});

// Custom REST API endpoint to get the latest Terms of Service
add_action('rest_api_init', function () {
    register_rest_route('v1', '/terms-of-service', [
        'methods' => 'GET',
        'callback' => function () {
            $args = [
                'post_type' => ['post', 'page'], // include both just like privacy
                'posts_per_page' => -1,
                'orderby' => 'modified',
                'order' => 'DESC',
                'suppress_filters' => false,
            ];

            $posts = get_posts($args);
            $terms_post = null;

            foreach ($posts as $post) {
                if (strtolower(trim($post->post_title)) === 'terms of service') {
                    $terms_post = $post;
                    break;
                }
            }

            if (!$terms_post) {
                return new WP_Error('not_found', 'Terms Of Service not found', ['status' => 404]);
            }

            return new WP_REST_Response([
                'id' => $terms_post->ID,
                'title' => $terms_post->post_title,
                'content' => apply_filters('the_content', $terms_post->post_content),
                'date' => $terms_post->post_date,
                'modified' => $terms_post->post_modified,
            ], 200);
        },
        'permission_callback' => '__return_true',
    ]);
});

// Custom REST API endpoint to get the latest Content Guidelines
add_action('rest_api_init', function () {
    register_rest_route('v1', '/content-guidelines', [
        'methods' => 'GET',
        'callback' => function () {
            $args = [
                'post_type' => ['post', 'page'], // include both
                'posts_per_page' => -1,
                'orderby' => 'modified',
                'order' => 'DESC',
                'suppress_filters' => false,
            ];

            $posts = get_posts($args);
            $guidelines_post = null;

            foreach ($posts as $post) {
                if (strtolower(trim($post->post_title)) === 'content guidelines') {
                    $guidelines_post = $post;
                    break;
                }
            }

            if (!$guidelines_post) {
                return new WP_Error('not_found', 'Content Guidelines not found', ['status' => 404]);
            }

            return new WP_REST_Response([
                'id' => $guidelines_post->ID,
                'title' => $guidelines_post->post_title,
                'content' => apply_filters('the_content', $guidelines_post->post_content),
                'date' => $guidelines_post->post_date,
                'modified' => $guidelines_post->post_modified,
            ], 200);
        },
        'permission_callback' => '__return_true',
    ]);
});
