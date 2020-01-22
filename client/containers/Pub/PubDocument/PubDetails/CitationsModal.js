/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { Classes, Dialog } from '@blueprintjs/core';

require('./citationsModal.scss');

const propTypes = {
	citationData: PropTypes.shape({
		pub: PropTypes.shape({
			apa: PropTypes.string,
			harvard: PropTypes.string,
			vancouver: PropTypes.string,
			bibtex: PropTypes.string,
		}),
	}).isRequired,
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

const CitationsModal = (props) => {
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
						dangerouslySetInnerHTML={{ __html: citationData.pub.apa }}
					/>
				</div>
				<div className="style-wrapper">
					<div className="style-title">Harvard</div>
					<div
						className="style-content"
						dangerouslySetInnerHTML={{ __html: citationData.pub.harvard }}
					/>
				</div>
				<div className="style-wrapper">
					<div className="style-title">Vancouver</div>
					<div
						className="style-content"
						dangerouslySetInnerHTML={{ __html: citationData.pub.vancouver }}
					/>
				</div>
				<div className="style-wrapper">
					<div className="style-title">Bibtex</div>
					<div
						className="style-content bibtex"
						dangerouslySetInnerHTML={{ __html: citationData.pub.bibtex }}
					/>
				</div>
			</div>
		</Dialog>
	);
};

CitationsModal.propTypes = propTypes;
export default CitationsModal;
