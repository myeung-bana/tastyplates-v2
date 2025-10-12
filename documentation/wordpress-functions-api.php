<?php

/**
 * TastyPlates Business Portal - Refactored WordPress Functions API
 * Modular, organized, and optimized version
 * 
 * This file contains:
 * - Core utility classes
 * - REST API endpoints (production only)
 * - GraphQL field registrations
 * - Comment management system
 * - Image handling utilities
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Core Utility Classes
 */
class TastyPlates_FieldProcessor {
    
    /**
     * Process Google Maps URL data for ACF fields
     */
    public static function process_google_maps_data($data, $post_id) {
        if (!is_array($data)) {
            return false;
        }
        
        $field_mapping = array(
            'city' => array('meta_key' => 'google_map_city', 'type' => 'string'),
            'country' => array('meta_key' => 'google_map_country', 'type' => 'string'),
            'countryShort' => array('meta_key' => 'google_map_country_short', 'type' => 'string'),
            'latitude' => array('meta_key' => 'google_map_latitude', 'type' => 'float'),
            'longitude' => array('meta_key' => 'google_map_longitude', 'type' => 'float'),
            'placeId' => array('meta_key' => 'google_map_place_id', 'type' => 'string'),
            'postCode' => array('meta_key' => 'google_map_post_code', 'type' => 'string'),
            'state' => array('meta_key' => 'google_map_state', 'type' => 'string'),
            'stateShort' => array('meta_key' => 'google_map_state_short', 'type' => 'string'),
            'streetAddress' => array('meta_key' => 'google_map_street_address', 'type' => 'string'),
            'streetName' => array('meta_key' => 'google_map_street_name', 'type' => 'string'),
            'streetNumber' => array('meta_key' => 'google_map_street_number', 'type' => 'string'),
            'zoom' => array('meta_key' => 'google_map_zoom', 'type' => 'int')
        );
        
        $acf_group_data = array();
        
        foreach ($field_mapping as $field_name => $field_config) {
            if (array_key_exists($field_name, $data)) {
                $raw_value = $data[$field_name];
                $processed_value = self::process_field_value($raw_value, $field_config['type']);
                
                update_post_meta($post_id, $field_config['meta_key'], $processed_value);
                
                // Map to ACF field names
                $acf_field_name = str_replace('google_map_', '', $field_config['meta_key']);
                $acf_group_data[$acf_field_name] = $processed_value;
            }
        }
        
        // Save complete JSON
        update_post_meta($post_id, 'google_map_url', json_encode($data));
        
        // Update ACF group field if ACF is active
        if (function_exists('update_field') && !empty($acf_group_data)) {
            update_field('google_map_url', $acf_group_data, $post_id);
            update_field('google_map_url_json', json_encode($data), $post_id);
        }
        
        return true;
    }
    
    /**
     * Process field value based on type
     */
    private static function process_field_value($value, $type) {
        switch ($type) {
            case 'string':
                return sanitize_text_field($value);
            case 'float':
                return is_numeric($value) ? floatval($value) : null;
            case 'int':
                return is_numeric($value) ? intval($value) : null;
            default:
                return $value;
        }
    }
}

class TastyPlates_ImageHandler {
    
    /**
     * Handle external image upload to WordPress media library
     */
    public static function upload_external_image($image_url, $post_id) {
        if (empty($image_url)) {
            return false;
        }
        
        // Download the image
        $temp_file = download_url($image_url);
        
        if (is_wp_error($temp_file)) {
            error_log('Failed to download image: ' . $temp_file->get_error_message());
            return false;
        }
        
        // Get filename from URL
        $filename = basename(parse_url($image_url, PHP_URL_PATH));
        if (empty($filename) || strpos($filename, '.') === false) {
            $filename = 'featured-image-' . time() . '.jpg';
        }
        
        // Prepare file array
        $file_array = array(
            'name' => $filename,
            'tmp_name' => $temp_file,
        );
        
        // Upload to media library
        $attachment_id = media_handle_sideload($file_array, $post_id);
        
        // Clean up temp file
        @unlink($temp_file);
        
        if (is_wp_error($attachment_id)) {
            error_log('Failed to upload to media library: ' . $attachment_id->get_error_message());
            return false;
        }
        
        return $attachment_id;
    }
    
    /**
     * Process multiple featured images
     */
    public static function process_featured_images($image_urls, $post_id) {
        if (!is_array($image_urls)) {
            return false;
        }
        
        $attachment_ids = array();
        
        foreach ($image_urls as $image_url) {
            if (!empty($image_url)) {
                $attachment_id = self::upload_external_image($image_url, $post_id);
                if ($attachment_id) {
                    $attachment_ids[] = $attachment_id;
                }
            }
        }
        
        if (!empty($attachment_ids)) {
            // Set first image as featured image
            set_post_thumbnail($post_id, $attachment_ids[0]);
            
            // Update ACF field if available
            if (function_exists('update_field')) {
                update_field('featured_images', $attachment_ids, $post_id);
            }
            
            // Save as meta
            update_post_meta($post_id, 'featured_images', $attachment_ids);
            
            // Clear cache
            clean_post_cache($post_id);
            wp_cache_delete($post_id, 'posts');
        }
        
        return $attachment_ids;
    }
}

