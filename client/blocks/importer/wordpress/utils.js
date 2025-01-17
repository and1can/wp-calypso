export const SESSION_STORAGE_IS_MIGRATE_FROM_WP = 'is_migrate_from_wp';

export const storeMigrateSource = () => {
	window.sessionStorage.setItem( SESSION_STORAGE_IS_MIGRATE_FROM_WP, 'true' );
};

export const clearMigrateSource = () => {
	window.sessionStorage.removeItem( SESSION_STORAGE_IS_MIGRATE_FROM_WP );
};

export const retrieveMigrateSource = () => {
	return window.sessionStorage.getItem( SESSION_STORAGE_IS_MIGRATE_FROM_WP );
};
