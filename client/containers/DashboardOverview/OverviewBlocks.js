import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'components';

require('./overviewBlocks.scss');

const propTypes = {
	pubs: PropTypes.array.isRequired,
	collections: PropTypes.array,
};

const defaultProps = {
	collections: undefined,
};

const OverviewBlocks = (props) => {
	const { pubs, collections } = props;

	const countItems = (type) => {
		if (type === 'pubs') {
			return pubs.length;
		}
		if (type === 'collections') {
			return collections.length;
		}
		return pubs.reduce((count, pub) => {
			return count + pub[type].length;
		}, 0);
	};
	const types = [
		{ type: 'collections', icon: 'collection' },
		{ type: 'pubs', icon: 'pubDoc' },
		{ type: 'discussions', icon: 'chat' },
		{ type: 'forks', icon: 'git-branch' },
		{ type: 'reviews', icon: 'social-media' },
	];
	return (
		<div className="overview-blocks-component">
			{types
				.filter((item) => {
					return item.type !== 'collections' || collections;
				})
				.map((item, index) => {
					return (
						<React.Fragment>
							{index > 0 && <div className="blip">•</div>}
							<div className="overview-block" key={item.type}>
								<Icon icon={item.icon} iconSize={18} />
								<div className="text">
									<span className="count">{countItems(item.type)}</span>{' '}
									{item.type}
								</div>
							</div>
						</React.Fragment>
					);
				})}
		</div>
	);
};

OverviewBlocks.propTypes = propTypes;
export default OverviewBlocks;
