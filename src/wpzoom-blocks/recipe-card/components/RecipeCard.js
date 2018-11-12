/* External dependencies */
import Detail from "./Detail";
import Ingredient from "./Ingredient";
import Direction from "./Direction";
import Inspector from "./Inspector";
import _get from "lodash/get";
import _isUndefined from "lodash/isUndefined";
import _merge from "lodash/merge";
import _filter from "lodash/filter";
import _indexOf from "lodash/indexOf";
import _isNull from "lodash/isNull";
import _uniq from "lodash/uniq";
import _uniqueId from "lodash/uniqueId";

/* Internal dependencies */
import { stripHTML } from "../../../helpers/stringHelpers";

/* WordPress dependencies */
const { __ } = wp.i18n;
const { Component, renderToString } = wp.element;
const { DropZoneProvider, DropZone, Button, Placeholder, FormFileUpload, Dashicon } = wp.components;
const { RichText, MediaUpload, InnerBlocks } = wp.editor;

/**
 * A Recipe Card block.
 */
export default class RecipeCard extends Component {

	/**
	 * Constructs a Recipe Card editor component.
	 *
	 * @param {Object} props This component's properties.
	 *
	 * @returns {void}
	 */
	constructor( props ) {
		super( props );

		this.props.attributes.id = RecipeCard.generateId( "wpzoom-recipe-card" );

		this.initBlocks();
		this.updateAttributes( props );
	}

	/**
	 * Generates a pseudo-unique id.
	 *
	 * @param {string} [prefix] The prefix to use.
	 *
	 * @returns {string} Returns the unique ID.
	 */
	static generateId( prefix = '' ) {
		return prefix !== '' ? _uniqueId( prefix + '-' ) : _uniqueId();
	}

	/**
	 * Get attributes from existings `Details`, `Ingredients` and `Directions` Blocks from post
	 * and set its to our Recipe Card
	 */
	updateAttributes( props ) {
		const { attributes, setAttributes } = props;
		const blocks        = [ "wpzoom-recipe-card/block-details", "wpzoom-recipe-card/block-ingredients", "wpzoom-recipe-card/block-directions" ];
		const { select }    = wp.data;
		const blocksList    = select('core/editor').getBlocks();

		const wpzoomBlocksFilter = _filter( blocksList, function( item ) { return _indexOf( blocks, item.name ) !== -1 } );

		const setDetailsAttributes = ( objects ) => {
		    const filter = _filter( objects, [ 'name', blocks[0] ] );

		    if ( _isUndefined( filter[0] ) )
		    	return;

		    let { attributes: { activeIconSet, course, cuisine, keywords, details } } = filter[0];

		    details ? 
		        details.map( ( item, index ) => {
		            const regex = /(\d+)(\D+)/;
		            const m = regex.exec( item.jsonValue );

		            if ( _isNull( m ) )
		                return;

		            const value = m[1] ? m[1] : 0;
		            const unit = m[2] ? m[2].trim() : '';

		            details[ index ]['value'] = value;
		            details[ index ]['jsonValue'] = stripHTML( renderToString( value ) );
		            details[ index ]['unit'] = unit;
		            details[ index ]['jsonUnit'] = stripHTML( renderToString( unit ) );

		            return details;
		        } )
		    : null;

		    setAttributes( { details, activeIconSet, course, cuisine, keywords } );
		}

		const setIngredientsAttributes = ( objects ) => {
		    const filter = _filter( objects, [ 'name', blocks[1] ] );

		    if ( _isUndefined( filter[0] ) )
		    	return;

		    let { attributes: { title, items } } = filter[0];

		    items ? 
		        items.map( ( item, index ) => {
		            items[ index ]['id'] = item.id;
		            items[ index ]['name'] = item.name;
		            items[ index ]['jsonName'] = stripHTML( renderToString( item.name ) );

		            return items;
		        } )
		    : null;

		    setAttributes( { ingredientsTitle: title, jsonIngredientsTitle: stripHTML( renderToString( title ) ), ingredients: items } );
		}

		const setStepsAttributes = ( objects ) => {
		    const filter = _filter( objects, [ 'name', blocks[2] ] );

		    if ( _isUndefined( filter[0] ) )
		    	return;

		    let { attributes: { title, steps } } = filter[0];

		    steps ? 
		        steps.map( ( item, index ) => {
		            steps[ index ]['id'] = item.id;
		            steps[ index ]['text'] = item.text;
		            steps[ index ]['jsonText'] = stripHTML( renderToString( item.text ) );

		            return steps;
		        } )
		    : null;

		    setAttributes( { directionsTitle: title, jsonDirectionsTitle: stripHTML( renderToString( title ) ), steps } );
		}

		setDetailsAttributes( wpzoomBlocksFilter );
		setIngredientsAttributes( wpzoomBlocksFilter );
		setStepsAttributes( wpzoomBlocksFilter );
	}