class TastyPlates_Auth {
    
    /**
     * Check if user can access listings
     */
    public static function can_access_listings() {
        return is_user_logged_in() && current_user_can('edit_posts');
    }
    
    /**
     * Check if user can moderate comments
     */
    public static function can_moderate_comments() {
        return current_user_can('moderate_comments');
    }
    
    /**
     * Get current user info for API responses
     */
    public static function get_user_info() {
        $user = wp_get_current_user();
        return array(
            'id' => $user->ID,
            'name' => $user->display_name,
            'roles' => $user->roles,
            'is_logged_in' => is_user_logged_in(),
        );
    }
}

/**
 * Post Type Setup and Permissions
 */
add_action('init', 'tastyplates_setup_post_types', 20);

function tastyplates_setup_post_types() {
    // Register listing post type if it doesn't exist
    if (!post_type_exists('listing')) {
        register_post_type('listing', array(
            'labels' => array(
                'name' => 'Listings',
                'singular_name' => 'Listing',
                'add_new' => 'Add New Listing',
                'add_new_item' => 'Add New Listing',
                'edit_item' => 'Edit Listing',
                'new_item' => 'New Listing',
                'view_item' => 'View Listing',
                'search_items' => 'Search Listings',
                'not_found' => 'No listings found',
                'not_found_in_trash' => 'No listings found in trash'
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'show_in_rest' => true,
            'rest_base' => 'listing',
            'menu_icon' => 'dashicons-store',
            'rewrite' => array('slug' => 'listing')
        ));
    }
    
    // Fix permissions
    tastyplates_fix_listing_permissions();
}

function tastyplates_fix_listing_permissions() {
    global $wp_post_types;
    
    if (isset($wp_post_types['listing'])) {
        $wp_post_types['listing']->capability_type = 'post';
        $wp_post_types['listing']->capabilities = array(
            'edit_post' => 'edit_post',
            'read_post' => 'read_post',
            'delete_post' => 'delete_post',
            'edit_posts' => 'edit_posts',
            'edit_others_posts' => 'edit_others_posts',
            'publish_posts' => 'publish_posts',
            'read_private_posts' => 'read_private_posts',
            'delete_posts' => 'delete_posts',
            'delete_private_posts' => 'delete_private_posts',
            'delete_published_posts' => 'delete_published_posts',
            'delete_others_posts' => 'delete_others_posts',
            'edit_private_posts' => 'edit_private_posts',
            'edit_published_posts' => 'edit_published_posts',
        );
        $wp_post_types['listing']->map_meta_cap = true;
    }
    
    // Grant admin capabilities
    $admin_role = get_role('Administrator');
    if ($admin_role) {
        $capabilities = array(
            'edit_post', 'read_post', 'delete_post', 'edit_posts',
            'edit_others_posts', 'publish_posts', 'read_private_posts',
            'delete_posts', 'delete_private_posts', 'delete_published_posts',
            'delete_others_posts', 'edit_private_posts', 'edit_published_posts',
        );
        
        foreach ($capabilities as $cap) {
            $admin_role->add_cap($cap);
        }
    }
}

/**
 * REST API Field Registration
 */
add_action('rest_api_init', function() {
    // Add ACF fields to REST API response
    register_rest_field('listing', 'acf', array(
        'get_callback' => function($post) {
            if (function_exists('get_fields')) {
                return get_fields($post['id']);
            }
            return null;
        },
        'schema' => null,
    ));
    
    // Add custom meta fields to REST API response
    register_rest_field('listing', 'listing_meta', array(
        'get_callback' => function($post) {
            return array(
                'price_range' => get_post_meta($post['id'], 'price_range', true),
                'listing_street' => get_post_meta($post['id'], 'listing_street', true),
                'phone' => get_post_meta($post['id'], 'phone', true),
                'opening_hours' => get_post_meta($post['id'], 'opening_hours', true),
            );
        },
        'schema' => null,
    ));
});

/**
 * REST API Query Filters
 */
add_filter('rest_listing_query', function($args, $request) {
    if (is_user_logged_in()) {
        unset($args['post_status']);
    }
    return $args;
}, 10, 2);

/**
 * Production REST API Endpoints
 */
add_action('rest_api_init', function() {
    
    /**
     * Authentication Test Endpoint
     */
    register_rest_route('tastyplates/v1', '/auth-test', array(
        'methods' => 'GET',
        'callback' => function($request) {
            return array(
                'is_logged_in' => is_user_logged_in(),
                'user' => TastyPlates_Auth::get_user_info(),
                'can_edit_posts' => current_user_can('edit_posts'),
                'can_edit_listings' => current_user_can('edit_posts', 'listing'),
                'auth_headers' => array(
                    'authorization' => $request->get_header('authorization') ? 'Present' : 'Missing',
                    'content_type' => $request->get_header('content-type'),
                ),
            );
        },
        'permission_callback' => '__return_true'
    ));
    
    /**
     * Draft Listings Endpoint
     */
    register_rest_route('tastyplates/v1', '/draft-listings', array(
        'methods' => 'GET',
        'callback' => function($request) {
            if (!TastyPlates_Auth::can_access_listings()) {
                return array(
                    'success' => false,
                    'error' => 'User not authenticated',
                    'message' => 'Authentication required to access draft listings'
                );
            }
            
            $all_posts = get_posts(array(
                'post_type' => 'listing',
                'post_status' => array('publish', 'draft', 'pending', 'private'),
                'numberposts' => -1,
            ));
            
            $posts_by_status = array();
            foreach ($all_posts as $post) {
                $status = $post->post_status;
                if (!isset($posts_by_status[$status])) {
                    $posts_by_status[$status] = array();
                }
                $posts_by_status[$status][] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'status' => $post->post_status,
                    'date' => $post->post_date,
                );
            }
            
            return array(
                'success' => true,
                'user' => TastyPlates_Auth::get_user_info(),
                'total_listings' => count($all_posts),
                'posts_by_status' => $posts_by_status,
                'draft_count' => count($posts_by_status['draft'] ?? array()),
                'pending_count' => count($posts_by_status['pending'] ?? array()),
                'private_count' => count($posts_by_status['private'] ?? array()),
                'published_count' => count($posts_by_status['publish'] ?? array()),
                'post_type_exists' => post_type_exists('listing'),
                'rest_enabled' => get_post_type_object('listing')->show_in_rest ?? false,
            );
        },
        'permission_callback' => '__return_true'
    ));
    
    /**
     * Published Listings Endpoint
     */
    register_rest_route('tastyplates/v1', '/published-listings', array(
        'methods' => 'GET',
        'callback' => function($request) {
            if (!TastyPlates_Auth::can_access_listings()) {
                return array(
                    'success' => false,
                    'error' => 'User not authenticated',
                    'message' => 'Authentication required to access listings'
                );
            }
            
            $published_posts = get_posts(array(
                'post_type' => 'listing',
                'post_status' => 'publish',
                'numberposts' => -1,
                'orderby' => 'date',
                'order' => 'DESC',
            ));
            
            $formatted_listings = array();
            foreach ($published_posts as $post) {
                $formatted_listings[] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'status' => $post->post_status,
                    'date' => $post->post_date,
                    'modified' => $post->post_modified,
                    'slug' => $post->post_name,
                    'excerpt' => $post->post_excerpt,
                    'content' => $post->post_content,
                    'author' => $post->post_author,
                    'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                    'meta' => array(
                        'price_range' => get_post_meta($post->ID, 'price_range', true),
                        'listing_street' => get_post_meta($post->ID, 'listing_street', true),
                        'phone' => get_post_meta($post->ID, 'phone', true),
                        'opening_hours' => get_post_meta($post->ID, 'opening_hours', true),
                    ),
                );
            }
            
            return array(
                'success' => true,
                'user' => TastyPlates_Auth::get_user_info(),
                'published_count' => count($published_posts),
                'published_listings' => $formatted_listings,
                'post_type_exists' => post_type_exists('listing'),
                'rest_enabled' => get_post_type_object('listing')->show_in_rest ?? false,
            );
        },
        'permission_callback' => '__return_true'
    ));
    
    /**
     * All Listings Endpoint
     */
    register_rest_route('tastyplates/v1', '/all-listings', array(
        'methods' => 'GET',
        'callback' => function($request) {
            if (!TastyPlates_Auth::can_access_listings()) {
                return array(
                    'success' => false,
                    'error' => 'User not authenticated',
                    'message' => 'Authentication required to access all listings'
                );
            }
            
            $all_posts = get_posts(array(
                'post_type' => 'listing',
                'post_status' => array('publish', 'draft', 'pending', 'private'),
                'numberposts' => -1,
                'orderby' => 'date',
                'order' => 'DESC',
            ));
            
            $posts_by_status = array();
            $status_counts = array(
                'publish' => 0,
                'draft' => 0,
                'pending' => 0,
                'private' => 0,
            );
            
            foreach ($all_posts as $post) {
                $status = $post->post_status;
                $status_counts[$status]++;
                
                if (!isset($posts_by_status[$status])) {
                    $posts_by_status[$status] = array();
                }
                
                $posts_by_status[$status][] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'status' => $post->post_status,
                    'date' => $post->post_date,
                    'modified' => $post->post_modified,
                    'slug' => $post->post_name,
                    'excerpt' => $post->post_excerpt,
                    'author' => $post->post_author,
                    'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                    'meta' => array(
                        'price_range' => get_post_meta($post->ID, 'price_range', true),
                        'listing_street' => get_post_meta($post->ID, 'listing_street', true),
                        'phone' => get_post_meta($post->ID, 'phone', true),
                        'opening_hours' => get_post_meta($post->ID, 'opening_hours', true),
                    ),
                );
            }
            
            return array(
                'success' => true,
                'user' => TastyPlates_Auth::get_user_info(),
                'total_listings' => count($all_posts),
                'status_counts' => $status_counts,
                'posts_by_status' => $posts_by_status,
                'post_type_exists' => post_type_exists('listing'),
                'rest_enabled' => get_post_type_object('listing')->show_in_rest ?? false,
            );
        },
        'permission_callback' => '__return_true'
    ));
    
    /**
     * Update Listing Endpoint
     */
    register_rest_route('tastyplates/v1', '/update-listing', array(
        'methods' => 'POST',
        'callback' => function($request) {
            if (!TastyPlates_Auth::can_access_listings()) {
                return array(
                    'success' => false,
                    'error' => 'User not authenticated',
                    'message' => 'Authentication required to update listings'
                );
            }
            
            $params = $request->get_params();
            $post_id = $params['id'];
            $title = $params['title'];
            $content = $params['content'];
            $status = $params['status'];
            $meta = $params['meta'] ?? array();
            
            $update_result = wp_update_post(array(
                'ID' => $post_id,
                'post_title' => $title,
                'post_content' => $content,
                'post_status' => $status,
            ));
            
            if (is_wp_error($update_result)) {
                return array(
                    'success' => false,
                    'error' => 'Failed to update post',
                    'message' => $update_result->get_error_message()
                );
            }
            
            foreach ($meta as $key => $value) {
                update_post_meta($post_id, $key, $value);
            }
            
            return array(
                'success' => true,
                'message' => 'Listing updated successfully',
                'post_id' => $post_id
            );
        },
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
    
    /**
     * Comment Management Endpoints
     */
    
    // Get all comments with filtering
    register_rest_route('tastyplates/v1', '/comments', array(
        'methods' => 'GET',
        'callback' => function($request) {
            if (!TastyPlates_Auth::can_moderate_comments()) {
                return array(
                    'success' => false,
                    'error' => 'Insufficient permissions',
                    'message' => 'Comment moderation permissions required'
                );
            }
            
            $params = $request->get_params();
            $status = $params['status'] ?? 'all';
            $post_id = $params['post_id'] ?? null;
            $per_page = $params['per_page'] ?? 20;
            $page = $params['page'] ?? 1;
            
            $args = array(
                'number' => $per_page,
                'offset' => ($page - 1) * $per_page,
                'orderby' => 'comment_date',
                'order' => 'DESC',
            );
            
            // Filter by status
            if ($status !== 'all') {
                switch ($status) {
                    case 'pending':
                        $args['status'] = 'hold';
                        break;
                    case 'approved':
                        $args['status'] = 'approve';
                        break;
                    case 'spam':
                        $args['status'] = 'spam';
                        break;
                    case 'trash':
                        $args['status'] = 'trash';
                        break;
                }
            }
            
            // Filter by post ID if provided
            if ($post_id) {
                $args['post_id'] = intval($post_id);
            }
            
            $comments = get_comments($args);
            $total_comments = get_comments(array_merge($args, array('count' => true, 'number' => 0, 'offset' => 0)));
            
            // Format comments for API response
            $formatted_comments = array();
            foreach ($comments as $comment) {
                $formatted_comments[] = array(
                    'id' => $comment->comment_ID,
                    'databaseId' => $comment->comment_ID,
                    'content' => $comment->comment_content,
                    'author' => $comment->comment_author,
                    'authorEmail' => $comment->comment_author_email,
                    'authorUrl' => $comment->comment_author_url,
                    'date' => $comment->comment_date,
                    'status' => $comment->comment_approved,
                    'postId' => $comment->comment_post_ID,
                    'postTitle' => get_the_title($comment->comment_post_ID),
                    'postType' => get_post_type($comment->comment_post_ID),
                    'parentId' => $comment->comment_parent,
                    'userAgent' => $comment->comment_agent,
                    'ip' => $comment->comment_author_IP,
                );
            }
            
            return array(
                'success' => true,
                'comments' => $formatted_comments,
                'total' => $total_comments,
                'pages' => ceil($total_comments / $per_page),
                'current_page' => $page,
                'per_page' => $per_page,
                'filters' => array(
                    'status' => $status,
                    'post_id' => $post_id,
                )
            );
        },
        'permission_callback' => function() {
            return TastyPlates_Auth::can_moderate_comments();
        }
    ));
    
    // Update comment status (approve, reject, spam)
    register_rest_route('tastyplates/v1', '/comments/(?P<id>\d+)', array(
        'methods' => 'POST',
        'callback' => function($request) {
            if (!TastyPlates_Auth::can_moderate_comments()) {
                return array(
                    'success' => false,
                    'error' => 'Insufficient permissions',
                    'message' => 'Comment moderation permissions required'
                );
            }
            
            $comment_id = $request['id'];
            $params = $request->get_params();
            $action = $params['action'] ?? '';
            
            // Validate action
            $valid_actions = array('approve', 'reject', 'spam', 'unspam', 'trash', 'untrash');
            if (!in_array($action, $valid_actions)) {
                return array(
                    'success' => false,
                    'error' => 'Invalid action. Must be one of: ' . implode(', ', $valid_actions)
                );
            }
            
            // Get the comment
            $comment = get_comment($comment_id);
            if (!$comment) {
                return array(
                    'success' => false,
                    'error' => 'Comment not found'
                );
            }
            
            $result = false;
            $new_status = '';
            
            switch ($action) {
                case 'approve':
                    $result = wp_set_comment_status($comment_id, 'approve');
                    $new_status = 'approved';
                    break;
                case 'reject':
                    $result = wp_set_comment_status($comment_id, 'hold');
                    $new_status = 'pending';
                    break;
                case 'spam':
                    $result = wp_set_comment_status($comment_id, 'spam');
                    $new_status = 'spam';
                    break;
                case 'unspam':
                    $result = wp_set_comment_status($comment_id, 'hold');
                    $new_status = 'pending';
                    break;
                case 'trash':
                    $result = wp_set_comment_status($comment_id, 'trash');
                    $new_status = 'trash';
                    break;
                case 'untrash':
                    $result = wp_set_comment_status($comment_id, 'hold');
                    $new_status = 'pending';
                    break;
            }
            
            if ($result) {
                // Get updated comment
                $updated_comment = get_comment($comment_id);
                
                return array(
                    'success' => true,
                    'message' => "Comment {$action}d successfully",
                    'comment' => array(
                        'id' => $updated_comment->comment_ID,
                        'status' => $updated_comment->comment_approved,
                        'new_status' => $new_status,
                        'content' => $updated_comment->comment_content,
                        'author' => $updated_comment->comment_author,
                        'postId' => $updated_comment->comment_post_ID,
                        'postTitle' => get_the_title($updated_comment->comment_post_ID),
                    )
                );
            } else {
                return array(
                    'success' => false,
                    'error' => "Failed to {$action} comment"
                );
            }
        },
        'permission_callback' => function() {
            return TastyPlates_Auth::can_moderate_comments();
        }
    ));
    
});

