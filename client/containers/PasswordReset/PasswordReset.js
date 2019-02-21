import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';
import { AnchorButton, Button, NonIdealState } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper, apiFetch } from 'utilities';

require('./passwordReset.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	passwordResetData: PropTypes.object.isRequired,
};

class PasswordReset extends Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			showConfirmation: false,
		};
		this.onEmailChange = this.onEmailChange.bind(this);
		this.onPasswordChange = this.onPasswordChange.bind(this);
		this.handlePostPasswordReset = this.handlePostPasswordReset.bind(this);
		this.handlePutPasswordReset = this.handlePutPasswordReset.bind(this);
	}

	onEmailChange(evt) {
		this.setState({ email: evt.target.value });
	}

	onPasswordChange(evt) {
		this.setState({ password: evt.target.value });
	}

	handlePostPasswordReset(evt) {
		evt.preventDefault();

		this.setState({ postIsLoading: true });
		return apiFetch('/api/password-reset', {
			method: 'POST',
			body: JSON.stringify({
				email: this.state.email.toLowerCase(),
			}),
		})
			.then(() => {
				this.setState({ postIsLoading: false, showConfirmation: true });
			})
			.catch(() => {
				this.setState({ postIsLoading: false, postError: 'Error' });
			});
	}

	handlePutPasswordReset(evt) {
		evt.preventDefault();

		this.setState({ putIsLoading: true });
		return apiFetch('/api/password-reset', {
			method: 'PUT',
			body: JSON.stringify({
				password: SHA3(this.state.password).toString(encHex),
				slug: this.props.locationData.params.slug,
				resetHash: this.props.locationData.params.resetHash,
			}),
		})
			.then(() => {
				this.setState({ putIsLoading: false, showConfirmation: true });
			})
			.catch(() => {
				this.setState({ putIsLoading: false, putError: 'Error' });
			});
	}

	render() {
		const resetHash = this.props.locationData.params.resetHash;
		return (
			<div id="password-reset-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={true}
					hideFooter={true}
				>
					<div className="container small">
						<div className="row">
							<div className="col-12">
								{!this.state.showConfirmation && !resetHash && (
									<h1>Reset Password</h1>
								)}
								{!this.state.showConfirmation && !!resetHash && (
									<h1>Set Password</h1>
								)}

								{/* Show form to submit email */}
								{!resetHash && !this.state.showConfirmation && (
									<form onSubmit={this.handlePostPasswordReset}>
										<p>
											Enter your email and a link to reset your password will
											be sent to you.
										</p>
										<InputField
											label="Email"
											type="email"
											placeholder="example@email.com"
											value={this.state.email}
											onChange={this.onEmailChange}
										/>
										<InputField
											error={
												this.state.postError && 'Error Resetting Password'
											}
										>
											<Button
												name="create"
												type="submit"
												className="bp3-button bp3-intent-primary create-account-button"
												onClick={this.handlePostPasswordReset}
												text="Reset Password"
												disabled={!this.state.email}
												loading={this.state.postIsLoading}
											/>
										</InputField>
									</form>
								)}

								{/* Show password reset request confirmation, with directions to check email  */}
								{!resetHash && this.state.showConfirmation && (
									<NonIdealState
										description="Check your inbox for an email with a reset link"
										title="Reset Password Email Sent"
										visual="envelope"
									/>
								)}

								{/* Show Error message if invalid hash */}
								{resetHash && !this.props.passwordResetData.hashIsValid && (
									<div className="bp3-callout bp3-intent-danger">
										Invalid hash. Try{' '}
										<a href="/password-reset">resetting your password</a> again.
									</div>
								)}

								{/* Show form to submit new password */}
								{resetHash &&
									this.props.passwordResetData.hashIsValid &&
									!this.state.showConfirmation && (
										<form onSubmit={this.handlePutPasswordReset}>
											<InputField
												label="Password"
												type="password"
												value={this.state.password}
												onChange={this.onPasswordChange}
											/>
											<InputField
												error={
													this.state.putError &&
													'Error Resetting Password'
												}
											>
												<Button
													name="create"
													type="submit"
													className="bp3-button bp3-intent-primary create-account-button"
													onClick={this.handlePutPasswordReset}
													text="Set New Password"
													disabled={!this.state.password}
													loading={this.state.putIsLoading}
												/>
											</InputField>
										</form>
									)}

								{/* Show confirmation of password reset. Link to Login */}
								{resetHash &&
									this.props.passwordResetData.hashIsValid &&
									this.state.showConfirmation && (
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
							</div>
						</div>
					</div>
				</PageWrapper>
			</div>
		);
	}
}

PasswordReset.propTypes = propTypes;
export default PasswordReset;

hydrateWrapper(PasswordReset);
