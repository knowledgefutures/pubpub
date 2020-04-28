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
		{ type: 'reviews', icon: 'social-media' },
	];
	return (
		<div className="overview-blocks-component">
			{types
				.filter((item) => {
					return item.type !== 'collections' || collections;
				})
				.map((item, index) => {
					const itemCount = countItems(item.type);
					const itemName =
						itemCount === 1 ? item.type.slice(0, item.type.length - 1) : item.type;
					return (
						<React.Fragment key={item.type}>
							{index > 0 && <div className="blip">•</div>}
							<div className="overview-block">
								<Icon icon={item.icon} iconSize={18} />
								<div className="text">
									<span className="count">{itemCount}</span> {itemName}
								</div>
							</div>
						</React.Fragment>
					);
				})}
		</div>
	);
};

OverviewBlocks.propTypes = propTypes;
OverviewBlocks.defaultProps = defaultProps;
export default OverviewBlocks;