	/**
	 * Because setAttributes is quite slow right after a block has been added we fake having a single item.
	 *
	 * @returns {void}
	 */
	initBlocks() {
		const { attributes } = this.props;
		const details = attributes.details ? attributes.details.slice() : [];
		const ingredients = attributes.ingredients ? attributes.ingredients.slice() : [];
		const steps = attributes.steps ? attributes.steps.slice() : [];

		if ( ! ingredients || ingredients.length === 0 ) {
		    attributes.ingredients = [
		        { 
		            id: Ingredient.generateId( "ingredient-item" ),
		            name: []
		        }
		    ];
		}

		if ( ! steps || steps.length === 0 ) {
		    attributes.steps = [
		        {
		            id: Direction.generateId( "direction-step" ),
		            text: []
		        }
		    ];
		}

		if ( ! details || details.length === 0 ) {
		    attributes.details = [
		        {
		            id: Detail.generateId( "detail-item" ),
		            icon: null,
		            label: [],
		            value: []
		        }
		    ];
		}

		attributes.details = Detail.removeDuplicates( attributes.details );
		attributes.ingredients = Ingredient.removeDuplicates( attributes.ingredients );
		attributes.steps = Direction.removeDuplicates( attributes.steps );
	}

	/**
	 * Set Active Block Style.
	 *
	 * @returns {void}
	 */
	setActiveBlockStyle( className ) {
		const { attributes, setAttributes } = this.props;
		const { settings } = attributes;

		const regex = /is-style-(\S*)/g;
		let m = regex.exec( className );
		const activeStyle = m !== null ? m[1] : wpzoomRecipeCard.block_style;

		if ( activeStyle === 'default' ) {
			settings[0].primary_color = '#222';
		} else if ( activeStyle === 'newdesign' ) {
			settings[0].primary_color = '#FFA921';
		}

		if ( m === null ) {
			settings[0]['additionalClasses'] = `is-style-${ activeStyle }`;
		} else {
			settings[0]['additionalClasses'] = '';
		}

		setAttributes( { style: activeStyle } );
		setAttributes( { settings } );
	}

	/**
	 * Set Video Block attributes.
	 *
	 * @returns {void}
	 */
	setVideoAttributes() {
		const { attributes, setAttributes, clientId } = this.props;
		const { select } = wp.data;
		const parentBlock = select( 'core/editor' ).getBlocksByClientId( clientId )[ 0 ];
		const childBlocks = ! _isNull( parentBlock ) ? parentBlock.innerBlocks : [];

		if ( ! _isUndefined( childBlocks[0] ) && childBlocks[0].attributes ) {
			setAttributes( { hasVideo: true, video: childBlocks[0].attributes } );
		} else {
			setAttributes( { hasVideo: false, video: null } );
		}
	}

