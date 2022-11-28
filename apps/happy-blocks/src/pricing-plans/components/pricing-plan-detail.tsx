import { recordTracksEvent } from '@automattic/calypso-analytics';
import { BlockSaveProps } from '@wordpress/blocks';
import { FunctionComponent } from 'react';
import { BlockPlan } from '../hooks/pricing-plans';
import { BlockAttributes } from '../types';
import BillingButton from './billing-button';
import BillingInfo from './billing-info';
import BillingOptions from './billing-options';

interface Props {
	plan: BlockPlan;
	plans: BlockPlan[];
	setPlan: ( productSlug?: string ) => void;
}

const PricingPlanDetail: FunctionComponent< BlockSaveProps< BlockAttributes > & Props > = ( {
	plan,
	plans,
	attributes,
	setPlan,
} ) => {
	const onCtaClick = () => {
		recordTracksEvent( 'calypso_happyblocks_upgrade_plan_click', {
			plan: plan.productSlug,
			domain: attributes.domain,
		} );
	};

	return (
		<section className="hb-pricing-plans-embed__detail">
			<div>
				<BillingInfo plan={ plan } />
				<BillingOptions plans={ plans } value={ attributes.productSlug } onChange={ setPlan } />
			</div>
			<BillingButton
				onClick={ onCtaClick }
				href={ `https://wordpress.com/checkout/${ attributes.domain }/${ plan.pathSlug }` }
			>
				{ plan.upgradeLabel }
			</BillingButton>
		</section>
	);
};
export default PricingPlanDetail;