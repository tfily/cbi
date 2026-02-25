<?php
/**
 * Plugin Name: CBI SEO Fields (Headless)
 * Description: Adds SEO/content fields to Services and Subscriptions and exposes them in REST for Next.js.
 * Version: 1.0.0
 * Author: CBI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cbi_seo_target_post_types() {
	return array( 'service', 'subscription' );
}

function cbi_seo_register_meta() {
	$meta_keys = array(
		'cbi_seo_title'       => 'string',
		'cbi_seo_description' => 'string',
		'cbi_focus_keyword'   => 'string',
		'cbi_service_area'    => 'string',
		'cbi_faq_json'        => 'string',
	);

	foreach ( cbi_seo_target_post_types() as $post_type ) {
		foreach ( $meta_keys as $key => $type ) {
			register_post_meta(
				$post_type,
				$key,
				array(
					'type'              => $type,
					'single'            => true,
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_textarea_field',
					'auth_callback'     => function() {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}
}
add_action( 'init', 'cbi_seo_register_meta' );

function cbi_seo_add_metabox() {
	foreach ( cbi_seo_target_post_types() as $post_type ) {
		add_meta_box(
			'cbi_seo_fields_box',
			'CBI SEO / Contenu',
			'cbi_seo_render_metabox',
			$post_type,
			'normal',
			'default'
		);
	}
}
add_action( 'add_meta_boxes', 'cbi_seo_add_metabox' );

function cbi_seo_render_metabox( $post ) {
	wp_nonce_field( 'cbi_seo_fields_save', 'cbi_seo_fields_nonce' );

	$values = array(
		'cbi_seo_title'       => get_post_meta( $post->ID, 'cbi_seo_title', true ),
		'cbi_seo_description' => get_post_meta( $post->ID, 'cbi_seo_description', true ),
		'cbi_focus_keyword'   => get_post_meta( $post->ID, 'cbi_focus_keyword', true ),
		'cbi_service_area'    => get_post_meta( $post->ID, 'cbi_service_area', true ),
		'cbi_faq_json'        => get_post_meta( $post->ID, 'cbi_faq_json', true ),
	);
	?>
	<p><label for="cbi_seo_title"><strong>SEO Title</strong></label></p>
	<input type="text" id="cbi_seo_title" name="cbi_seo_title" value="<?php echo esc_attr( $values['cbi_seo_title'] ); ?>" style="width:100%;" />

	<p><label for="cbi_seo_description"><strong>Meta Description</strong></label></p>
	<textarea id="cbi_seo_description" name="cbi_seo_description" rows="3" style="width:100%;"><?php echo esc_textarea( $values['cbi_seo_description'] ); ?></textarea>

	<p><label for="cbi_focus_keyword"><strong>Mot-clé principal</strong></label></p>
	<input type="text" id="cbi_focus_keyword" name="cbi_focus_keyword" value="<?php echo esc_attr( $values['cbi_focus_keyword'] ); ?>" style="width:100%;" />

	<p><label for="cbi_service_area"><strong>Zone desservie</strong></label></p>
	<input type="text" id="cbi_service_area" name="cbi_service_area" value="<?php echo esc_attr( $values['cbi_service_area'] ); ?>" style="width:100%;" />

	<p><label for="cbi_faq_json"><strong>FAQ JSON (optionnel)</strong></label></p>
	<textarea id="cbi_faq_json" name="cbi_faq_json" rows="8" style="width:100%;" placeholder='[{"q":"Question","a":"Reponse"}]'><?php echo esc_textarea( $values['cbi_faq_json'] ); ?></textarea>
	<?php
}

function cbi_seo_save_metabox( $post_id ) {
	if ( ! isset( $_POST['cbi_seo_fields_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['cbi_seo_fields_nonce'] ) ), 'cbi_seo_fields_save' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$keys = array(
		'cbi_seo_title',
		'cbi_seo_description',
		'cbi_focus_keyword',
		'cbi_service_area',
		'cbi_faq_json',
	);

	foreach ( $keys as $key ) {
		$value = isset( $_POST[ $key ] ) ? sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) ) : '';
		update_post_meta( $post_id, $key, $value );
	}
}
add_action( 'save_post', 'cbi_seo_save_metabox' );