	/**
	 * Returns the component to be used to render
	 * the Recipe Card block on Wordpress (e.g. not in the editor).
	 *
	 * @param {object} props the attributes of the Recipe Card block.
	 *
	 * @returns {Component} The component representing a Recipe Card block.
	 */
	static Content( props ) {
		const {
			id,
			style,
			recipeTitle,
			jsonName,
			summary,
			jsonSummary,
			course,
			cuisine,
			difficulty,
			hasImage,
			image,
			settings,
			className
		} = props;

		const printStyles = { 'background-color': `${ settings[0]['primary_color'] }` };

		const RecipeCardClassName = [ className, settings[0]['additionalClasses'] ].filter( ( item ) => item ).join( " " );
		const PrintClasses = [ "wpzoom-recipe-card-print-link", settings[0]['print_btn'] ].filter( ( item ) => item ).join( " " );
		const PinterestClasses = [ "wpzoom-recipe-card-pinit", settings[0]['pin_btn'] ].filter( ( item ) => item ).join( " " );
		const pinitURL = `https://www.pinterest.com/pin/create/button/?url=${ wpzoomRecipeCard.post_permalink }/&media=${ hasImage ? image.url : wpzoomRecipeCard.post_thumbnail_url }&description=${ jsonName ? jsonName : jsonSummary ? jsonSummary : '' }`;

		return (
			<div className={ RecipeCardClassName } id={ id }>
				{
					hasImage &&
						<div className="recipe-card-image">
							<figure>
								<img src={ image.url } id={ image.id } alt={ jsonName ? jsonName : wpzoomRecipeCard.post_title }/>
								<figcaption>
									<div className={ PinterestClasses }>
					                    <a className="btn-pinit-link no-print" data-pin-do="buttonPin" href={ pinitURL } data-pin-custom="true">
					                    	<i className="fa fa-pinterest-p icon-pinit-link"></i>
					                    	<span>{ __( "Pin", "wpzoom-recipe-card" ) }</span>
					                    </a>
					                </div>
									<div className={ PrintClasses }>
					                    <a className="btn-print-link no-print" href={ "#" + id } title={ __( "Print directions...", "wpzoom-recipe-card" ) } style={ printStyles }>
					                    	<i className="fa fa-print icon-print-link"></i>
					                        <span>{ __( "Print", "wpzoom-recipe-card" ) }</span>
					                    </a>
					                </div>
					            </figcaption>
							</figure>
						</div>
				}
				<div className="recipe-card-heading">
					<RichText.Content
						className="recipe-card-title"
						tagName="h1"
						value={ jsonName ? recipeTitle : wpzoomRecipeCard.post_title }
					/>
					{ settings[0]['displayAuthor'] && <span className="recipe-card-author">{ `${ __( "Recipe by", "wpzoom-recipe-card" ) } ${ settings[0]['custom_author_name'] }` }</span> }
					{ settings[0]['displayCourse'] && <span className="recipe-card-course">{ __( "Course:", "wpzoom-recipe-card" ) } <mark>{ course }</mark></span> }
					{ settings[0]['displayCuisine'] && <span className="recipe-card-cuisine">{ __( "Cuisine:", "wpzoom-recipe-card" ) } <mark>{ cuisine }</mark></span> }
					{ settings[0]['displayDifficulty'] && <span className="recipe-card-difficulty">{ __( "Difficulty:", "wpzoom-recipe-card" ) } <mark>{ difficulty }</mark></span> }
				</div>
				<Detail.Content { ...props } />
				<RichText.Content
					className="recipe-card-summary"
					tagName="p"
					value={ summary }
				/>
				<Ingredient.Content { ...props } />
				<Direction.Content { ...props } />
			</div>
		);
	}

