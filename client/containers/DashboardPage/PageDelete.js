import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { InputField } from 'components';
import { usePendingChanges } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

const propTypes = {
	communityId: PropTypes.string.isRequired,
	pageData: PropTypes.shape({
		id: PropTypes.string,
		title: PropTypes.string,
	}).isRequired,
};

const PageDelete = (props) => {
	const { pendingPromise } = usePendingChanges();
	const { communityId, pageData } = props;
	const [deleteString, setDeleteString] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = useCallback(() => {
		setIsDeleting(true);
		return pendingPromise(
			apiFetch('/api/pages', {
				method: 'DELETE',
				body: JSON.stringify({
					pageId: pageData.id,
					communityId: communityId,
				}),
			}),
		)
			.then(() => {
				window.location.href = '/dashboard';
			})
			.catch((err) => {
				console.error(err);
				setIsDeleting(false);
			});
	}, [communityId, pageData.id, pendingPromise]);

	return (
		<div className="bp3-callout bp3-intent-danger">
			<h5>Delete Page from Community</h5>
			<p>Deleting a Page is permanent.</p>
			<p>
				This will permanently delete <b>{pageData.title}</b>. This will not delete pubs that
				are included in this page&apos;s layout.
			</p>
			<p>Please type the title of the Page below to confirm your intention.</p>

			<InputField
				label={<b>Confirm Page Title</b>}
				value={deleteString}
				onChange={(evt) => setDeleteString(evt.target.value)}
			/>
			<div className="delete-button-wrapper">
				<Button
					type="button"
					className="bp3-intent-danger"
					text="Delete Page"
					disabled={deleteString !== pageData.title}
					loading={isDeleting}
					onClick={handleDelete}
				/>
			</div>
		</div>
	);
};

PageDelete.propTypes = propTypes;
export default PageDelete;
