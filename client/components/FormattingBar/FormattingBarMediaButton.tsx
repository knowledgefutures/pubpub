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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'editorChangeObject' does not exist on ty... Remove this comment to see the full error message
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
				// @ts-expect-error ts-migrate(2322) FIXME: Property 'isIndicated' does not exist on type 'Int... Remove this comment to see the full error message
				isIndicated={isIndicated}
				isOpen={isOpen}
				isSmall={isSmall}
				label="Media"
				onClick={isIndicated || isOpen ? onClick : () => setModalOpen(true)}
			/>
		</>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ editorChangeObject: Validator<InferProps<{... Remove this comment to see the full error message
FormattingBarMediaButton.propTypes = propTypes;
export default FormattingBarMediaButton;
