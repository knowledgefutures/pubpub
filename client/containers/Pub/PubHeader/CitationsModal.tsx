/* eslint-disable react/no-danger */
import React from 'react';
import { Classes, Dialog } from '@blueprintjs/core';

require('./citationsModal.scss');

type Props = {
	citationData: {
		pub?: {
			apa?: string;
			harvard?: string;
			vancouver?: string;
			bibtex?: string;
		};
	};
	isOpen: boolean;
	onClose: (...args: any[]) => any;
};

const CitationsModal = (props: Props) => {
	const { citationData, isOpen, onClose } = props;
	return (
		<Dialog
			className="citations-modal-component"
			isOpen={isOpen}
			onClose={onClose}
			title="Cite this pub"
		>
			<div className={Classes.DIALOG_BODY}>
				<div className="style-wrapper">
					<div className="style-title">APA</div>
					<div
						className="style-content"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
						dangerouslySetInnerHTML={{ __html: citationData.pub.apa }}
					/>
				</div>
				<div className="style-wrapper">
					<div className="style-title">Harvard</div>
					<div
						className="style-content"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
						dangerouslySetInnerHTML={{ __html: citationData.pub.harvard }}
					/>
				</div>
				<div className="style-wrapper">
					<div className="style-title">Vancouver</div>
					<div
						className="style-content"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
						dangerouslySetInnerHTML={{ __html: citationData.pub.vancouver }}
					/>
				</div>
				<div className="style-wrapper">
					<div className="style-title">Bibtex</div>
					<div
						className="style-content bibtex"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
						dangerouslySetInnerHTML={{ __html: citationData.pub.bibtex }}
					/>
				</div>
			</div>
		</Dialog>
	);
};
export default CitationsModal;
