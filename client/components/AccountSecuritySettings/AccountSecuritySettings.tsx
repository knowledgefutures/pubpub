import React, { useState } from 'react';

import { Button, Callout, Card } from '@blueprintjs/core';
import encHex from 'crypto-js/enc-hex';
import SHA3 from 'crypto-js/sha3';

import { apiFetch } from 'client/utils/apiFetch';
import { InputField } from 'components';

import './accountSecuritySettings.scss';

const stripHTTPError = (error: string) => {
	return error.replace(/^HTTP Error \d+: /, '');
};

const AccountSecuritySettings = ({ userEmail }: { userEmail: string }) => {
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordIsLoading, setPasswordIsLoading] = useState(false);
	const [passwordError, setPasswordError] = useState<string | undefined>();
	const [passwordSuccess, setPasswordSuccess] = useState(false);

	const [newEmail, setNewEmail] = useState('');
	const [emailPassword, setEmailPassword] = useState('');
	const [emailIsLoading, setEmailIsLoading] = useState(false);
	const [emailError, setEmailError] = useState<string | undefined>();
	const [submittedEmail, setSubmittedEmail] = useState<string | undefined>();

	const handlePasswordChange = (evt: React.FormEvent) => {
		evt.preventDefault();

		if (newPassword !== confirmPassword) {
			setPasswordError('New passwords do not match');
			return;
		}

		if (newPassword.length < 8) {
			setPasswordError('Password must be at least 8 characters');
			return;
		}

		setPasswordIsLoading(true);
		setPasswordError(undefined);
		setPasswordSuccess(false);

		apiFetch('/api/account/password', {
			method: 'PUT',
			body: JSON.stringify({
				currentPassword: SHA3(currentPassword).toString(encHex),
				newPassword: SHA3(newPassword).toString(encHex),
			}),
		})
			.then(() => {
				setPasswordIsLoading(false);
				setPasswordSuccess(true);
				setCurrentPassword('');
				setNewPassword('');
				setConfirmPassword('');
			})
			.catch((err) => {
				setPasswordIsLoading(false);
				setPasswordError(stripHTTPError(err.message) || 'Failed to change password');
			});
	};

	const handleEmailChange = (evt: React.FormEvent) => {
		evt.preventDefault();

		if (!newEmail || !emailPassword) {
			setEmailError('Please enter both email and password');
			return;
		}

		const submittedEmailValue = newEmail.toLowerCase().trim();

		setEmailIsLoading(true);
		setEmailError(undefined);
		setSubmittedEmail(undefined);

		apiFetch('/api/account/email', {
			method: 'POST',
			body: JSON.stringify({
				newEmail: submittedEmailValue,
				password: SHA3(emailPassword).toString(encHex),
			}),
		})
			.then(() => {
				setEmailIsLoading(false);
				setSubmittedEmail(submittedEmailValue);
				setNewEmail('');
				setEmailPassword('');
			})
			.catch((err) => {
				setEmailIsLoading(false);
				setEmailError(stripHTTPError(err.message) || 'Failed to initiate email change');
			});
	};

	const isPasswordFormValid =
		currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

	const isEmailFormValid = newEmail && emailPassword;

	return (
		<div className="account-security-settings">
			<Card>
				<h5 id="change-password">Change password</h5>
				<p>Enter your current password and choose a new password for your account.</p>
				{passwordSuccess && (
					<Callout intent="success" className="success-message">
						Your password has been successfully changed.
					</Callout>
				)}
				<form onSubmit={handlePasswordChange}>
					<InputField
						label="Current password"
						type="password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
					/>
					<InputField
						label="New password"
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						helperText="Must be at least 8 characters"
					/>
					<InputField
						label="Confirm new password"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
					<InputField error={passwordError}>
						<Button
							type="submit"
							intent="primary"
							text="Change password"
							disabled={!isPasswordFormValid}
							loading={passwordIsLoading}
						/>
					</InputField>
				</form>
			</Card>

			<Card>
				<h5 id="email-address">Change email address</h5>
				<p>
					Your current email is <strong>{userEmail}</strong>. To change it, enter a new
					email address and your password. You will receive a confirmation email at the
					new address.
				</p>
				{submittedEmail && (
					<Callout intent="success" className="success-message">
						A confirmation email has been sent to {submittedEmail}. Please check your
						inbox and click the link to complete the email change.
					</Callout>
				)}
				<form onSubmit={handleEmailChange}>
					<InputField
						label="New email address"
						type="email"
						value={newEmail}
						onChange={(e) => {
							setNewEmail(e.target.value);
							setEmailError(undefined);
							setSubmittedEmail(undefined);
						}}
						placeholder="new.email@example.com"
					/>
					<InputField
						label="Confirm your password"
						type="password"
						value={emailPassword}
						onChange={(e) => {
							setEmailPassword(e.target.value);
							setEmailError(undefined);
							setSubmittedEmail(undefined);
						}}
						helperText="Enter your current password to confirm this change"
					/>
					<InputField error={emailError}>
						<Button
							type="submit"
							intent="primary"
							text="Change email address"
							disabled={!isEmailFormValid}
							loading={emailIsLoading}
						/>
					</InputField>
				</form>
			</Card>
		</div>
	);
};

export default AccountSecuritySettings;
