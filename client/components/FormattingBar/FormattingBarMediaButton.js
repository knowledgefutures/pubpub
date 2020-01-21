import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Overlay } from 'components';

import FormattingBarButton from './FormattingBarButton';
import Media from './media/Media';

const propTypes = {
	editorChangeObject: PropTypes.shape({
		insertFunctions: PropTypes.object,
	}).isRequired,
	isIndicated: PropTypes.bool.isRequired,
	isSmall: PropTypes.bool.isRequired,
	isOpen: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

const FormattingBarMediaButton = React.forwardRef((props, ref) => {
	const { editorChangeObject, isSmall, onClick, isIndicated, isOpen, ...restProps } = props;
	const [isModalOpen, setModalOpen] = useState(false);

	const handleInsert = (insertType, insertData) => {
		const { insertFunctions } = editorChangeObject;
		if (insertFunctions) {
			insertFunctions[insertType](insertData);
		}
		setModalOpen(false);
	};
	return (
		<>
			<Overlay isOpen={isModalOpen} onClose={() => setModalOpen(false)} maxWidth={750}>
				<Media
					editorChangeObject={editorChangeObject}
					onInsert={handleInsert}
					isSmall={isSmall}
				/>
			</Overlay>
			<div className="separator" />
			<FormattingBarButton
				{...restProps}
				ref={ref}
				isIndicated={isIndicated}
				isOpen={isOpen}
				isSmall={isSmall}
				label="Media"
				onClick={isIndicated || isOpen ? onClick : () => setModalOpen(true)}
			/>
		</>
	);
});

FormattingBarMediaButton.propTypes = propTypes;
export default FormattingBarMediaButton;
