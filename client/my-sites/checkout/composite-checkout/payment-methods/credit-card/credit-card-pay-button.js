/**
 * External dependencies
 */
import React from 'react';
import debugFactory from 'debug';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@automattic/react-i18n';
import {
	Button,
	FormStatus,
	usePaymentProcessor,
	useTransactionStatus,
	useLineItems,
	useEvents,
	useFormStatus,
	useSelect,
} from '@automattic/composite-checkout';

/**
 * Internal dependencies
 */
import { showStripeModalAuth } from 'calypso/lib/stripe';
import { validatePaymentDetails } from 'calypso/lib/checkout/validation';
import { useCart } from 'calypso/my-sites/checkout/composite-checkout/cart-provider';
import { paymentMethodClassName } from 'calypso/lib/cart-values';

const debug = debugFactory( 'calypso:composite-checkout:credit-card' );

export default function CreditCardPayButton( { disabled, store, stripe, stripeConfiguration } ) {
	const { __ } = useI18n();
	const [ items, total ] = useLineItems();
	const fields = useSelect( ( select ) => select( 'credit-card' ).getFields() );
	const cardholderName = fields.cardholderName;
	const { formStatus } = useFormStatus();
	const {
		setTransactionComplete,
		setTransactionRedirecting,
		setTransactionError,
		setTransactionPending,
	} = useTransactionStatus();
	const submitTransaction = usePaymentProcessor( 'card' );
	const onEvent = useEvents();

	const cart = useCart();
	const contactCountryCode = useSelect(
		( select ) => select( 'wpcom' )?.getContactInfo().countryCode?.value
	);
	const paymentPartner = getPaymentPartner( {
		cart,
		contactCountryCode,
	} );

	return (
		<Button
			disabled={ disabled }
			onClick={ () => {
				if ( isCreditCardFormValid( store, paymentPartner, __ ) ) {
					if ( paymentPartner === 'stripe' ) {
						debug( 'submitting stripe payment' );
						setTransactionPending();
						onEvent( { type: 'STRIPE_TRANSACTION_BEGIN' } );
						submitTransaction( {
							stripe,
							name: cardholderName?.value,
							items,
							total,
							stripeConfiguration,
							paymentPartner,
						} )
							.then( ( stripeResponse ) => {
								// 3DS authentication required
								if ( stripeResponse?.message?.payment_intent_client_secret ) {
									debug( 'showing stripe authentication modal' );
									onEvent( { type: 'SHOW_MODAL_AUTHORIZATION' } );
									return showStripeModalAuth( {
										stripeConfiguration,
										response: stripeResponse,
									} );
								}
								return stripeResponse;
							} )
							.then( ( stripeResponse ) => {
								// Redirect required
								if ( stripeResponse?.redirect_url ) {
									debug( 'stripe transaction requires redirect' );
									setTransactionRedirecting( stripeResponse.redirect_url );
									return;
								}
								// Nothing more required
								debug( 'stripe transaction is successful' );
								setTransactionComplete();
							} )
							.catch( ( error ) => {
								setTransactionError( error.message );
							} );
						return;
					}
					if ( paymentPartner === 'ebanx' ) {
						debug( 'submitting ebanx payment' );
						setTransactionPending();
						onEvent( { type: 'EBANX_TRANSACTION_BEGIN' } );
						submitTransaction( {
							name: cardholderName?.value || '',
							countryCode: fields?.countryCode?.value || '',
							number: fields?.number?.value?.replace( /\s+/g, '' ) || '',
							cvv: fields?.cvv?.value || '',
							'expiration-date': fields[ 'expiration-date' ]?.value || '',
							state: fields?.state?.value || '',
							city: fields?.city?.value || '',
							postalCode: fields[ 'postal-code' ]?.value || '',
							address: fields[ 'address-1' ]?.value || '',
							streetNumber: fields[ 'street-number' ]?.value || '',
							phoneNumber: fields[ 'phone-number' ]?.value || '',
							document: fields?.document?.value || '', // Taxpayer Identification Number
							items,
							total,
							paymentPartner,
						} )
							.then( ( ebanxResponse ) => {
								debug( 'ebanx transaction is successful', ebanxResponse );
								setTransactionComplete();
							} )
							.catch( ( error ) => {
								debug( 'ebanx transaction error', error );
								setTransactionError( error );
							} );
						return;
					}
					throw new Error(
						'Unrecognized payment partner in submit handler: "' + paymentPartner + '"'
					);
				}
			} }
			buttonType="primary"
			isBusy={ FormStatus.SUBMITTING === formStatus }
			fullWidth
		>
			<ButtonContents formStatus={ formStatus } total={ total } />
		</Button>
	);
}

