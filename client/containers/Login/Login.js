import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';
import { Button } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { apiFetch, hydrateWrapper } from 'utilities';

require('./login.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			loginLoading: false,
			loginError: undefined,
		};
		this.onLoginSubmit = this.onLoginSubmit.bind(this);
		this.onEmailChange = this.onEmailChange.bind(this);
		this.onPasswordChange = this.onPasswordChange.bind(this);
	}
	onLoginSubmit(evt) {
		evt.preventDefault();

		this.setState({ loginLoading: true, loginError: undefined });
		return apiFetch('/api/login', {
			method: 'POST',
			body: JSON.stringify({
				email: this.state.email.toLowerCase(),
				password: SHA3(this.state.password).toString(encHex),
			})
		})
		.then(()=> {
			window.location.href = this.props.locationData.query.redirect || '/';
		})
		.catch((err)=> {
			this.setState({ loginLoading: false, loginError: 'Invalid Email or Password' });
		});
	}

	onEmailChange(evt) {
		this.setState({ email: evt.target.value });
	}

	onPasswordChange(evt) {
		this.setState({ password: evt.target.value });
	}

	render() {
		return (
			<div id="login-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={this.props.locationData.isBasePubPub}
					hideFooter={true}
				>
					<div className="container small">
						<div className="row">
							<div className="col-12 pt-elevation">
								<h1>Login</h1>
								{!this.props.locationData.isBasePubPub &&
									<p>Login to <b>{this.props.communityData.title}</b> using your <a href="https://www.pubpub.org">PubPub</a> account.</p>
								}
								<form onSubmit={this.onLoginSubmit}>
									<InputField
										label="Email"
										placeholder="example@email.com"
										value={this.state.email}
										onChange={this.onEmailChange}
										autocomplete="username"
									/>
									<InputField
										label="Password"
										type="password"
										value={this.state.password}
										onChange={this.onPasswordChange}
										autocomplete="current-password"
										helperText={<a href="/password-reset">Forgot Password</a>}
									/>
									<InputField error={this.state.loginError}>
										<Button
											name="login"
											type="submit"
											className="pt-button pt-intent-primary"
											onClick={this.onLoginSubmit}
											text="Login"
											disabled={!this.state.email || !this.state.password}
											loading={this.state.loginLoading}
										/>
									</InputField>
								</form>

								<a href="/signup" className="switch-message">Don't have a PubPub account? Click to Signup</a>
							</div>
						</div>
					</div>
				</PageWrapper>
			</div>
		);
	}
}

Login.propTypes = propTypes;
export default Login;

hydrateWrapper(Login);
