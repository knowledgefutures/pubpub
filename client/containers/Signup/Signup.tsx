import type { AltchaRef } from 'components';

import React, { useRef, useState } from 'react';

import { Button, Classes, NonIdealState } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { Altcha, GridWrapper, Honeypot, InputField } from 'components';
import { usePageContext } from 'utils/hooks';

import './signup.scss';

const Signup = () => {
	const { locationData, communityData } = usePageContext();
	const [email, setEmail] = useState('');
	const [isSuccessful, setIsSuccessful] = useState(false);
	const [postSignupIsLoading, setPostSignupIsLoading] = useState(false);
	const [postSignupError, setPostSignupError] = useState<string | undefined>(undefined);
	const altchaRef = useRef<AltchaRef>(null);

	const onSignupSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		// grab form data synchronously; currentTarget is nulled after the sync frame in react 16
		const formData = new FormData(evt.currentTarget);
		const confirmEmail = (formData.get('confirmEmail') as string | undefined) ?? '';
		setPostSignupIsLoading(true);
		setPostSignupError(undefined);
		try {
			const altchaPayload = await altchaRef.current?.verify();
			if (!altchaPayload) {
				throw new Error('Verification failed. Please try again.');
			}
			await apiFetch('/api/signup', {
				method: 'POST',
				body: JSON.stringify({
					_honeypot: confirmEmail,
					email: email.toLowerCase(),
					communityId: communityData.id,
					altcha: altchaPayload,
				}),
			});
			setPostSignupIsLoading(false);
			setIsSuccessful(true);
		} catch (err) {
			setPostSignupIsLoading(false);
			setPostSignupError(
				err instanceof Error ? err.message : 'Verification failed. Please try again.',
			);
		}
	};
	const handleResendEmail = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		setPostSignupIsLoading(true);
		setPostSignupError(undefined);
		try {
			await apiFetch('/api/signup', {
				method: 'POST',
				body: JSON.stringify({
					email: email.toLowerCase(),
					communityId: communityData.id,
					_honeypot: '',
					altcha: '',
				}),
			});
		} catch {
			// resend is best-effort
		} finally {
			setPostSignupIsLoading(false);
		}
	};

	const onEmailChange = (evt) => {
		setEmail(evt.target.value);
	};

	return (
		<div id="signup-container">
			<GridWrapper containerClassName="small">
				{!isSuccessful && (
					<div>
						<h1>Signup</h1>
						{!locationData.isBasePubPub && (
							<p>
								Signup to create a <a href="https://www.pubpub.org">PubPub</a>{' '}
								account, which will work on <b>{communityData.title}</b> and all
								other PubPub communities.
							</p>
						)}
						<form onSubmit={onSignupSubmit}>
							<InputField
								label="Email"
								placeholder="example@email.com"
								value={email}
								onChange={onEmailChange}
								error={postSignupError}
							/>
							<Honeypot name="confirmEmail" />
							<Altcha ref={altchaRef} auto="onload" />
							<Button
								name="signup"
								type="submit"
								className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY}`}
								text="Signup"
								disabled={!email}
								loading={postSignupIsLoading}
							/>
						</form>
						<a href="/login" className="switch-message">
							Already have a PubPub account? Click to Login
						</a>
					</div>
				)}

				{isSuccessful && (
					<NonIdealState
						title="Signup Successful"
						description={
							<div className="success">
								<p>
									An email has been sent to <b>{email}</b>
								</p>
								<p>Follow the link in that email to create your account.</p>
							</div>
						}
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; description: Element; visua... Remove this comment to see the full error message
						visual="tick-circle"
						action={
							<form onSubmit={handleResendEmail}>
								<Button
									name="resendEmail"
									disabled={!altchaRef.current?.value}
									type="submit"
									className={Classes.BUTTON}
									text="Resend Email"
									loading={!altchaRef.current?.value || postSignupIsLoading}
								/>
								<Altcha ref={altchaRef} auto="onload" />
							</form>
						}
					/>
				)}
			</GridWrapper>
		</div>
	);
};

export default Signup;
