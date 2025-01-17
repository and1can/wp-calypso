// Copied from https://github.com/Automattic/wp-calypso/blob/6755acc862c0387b7061e13f99fd22c5dd22e458/packages/create-calypso-config/src/test/index.js
// This makes sure our implementation is compatible with the original one.
import createConfig from '../create-odyssey-config';

describe( 'index', () => {
	describe( 'config without data', () => {
		const config = createConfig( {} );

		test( 'has to return false when the feature flags are not specified', () => {
			const result = config.isEnabled( 'flagA' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'config with data', () => {
		const config = createConfig( {
			keyA: 'value',
			features: {
				flagA: false,
				flagB: false,
				flagC: true,
			},
		} );

		test( 'has to return value of the provided key', () => {
			const result = config( 'keyA' );

			expect( result ).toEqual( 'value' );
		} );

		test( 'has to return false when the provided feature flag is disabled', () => {
			const result = config.isEnabled( 'flagA' );

			expect( result ).toBe( false );
		} );

		test( 'has to return false when the provided feature flag is enabled', () => {
			const result = config.isEnabled( 'flagC' );

			expect( result ).toBe( true );
		} );

		describe( 'error cases', () => {
			const NODE_ENV = process.env.NODE_ENV;
			const fakeKey = 'where did all the errors go?';

			afterEach( () => ( process.env.NODE_ENV = NODE_ENV ) );

			test( "should throw an error when given key doesn't exist (NODE_ENV == development)", () => {
				process.env.NODE_ENV = 'development';

				expect( () => config( fakeKey ) ).toThrowError( ReferenceError );
			} );

			test( "should not throw an error when given key doesn't exist (NODE_ENV != development)", () => {
				const envs = [ 'client', 'desktop', 'horizon', 'production', 'stage', 'test', 'wpcalypso' ];

				envs.forEach( ( env ) => {
					process.env.NODE_ENV = env;

					expect( process.env.NODE_ENV ).toEqual( env );
					expect( () => config( fakeKey ) ).not.toThrow( Error );
				} );
			} );
		} );
	} );

	describe( 'config utilities', () => {
		let config;

		beforeEach( () => {
			config = createConfig( {
				features: {
					flagA: false,
					flagB: false,
					flagC: true,
				},
			} );
		} );

		afterEach( () => {
			config = null;
		} );

		describe( 'isEnabled', () => {
			test( 'it correctly reports status of features', () => {
				expect( config.isEnabled( 'flagA' ) ).toBe( false );
				expect( config.isEnabled( 'flagC' ) ).toBe( true );
			} );

			test( 'it defaults to "false" when feature is not defined', () => {
				expect( config.isEnabled( 'flagXYZ' ) ).toBe( false );
			} );
		} );

		describe( 'enable', () => {
			test( 'it can enable features which are not yet set', () => {
				config.enable( 'flagD' );
				config.enable( 'flagE' );
				expect( config.isEnabled( 'flagD' ) ).toBe( true );
				expect( config.isEnabled( 'flagE' ) ).toBe( true );
			} );

			test( 'it can toggle existing features to enable them', () => {
				config.enable( 'flagA' );
				expect( config.isEnabled( 'flagA' ) ).toBe( true );
			} );
		} );

		describe( 'disable', () => {
			test( 'it can toggle existing features to disable them', () => {
				config.disable( 'flagC' );
				expect( config.isEnabled( 'flagC' ) ).toBe( false );
			} );

			test( 'it retains existing disable setting for features that are already disabled', () => {
				config.disable( 'flagA' );
				expect( config.isEnabled( 'flagA' ) ).toBe( false );
			} );

			test( 'it will handle setting new features to a initial disabled state', () => {
				config.disable( 'flagZXY' );
				expect( config.isEnabled( 'flagZXY' ) ).toBe( false );
			} );
		} );
	} );
} );