	render() {
		const { attributes, setAttributes, className, clientId } = this.props;
		const {
			id,
			style,
			recipeTitle,
			jsonName,
			summary,
			jsonSummary,
			course,
			cuisine,
			difficulty,
			hasImage,
			image,
			settings
		} = attributes;

		const printStyles = { 'background-color': `${ settings[0]['primary_color'] }` };

		this.setVideoAttributes();
		this.setActiveBlockStyle( className );

		const RecipeCardClassName = [ className, settings[0]['additionalClasses'] ].filter( ( item ) => item ).join( " " );
		const PrintClasses = [ "wpzoom-recipe-card-print-link", settings[0]['print_btn'] ].filter( ( item ) => item ).join( " " );
		const PinterestClasses = [ "wpzoom-recipe-card-pinit", settings[0]['pin_btn'] ].filter( ( item ) => item ).join( " " );
		const pinitURL = `https://www.pinterest.com/pin/create/button/?url=${ wpzoomRecipeCard.post_permalink }/&media=${ hasImage ? image.url : wpzoomRecipeCard.post_thumbnail_url }&description=${ jsonName ? jsonName : jsonSummary ? jsonSummary : '' }`;

		return (
			<div className={ RecipeCardClassName } id={ id }>
				{
					! hasImage ?
						<Placeholder
							icon="format-image"
							className="recipe-card-image-placeholder"
							label={ __( "Recipe Image", "wpzoom-recipe-card" ) }
							instructions={ __( "Select an image file from your library.", "wpzoom-recipe-card" ) }
							children={
					        	<MediaUpload
					        		onSelect={ media => setAttributes( { hasImage: 'true', image: { id: media.id, url: media.url } } ) }
					        		allowedTypes={ [ 'image' ] }
					        		value={ hasImage ? image.id : '' }
					        		render={ ( { open } ) => (
					        			<Button
					        				onClick={ open }
					        				isButton="true"
					        				isDefault="true"
					        				isLarge="true"
					        			>
				        					{ __( "Upload Image", "wpzoom-recipe-card" ) }
					        			</Button>
					        		) }
					        	/>
							}
						/>
					:
			        	<MediaUpload
			        		onSelect={ media => setAttributes( { hasImage: 'true', image: { id: media.id, url: media.url } } ) }
			        		allowedTypes={ [ 'image' ] }
			        		value={ hasImage ? image.id : '' }
			        		render={ ( { open } ) => (
			        			<Button
			        				className="recipe-card-image-preview"
			        				onClick={ open }
			        			>
        							<div className="recipe-card-image">
        								<figure>
        									<img src={ image.url } id={ image.id } alt={ jsonName ? jsonName : wpzoomRecipeCard.post_title }/>
        									<figcaption>
												<div className={ PinterestClasses }>
								                    <a className="btn-pinit-link no-print" data-pin-do="buttonPin" href={ pinitURL } data-pin-custom="true">
								                    	<i className="fa fa-pinterest-p icon-pinit-link"></i>
								                    	<span>{ __( "Pin", "wpzoom-recipe-card" ) }</span>
								                    </a>
								                </div>
        										<div className={ PrintClasses }>
        						                    <a className="btn-print-link no-print" href={ "#" + id } title={ __( "Print directions...", "wpzoom-recipe-card" ) } style={ printStyles }>
        					                        	<i className="fa fa-print icon-print-link"></i>
        					                            <span>{ __( "Print", "wpzoom-recipe-card" ) }</span>
        						                    </a>
        						                </div>
        						            </figcaption>
        								</figure>
        							</div>
			        			</Button>
			        		) }
			        	/>
						
				}
				<div className="recipe-card-heading">
					<RichText
						className="recipe-card-title"
						tagName="h1"
						value={ jsonName ? recipeTitle : wpzoomRecipeCard.post_title }
						onChange={ newTitle => setAttributes( { recipeTitle: newTitle, jsonName: stripHTML( renderToString( newTitle ) ) } ) }
						placeholder={ __( "Enter the title of your Recipe Card.", "wpzoom-recipe-card" ) }
					/>
					{ settings[0]['displayAuthor'] && <span className="recipe-card-author">{ `${ __( "Recipe by", "wpzoom-recipe-card" ) } ${ settings[0]['custom_author_name'] }` }</span> }
					{ settings[0]['displayCourse'] && <span className="recipe-card-course">{ __( "Course:", "wpzoom-recipe-card" ) } <mark>{ course ? course : __( "Not added", "wpzoom-recipe-card" ) }</mark></span> }
					{ settings[0]['displayCuisine'] && <span className="recipe-card-cuisine">{ __( "Cuisine:", "wpzoom-recipe-card" ) } <mark>{ cuisine ? cuisine : __( "Not added", "wpzoom-recipe-card" ) }</mark></span> }
					{ settings[0]['displayDifficulty'] && <span className="recipe-card-difficulty">{ __( "Difficulty:", "wpzoom-recipe-card" ) } <mark>{ difficulty ? difficulty : __( "Not added", "wpzoom-recipe-card" ) }</mark></span> }
				</div>
				<Detail { ...{ attributes, setAttributes, className } } />
				<RichText
					className="recipe-card-summary"
					tagName="p"
					value={ summary }
					onChange={ newSummary => setAttributes( { summary: newSummary, jsonSummary: stripHTML( renderToString( newSummary ) ) } ) }
					placeholder={ __( "Enter description / summary about your recipe.", "wpzoom-recipe-card" ) }
				/>
				<Ingredient { ...{ attributes, setAttributes, className } } />
				<Direction { ...{ attributes, setAttributes, className } } />
				<Inspector { ...{ attributes, setAttributes, className , clientId } } />
			</div>
		);
	}

}