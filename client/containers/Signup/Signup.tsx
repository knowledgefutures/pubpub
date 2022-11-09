import React, { useState } from 'react';
import { Button, Classes, NonIdealState } from '@blueprintjs/core';

import { GridWrapper, InputField } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./signup.scss');

const Signup = () => {
	const { locationData, communityData } = usePageContext();
	const [email, setEmail] = useState('');
	const [isSuccessful, setIsSuccessful] = useState(false);
	const [postSignupIsLoading, setPostSignupIsLoading] = useState(false);
	const [postSignupError, setPostSignupError] = useState(undefined);
	const [confirmEmail, setConfirmEmail] = useState('');
	const onSignupSubmit = (evt) => {
		evt.preventDefault();
		setPostSignupIsLoading(true);
		setPostSignupError(undefined);
		return apiFetch('/api/signup', {
			method: 'POST',
			body: JSON.stringify({
				email: email.toLowerCase(),
				communityId: communityData.id,
				confirmEmail,
			}),
		})
			.then(() => {
				setPostSignupIsLoading(false);
				setIsSuccessful(true);
			})
			.catch((err) => {
				setPostSignupIsLoading(false);
				setPostSignupError(err);
			});
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
							<input
								type="search"
								className="confirm-email"
								name="confirmEmail"
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
								tabIndex="-1"
								autoComplete="new-user-street-address"
								onChange={(evt) => setConfirmEmail(evt.target.value)}
							/>
							<Button
								name="signup"
								type="submit"
								className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY}`}
								onClick={onSignupSubmit}
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
							<Button
								name="resendEmail"
								type="button"
								className={Classes.BUTTON}
								onClick={onSignupSubmit}
								text="Resend Email"
								loading={postSignupIsLoading}
							/>
						}
					/>
				)}
			</GridWrapper>
		</div>
	);
};

export default Signup;
