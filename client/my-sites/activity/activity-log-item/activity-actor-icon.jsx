/** @format */
/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Gridicon from 'gridicons';

export default class ActivityActorIcon extends PureComponent {
	static propTypes = {
		icon: PropTypes.string.isRequired,
	};

	render() {
		const { icon } = this.props;

		return (
			<div className="activity-log-item__activity-actor-icon">
				<Gridicon icon={ icon } size={ 24 } />
			</div>
		);
	}
}
