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

function cbi_contact_request_post_types() {
	return array( 'contact-request', 'contact_request', 'contact-requests' );
}

function cbi_feedback_post_type() {
	return 'cbi-feedback';
}

function cbi_contact_request_meta_keys() {
	return array(
		'cbi_name'                   => 'string',
		'cbi_email'                  => 'string',
		'cbi_phone'                  => 'string',
		'cbi_service_slug'           => 'string',
		'cbi_subscription_slug'      => 'string',
		'cbi_request_type'           => 'string',
		'cbi_scheduled_date'         => 'string',
		'cbi_time_slot'              => 'string',
		'cbi_custom_service_title'   => 'string',
		'cbi_custom_service_details' => 'string',
		'cbi_location'               => 'string',
		'cbi_frequency'              => 'string',
		'cbi_budget'                 => 'string',
		'cbi_preferred_contact'      => 'string',
		'cbi_urgency'                => 'string',
		'cbi_admin_notified'         => 'string',
	);
}

function cbi_feedback_meta_keys() {
	return array(
		'cbi_order_id'            => 'string',
		'cbi_rating'              => 'string',
		'cbi_customer_name'       => 'string',
		'cbi_customer_email'      => 'string',
		'cbi_feedback_message'    => 'string',
		'cbi_feedback_publish_ok' => 'string',
	);
}

