<?php
/**
 * Phase 3 skeleton: paid-order auto-blocking for service/subscription availability.
 * Integrate this into your WordPress plugin and adapt names as needed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cbi_reservations_table_name() {
	global $wpdb;
	return $wpdb->prefix . 'cbi_reservations';
}

function cbi_create_reservations_table() {
	global $wpdb;
	$table_name      = cbi_reservations_table_name();
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE {$table_name} (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		order_id BIGINT UNSIGNED NOT NULL,
		order_item_id BIGINT UNSIGNED NULL,
		product_type VARCHAR(20) NOT NULL,
		product_slug VARCHAR(191) NOT NULL,
		scheduled_date DATE NOT NULL,
		time_slot VARCHAR(50) NULL,
		quantity INT UNSIGNED NOT NULL DEFAULT 1,
		status VARCHAR(20) NOT NULL DEFAULT 'active',
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL,
		PRIMARY KEY  (id),
		UNIQUE KEY uniq_order_item (order_id, order_item_id),
		KEY idx_lookup (product_slug, scheduled_date, time_slot, status)
	) {$charset_collate};";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

/**
 * Upsert reservations when order becomes paid.
 */
function cbi_upsert_reservations_from_order( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}

	global $wpdb;
	$table_name = cbi_reservations_table_name();
	$now        = current_time( 'mysql' );

	$item_type       = (string) $order->get_meta( 'item_type', true );
	$service_slug    = (string) $order->get_meta( 'service_slug', true );
	$subscription    = (string) $order->get_meta( 'subscription_slug', true );
	$scheduled_date  = (string) $order->get_meta( 'scheduled_date', true );
	$time_slot       = (string) $order->get_meta( 'time_slot', true );
	$resolved_type   = $item_type ? $item_type : ( $subscription ? 'subscription' : 'service' );
	$resolved_slug   = $resolved_type === 'subscription' ? $subscription : $service_slug;

	if ( ! $resolved_slug || ! $scheduled_date ) {
		return;
	}

	foreach ( $order->get_items() as $item_id => $item ) {
		$quantity = max( 1, (int) $item->get_quantity() );

		$existing_id = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$table_name} WHERE order_id = %d AND order_item_id = %d LIMIT 1",
				(int) $order_id,
				(int) $item_id
			)
		);

		$data = array(
			'order_id'        => (int) $order_id,
			'order_item_id'   => (int) $item_id,
			'product_type'    => $resolved_type,
			'product_slug'    => $resolved_slug,
			'scheduled_date'  => $scheduled_date,
			'time_slot'       => $time_slot ? $time_slot : null,
			'quantity'        => $quantity,
			'status'          => 'active',
			'updated_at'      => $now,
		);

		if ( $existing_id ) {
			$wpdb->update( $table_name, $data, array( 'id' => (int) $existing_id ) );
		} else {
			$data['created_at'] = $now;
			$wpdb->insert( $table_name, $data );
		}
	}
}

/**
 * Release reservations when order is cancelled/failed/refunded.
 */
function cbi_release_reservations_from_order( $order_id ) {
	global $wpdb;
	$table_name = cbi_reservations_table_name();
	$wpdb->update(
		$table_name,
		array(
			'status'     => 'released',
			'updated_at' => current_time( 'mysql' ),
		),
		array( 'order_id' => (int) $order_id )
	);
}

add_action( 'woocommerce_order_status_processing', 'cbi_upsert_reservations_from_order' );
add_action( 'woocommerce_order_status_completed', 'cbi_upsert_reservations_from_order' );
add_action( 'woocommerce_order_status_cancelled', 'cbi_release_reservations_from_order' );
add_action( 'woocommerce_order_status_failed', 'cbi_release_reservations_from_order' );
add_action( 'woocommerce_order_status_refunded', 'cbi_release_reservations_from_order' );

/**
 * REST: GET /wp-json/cbi/v1/availability?slug={slug}&week_start=YYYY-MM-DD
 * Assumes availability rules are stored in post meta cbi_availability_rules.
 */