/**
 * GraphQL Field Registrations and Mutations
 */
add_action('graphql_register_types', function() {
    
    // Register custom fields for GraphQL mutations
    register_graphql_field('UpdateListingInput', 'priceRange', array(
        'type' => 'String',
        'description' => 'Price range for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'listingStreet', array(
        'type' => 'String',
        'description' => 'Street address for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'phone', array(
        'type' => 'String',
        'description' => 'Phone number for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'openingHours', array(
        'type' => 'String',
        'description' => 'Opening hours for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'averageRating', array(
        'type' => 'Float',
        'description' => 'Average rating for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'ratingsCount', array(
        'type' => 'Int',
        'description' => 'Number of ratings for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'googleMapUrl', array(
        'type' => 'GoogleMapUrlInput',
        'description' => 'Google Maps URL details for the listing',
    ));
    
    register_graphql_field('UpdateListingInput', 'featuredImages', array(
        'type' => array('list_of' => 'String'),
        'description' => 'Array of featured image URLs for the listing (S3 bucket URLs)',
    ));
    
    register_graphql_field('UpdateListingInput', 'featuredImage', array(
        'type' => 'String',
        'description' => 'Featured image URL for the listing (S3 bucket URL)',
    ));
    
    register_graphql_field('UpdateListingInput', 'languagePreference', array(
        'type' => 'String',
        'description' => 'Language preference for the user',
    ));
    
    // Register GoogleMapUrlInput type
    register_graphql_input_type('GoogleMapUrlInput', array(
        'description' => 'Input for Google Maps URL details',
        'fields' => array(
            'city' => array('type' => 'String'),
            'country' => array('type' => 'String'),
            'countryShort' => array('type' => 'String'),
            'latitude' => array('type' => 'Float'),
            'longitude' => array('type' => 'Float'),
            'placeId' => array('type' => 'String'),
            'postCode' => array('type' => 'String'),
            'state' => array('type' => 'String'),
            'stateShort' => array('type' => 'String'),
            'streetAddress' => array('type' => 'String'),
            'streetName' => array('type' => 'String'),
            'streetNumber' => array('type' => 'String'),
            'zoom' => array('type' => 'Int'),
        ),
    ));
    
    // Register GoogleMapUrl type for queries
    register_graphql_object_type('GoogleMapUrl', array(
        'description' => 'Google Maps URL details',
        'fields' => array(
            'city' => array('type' => 'String'),
            'country' => array('type' => 'String'),
            'countryShort' => array('type' => 'String'),
            'latitude' => array('type' => 'Float'),
            'longitude' => array('type' => 'Float'),
            'placeId' => array('type' => 'String'),
            'postCode' => array('type' => 'String'),
            'state' => array('type' => 'String'),
            'stateShort' => array('type' => 'String'),
            'streetAddress' => array('type' => 'String'),
            'streetName' => array('type' => 'String'),
            'streetNumber' => array('type' => 'String'),
            'zoom' => array('type' => 'Int'),
        ),
    ));
    
    // Register fields for Listing type queries
    register_graphql_field('Listing', 'priceRange', array(
        'type' => 'String',
        'description' => 'Price range for the listing',
        'resolve' => function($post) {
            return get_post_meta($post->ID, 'price_range', true);
        },
    ));
    
    register_graphql_field('Listing', 'listingStreet', array(
        'type' => 'String',
        'description' => 'Street address for the listing',
        'resolve' => function($post) {
            if (function_exists('get_field')) {
                $street = get_field('listing_street', $post->ID);
                if ($street) return $street;
            }
            return get_post_meta($post->ID, 'listing_street', true);
        },
    ));
    
    register_graphql_field('Listing', 'phone', array(
        'type' => 'String',
        'description' => 'Phone number for the listing',
        'resolve' => function($post) {
            if (function_exists('get_field')) {
                $phone = get_field('phone', $post->ID);
                if ($phone) return $phone;
            }
            return get_post_meta($post->ID, 'phone', true);
        },
    ));
    
    register_graphql_field('Listing', 'openingHours', array(
        'type' => 'String',
        'description' => 'Opening hours for the listing',
        'resolve' => function($post) {
            if (function_exists('get_field')) {
                $hours = get_field('opening_hours', $post->ID);
                if ($hours) return $hours;
            }
            return get_post_meta($post->ID, 'opening_hours', true);
        },
    ));
    
    register_graphql_field('Listing', 'averageRating', array(
        'type' => 'Float',
        'description' => 'Average rating for the listing',
        'resolve' => function($post) {
            return floatval(get_post_meta($post->ID, 'average_rating', true));
        },
    ));
    
    register_graphql_field('Listing', 'ratingsCount', array(
        'type' => 'Int',
        'description' => 'Number of ratings for the listing',
        'resolve' => function($post) {
            return intval(get_post_meta($post->ID, 'ratings_count', true));
        },
    ));
    
    register_graphql_field('Listing', 'languagePreference', array(
        'type' => 'String',
        'description' => 'Language preference for the listing',
        'resolve' => function($post) {
            if (function_exists('get_field')) {
                $acf_language = get_field('language_preference', $post->ID);
                if ($acf_language) return $acf_language;
            }
            return get_post_meta($post->ID, 'language_preference', true);
        },
    ));
    
    register_graphql_field('Listing', 'featuredImages', array(
        'type' => array('list_of' => 'MediaItem'),
        'description' => 'Array of featured images for the listing',
        'resolve' => function($post) {
            if (function_exists('get_field')) {
                $acf_images = get_field('featured_images', $post->ID);
                if ($acf_images && is_array($acf_images)) {
                    return $acf_images;
                }
            }
            
            $meta_images = get_post_meta($post->ID, 'featured_images', true);
            if ($meta_images && is_array($meta_images)) {
                return $meta_images;
            }
            
            return array();
        },
    ));
    
    register_graphql_field('Listing', 'featuredImage', array(
        'type' => 'MediaItem',
        'description' => 'Featured image for the listing',
        'resolve' => function($post) {
            if (function_exists('get_field')) {
                $acf_image = get_field('featured_image', $post->ID);
                if ($acf_image) return $acf_image;
            }
            
            $meta_image = get_post_meta($post->ID, 'featured_image', true);
            if ($meta_image) return $meta_image;
            
            return null;
        },
    ));
    
    register_graphql_field('ListingDetails', 'googleMapUrl', array(
        'type' => 'GoogleMapUrl',
        'description' => 'Google Maps URL details for the listing',
        'resolve' => function($post) {
            // Try ACF group field first
            if (function_exists('get_field')) {
                $acf_group_data = get_field('google_map_url', $post->ID);
                if ($acf_group_data && is_array($acf_group_data)) {
                    $field_mapping = array(
                        'city' => 'city',
                        'country' => 'country',
                        'country_short' => 'countryShort',
                        'latitude' => 'latitude',
                        'longitude' => 'longitude',
                        'place_id' => 'placeId',
                        'post_code' => 'postCode',
                        'state' => 'state',
                        'state_short' => 'stateShort',
                        'street_address' => 'streetAddress',
                        'street_name' => 'streetName',
                        'street_number' => 'streetNumber',
                        'zoom' => 'zoom'
                    );
                    
                    $graphql_data = array();
                    foreach ($field_mapping as $acf_field => $graphql_field) {
                        if (isset($acf_group_data[$acf_field])) {
                            $graphql_data[$graphql_field] = $acf_group_data[$acf_field];
                        }
                    }
                    
                    if (!empty($graphql_data)) {
                        return $graphql_data;
                    }
                }
                
                // Try ACF JSON field as fallback
                $acf_json_data = get_field('google_map_url_json', $post->ID);
                if ($acf_json_data) {
                    $decoded = json_decode($acf_json_data, true);
                    if ($decoded) {
                        return $decoded;
                    }
                }
            }
            
            // Fallback to individual meta fields
            $google_map_url = array();
            $fields = array(
                'city' => 'google_map_city',
                'country' => 'google_map_country',
                'countryShort' => 'google_map_country_short',
                'latitude' => 'google_map_latitude',
                'longitude' => 'google_map_longitude',
                'placeId' => 'google_map_place_id',
                'postCode' => 'google_map_post_code',
                'state' => 'google_map_state',
                'stateShort' => 'google_map_state_short',
                'streetAddress' => 'google_map_street_address',
                'streetName' => 'google_map_street_name',
                'streetNumber' => 'google_map_street_number',
                'zoom' => 'google_map_zoom',
            );
            
            foreach ($fields as $field_name => $meta_key) {
                $value = get_post_meta($post->ID, $meta_key, true);
                if ($value !== null && $value !== false) {
                    $google_map_url[$field_name] = $value;
                }
            }
            
            return !empty($google_map_url) ? $google_map_url : null;
        },
    ));
    
    // Comment management fields
    register_graphql_field('UpdateCommentInput', 'commentApproved', array(
        'type' => 'Int',
        'description' => 'Comment approval status (0=pending, 1=approved, 2=spam, 3=trash)',
    ));
    
    register_graphql_field('Comment', 'commentApproved', array(
        'type' => 'Int',
        'description' => 'Comment approval status (0=pending, 1=approved, 2=spam, 3=trash)',
        'resolve' => function($comment) {
            return intval($comment->comment_approved);
        },
    ));
    
    register_graphql_field('Comment', 'commentType', array(
        'type' => 'String',
        'description' => 'Comment type (e.g., listing)',
        'resolve' => function($comment) {
            return $comment->comment_type;
        },
    ));
    
    register_graphql_field('Comment', 'reviewMainTitle', array(
        'type' => 'String',
        'description' => 'Review main title',
        'resolve' => function($comment) {
            return get_comment_meta($comment->comment_ID, 'review_main_title', true);
        },
    ));
    
    register_graphql_field('Comment', 'reviewStars', array(
        'type' => 'String',
        'description' => 'Review star rating',
        'resolve' => function($comment) {
            return get_comment_meta($comment->comment_ID, 'review_stars', true);
        },
    ));
    
    register_graphql_field('Comment', 'reviewImages', array(
        'type' => array('list_of' => 'MediaItem'),
        'description' => 'Review images',
        'resolve' => function($comment) {
            $image_ids = get_comment_meta($comment->comment_ID, 'review_images', true);
            if (empty($image_ids)) {
                return array();
            }
            
            $images = array();
            foreach ($image_ids as $image_id) {
                $image = get_post($image_id);
                if ($image && $image->post_type === 'attachment') {
                    $images[] = $image;
                }
            }
            
            return $images;
        },
    ));
    
    register_graphql_field('Comment', 'palates', array(
        'type' => 'String',
        'description' => 'Review palates',
        'resolve' => function($comment) {
            return get_comment_meta($comment->comment_ID, 'palates', true);
        },
    ));
    
    register_graphql_field('Comment', 'userAvatar', array(
        'type' => 'String',
        'description' => 'User avatar URL',
        'resolve' => function($comment) {
            return get_comment_meta($comment->comment_ID, 'user_avatar', true);
        },
    ));
    
    register_graphql_field('Comment', 'userId', array(
        'type' => 'Int',
        'description' => 'User ID',
        'resolve' => function($comment) {
            return intval($comment->user_id);
        },
    ));
    
    register_graphql_field('Comment', 'commentLikes', array(
        'type' => 'Int',
        'description' => 'Number of comment likes',
        'resolve' => function($comment) {
            return intval(get_comment_meta($comment->comment_ID, 'comment_likes', true));
        },
    ));
    
    register_graphql_field('Comment', 'userLiked', array(
        'type' => 'Boolean',
        'description' => 'Whether current user liked this comment',
        'resolve' => function($comment) {
            return get_comment_meta($comment->comment_ID, 'user_liked', true) === '1';
        },
    ));
    
    // Comments query
    register_graphql_field('RootQuery', 'comments', array(
        'type' => array('list_of' => 'Comment'),
        'description' => 'Get comments with filtering',
        'args' => array(
            'commentType' => array(
                'type' => 'String',
                'description' => 'Comment type to filter by',
            ),
            'commentApproved' => array(
                'type' => 'Int',
                'description' => 'Comment approval status to filter by',
            ),
            'first' => array(
                'type' => 'Int',
                'description' => 'Number of comments to return',
            ),
            'after' => array(
                'type' => 'String',
                'description' => 'Cursor for pagination',
            ),
        ),
        'resolve' => function($source, $args) {
            $query_args = array(
                'number' => $args['first'] ?? 20,
                'orderby' => 'comment_date',
                'order' => 'DESC',
            );
            
            if (isset($args['commentType'])) {
                $query_args['type'] = $args['commentType'];
            }
            
            if (isset($args['commentApproved'])) {
                $status_map = array(
                    0 => 'hold',
                    1 => 'approve',
                    2 => 'spam',
                    3 => 'trash'
                );
                
                if (isset($status_map[$args['commentApproved']])) {
                    $query_args['status'] = $status_map[$args['commentApproved']];
                }
            }
            
            return get_comments($query_args);
        },
    ));
    
});

