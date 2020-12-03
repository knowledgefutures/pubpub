import React, { useState, useRef } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
				ref={copyableCitationRef}
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'citationData' does not exist on type 'pu... Remove this comment to see the full error message
					__html: pubData.citationData.pub.default,
				}}
			/>
			<ButtonGroup>
				{/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
				<ClickToCopyButton
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					className="copy-button"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					icon="duplicate"
					// @ts-expect-error ts-migrate(2322) FIXME: Type '() => any' is not assignable to type 'never'... Remove this comment to see the full error message
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
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'citationData' does not exist on type 'pu... Remove this comment to see the full error message
				citationData={pubData.citationData}
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'citationStyle' does not exist on type 'p... Remove this comment to see the full error message
				citationStyle={pubData.citationStyle}
				onClose={() => setCitationModalOpen(false)}
			/>
		</div>
	);
};
CitationsPreview.defaultProps = defaultProps;
export default CitationsPreview;
