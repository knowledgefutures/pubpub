import React, { useCallback, useState } from 'react';
import { Button, Classes } from '@blueprintjs/core';

import { InputField } from 'components';
import { usePendingChanges } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

type Props = {
	isForbidden: boolean;
	communityId: string;
	pageData: {
		id?: string;
		title?: string;
	};
};

const PageDelete = (props: Props) => {
	const { pendingPromise } = usePendingChanges();
	const { communityId, pageData, isForbidden } = props;
	const [deleteString, setDeleteString] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = useCallback(() => {
		setIsDeleting(true);
		return pendingPromise(
			apiFetch('/api/pages', {
				method: 'DELETE',
				body: JSON.stringify({
					pageId: pageData.id,
					communityId,
				}),
			}),
		)
			.then(() => {
				window.location.href = '/dash';
			})
			.catch((err) => {
				console.error(err);
				setIsDeleting(false);
			});
	}, [communityId, pageData.id, pendingPromise]);

	return isForbidden ? (
		<div className={`${Classes.CALLOUT} ${Classes.INTENT_DANGER}`}>
			<h5>Delete Page from Community</h5>
			<p>
				<b>{pageData.title}</b> cannot be deleted because it is the home page for this
				Community.
			</p>
		</div>
	) : (
		<div className={`${Classes.CALLOUT} ${Classes.INTENT_DANGER}`}>
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
					className={Classes.INTENT_DANGER}
					text="Delete Page"
					disabled={deleteString !== pageData.title}
					loading={isDeleting}
					onClick={handleDelete}
				/>
			</div>
		</div>
	);
};
export default PageDelete;