function cbi_register_availability_route() {
	register_rest_route(
		'cbi/v1',
		'/availability',
		array(
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => 'cbi_get_weekly_availability',
			'args'                => array(
				'slug'       => array( 'required' => true ),
				'week_start' => array( 'required' => true ),
				'type'       => array( 'required' => false ),
			),
		)
	);
}
add_action( 'rest_api_init', 'cbi_register_availability_route' );

function cbi_count_booked_for_slot( $slug, $date, $slot = null ) {
	global $wpdb;
	$table_name = cbi_reservations_table_name();

	if ( $slot ) {
		$query = $wpdb->prepare(
			"SELECT COALESCE(SUM(quantity),0) FROM {$table_name}
			 WHERE product_slug = %s AND scheduled_date = %s AND time_slot = %s AND status = 'active'",
			$slug,
			$date,
			$slot
		);
	} else {
		$query = $wpdb->prepare(
			"SELECT COALESCE(SUM(quantity),0) FROM {$table_name}
			 WHERE product_slug = %s AND scheduled_date = %s AND status = 'active'",
			$slug,
			$date
		);
	}

	return (int) $wpdb->get_var( $query );
}

function cbi_state_from_remaining( $remaining, $capacity ) {
	if ( $capacity <= 0 || $remaining <= 0 ) {
		return 'full';
	}
	if ( $remaining < $capacity ) {
		return 'limited';
	}
	return 'available';
}

function cbi_get_weekly_availability( WP_REST_Request $request ) {
	$slug      = sanitize_text_field( (string) $request->get_param( 'slug' ) );
	$week_start = sanitize_text_field( (string) $request->get_param( 'week_start' ) );

	$post = get_page_by_path( $slug, OBJECT, array( 'service', 'subscription' ) );
	if ( ! $post ) {
		return new WP_Error( 'not_found', 'Unknown slug', array( 'status' => 404 ) );
	}

	$rules_json = (string) get_post_meta( $post->ID, 'cbi_availability_rules', true );
	$rules      = json_decode( $rules_json, true );
	if ( ! is_array( $rules ) ) {
		$rules = array();
	}

	$days_out = array();
	$start_ts = strtotime( $week_start );
	for ( $i = 0; $i < 7; $i++ ) {
		$day_ts   = strtotime( '+' . $i . ' day', $start_ts );
		$date     = gmdate( 'Y-m-d', $day_ts );
		$weekday  = strtolower( gmdate( 'D', $day_ts ) ); // mon..sun
		$day_rules = isset( $rules[ $weekday ] ) && is_array( $rules[ $weekday ] ) ? $rules[ $weekday ] : array();

		$slots = array();
		foreach ( $day_rules as $rule ) {
			$slot     = isset( $rule['slot'] ) ? (string) $rule['slot'] : '';
			$capacity = isset( $rule['capacity'] ) ? (int) $rule['capacity'] : 0;
			$booked   = cbi_count_booked_for_slot( $slug, $date, $slot ? $slot : null );
			$remaining = max( 0, $capacity - $booked );
			$slots[] = array(
				'slot'      => $slot,
				'capacity'  => $capacity,
				'booked'    => $booked,
				'remaining' => $remaining,
				'state'     => cbi_state_from_remaining( $remaining, $capacity ),
			);
		}

		$day_state = 'off';
		if ( ! empty( $slots ) ) {
			$day_state = 'available';
			foreach ( $slots as $slot_data ) {
				if ( 'full' === $slot_data['state'] ) {
					$day_state = 'limited';
				}
			}
			$all_full = true;
			foreach ( $slots as $slot_data ) {
				if ( 'full' !== $slot_data['state'] ) {
					$all_full = false;
					break;
				}
			}
			if ( $all_full ) {
				$day_state = 'full';
			}
		}

		$days_out[] = array(
			'date'  => $date,
			'slots' => $slots,
			'state' => $day_state,
		);
	}

	return array(
		'type'       => $post->post_type,
		'slug'       => $slug,
		'week_start' => $week_start,
		'days'       => $days_out,
	);
}

/**
 * Call on plugin activation.
 */
function cbi_phase3_activate() {
	cbi_create_reservations_table();
}
