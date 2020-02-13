import React from 'react';
import PropTypes from 'prop-types';
import { getJSON } from '@pubpub/editor';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';

import { getTocHeadings } from './headerUtils';
import PubToc from './PubToc';

require('./pubHeaderSticky.scss');

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string,
	}).isRequired,
	collabData: PropTypes.shape({
		editorChangeObject: PropTypes.shape({
			view: PropTypes.object,
		}),
	}).isRequired,
};

const getPubHeadings = (pubData, collabData) => {
	let docJson = pubData.initialDoc;
	if (collabData.editorChangeObject && collabData.editorChangeObject.view) {
		docJson = getJSON(collabData.editorChangeObject.view);
	}
	return docJson ? getTocHeadings(docJson) : [];
};

const PubHeaderSticky = (props) => {
	const { pubData, collabData } = props;
	const headings = getPubHeadings(pubData, collabData);
	return (
		<div className="pub-header-sticky-component">
			<div className="sticky-title">{pubData.title}</div>
			<div className="sticky-buttons">
				{headings.length > 0 && (
					<React.Fragment>
						<PubToc pubData={pubData} headings={headings}>
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
