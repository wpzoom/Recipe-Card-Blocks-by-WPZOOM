<?php
/**
 * Blocks Initializer
 *
 * Enqueue CSS/JS of all the blocks.
 *
 * @since   1.0.1
 * @package WPZOOM Recipe Card Block
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WPZOOM_Assets_Manager' ) ) {
	/**
	 * Main WPZOOM_Assets_Manager Class.
	 *
	 * @since 1.0.1
	 */
	class WPZOOM_Assets_Manager {
		/**
		 * This plugin's instance.
		 *
		 * @var WPZOOM_Assets_Manager
		 * @since 1.0.1
		 */
		private static $instance;

		/**
		 * Registers the plugin.
		 */
		public static function register() {
			if ( null === self::$instance ) {
				self::$instance = new WPZOOM_Assets_Manager();
			}
		}

		/**
		 * The base directory path.
		 *
		 * @var string $_dir
		 */
		private $_dir;

		/**
		 * The base URL path.
		 *
		 * @var string $_url
		 */
		private $_url;

		/**
		 * The Plugin text domain.
		 *
		 * @var string $_textdomain
		 */
		private $_textdomain;

		/**
		 * The Plugin version.
		 *
		 * @var string $_version
		 */
		private $_version;

		/**
		 * The Plugin version.
		 *
		 * @var string $_slug
		 */
		private $_slug;

		/**
		 * The Constructor.
		 */
		private function __construct() {
			$this->_version 	= WPZOOM_RCB_VERSION;
			$this->_textdomain 	= WPZOOM_RCB_TEXT_DOMAIN;
			$this->_slug    	= 'wpzoom-rcb-block';
			$this->_url     	= untrailingslashit( plugins_url( '/', dirname( __FILE__ ) ) );

			add_action( 'enqueue_block_assets', array( $this, 'block_assets' ) );
			add_action( 'enqueue_block_assets', array( $this, 'load_icon_fonts' ) );
			add_action( 'enqueue_block_assets', array( $this, 'load_jed_text_domain' ) );
			add_action( 'enqueue_block_editor_assets', array( $this, 'editor_assets' ) );
		}

		/**
		 * Get array of dependencies.
		 *
		 * @param string|string $handle The handle slug.
		 *
		 * @since 1.0.1
		 */
		private function get_dependencies( $handle ) {
			$dependencies = array();

			if ( $this->_slug . '-js' === $handle ) {
				$dependencies = array( 'wp-blocks', 'wp-i18n', 'wp-element' );
			}
			elseif ( $this->_slug . '-editor-css' === $handle ) {
				$dependencies = array( 'wp-edit-blocks' );
			}
			elseif ( $this->_slug . '-script' === $handle ) {
				$dependencies = array( 'jquery' );
			}
			elseif ( $this->_slug . '-style-css' === $handle ) {
				$dependencies = array( 'wp-blocks' );
			}
			elseif ( $this->_slug . '-oldicon-css' === $handle || $this->_slug . '-foodicons-css' === $handle || $this->_slug . '-font-awesome-css' === $handle || $this->_slug . '-genericons-css' === $handle ) {
				$dependencies = array( 'wp-edit-blocks' );
			}

			return $dependencies;
		}

		/**
		 * Enqueue Gutenberg block assets for both frontend + backend.
		 *
		 * `wp-blocks`: includes block type registration and related functions.
		 *
		 * @since 1.0.1
		 */
		public function block_assets() {
			// Scripts.
			wp_enqueue_script(
			    $this->_slug . '-script',
			    $this->asset_source( 'js', 'script.js' ),
			    $this->get_dependencies( $this->_slug . '-script' ),
			    $this->_version,
			    true
			);

			// Styles.
			wp_enqueue_style(
				$this->_slug . '-style-css', // Handle.
				$this->asset_source( '', 'blocks.style.build.css' ), // Block style CSS.
				$this->get_dependencies( $this->_slug . '-style-css' ), // Dependency to include the CSS after it.
				$this->_version
			);

			wp_enqueue_style(
		    	$this->_slug . '-google-font',
		    	'https://fonts.googleapis.com/css?family=Roboto+Condensed:400,400i,700,700i',
		    	false
		    );

		    /**
		     * Localize script data.
		     */
		    $this->localize_script(
		    	$this->_slug . '-script',
		    	'wpzoomRecipeCard',
		    	array(
		    		'version' => $this->_version,
		    		'textdomain' => $this->_textdomain,
		    		'pluginURL' => plugins_url('recipe-card-blocks-by-wpzoom'),
		    		'post_title' => get_the_title()
		    	)
		    );
		}

		/**
		 * Load Jed-formatted localization text domain.
		 *
		 * @since 1.0.1
		 */
		public function load_jed_text_domain() {
			wp_add_inline_script(
				'wp-i18n',
				'wp.i18n.setLocaleData( ' . wp_json_encode( gutenberg_get_jed_locale_data( $this->_textdomain ) ) . ', "' . $this->_textdomain . '" );',
				'after'
			);
		}

		/**
		 * Enqueue Gutenberg block assets for backend editor.
		 *
		 * `wp-blocks`: includes block type registration and related functions.
		 * `wp-element`: includes the WordPress Element abstraction for describing the structure of your blocks.
		 * `wp-i18n`: To internationalize the block's text.
		 *
		 * @since 1.0.1
		 */
		public function editor_assets() {
			// Scripts.
			wp_enqueue_script(
				$this->_slug . '-js', // Handle.
				$this->asset_source( '', 'blocks.build.js' ), // Block.build.js: We register the block here. Built with Webpack.
				$this->get_dependencies( $this->_slug . '-js' ), // Dependencies, defined above.
				$this->_version,
				true // Enqueue the script in the footer.
			);

			// Styles.
			wp_enqueue_style(
				$this->_slug . '-editor-css', // Handle.
				$this->asset_source( '', 'blocks.editor.build.css' ), // Block editor CSS.
				$this->get_dependencies( $this->_slug . '-editor-css' ), // Dependency to include the CSS after it.
				$this->_version
			);
		}

		/**
		 * Load icon fonts.
		 *
		 * To make backward compatibility we include icons from version 1.0.1
		 * That's why we named it 'oldicon'
		 *
		 * @since 1.0.1
		 */
		public function load_icon_fonts() {
			$icon_fonts = array( 'oldicon', 'foodicons', 'font-awesome', 'genericons' );

			foreach ( $icon_fonts as $icon ) {
				wp_enqueue_style(
					$this->_slug . '-' . $icon . '-css', // Handle.
					$this->asset_source( 'css', $icon .'.min.css' ), // Block editor CSS.
					$this->get_dependencies( $this->_slug . '-' . $icon . '_css' ), // Dependency to include the CSS after it.
					$this->_version
				);
			}
		}

		/**
		 * Source assets.
		 *
		 * @since 1.0.1
		 * @param string|string $type The type of resource.
		 * @param string|string $directory Any extra directories needed.
		 */
		public function asset_source( $type = 'js', $directory = null ) {
			if ( 'js' === $type || 'css' === $type ) {
				return $this->_url . '/dist/assets/' . $type . '/' . $directory;
			} else {
				return $this->_url . '/dist/' . $directory;
			}
		}

		/**
		 * Enqueue localization data.
		 *
		 * @since 1.0.1
		 * @access public
		 */
		public function localize_script( $handle, $name, $data ) {
			wp_localize_script( $handle, $name, $data );
		}
	}
}

WPZOOM_Assets_Manager::register();