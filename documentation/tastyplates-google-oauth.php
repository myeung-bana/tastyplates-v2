<?php
/**
 * Plugin Name: Tastyplates Google OAuth REST bridge
 * Description: REST endpoint to accept Google id_token, validate it with Google, create or find a WP user, log them in, and return user info.
 * Version: 0.1
 * Author: Tastyplates
 */

add_action('rest_api_init', function () {
    register_rest_route('wp/v2/api', '/users/google-oauth', array(
        'methods' => 'POST',
        'callback' => 'tastyplates_google_oauth_handler',
        'permission_callback' => '__return_true',
    ));
});

function tastyplates_google_oauth_handler( WP_REST_Request $request ) {
    $params = json_decode( $request->get_body(), true );
    if ( empty( $params['id_token'] ) ) {
        return new WP_REST_Response( array( 'error' => 'missing_id_token' ), 400 );
    }

    $id_token = sanitize_text_field( $params['id_token'] );

    // Validate id_token with Google
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

    // Check if user exists
    $user = get_user_by( 'email', $email );
    if ( ! $user ) {
        // create a username from email
        $username = sanitize_user( current( explode( '@', $email ) ), true );
        // ensure unique username
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

        // store google sub on user meta for later
        update_user_meta( $user_id, 'tastyplates_google_sub', $google_sub );
        $user = get_user_by( 'id', $user_id );
    }

    // Log the user in (set auth cookie)
    wp_set_current_user( $user->ID );
    wp_set_auth_cookie( $user->ID, true );

    // Optionally: if you have JWT plugin, create a JWT here and return it.
    $result = array(
        'user_id' => $user->ID,
        'email' => $user->user_email,
        'display_name' => $user->display_name,
        'redirect' => '/onboarding'
    );

    return new WP_REST_Response( $result, 200 );
}
?>