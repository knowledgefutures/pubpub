import React from 'react';

import { Button } from '@blueprintjs/core';

import { Icon } from 'components';

import { usePubContext } from '../pubHooks';
import PubToc from './PubToc';

import './pubHeaderSticky.scss';

const PubHeaderSticky = () => {
	const { pubData } = usePubContext();

	return (
		<div className="pub-header-sticky-component">
			<div className="sticky-title">{pubData.title}</div>
			<div className="sticky-buttons">
				<PubToc limitHeight>
					{({ ref, ...disclosureProps }) => (
						<>
							<Button
								minimal={true}
								{...disclosureProps}
								elementRef={ref as any}
								className="contents-button"
							>
								Contents
							</Button>
							<span className="dot">·</span>
						</>
					)}
				</PubToc>
				<Button
					minimal={true}
					onClick={() => window.scrollTo({ left: 0, top: 0, behavior: 'auto' })}
					icon={<Icon icon="double-chevron-up" />}
				/>
			</div>
		</div>
	);
};
export default PubHeaderSticky;
