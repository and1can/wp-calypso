import { Gridicon } from '@automattic/components';
import { SubscriptionManager } from '@automattic/data-stores';
import { useTranslate } from 'i18n-calypso';
import { useMemo } from 'react';
import TimeSince from 'calypso/components/time-since';
import { SiteSettings } from '../settings-popover';
import type {
	SiteSubscription,
	SiteSubscriptionDeliveryFrequency,
} from '@automattic/data-stores/src/reader/types';

const useDeliveryFrequencyLabel = ( deliveryFrequencyValue: SiteSubscriptionDeliveryFrequency ) => {
	const translate = useTranslate();

	const deliveryFrequencyLabels = useMemo(
		() => ( {
			daily: translate( 'Daily' ),
			weekly: translate( 'Weekly' ),
			instantly: translate( 'Instantly' ),
		} ),
		[ translate ]
	);

	return deliveryFrequencyLabels[ deliveryFrequencyValue ] || translate( 'Paused' );
};

export default function SiteRow( {
	blog_ID,
	name,
	site_icon,
	URL: url,
	date_subscribed,
	delivery_methods,
}: SiteSubscription ) {
	const hostname = useMemo( () => new URL( url ).hostname, [ url ] );
	const siteIcon = useMemo( () => {
		if ( site_icon ) {
			return <img className="icon" src={ site_icon } alt={ name } />;
		}
		return <Gridicon className="icon" icon="globe" size={ 48 } />;
	}, [ site_icon, name ] );
	const { isLoggedIn } = SubscriptionManager.useIsLoggedIn();
	const translate = useTranslate();

	const notifyMeOfNewPosts = useMemo(
		() => delivery_methods?.notification?.send_posts,
		[ delivery_methods?.notification?.send_posts ]
	);

	const emailMeNewPosts = useMemo(
		() => delivery_methods?.email?.send_posts,
		[ delivery_methods?.email?.send_posts ]
	);

	const deliveryFrequencyValue = useMemo(
		() => delivery_methods?.email?.post_delivery_frequency as SiteSubscriptionDeliveryFrequency,
		[ delivery_methods?.email?.post_delivery_frequency ]
	);

	const emailMeNewComments = useMemo(
		() => delivery_methods?.email?.send_comments,
		[ delivery_methods?.email?.send_comments ]
	);

	const newPostDelivery = useMemo( () => {
		const emailDelivery = delivery_methods?.email?.send_posts ? translate( 'Email' ) : null;
		const notificationDelivery = delivery_methods?.notification?.send_posts
			? translate( 'Notifications' )
			: null;
		return [ emailDelivery, notificationDelivery ].filter( Boolean ).join( ', ' );
	}, [ delivery_methods?.email?.send_posts, delivery_methods?.notification?.send_posts ] );
	const newCommentDelivery = useMemo(
		() => delivery_methods?.email?.send_comments,
		[ delivery_methods?.email?.send_comments ]
	);
	const deliveryFrequencyLabel = useDeliveryFrequencyLabel( deliveryFrequencyValue );

	const { mutate: updateNotifyMeOfNewPosts, isLoading: updatingNotifyMeOfNewPosts } =
		SubscriptionManager.useSiteNotifyMeOfNewPostsMutation();
	const { mutate: updateEmailMeNewPosts, isLoading: updatingEmailMeNewPosts } =
		SubscriptionManager.useSiteEmailMeNewPostsMutation();
	const { mutate: updateDeliveryFrequency, isLoading: updatingFrequency } =
		SubscriptionManager.useSiteDeliveryFrequencyMutation();
	const { mutate: updateEmailMeNewComments, isLoading: updatingEmailMeNewComments } =
		SubscriptionManager.useSiteEmailMeNewCommentsMutation();
	const { mutate: unsubscribe, isLoading: unsubscribing } =
		SubscriptionManager.useSiteUnsubscribeMutation();

	return (
		<li className="row" role="row">
			<a href={ url } rel="noreferrer noopener" className="title-box" target="_blank">
				<span className="title-box" role="cell">
					{ siteIcon }
					<span className="title-column">
						<span className="name">{ name }</span>
						<span className="url">{ hostname }</span>
					</span>
				</span>
			</a>
			<span className="date" role="cell">
				<TimeSince
					date={
						( date_subscribed.valueOf() ? date_subscribed : new Date( 0 ) ).toISOString?.() ??
						date_subscribed
					}
				/>
			</span>
			{ isLoggedIn && (
				<span className="new-posts" role="cell">
					{ newPostDelivery }
				</span>
			) }
			{ isLoggedIn && (
				<span className="new-comments" role="cell">
					{ newCommentDelivery ? (
						<Gridicon icon="checkmark" size={ 16 } className="green" />
					) : (
						<Gridicon icon="cross" size={ 16 } className="red" />
					) }
				</span>
			) }
			<span className="email-frequency" role="cell">
				{ deliveryFrequencyLabel }
			</span>
			<span className="actions" role="cell">
				<SiteSettings
					notifyMeOfNewPosts={ notifyMeOfNewPosts }
					onNotifyMeOfNewPostsChange={ ( send_posts ) =>
						updateNotifyMeOfNewPosts( { blog_id: blog_ID, send_posts } )
					}
					updatingNotifyMeOfNewPosts={ updatingNotifyMeOfNewPosts }
					emailMeNewPosts={ emailMeNewPosts }
					updatingEmailMeNewPosts={ updatingEmailMeNewPosts }
					onEmailMeNewPostsChange={ ( send_posts ) =>
						updateEmailMeNewPosts( { blog_id: blog_ID, send_posts } )
					}
					deliveryFrequency={ deliveryFrequencyValue }
					onDeliveryFrequencyChange={ ( delivery_frequency ) =>
						updateDeliveryFrequency( { blog_id: blog_ID, delivery_frequency } )
					}
					updatingFrequency={ updatingFrequency }
					emailMeNewComments={ emailMeNewComments }
					onEmailMeNewCommentsChange={ ( send_comments ) =>
						updateEmailMeNewComments( { blog_id: blog_ID, send_comments } )
					}
					updatingEmailMeNewComments={ updatingEmailMeNewComments }
					onUnsubscribe={ () => unsubscribe( { blog_id: blog_ID, url: url } ) }
					unsubscribing={ unsubscribing }
				/>
			</span>
		</li>
	);
}