function cbi_register_feedback_post_type() {
	register_post_type(
		cbi_feedback_post_type(),
		array(
			'labels'       => array(
				'name'          => 'Avis clients',
				'singular_name' => 'Avis client',
			),
			'public'       => false,
			'show_ui'      => true,
			'show_in_rest' => true,
			'rest_base'    => 'cbi-feedback',
			'supports'     => array( 'title', 'editor' ),
			'menu_icon'    => 'dashicons-star-filled',
		)
	);
}
add_action( 'init', 'cbi_register_feedback_post_type' );

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

	foreach ( cbi_contact_request_post_types() as $post_type ) {
		foreach ( cbi_contact_request_meta_keys() as $key => $type ) {
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

	foreach ( cbi_feedback_meta_keys() as $key => $type ) {
		register_post_meta(
			cbi_feedback_post_type(),
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

	foreach ( cbi_contact_request_post_types() as $post_type ) {
		if ( ! post_type_exists( $post_type ) ) {
			continue;
		}

		add_meta_box(
			'cbi_contact_request_box',
			'CBI Demande client',
			'cbi_render_contact_request_metabox',
			$post_type,
			'normal',
			'high'
		);
	}

	add_meta_box(
		'cbi_feedback_box',
		'CBI Avis client',
		'cbi_render_feedback_metabox',
		cbi_feedback_post_type(),
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'cbi_seo_add_metabox' );

function cbi_render_contact_request_metabox( $post ) {
	$fields = array(
		'Type de demande'         => get_post_meta( $post->ID, 'cbi_request_type', true ),
		'Nom'                     => get_post_meta( $post->ID, 'cbi_name', true ),
		'Email'                   => get_post_meta( $post->ID, 'cbi_email', true ),
		'Telephone'               => get_post_meta( $post->ID, 'cbi_phone', true ),
		'Service demande'         => get_post_meta( $post->ID, 'cbi_service_slug', true ),
		'Abonnement'              => get_post_meta( $post->ID, 'cbi_subscription_slug', true ),
		'Date souhaitee'          => get_post_meta( $post->ID, 'cbi_scheduled_date', true ),
		'Creneau'                 => get_post_meta( $post->ID, 'cbi_time_slot', true ),
		'Service sur-mesure'      => get_post_meta( $post->ID, 'cbi_custom_service_title', true ),
		'Lieu / secteur'          => get_post_meta( $post->ID, 'cbi_location', true ),
		'Frequence'               => get_post_meta( $post->ID, 'cbi_frequency', true ),
		'Budget'                  => get_post_meta( $post->ID, 'cbi_budget', true ),
		'Contact prefere'         => get_post_meta( $post->ID, 'cbi_preferred_contact', true ),
		'Urgence'                 => get_post_meta( $post->ID, 'cbi_urgency', true ),
		'Details complementaires' => get_post_meta( $post->ID, 'cbi_custom_service_details', true ),
	);

	echo '<div class="cbi-contact-request-fields">';
	foreach ( $fields as $label => $value ) {
		if ( '' === (string) $value ) {
			continue;
		}

		echo '<p>';
		echo '<strong>' . esc_html( $label ) . ':</strong><br />';
		echo nl2br( esc_html( $value ) );
		echo '</p>';
	}
	echo '</div>';
}

function cbi_render_feedback_metabox( $post ) {
	$fields = array(
		'Commande'               => get_post_meta( $post->ID, 'cbi_order_id', true ),
		'Note'                   => get_post_meta( $post->ID, 'cbi_rating', true ),
		'Nom client'             => get_post_meta( $post->ID, 'cbi_customer_name', true ),
		'Email client'           => get_post_meta( $post->ID, 'cbi_customer_email', true ),
		'Publication autorisee'  => get_post_meta( $post->ID, 'cbi_feedback_publish_ok', true ),
		'Message'                => get_post_meta( $post->ID, 'cbi_feedback_message', true ),
	);

	echo '<div class="cbi-feedback-fields">';
	foreach ( $fields as $label => $value ) {
		if ( '' === (string) $value ) {
			continue;
		}

		echo '<p>';
		echo '<strong>' . esc_html( $label ) . ':</strong><br />';
		echo nl2br( esc_html( $value ) );
		echo '</p>';
	}
	echo '</div>';
}

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

/**
 * Resolve exiftool binary path.
 */
function cbi_get_exiftool_binary() {
	$exiftool_binary = apply_filters( 'cbi_exiftool_binary', '/usr/bin/exiftool' );
	if ( ! is_string( $exiftool_binary ) || '' === $exiftool_binary || ! file_exists( $exiftool_binary ) ) {
		return '';
	}

	return $exiftool_binary;
}

/**
 * Strip metadata from one file using exiftool.
 */
function cbi_strip_metadata_for_file( $file_path ) {
	if ( ! is_string( $file_path ) || ! file_exists( $file_path ) || ! is_writable( $file_path ) ) {
		return false;
	}

	$mime = wp_check_filetype( $file_path );
	$mime = isset( $mime['type'] ) ? (string) $mime['type'] : '';

	$is_target = (
		0 === strpos( $mime, 'image/' ) ||
		0 === strpos( $mime, 'video/' ) ||
		'application/pdf' === $mime
	);

	if ( ! $is_target ) {
		return false;
	}

	$exiftool_binary = cbi_get_exiftool_binary();
	if ( '' === $exiftool_binary ) {
		return false;
	}

	// -overwrite_original avoids *_original backups in uploads.
	$command = sprintf(
		'%s -all= -overwrite_original %s 2>&1',
		escapeshellarg( $exiftool_binary ),
		escapeshellarg( $file_path )
	);

	$output      = array();
	$return_code = 1;
	exec( $command, $output, $return_code );

	if ( 0 !== $return_code ) {
		error_log(
			sprintf(
				'[CBI] exiftool metadata strip failed for %s: %s',
				$file_path,
				implode( ' | ', $output )
			)
		);

		return false;
	}

	return true;
}

/**
 * Strip metadata from uploaded assets using exiftool.
 * Runs after WordPress stores the file in uploads.
 */
function cbi_strip_upload_metadata( $upload ) {
	if ( empty( $upload['file'] ) ) {
		return $upload;
	}

	cbi_strip_metadata_for_file( $upload['file'] );

	return $upload;
}
add_filter( 'wp_handle_upload', 'cbi_strip_upload_metadata', 20 );

function cbi_build_review_link_for_order( $order ) {
	if ( ! $order instanceof WC_Order ) {
		return '';
	}

	$base = trim( (string) $order->get_meta( 'review_url_base', true ) );
	if ( '' === $base ) {
		$base = home_url();
	}

	$base = untrailingslashit( $base );
	if ( '' === $base ) {
		return '';
	}

	return add_query_arg(
		array(
			'orderId' => $order->get_id(),
			'email'   => $order->get_billing_email(),
		),
		$base . '/feedback'
	);
}

function cbi_send_review_invitation_for_completed_order( $order_id ) {
	if ( ! function_exists( 'wc_get_order' ) ) {
		return;
	}

	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return;
	}

	if ( '1' === (string) $order->get_meta( 'cbi_review_invite_sent', true ) ) {
		return;
	}

	$email = $order->get_billing_email();
	if ( ! $email || ! is_email( $email ) ) {
		return;
	}

	$review_link = cbi_build_review_link_for_order( $order );
	if ( '' === $review_link ) {
		return;
	}

	$name        = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
	$service_name = (string) $order->get_meta( 'service_name', true );
	$subject     = 'Votre avis sur votre prestation Conciergerie by Isa';
	$lines       = array(
		$name ? 'Bonjour ' . $name . ',' : 'Bonjour,',
		'',
		'Merci pour votre confiance.',
		$service_name ? 'Vous pouvez donner votre avis sur : ' . $service_name . '.' : 'Vous pouvez donner votre avis sur votre prestation.',
		'',
		'Lien de retour :',
		$review_link,
		'',
		'Votre retour nous aide a ameliorer la qualite de service.',
	);
	$body        = implode( "\n", $lines );

	$sent = wp_mail( $email, $subject, $body );
	if ( $sent ) {
		$order->update_meta_data( 'cbi_review_invite_sent', '1' );
		$order->save();
	}
}
add_action( 'woocommerce_order_status_completed', 'cbi_send_review_invitation_for_completed_order' );

function cbi_is_contact_request_post_type( $post_type ) {
	return in_array( $post_type, cbi_contact_request_post_types(), true );
}

function cbi_notify_admin_for_contact_request( $post_id, $post, $update ) {
	if ( wp_is_post_revision( $post_id ) || ! $post instanceof WP_Post ) {
		return;
	}

	if ( ! cbi_is_contact_request_post_type( $post->post_type ) ) {
		return;
	}

	if ( $update ) {
		return;
	}

	if ( 'publish' !== $post->post_status ) {
		return;
	}

	if ( get_post_meta( $post_id, 'cbi_admin_notified', true ) ) {
		return;
	}

	$admin_email = get_option( 'admin_email' );
	if ( ! $admin_email || ! is_email( $admin_email ) ) {
		return;
	}

	$request_type         = get_post_meta( $post_id, 'cbi_request_type', true );
	$custom_service_title = get_post_meta( $post_id, 'cbi_custom_service_title', true );
	$name                 = get_post_meta( $post_id, 'cbi_name', true );
	$email                = get_post_meta( $post_id, 'cbi_email', true );
	$phone                = get_post_meta( $post_id, 'cbi_phone', true );
	$service_slug         = get_post_meta( $post_id, 'cbi_service_slug', true );
	$subscription_slug    = get_post_meta( $post_id, 'cbi_subscription_slug', true );
	$scheduled_date       = get_post_meta( $post_id, 'cbi_scheduled_date', true );
	$time_slot            = get_post_meta( $post_id, 'cbi_time_slot', true );
	$location             = get_post_meta( $post_id, 'cbi_location', true );
	$frequency            = get_post_meta( $post_id, 'cbi_frequency', true );
	$budget               = get_post_meta( $post_id, 'cbi_budget', true );
	$preferred_contact    = get_post_meta( $post_id, 'cbi_preferred_contact', true );
	$urgency              = get_post_meta( $post_id, 'cbi_urgency', true );
	$custom_details       = get_post_meta( $post_id, 'cbi_custom_service_details', true );

	$subject = 'Nouvelle demande client CBI';
	if ( 'custom_service' === $request_type && $custom_service_title ) {
		$subject = 'Nouvelle demande sur-mesure CBI: ' . $custom_service_title;
	}

	$admin_url = admin_url( 'post.php?post=' . $post_id . '&action=edit' );
	$lines     = array(
		'Une nouvelle demande client a ete enregistree.',
		'',
		'Type: ' . ( $request_type ? $request_type : 'standard' ),
		'Nom: ' . $name,
		'Email: ' . $email,
		'Telephone: ' . $phone,
		'Service: ' . $service_slug,
		'Abonnement: ' . $subscription_slug,
		'Date souhaitee: ' . $scheduled_date,
		'Creneau: ' . $time_slot,
		'Service sur-mesure: ' . $custom_service_title,
		'Lieu: ' . $location,
		'Frequence: ' . $frequency,
		'Budget: ' . $budget,
		'Contact prefere: ' . $preferred_contact,
		'Urgence: ' . $urgency,
		'',
		'Message:',
		wp_strip_all_tags( $post->post_content ),
		'',
		'Details complementaires:',
		$custom_details,
		'',
		'Voir dans l admin:',
		$admin_url,
	);
	$body      = implode( "\n", array_filter( $lines, 'strlen' ) );

	$sent = wp_mail( $admin_email, $subject, $body );
	if ( $sent ) {
		update_post_meta( $post_id, 'cbi_admin_notified', '1' );
	}
}
add_action( 'save_post', 'cbi_notify_admin_for_contact_request', 20, 3 );

/**
 * Register a WP-CLI command to strip metadata from already uploaded media.
 */
function cbi_register_cli_commands() {
	if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
		return;
	}

	WP_CLI::add_command(
		'cbi strip-metadata',
		function( $args, $assoc_args ) {
			$limit   = isset( $assoc_args['limit'] ) ? (int) $assoc_args['limit'] : 0;
			$offset  = isset( $assoc_args['offset'] ) ? (int) $assoc_args['offset'] : 0;
			$dry_run = isset( $assoc_args['dry-run'] );

			$query_args = array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => $limit > 0 ? $limit : -1,
				'offset'         => max( 0, $offset ),
				'fields'         => 'ids',
				'orderby'        => 'ID',
				'order'          => 'ASC',
			);

			$attachment_ids = get_posts( $query_args );
			if ( empty( $attachment_ids ) ) {
				WP_CLI::success( 'No attachments found.' );
				return;
			}

			$uploads_dir = wp_get_upload_dir();
			$base_dir    = isset( $uploads_dir['basedir'] ) ? (string) $uploads_dir['basedir'] : '';

			$total_files = 0;
			$cleaned     = 0;
			$failed      = 0;

			foreach ( $attachment_ids as $attachment_id ) {
				$paths = array();

				$original = get_attached_file( $attachment_id );
				if ( is_string( $original ) && '' !== $original ) {
					$paths[] = $original;
				}

				$meta = wp_get_attachment_metadata( $attachment_id );
				if ( is_array( $meta ) && ! empty( $meta['sizes'] ) && is_array( $meta['sizes'] ) ) {
					$relative_dir = '';
					if ( isset( $meta['file'] ) && is_string( $meta['file'] ) ) {
						$relative_dir = dirname( $meta['file'] );
						$relative_dir = '.' === $relative_dir ? '' : $relative_dir;
					}

					foreach ( $meta['sizes'] as $size ) {
						if ( empty( $size['file'] ) || ! is_string( $size['file'] ) ) {
							continue;
						}
						$rel_path = '' !== $relative_dir ? $relative_dir . '/' . $size['file'] : $size['file'];
						if ( '' !== $base_dir ) {
							$paths[] = trailingslashit( $base_dir ) . ltrim( $rel_path, '/' );
						}
					}
				}

				$paths = array_values( array_unique( array_filter( $paths, 'is_string' ) ) );
				foreach ( $paths as $path ) {
					$total_files++;
					if ( $dry_run ) {
						WP_CLI::log( '[dry-run] ' . $path );
						continue;
					}

					if ( cbi_strip_metadata_for_file( $path ) ) {
						$cleaned++;
					} else {
						$failed++;
					}
				}
			}

			WP_CLI::success(
				sprintf(
					'Processed %d file(s). Cleaned: %d. Failed/skipped: %d.',
					$total_files,
					$cleaned,
					$failed
				)
			);
		},
		array(
			'shortdesc' => 'Strip metadata from existing uploaded media files using exiftool.',
			'synopsis'  => array(
				array(
					'type'        => 'assoc',
					'name'        => 'limit',
					'optional'    => true,
					'description' => 'Limit number of attachments to process.',
				),
				array(
					'type'        => 'assoc',
					'name'        => 'offset',
					'optional'    => true,
					'description' => 'Offset attachment query.',
				),
				array(
					'type'        => 'flag',
					'name'        => 'dry-run',
					'optional'    => true,
					'description' => 'List files without modifying them.',
				),
			),
		)
	);
}
add_action( 'init', 'cbi_register_cli_commands' );
