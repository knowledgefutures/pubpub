import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';
import { AnchorButton, Button, NonIdealState } from '@blueprintjs/core';

import { GridWrapper, InputField } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';

require('./passwordReset.scss');

const propTypes = {
	passwordResetData: PropTypes.object.isRequired,
};

const PasswordReset = (props) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [postIsLoading, setPostIsLoading] = useState(false);
	const [postError, setPostError] = useState(undefined);
	const [putIsLoading, setPutIsLoading] = useState(false);
	const [putError, setPutError] = useState(undefined);
	const { passwordResetData } = props;
	const { locationData } = usePageContext();

	const onEmailChange = (evt) => {
		setEmail(evt.target.value);
	};

	const onPasswordChange = (evt) => {
		setPassword(evt.target.value);
	};

	const handlePostPasswordReset = (evt) => {
		evt.preventDefault();
		setPostIsLoading(true);

		return apiFetch('/api/password-reset', {
			method: 'POST',
			body: JSON.stringify({
				email: email.toLowerCase(),
			}),
		})
			.then(() => {
				setPostIsLoading(false);
				setShowConfirmation(true);
			})
			.catch(() => {
				setPostIsLoading(false);
				setPostError('Error');
			});
	};

	const handlePutPasswordReset = (evt) => {
		evt.preventDefault();
		setPutIsLoading(true);

		return apiFetch('/api/password-reset', {
			method: 'PUT',
			body: JSON.stringify({
				password: SHA3(password).toString(encHex),
				slug: locationData.params.slug,
				resetHash: locationData.params.resetHash,
			}),
		})
			.then(() => {
				setPutIsLoading(false);
				setShowConfirmation(true);
			})
			.catch(() => {
				setPutIsLoading(false);
				setPutError('Error');
			});
	};
	const resetHash = locationData.params.resetHash;

	return (
		<div id="password-reset-container">
			<GridWrapper containerClassName="small">
				{!showConfirmation && !resetHash && <h1>Reset Password</h1>}
				{!showConfirmation && !!resetHash && <h1>Set Password</h1>}

				{/* Show form to submit email */}
				{!resetHash && !showConfirmation && (
					<form onSubmit={handlePostPasswordReset}>
						<p>
							Enter your email and a link to reset your password will be sent to you.
						</p>
						<InputField
							label="Email"
							type="email"
							placeholder="example@email.com"
							value={email}
							onChange={onEmailChange}
						/>
						<InputField error={postError && 'Error Resetting Password'}>
							<Button
								name="create"
								type="submit"
								className="bp3-button bp3-intent-primary create-account-button"
								onClick={handlePostPasswordReset}
								text="Reset Password"
								disabled={!email}
								loading={postIsLoading}
							/>
						</InputField>
					</form>
				)}

				{/* Show password reset request confirmation, with directions to check email  */}
				{!resetHash && showConfirmation && (
					<NonIdealState
						description="Check your inbox for an email with a reset link"
						title="Reset Password Email Sent"
						visual="envelope"
					/>
				)}

				{/* Show Error message if invalid hash */}
				{resetHash && !passwordResetData.hashIsValid && (
					<div className="bp3-callout bp3-intent-danger">
						Invalid hash. Try <a href="/password-reset">resetting your password</a>{' '}
						again.
					</div>
				)}

				{/* Show form to submit new password */}
				{resetHash && passwordResetData.hashIsValid && !showConfirmation && (
					<form onSubmit={handlePutPasswordReset}>
						<InputField
							label="Password"
							type="password"
							value={password}
							onChange={onPasswordChange}
						/>
						<InputField error={putError && 'Error Resetting Password'}>
							<Button
								name="create"
								type="submit"
								className="bp3-button bp3-intent-primary create-account-button"
								onClick={handlePutPasswordReset}
								text="Set New Password"
								disabled={!password}
								loading={putIsLoading}
							/>
						</InputField>
					</form>
				)}

				{/* Show confirmation of password reset. Link to Login */}
				{resetHash && passwordResetData.hashIsValid && showConfirmation && (
					<NonIdealState
						description="Your password has been successfully changed."
						title="Reset Password Successful"
						visual="tick"
						action={
							<AnchorButton
								href="/login"
								className="bp3-intent-primary bp3-large"
								text="Login with new password"
							/>
						}
					/>
				)}
			</GridWrapper>
		</div>
	);
};

PasswordReset.propTypes = propTypes;
export default PasswordReset;
