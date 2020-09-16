import React, { useState, useRef } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'types/pub' or its correspondin... Remove this comment to see the full error message
import { pubDataProps } from 'types/pub';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';
import CitationsModal from './CitationsModal';

require('./citationsPreview.scss');

type OwnProps = {
	pubData: pubDataProps;
	showHeader?: boolean;
};

const defaultProps = {
	showHeader: true,
};

type Props = OwnProps & typeof defaultProps;

const CitationsPreview = (props: Props) => {
	const { pubData, showHeader } = props;
	const [isCitationModalOpen, setCitationModalOpen] = useState(false);
	const copyableCitationRef = useRef();

	return (
		<div className="citations-preview-component">
			{showHeader && <h6 className="pub-header-themed-secondary">Cite as</h6>}
			<div
				className="citation-body"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'HTMLDi... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
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
CitationsPreview.defaultProps = defaultProps;
export default CitationsPreview;
