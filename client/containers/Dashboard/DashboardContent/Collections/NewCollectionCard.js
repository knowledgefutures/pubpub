import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Card, Icon, InputGroup, Overlay, Spinner } from '@blueprintjs/core';
import { Classes as SelectClasses } from '@blueprintjs/select';

require('@blueprintjs/select/src/blueprint-select.scss');

const propTypes = {
	schema: PropTypes.shape({
		bpDisplayIcon: PropTypes.string.isRequired,
		label: {
			singular: PropTypes.string,
		},
	}).isRequired,
	header: PropTypes.string.isRequired,
	description: PropTypes.node.isRequired,
	onCreateCollection: PropTypes.func.isRequired,
};

const NewCollectionCard = ({ schema, description, header, onCreateCollection }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [name, setName] = useState('');
	const {
		bpDisplayIcon,
		label: { singular: collectionLabel },
	} = schema;
	return (
		<React.Fragment>
			<Overlay
				className={classNames('new-collection-card-overlay', SelectClasses.OMNIBAR_OVERLAY)}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				hasBackdrop={true}
				usePortal={true}
			>
				<div className={SelectClasses.OMNIBAR}>
					<InputGroup
						autoFocus={true}
						leftIcon={bpDisplayIcon}
						rightElement={isPending && <Spinner size={16} />}
						placeholder={`Name a new ${collectionLabel}...`}
						large={true}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && name.length > 0) {
								const res = onCreateCollection(name);
								if (typeof res.then === 'function') {
									setIsPending(true);
									res.then(() => {
										setIsOpen(false);
										setIsPending(false);
									});
								} else {
									setIsOpen(false);
								}
							}
						}}
					/>
				</div>
			</Overlay>
			<Card className="top-controls-card" onClick={() => setIsOpen(true)}>
				<h6>
					<Icon icon={bpDisplayIcon} iconSize={20} />
					{header}
				</h6>
				<p>{description}</p>
			</Card>
		</React.Fragment>
	);
};

NewCollectionCard.propTypes = propTypes;
export default NewCollectionCard;
