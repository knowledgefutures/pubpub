/* eslint-disable react/no-danger */
import React from 'react';
import { Classes, Dialog } from '@blueprintjs/core';
import { citationStyles } from 'utils/citations';

require('./citationsModal.scss');

type Props = {
	citationData: {
		pub?: {
			default?: string;
			apa?: string;
			harvard?: string;
			vancouver?: string;
			bibtex?: string;
		};
	};
	citationStyle: string;
	isOpen: boolean;
	onClose: (...args: any[]) => any;
};

const CitationsModal = (props: Props) => {
	const { citationData, citationStyle, isOpen, onClose } = props;
	let defaultCitationName = '';
	citationStyles.forEach((style) => {
		if (style.key === citationStyle) defaultCitationName = style.name;
	});
	return (
		<Dialog
			className="citations-modal-component"
			isOpen={isOpen}
			onClose={onClose}
			title="Cite this pub"
		>
			<div className={Classes.DIALOG_BODY}>
				<div className="style-wrapper">
					<div className="style-title">{defaultCitationName} (Default)</div>
					<div
						className="style-content"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
						dangerouslySetInnerHTML={{ __html: citationData.pub.default }}
					/>
				</div>
				{citationStyle !== 'apa-7' && citationStyle !== 'apa' && (
					<div className="style-wrapper">
						<div className="style-title">APA 7th Edition</div>
						<div
							className="style-content"
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
							dangerouslySetInnerHTML={{ __html: citationData.pub.apa }}
						/>
					</div>
				)}
				{citationStyle !== 'harvard' && (
					<div className="style-wrapper">
						<div className="style-title">Harvard</div>
						<div
							className="style-content"
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
							dangerouslySetInnerHTML={{ __html: citationData.pub.harvard }}
						/>
					</div>
				)}
				{citationStyle !== 'vancouver' && (
					<div className="style-wrapper">
						<div className="style-title">Vancouver</div>
						<div
							className="style-content"
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
							dangerouslySetInnerHTML={{ __html: citationData.pub.vancouver }}
						/>
					</div>
				)}
				<div className="style-wrapper">
					<div className="style-title">Bibtex</div>
					<div
						className="style-content bibtex"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
						dangerouslySetInnerHTML={{ __html: citationData.pub.bibtex }}
					/>
				</div>
			</div>
		</Dialog>
	);
};
export default CitationsModal;
