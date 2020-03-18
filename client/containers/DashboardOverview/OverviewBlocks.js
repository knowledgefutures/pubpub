import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'components';

require('./overviewBlocks.scss');

const propTypes = {
	pubs: PropTypes.array.isRequired,
};

const OverviewBlocks = (props) => {
	const { pubs } = props;

	const countItems = (type) => {
		if (type === 'pubs') {
			return pubs.length;
		}
		return pubs.reduce((count, pub) => {
			return count + pub[type].length;
		}, 0);
	};
	const types = [
		{ type: 'pubs', icon: 'pubDoc' },
		{ type: 'discussions', icon: 'chat' },
		{ type: 'forks', icon: 'git-branch' },
		{ type: 'reviews', icon: 'social-media' },
	];
	return (
		<div className="overview-blocks-component">
			{types.map((item) => {
				return (
					<div className="overview-block" key={item.type}>
						<Icon icon={item.icon} iconSize={18} />
						<div className="text">
							<span className="count">{countItems(item.type)}</span> {item.type}
						</div>
					</div>
				);
			})}
		</div>
	);
};

OverviewBlocks.propTypes = propTypes;
export default OverviewBlocks;