/**
 * GraphQL Mutation Handlers
 */
add_action('graphql_post_object_mutation_update_additional_data', function($post_id, $input, $post_type_object, $mutation_name) {
    
    if ($post_type_object->name !== 'listing') {
        return;
    }
    
    // Update custom fields if provided
    if (isset($input['priceRange'])) {
        update_post_meta($post_id, 'price_range', sanitize_text_field($input['priceRange']));
    }
    
    if (isset($input['listingStreet'])) {
        update_post_meta($post_id, 'listing_street', sanitize_text_field($input['listingStreet']));
    }
    
    if (isset($input['phone'])) {
        update_post_meta($post_id, 'phone', sanitize_text_field($input['phone']));
    }
    
    if (isset($input['openingHours'])) {
        update_post_meta($post_id, 'opening_hours', sanitize_text_field($input['openingHours']));
    }
    
    if (isset($input['averageRating'])) {
        update_post_meta($post_id, 'average_rating', floatval($input['averageRating']));
    }
    
    if (isset($input['ratingsCount'])) {
        update_post_meta($post_id, 'ratings_count', intval($input['ratingsCount']));
    }
    
    if (isset($input['languagePreference'])) {
        update_post_meta($post_id, 'language_preference', sanitize_text_field($input['languagePreference']));
    }
    
    // Handle googleMapUrl
    if (isset($input['googleMapUrl']) && is_array($input['googleMapUrl'])) {
        TastyPlates_FieldProcessor::process_google_maps_data($input['googleMapUrl'], $post_id);
    }
    
    // Handle featured images
    if (isset($input['featuredImages']) && is_array($input['featuredImages'])) {
        TastyPlates_ImageHandler::process_featured_images($input['featuredImages'], $post_id);
    }
    
    // Handle single featured image
    if (isset($input['featuredImage']) && !empty($input['featuredImage'])) {
        $attachment_id = TastyPlates_ImageHandler::upload_external_image($input['featuredImage'], $post_id);
        if ($attachment_id) {
            set_post_thumbnail($post_id, $attachment_id);
            
            if (function_exists('update_field')) {
                update_field('featured_image', $attachment_id, $post_id);
            }
            
            update_post_meta($post_id, 'featured_image', $attachment_id);
            clean_post_cache($post_id);
            wp_cache_delete($post_id, 'posts');
        }
    }
    
    // Update ACF fields if ACF is active
    if (function_exists('update_field')) {
        if (isset($input['phone'])) {
            update_field('phone', $input['phone'], $post_id);
        }
        
        if (isset($input['openingHours'])) {
            update_field('opening_hours', $input['openingHours'], $post_id);
        }
        
        if (isset($input['priceRange'])) {
            update_field('price_range', $input['priceRange'], $post_id);
        }
        
        if (isset($input['listingStreet'])) {
            update_field('listing_street', $input['listingStreet'], $post_id);
        }
        
        if (isset($input['languagePreference'])) {
            update_field('language_preference', $input['languagePreference'], $post_id);
        }
    }
    
}, 10, 4);

// Handle comment status updates in GraphQL mutations
add_action('graphql_comment_object_mutation_update_additional_data', function($comment_id, $input, $comment_type_object, $mutation_name) {
    
    if (isset($input['commentApproved'])) {
        $status_value = intval($input['commentApproved']);
        
        $status_map = array(
            0 => 'hold',      // pending
            1 => 'approve',   // approved
            2 => 'spam',      // spam
            3 => 'trash'      // trash
        );
        
        if (isset($status_map[$status_value])) {
            wp_set_comment_status($comment_id, $status_map[$status_value]);
        }
    }
    
}, 10, 4);

?>
