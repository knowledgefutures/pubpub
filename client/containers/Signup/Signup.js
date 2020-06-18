import React, { useState } from 'react';
import { Button, NonIdealState } from '@blueprintjs/core';

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
				confirmEmail: confirmEmail,
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
								tabIndex="-1"
								autoComplete="new-user-street-address"
								onChange={(evt) => setConfirmEmail(evt.target.value)}
							/>
							<Button
								name="signup"
								type="submit"
								className="bp3-button bp3-intent-primary"
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
						visual="tick-circle"
						action={
							<Button
								name="resendEmail"
								type="button"
								className="bp3-button"
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
