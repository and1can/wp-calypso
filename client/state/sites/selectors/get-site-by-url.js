import { urlToSlug } from 'calypso/lib/url';
import getSiteBySlug from './get-site-by-slug';

/**
 * Returns a site object by its URL.
 *
 * @param  {Object}  state Global state tree
 * @param  {string}  url   Site URL
 * @returns {?Object}       Site object
 */
export default function getSiteByUrl( state, url ) {
	const slug = urlToSlug( url );

	return getSiteBySlug( state, slug );
}
