import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';
import CitationsModal from './CitationsModal';

require('./citationsPreview.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	showHeader: PropTypes.bool,
};

const defaultProps = {
	showHeader: true,
};

const CitationsPreview = (props) => {
	const { pubData, showHeader } = props;
	const [isCitationModalOpen, setCitationModalOpen] = useState(false);
	const copyableCitationRef = useRef();

	return (
		<div className="citations-preview-component">
			{showHeader && <h6 className="pub-header-themed-secondary">Cite as</h6>}
			<div
				className="citation-body"
				ref={copyableCitationRef}
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					__html: pubData.citationData.pub.apa,
				}}
			/>
			<ButtonGroup>
				<ClickToCopyButton
					className="copy-button"
					icon="duplicate"
					copyString={() => {
						if (copyableCitationRef.current) {
							return copyableCitationRef.current.textContent;
						}
						return '';
					}}
				>
					Copy
				</ClickToCopyButton>
				<Button
					className="more-cite-options-button"
					icon="more"
					minimal
					onClick={() => setCitationModalOpen(true)}
				>
					More Cite Options
				</Button>
			</ButtonGroup>
			<CitationsModal
				isOpen={isCitationModalOpen}
				citationData={pubData.citationData}
				onClose={() => setCitationModalOpen(false)}
			/>
		</div>
	);
};

CitationsPreview.propTypes = propTypes;
CitationsPreview.defaultProps = defaultProps;
export default CitationsPreview;
