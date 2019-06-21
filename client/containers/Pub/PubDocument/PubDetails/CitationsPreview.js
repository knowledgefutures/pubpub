import React, { useState, useRef } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';

import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

import CitationsModal from './CitationsModal';

require('./citationsPreview.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const CitationsPreview = (props) => {
	const { pubData } = props;
	const [isCitationModalOpen, setCitationModalOpen] = useState(false);
	const copyableCitationRef = useRef();

	return (
		<div className="citations-preview-component">
			<h6>Cite as</h6>
			<div
				className="citation-body"
				ref={copyableCitationRef}
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
				<Button icon="more" minimal onClick={() => setCitationModalOpen(true)}>
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
export default CitationsPreview;
