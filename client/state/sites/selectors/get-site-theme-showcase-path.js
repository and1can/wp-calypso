import getRawSite from 'calypso/state/selectors/get-raw-site';
import getSiteOption from './get-site-option';
import getSiteSlug from './get-site-slug';

/**
 * Returns a site's theme showcase path.
 *
 * @param  {Object}  state  Global state tree
 * @param  {number}  siteId SiteId
 * @returns {?string}        Theme showcase path
 */
export default function getSiteThemeShowcasePath( state, siteId ) {
	const site = getRawSite( state, siteId );
	if ( ! site || site.jetpack ) {
		return null;
	}

	const [ type, slug ] = getSiteOption( state, siteId, 'theme_slug' )?.split( '/', 2 ) ?? [];

	// to accomodate a8c and other theme types
	if ( ! [ 'pub', 'premium' ].includes( type ) ) {
		return null;
	}

	const siteSlug = getSiteSlug( state, siteId );
	return type === 'premium'
		? `/theme/${ slug }/setup/${ siteSlug }`
		: `/theme/${ slug }/${ siteSlug }`;
}
