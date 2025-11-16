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
    protected $meta;
    protected $schema;

    public function __construct() {
        $this->meta = new WP_REST_User_Meta_Fields();
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
        // Retrieve the list of registered collection query parameters.
        $registered = $this->get_collection_params();

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
            $prepared_args['fields'] = 'id';
        }

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

        $per_page = (int) $prepared_args['number'];
        $page     = (int) ceil( ( ( (int) $prepared_args['offset'] ) / $per_page ) + 1 );

        $prepared_args['fields'] = 'ID';

        $total_users = $query->get_total();

        if ( $total_users < 1 ) {
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

    /**
     * Retrieves the item schema, conforming to JSON Schema.
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
                'email'              => array(
                    'description' => __( 'The email address for the user.' ),
                    'type'        => 'string',
                    'format'      => 'email',
                    'context'     => array( 'edit' ),
                    'required'    => true,
                ),
                'password'           => array(
                    'description' => __( 'Password for the user (never included).' ),
                    'type'        => 'string',
                    'context'     => array(),
                    'required'    => true,
                ),
                'roles'              => array(
                    'description' => __( 'Roles assigned to the user.' ),
                    'type'        => 'array',
                    'items'       => array(
                        'type' => 'string',
                    ),
                    'context'     => array( 'edit' ),
                ),
                'birthdate'         => array(
                    'description' => __( 'Birthdate for the user.' ),
                    'type'        => 'string',
                    'format'      => 'date',
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
                'meta'              => array(
                    'description' => __( 'Meta fields.' ),
                    'type'        => 'object',
                    'context'     => array( 'edit' ),
                    'properties'  => array(),
                ),
            ),
        );

        if ( get_option( 'show_avatars' ) ) {
            $avatar_properties = array();
            $avatar_sizes = rest_get_avatar_sizes();
            foreach ( $avatar_sizes as $size ) {
                $avatar_properties[ $size ] = array(
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

        $this->schema = $schema;
        return $this->add_additional_fields_schema( $this->schema );
    }

    /**
     * Determines if the current user is allowed to make the desired roles change.
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
                    sprintf( __( 'The role %s does not exist.' ), $role ),
                    array( 'status' => 400 )
                );
            }

            $potential_role = $wp_roles->role_objects[ $role ];

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

            require_once ABSPATH . 'wp-admin/includes/user.php';
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
     * Prepares a single user for creation or update.
     *
     * @param WP_REST_Request $request Request object.
     * @return object User object.
     */
    protected function prepare_item_for_database( $request ) {
        $prepared_user = new stdClass();

        $schema = $this->get_item_schema();

        if ( isset( $request['email'] ) && ! empty( $schema['properties']['email'] ) ) {
            $prepared_user->user_email = $request['email'];
        }

        if ( isset( $request['username'] ) && ! empty( $schema['properties']['username'] ) ) {
            $prepared_user->user_login = $request['username'];
        }

        if ( isset( $request['password'] ) && ! empty( $schema['properties']['password'] ) ) {
            $prepared_user->user_pass = $request['password'];
        }

        if ( isset( $request['id'] ) ) {
            $prepared_user->ID = absint( $request['id'] );
        }

        if ( isset( $request['name'] ) && ! empty( $schema['properties']['name'] ) ) {
            $prepared_user->display_name = $request['name'];
        }

        if ( isset( $request['birthdate'] ) && ! empty( $schema['properties']['birthdate'] ) ) {
            $prepared_user->birthdate = $request['birthdate'];
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

        return apply_filters( 'rest_pre_insert_user', $prepared_user, $request );
    }

    /**
     * Prepares a single user output for response.
     *
     * @param WP_User         $item    User object.
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response Response object.
     */
    public function prepare_item_for_response( $item, $request ) {
        $user = $item;

        if ( $request->is_method( 'HEAD' ) ) {
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

        if ( in_array( 'email', $fields, true ) ) {
            $data['email'] = $user->user_email;
        }

        if ( in_array( 'roles', $fields, true ) ) {
            $data['roles'] = array_values( $user->roles );
        }

        if ( in_array( 'meta', $fields, true ) ) {
            $data['meta'] = $this->meta->get_value( $user->ID, $request );
        }

        $context = ! empty( $request['context'] ) ? $request['context'] : 'embed';
        $data = $this->add_additional_fields_to_object( $data, $request );
        $data = $this->filter_response_by_context( $data, $context );

        $response = rest_ensure_response( $data );

        if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
            $response->add_links( $this->prepare_links( $user ) );
        }

        return apply_filters( 'rest_prepare_user', $response, $user, $request );
    }

    /**
     * Prepares links for the user request.
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
     * Retrieves the query params for collections.
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

        $query_params['roles'] = array(
            'description' => __( 'Limit result set to users matching at least one specific role provided. Accepts csv list or single role.' ),
            'type'        => 'array',
            'items'       => array(
                'type' => 'string',
            ),
        );

        return apply_filters( 'rest_user_collection_params', $query_params );
    }

    /**
     * Check a username for the REST API.
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
     * Custom wp_insert_user implementation.
     *
     * @param array $userdata User data.
     * @return int|WP_Error User ID on success, WP_Error on failure.
     */
    protected function wp_insert_user( $userdata ) {
        global $wpdb;

        if ( $userdata instanceof stdClass ) {
            $userdata = get_object_vars( $userdata );
        } elseif ( $userdata instanceof WP_User ) {
            $userdata = $userdata->to_array();
        }

        $update = ! empty( $userdata['ID'] );
        if ( $update ) {
            $user_id = (int) $userdata['ID'];
            $old_user_data = get_userdata( $user_id );
            if ( ! $old_user_data ) {
                return new WP_Error( 'invalid_user_id', __( 'Invalid user ID.' ) );
            }
            $user_pass = ! empty( $userdata['user_pass'] ) ? $userdata['user_pass'] : $old_user_data->user_pass;
        } else {
            $user_pass = wp_hash_password( $userdata['user_pass'] );
        }

        $sanitized_user_login = sanitize_user( $userdata['user_login'], true );
        $user_login = trim( apply_filters( 'pre_user_login', $sanitized_user_login ) );

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

        if ( ! empty( $userdata['user_nicename'] ) ) {
            $user_nicename = sanitize_user( $userdata['user_nicename'], true );
        } else {
            $user_nicename = mb_substr( $user_login, 0, 50 );
        }
        $user_nicename = sanitize_title( $user_nicename );
        $user_nicename = apply_filters( 'pre_user_nicename', $user_nicename );

        if ( mb_strlen( $user_nicename ) > 50 ) {
            return new WP_Error( 'user_nicename_too_long', __( 'Nicename may not be longer than 50 characters.' ) );
        }

        $raw_user_email = empty( $userdata['user_email'] ) ? '' : $userdata['user_email'];
        $user_email = apply_filters( 'pre_user_email', $raw_user_email );

        if ( ( ! $update || ( ! empty( $old_user_data ) && 0 !== strcasecmp( $user_email, $old_user_data->user_email ) ) )
            && ! defined( 'WP_IMPORTING' )
            && email_exists( $user_email )
        ) {
            return new WP_Error( 'existing_user_email', __( 'Sorry, that email address is already used!' ) );
        }

        $user_registered = empty( $userdata['user_registered'] ) ? gmdate( 'Y-m-d H:i:s' ) : $userdata['user_registered'];
        $display_name = empty( $userdata['display_name'] ) ? $user_login : $userdata['display_name'];
        $display_name = apply_filters( 'pre_user_display_name', $display_name );

        $acf_fields = array( 'birthdate', 'gender', 'custom_gender', 'pronoun', 'palates', 'about_me', 'is_google_user' );

        $compacted = compact(
            'user_pass',
            'user_nicename',
            'user_email',
            'user_registered',
            'display_name'
        );

        foreach ( $acf_fields as $acf_field ) {
            if ( $acf_field === 'palates' && ! empty( $userdata[ $acf_field ] ) ) {
                $palates_array = array_map( 'trim', explode( ',', $userdata[ $acf_field ] ) );
                $palates_array = array_map( 'ucfirst', $palates_array );
                $userdata[ $acf_field ] = implode( ' | ', $palates_array );
            }
        }
        unset( $userdata['profile_image'] );

        $data = wp_unslash( $compacted );

        if ( ! $update ) {
            $data = $data + compact( 'user_login' );
        }

        $data = apply_filters( 'wp_pre_insert_user_data', $data, $update, ( $update ? $user_id : null ), $userdata );

        if ( empty( $data ) || ! is_array( $data ) ) {
            return new WP_Error( 'empty_data', __( 'Not enough data to create this user.' ) );
        }

        if ( $update ) {
            if ( $user_email !== $old_user_data->user_email || $user_pass !== $old_user_data->user_pass ) {
                $data['user_activation_key'] = '';
            }
            $wpdb->update( $wpdb->users, $data, array( 'ID' => $user_id ) );
        } else {
            $wpdb->insert( $wpdb->users, $data );
            $user_id = (int) $wpdb->insert_id;

            foreach ( $acf_fields as $acf_field ) {
                if ( ! empty( $userdata[ $acf_field ] ) ) {
                    update_user_meta( $user_id, $acf_field, $userdata[ $acf_field ] );
                }
            }

            if ( ! empty( $userdata['profile_image'] ) ) {
                $this->update_profile_image( $user_id, $userdata['profile_image'] );
            }
        }

        $user = new WP_User( $user_id );

        if ( isset( $userdata['role'] ) ) {
            $user->set_role( $userdata['role'] );
        } elseif ( ! $update ) {
            $user->set_role( get_option( 'default_role' ) );
        }

        clean_user_cache( $user_id );

        if ( $update ) {
            do_action( 'profile_update', $user_id, $old_user_data, $userdata );
        } else {
            do_action( 'user_register', $user_id, $userdata );
        }

        return $user_id;
    }

    /**
     * Update profile image for a user.
     *
     * @param int    $user_id       User ID.
     * @param string $profile_image Profile image data (base64 or URL).
     * @return void
     */
    protected function update_profile_image( $user_id, $profile_image ) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $existing_image_id = get_user_meta( $user_id, 'profile_image', true );
        if ( $existing_image_id ) {
            wp_delete_attachment( $existing_image_id, true );
            delete_user_meta( $user_id, 'profile_image' );
        }

        if ( preg_match( '/^data:image\/(\w+);base64,/', $profile_image, $type ) ) {
            $image_data = substr( $profile_image, strpos( $profile_image, ',' ) + 1 );
            $image_data = base64_decode( $image_data );

            if ( $image_data === false ) {
                return;
            }

            $extension = strtolower( $type[1] );
            $filename = 'profile_image_' . time() . '.' . $extension;

            $tmp_file = wp_tempnam( $filename );
            file_put_contents( $tmp_file, $image_data );

            $file_array = array(
                'name'     => $filename,
                'tmp_name' => $tmp_file,
            );

            $attachment_id = media_handle_sideload( $file_array, 0 );

            if ( ! is_wp_error( $attachment_id ) ) {
                update_user_meta( $user_id, 'profile_image', $attachment_id );
            }

            @unlink( $tmp_file );
        } else {
            $tmp = download_url( $profile_image );

            if ( ! is_wp_error( $tmp ) ) {
                $file_array = array(
                    'name'     => basename( $profile_image ),
                    'tmp_name' => $tmp,
                );

                $attachment_id = media_handle_sideload( $file_array, 0 );

                if ( ! is_wp_error( $attachment_id ) ) {
                    update_user_meta( $user_id, 'profile_image', $attachment_id );
                }

                @unlink( $tmp );
            }
        }
    }
}

new TastyPlates_User_REST_API();

?>
