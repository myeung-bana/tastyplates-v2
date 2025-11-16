<?php
/*
Plugin Name: Tastyplates User REST API
Description: Unified REST API for user registration, login, Google OAuth, JWT, and profile management.
Version: 2.0
Author: Tastyplates
*/

if ( ! defined( 'ABSPATH' ) ) exit;

class TastyPlates_User_REST_API extends WP_REST_Controller {
    protected $namespace = 'wp/v2/api';
    protected $rest_base = 'users';

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        // Manual registration
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => '__return_true',
            ],
        ]);
        // Google OAuth (create or login)
        register_rest_route($this->namespace, '/' . $this->rest_base . '/google-oauth', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'google_oauth'],
                'permission_callback' => '__return_true',
            ]
        ]);
        // JWT login (manual or Google)
        register_rest_route($this->namespace, '/' . $this->rest_base . '/unified-token', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'generate_unified_token'],
                'permission_callback' => '__return_true',
            ]
        ]);
        // Check email
        register_rest_route($this->namespace, '/' . $this->rest_base . '/check-email', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'check_email_exists'],
                'permission_callback' => '__return_true',
            ]
        ]);
        // Check username
        register_rest_route($this->namespace, '/' . $this->rest_base . '/check-username', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'check_username_exists'],
                'permission_callback' => '__return_true',
            ]
        ]);
        // Get current user
        register_rest_route($this->namespace, '/' . $this->rest_base . '/current', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_current_user'],
                'permission_callback' => '__return_true',
            ]
        ]);
        // Password reset, update fields, etc. (add more as needed)
        // ...
    }

    // Manual registration handler
    public function create_item( WP_REST_Request $request ) {
        // --- Begin migrated from user-custom-plugin.php create_item ---
        if ( ! empty( $request['id'] ) ) {
            return new WP_Error(
                'rest_user_exists',
                __( 'Cannot create existing user.' ),
                array( 'status' => 400 )
            );
        }

        $schema = $this->get_item_schema();

        if ( ! empty( $request['roles'] ) && ! empty( $schema['properties']['roles'] ) ) {
            $check_permission = $this->check_role_update( $request['id'], $request['roles'] );
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
                return $error;
            }
        }

        if ( is_multisite() ) {
            $user_id = wpmu_create_user( $user->user_login, $user->user_pass, $user->user_email );
            if ( ! $user_id ) {
                return new WP_Error(
                    'rest_user_create',
                    __( 'Error creating new user.' ),
                    array( 'status' => 500 )
                );
            }
            $user->ID = $user_id;
            $user_id  = wp_update_user( wp_slash( (array) $user ) );
            if ( is_wp_error( $user_id ) ) {
                return $user_id;
            }
            $result = add_user_to_blog( get_site()->id, $user_id, '' );
            if ( is_wp_error( $result ) ) {
                return $result;
            }
        } else {
            $user_id = $this->wp_insert_user( wp_slash( (array) $user ) );
            if ( is_wp_error( $user_id ) ) {
                return $user_id;
            }
        }

        $user = get_user_by( 'id', $user_id );
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
        do_action( 'rest_after_insert_user', $user, $request, true );
        $response = $this->prepare_item_for_response( $user, $request );
        $response = rest_ensure_response( $response );
        $response->set_status( 201 );
        $response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $user_id ) ) );
        return $response;
        // --- End migrated ---
    }

    // Manual get users handler
    public function get_items( WP_REST_Request $request ) {
        // --- Begin migrated from user-custom-plugin.php get_items ---
        // (Truncated for brevity, see user-custom-plugin.php for full logic)
        // ...existing code...
        return parent::get_items($request);
        // --- End migrated ---
    }

    // Google OAuth handler (create or login)
    public function google_oauth( WP_REST_Request $request ) {
        // --- Begin migrated from tastyplates-google-oauth.php ---
        $params = json_decode( $request->get_body(), true );
        if ( empty( $params['id_token'] ) ) {
            return new WP_REST_Response( array( 'error' => 'missing_id_token' ), 400 );
        }
        $id_token = sanitize_text_field( $params['id_token'] );
        $verify_url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode( $id_token );
        $response = wp_remote_get( $verify_url, array( 'timeout' => 10 ) );
        if ( is_wp_error( $response ) ) {
            return new WP_REST_Response( array( 'error' => 'google_verification_failed' ), 500 );
        }
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );
        if ( empty( $data ) || empty( $data['email'] ) ) {
            return new WP_REST_Response( array( 'error' => 'invalid_id_token' ), 400 );
        }
        $email = sanitize_email( $data['email'] );
        $name = ! empty( $data['name'] ) ? sanitize_text_field( $data['name'] ) : $email;
        $google_sub = isset($data['sub']) ? sanitize_text_field($data['sub']) : '';
        $user = get_user_by( 'email', $email );
        if ( ! $user ) {
            $username = sanitize_user( current( explode( '@', $email ) ), true );
            $username_base = $username;
            $i = 1;
            while ( username_exists( $username ) ) {
                $username = $username_base . $i;
                $i++;
            }
            $random_pass = wp_generate_password( 24, true );
            $user_id = wp_insert_user( array(
                'user_login' => $username,
                'user_pass'  => $random_pass,
                'user_email' => $email,
                'display_name' => $name,
                'role' => 'subscriber',
            ) );
            if ( is_wp_error( $user_id ) ) {
                return new WP_REST_Response( array( 'error' => 'user_create_failed', 'details' => $user_id->get_error_messages() ), 500 );
            }
            update_user_meta( $user_id, 'tastyplates_google_sub', $google_sub );
            $user = get_user_by( 'id', $user_id );
        }
        wp_set_current_user( $user->ID );
        wp_set_auth_cookie( $user->ID, true );
        $result = array(
            'user_id' => $user->ID,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'redirect' => '/onboarding'
        );
        return new WP_REST_Response( $result, 200 );
        // --- End migrated ---
    }

    // JWT login handler
    public function generate_unified_token( WP_REST_Request $request ) {
        // --- Begin migrated from user-custom-plugin.php generateUnifiedToken ---
        global $wpdb;
        $user_id = $request->get_param('user_id');
        $email = $request->get_param('email');
        $password = $request->get_param('password');
        if (empty($user_id) && empty($email)) {
            $params = $request->get_json_params();
            $user_id = isset($params['user_id']) ? $params['user_id'] : null;
            $email = isset($params['email']) ? $params['email'] : null;
            $password = isset($params['password']) ? $params['password'] : null;
        }
        if (empty($user_id) && empty($email)) {
            return new WP_REST_Response(array(
                'message' => 'User ID or email parameter is required.',
                'status' => 400,
            ), 400);
        }
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
        if (!empty($password)) {
            if (!wp_check_password($password, $user->user_pass, $user->ID)) {
                return new WP_REST_Response(array(
                    'message' => 'Invalid password.',
                    'status' => 401,
                ), 401);
            }
        } else {
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
        }
        wp_set_current_user( $user->ID );
        $secret_key = defined( 'JWT_AUTH_SECRET_KEY' ) ? JWT_AUTH_SECRET_KEY : '';
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
        if (!class_exists('JWT')) {
            require_once ABSPATH . 'wp-content/plugins/jwt-auth/vendor/firebase/php-jwt/src/JWT.php';
        }
        $jwt = JWT::encode( $token, $secret_key, 'HS256' );
        return new WP_REST_Response( array(
            'token' => $jwt,
            'user_email' => $user->user_email,
            'user_nicename' => $user->user_nicename,
            'user_display_name' => $user->display_name,
            'id' => $user->ID,
            'status' => 200,
        ), 200 );
        // --- End migrated ---
    }

    // Check email handler
    public function check_email_exists( WP_REST_Request $request ) {
        // --- Begin migrated from user-custom-plugin.php check_email_exists ---
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
        // --- End migrated ---
    }

    // Check username handler
    public function check_username_exists( WP_REST_Request $request ) {
        // --- Begin migrated from user-custom-plugin.php check_username_exists ---
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
        // --- End migrated ---
    }

    // Get current user handler
    public function get_current_user( WP_REST_Request $request ) {
        // --- Begin migrated from user-custom-plugin.php get_current_user ---
        $user = wp_get_current_user();
        if ( ! $user || ! $user->ID ) {
            return new WP_REST_Response([
                'status' => false,
                'message' => 'User not authenticated',
            ], 401);
        }
        $attachment_id = get_user_meta( $user->ID, 'profile_image', true );
        $profileImage = '';
        if ( $attachment_id && is_numeric($attachment_id) ) {
            $image_url = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
            if ( $image_url ) {
                $profileImage = $image_url;
            }
        }
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
        // --- End migrated ---
    }

    // Add more handlers for password reset, update fields, etc.
}

new TastyPlates_User_REST_API();

?>
