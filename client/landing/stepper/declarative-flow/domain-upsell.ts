import { useSelect } from '@wordpress/data';
import { translate } from 'i18n-calypso';
import { OnboardSelect } from 'calypso/../packages/data-stores/src';
import {
	addPlanToCart,
	addProductsToCart,
	DOMAIN_UPSELL_FLOW,
} from 'calypso/../packages/onboarding/src';
import { useQuery } from '../hooks/use-query';
import { useSiteSlug } from '../hooks/use-site-slug';
import { ONBOARD_STORE } from '../stores';
import DomainsStep from './internals/steps-repository/domains';
import PlansStep from './internals/steps-repository/plans';
import { ProvidedDependencies } from './internals/types';
import type { Flow } from './internals/types';

const domainUpsell: Flow = {
	name: DOMAIN_UPSELL_FLOW,
	get title() {
		return translate( 'Domain Upsell' );
	},

	useSteps() {
		return [
			{ slug: 'domains', component: DomainsStep },
			{ slug: 'plans', component: PlansStep },
		];
	},

	useStepNavigation( currentStep, navigate ) {
		const flowName = useQuery().get( 'flowToReturnTo' );
		const siteSlug = useSiteSlug();
		const { getDomainCartItem, getPlanCartItem } = useSelect(
			( select ) => ( {
				getDomainCartItem: ( select( ONBOARD_STORE ) as OnboardSelect ).getDomainCartItem,
				getPlanCartItem: ( select( ONBOARD_STORE ) as OnboardSelect ).getPlanCartItem,
			} ),
			[]
		);
		const returnUrl = `/setup/${ flowName }/launchpad?siteSlug=${ siteSlug }`;
		const encodedReturnUrl = encodeURIComponent( returnUrl );

		async function submit( providedDependencies: ProvidedDependencies = {} ) {
			switch ( currentStep ) {
				case 'domains':
					if ( providedDependencies?.deferDomainSelection ) {
						return window.location.assign( returnUrl );
					}
					navigate( 'plans' );

				case 'plans':
					if ( providedDependencies?.goToCheckout ) {
						const planCartItem = getPlanCartItem();
						const domainCartItem = getDomainCartItem();
						if ( planCartItem ) {
							await addPlanToCart( siteSlug as string, flowName as string, true, '', planCartItem );
						}

						if ( domainCartItem ) {
							await addProductsToCart( siteSlug as string, flowName as string, [ domainCartItem ] );
						}

						return window.location.assign(
							`/checkout/${ encodeURIComponent(
								( siteSlug as string ) ?? ''
							) }?redirect_to=${ encodedReturnUrl }`
						);
					}
			}
		}

		return { submit };
	},
};

export default domainUpsell;