function ButtonContents( { formStatus, total } ) {
	const { __ } = useI18n();
	if ( formStatus === FormStatus.SUBMITTING ) {
		return __( 'Processing…' );
	}
	if ( formStatus === FormStatus.READY ) {
		return sprintf( __( 'Pay %s' ), total.amount.displayValue );
	}
	return __( 'Please wait…' );
}

function getPaymentPartner( { cart, contactCountryCode } ) {
	const isEbanxAvailable = Boolean(
		cart?.allowed_payment_methods?.includes( paymentMethodClassName( 'ebanx' ) )
	);

	let paymentPartner = 'stripe';
	if ( contactCountryCode === 'BR' && isEbanxAvailable ) {
		paymentPartner = 'ebanx';
	}

	debug( 'credit card form selects payment partner: "' + paymentPartner + '"' );
	return paymentPartner;
}

function isCreditCardFormValid( store, paymentPartner, __ ) {
	debug( 'validating credit card fields' );

	switch ( paymentPartner ) {
		case 'stripe': {
			const fields = store.selectors.getFields( store.getState() );
			const cardholderName = fields.cardholderName;
			if ( ! cardholderName?.value.length ) {
				// Touch the field so it displays a validation error
				store.dispatch( store.actions.setFieldValue( 'cardholderName', '' ) );
			}
			const errors = store.selectors.getCardDataErrors( store.getState() );
			const incompleteFieldKeys = store.selectors.getIncompleteFieldKeys( store.getState() );
			const areThereErrors = Object.keys( errors ).some( ( errorKey ) => errors[ errorKey ] );

			if ( incompleteFieldKeys.length > 0 ) {
				// Show "this field is required" for each incomplete field
				incompleteFieldKeys.map( ( key ) =>
					store.dispatch( store.actions.setCardDataError( key, __( 'This field is required' ) ) )
				);
			}
			if ( areThereErrors || ! cardholderName?.value.length || incompleteFieldKeys.length > 0 ) {
				return false;
			}
			return true;
		}

		case 'ebanx': {
			// Touch fields so that we show errors
			store.dispatch( store.actions.touchAllFields() );
			let isValid = true;

			const rawState = store.selectors.getFields( store.getState() );
			const cardholderName = rawState.cardholderName;
			const numberWithoutSpaces = {
				value: rawState?.number?.value?.replace( /\s+/g, '' ),
			}; // the validator package we're using requires this
			const validationResults = validatePaymentDetails(
				Object.entries( {
					...rawState,
					country: rawState.countryCode,
					name: cardholderName,
					number: numberWithoutSpaces,
				} ).reduce( ( accum, [ key, managedValue ] ) => {
					accum[ key ] = managedValue?.value;
					return accum;
				}, {} )
			);
			Object.entries( validationResults.errors ).map( ( [ key, errors ] ) => {
				errors.map( ( error ) => {
					isValid = false;
					store.dispatch( store.actions.setFieldError( key, error ) );
				} );
			} );
			debug( 'ebanx card details validation results: ', validationResults );
			return isValid;
		}

		default: {
			throw new RangeError( 'Unexpected payment partner "' + paymentPartner + '"' );
		}
	}
}
