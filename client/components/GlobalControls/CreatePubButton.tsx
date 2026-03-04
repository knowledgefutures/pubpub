import type * as types from 'types';

import React, { useCallback, useRef, useState } from 'react';

import { apiFetch } from 'client/utils/apiFetch';
import { Altcha, Honeypot } from 'components';
import { usePageContext } from 'utils/hooks';

import GlobalControlsButton from './GlobalControlsButton';

const CreatePubButton = () => {
	const [isLoading, setIsLoading] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);
	const altchaRef = useRef<import('components').AltchaRef>(null);
	const { communityData } = usePageContext();

	const handleCreatePub = useCallback(async () => {
		if (isLoading) {
			return;
		}

		const formElement = formRef.current;
		if (!formElement) {
			return;
		}

		const formData = new FormData(formElement);
		const honeypot = (formData.get('description') as string) ?? '';
		setIsLoading(true);
		try {
			const altchaPayload = await altchaRef.current?.verify();
			if (!altchaPayload) return;
			const newPub = await apiFetch.post<types.Pub>('/api/pubs/fromForm', {
				communityId: communityData.id,
				altcha: altchaPayload,
				_honeypot: honeypot,
			});
			window.location.href = `/pub/${newPub.slug}`;
		} catch (error) {
			console.error('Error in handleCreatePub', error);
		} finally {
			setIsLoading(false);
		}
	}, [communityData.id, isLoading]);

	return (
		// the form might feel a little superfluous here, but it's necessary form anchoring altcha correctly
		<form
			onSubmit={(evt) => {
				// we don't use the `onSubmit` handler to actually create the pub,
				// because otherwise the following happens:
				// 1. click "Create Pub" button
				// 2. altcha reacts to first interaction with form, stops the event from propagating, and starts verifying
				// 3. altcha verifies succesfully, but the form is not submitted, so the pub is not created
				// 4. user needs to click the button again to create the pub

				// this kinda sucks, so instead we just do it through the onClick handler. not really nice form semantics, but should be fine accessibility-wise.
				evt.preventDefault();
			}}
			ref={formRef}
			// only relevant in dev
			style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
		>
			<Altcha ref={altchaRef} />
			<Honeypot name="description" />
			<GlobalControlsButton
				onClick={handleCreatePub}
				loading={isLoading}
				aria-label="Create Pub"
				type="submit"
				desktop={{ text: 'Create Pub' }}
				mobile={{ icon: 'pubDocNew' }}
			/>
		</form>
	);
};

export default CreatePubButton;
