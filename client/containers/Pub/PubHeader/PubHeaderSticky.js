import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';

import PubToc from './PubToc';

require('./pubHeaderSticky.scss');

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string,
	}).isRequired,
	pubHeadings: PropTypes.array.isRequired,
};

const PubHeaderSticky = (props) => {
	const { pubData, pubHeadings } = props;
	return (
		<div className="pub-header-sticky-component">
			<div className="sticky-title">{pubData.title}</div>
			<div className="sticky-buttons">
				{pubHeadings.length > 0 && (
					<React.Fragment>
						<PubToc headings={pubHeadings}>
							{({ ref, ...disclosureProps }) => (
								<Button minimal={true} {...disclosureProps} elementRef={ref}>
									Contents
								</Button>
							)}
						</PubToc>
						<span className="dot">·</span>
					</React.Fragment>
				)}
				<Button
					minimal={true}
					onClick={() => window.scrollTo({ left: 0, top: 0, behavior: 'auto' })}
					icon={<Icon icon="double-chevron-up" />}
				/>
			</div>
		</div>
	);
};

PubHeaderSticky.propTypes = propTypes;
export default PubHeaderSticky;
