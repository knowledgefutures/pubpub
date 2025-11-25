import React, { useCallback, useEffect, useState } from 'react';

import { AnchorButton, Spinner } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { GridWrapper } from 'components';

import './emailChange.scss';

type Props = {
	emailChangeData: {
		tokenIsValid: boolean;
		token: string;
		newEmail: string;
	};
};

const EmailChange = (props: Props) => {
	const { emailChangeData } = props;
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [success, setSuccess] = useState(false);

	const handleEmailChange = useCallback(() => {
		setIsLoading(true);
		setError(undefined);

		return apiFetch('/api/account/email', {
			method: 'PUT',
			body: JSON.stringify({
				token: emailChangeData.token,
			}),
		})
			.then(() => {
				setIsLoading(false);
				setSuccess(true);
			})
			.catch((err) => {
				setIsLoading(false);
				setError(err.message || 'Failed to change email');
			});
	}, [emailChangeData.token]);

	useEffect(() => {
		if (emailChangeData.tokenIsValid && emailChangeData.newEmail) {
			handleEmailChange();
		}
	}, [emailChangeData.tokenIsValid, emailChangeData.newEmail, handleEmailChange]);

	return (
		<div id="email-change-container">
			<GridWrapper containerClassName="small">
				{!emailChangeData.tokenIsValid && (
					<div className="email-change-content">
						<div className="icon-container error">
							<span className="icon-wrapper">✕</span>
						</div>
						<h1>Invalid Link</h1>
						<p className="description">
							This email change link is invalid or has expired. Please request a new
							one from your{' '}
							<a href="/legal/settings#email-address">privacy settings</a>.
						</p>
					</div>
				)}

				{emailChangeData.tokenIsValid && isLoading && (
					<div className="email-change-content">
						<div className="icon-container loading">
							<Spinner />
						</div>
						<h1>Confirming Email Change</h1>
						<p className="description">
							Please wait while we update your email address...
						</p>
					</div>
				)}

				{emailChangeData.tokenIsValid && error && (
					<div className="email-change-content">
						<div className="icon-container error">
							<span className="icon-wrapper">✕</span>
						</div>
						<h1>Change Failed</h1>
						<p className="description">
							{error}. Try requesting a new email change from your{' '}
							<a href="/legal/settings#email-address">privacy settings</a>.
						</p>
					</div>
				)}

				{success && (
					<div className="email-change-content">
						<div className="icon-container success">
							<span className="icon-wrapper">✓</span>
						</div>
						<h1>Email Change Successful</h1>
						<p className="description">
							Your email has been successfully changed to{' '}
							<strong>{emailChangeData.newEmail}</strong>
						</p>
						<AnchorButton
							href="/"
							intent="primary"
							large
							text="Go to homepage"
							className="action-button"
						/>
					</div>
				)}
			</GridWrapper>
		</div>
	);
};

export default EmailChange;
