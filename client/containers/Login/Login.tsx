import React, { useState, useRef } from 'react';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';
import { AnchorButton, Button, Classes, NonIdealState } from '@blueprintjs/core';
import { Avatar, GridWrapper, InputField } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./login.scss');

const Login = () => {
	const [loginLoading, setLoginLoading] = useState(false);
	const [loginError, setLoginError] = useState(undefined);
	const [logoutLoading, setLogoutLoading] = useState(false);
	const emailRef = useRef(null);
	const passwordRef = useRef(null);
	const { locationData, loginData, communityData } = usePageContext();
	const onLoginSubmit = (evt) => {
		evt.preventDefault();
		if (
			!emailRef.current ||
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			!emailRef.current.value ||
			!passwordRef.current ||
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			!passwordRef.current.value
		) {
			setLoginLoading(false);
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"Invalid Email or Password"' is ... Remove this comment to see the full error message
			setLoginError('Invalid Email or Password');
			return null;
		}
		setLoginLoading(true);
		setLoginError(undefined);
		return apiFetch('/api/login', {
			method: 'POST',
			body: JSON.stringify({
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
				email: emailRef.current.value.toLowerCase(),
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
				password: SHA3(passwordRef.current.value).toString(encHex),
			}),
		})
			.then(() => {
				window.location.href = locationData.query.redirect
					? `/${locationData.query.redirect.replace(/^\/+/, '')}`
					: '/';
				// window.location.href =
				// 	`/${trimStart(`${locationData.query.redirect}`, '/')}` || '/';
			})
			.catch(() => {
				setLoginLoading(false);
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"Invalid Email or Password"' is ... Remove this comment to see the full error message
				setLoginError('Invalid Email or Password');
			});
	};
	const onLogoutSubmit = () => {
		setLogoutLoading(true);
		apiFetch('/api/logout').then(() => {
			window.location.href = '/';
		});
	};

	return (
		<div id="login-container">
			<GridWrapper containerClassName="small">
				{!loginData.id && (
					<div>
						<h1>Login</h1>
						{!locationData.isBasePubPub && (
							<p>
								Login to <b>{communityData.title}</b> using your{' '}
								<a href="https://www.pubpub.org">PubPub</a> account.
							</p>
						)}
						<form onSubmit={onLoginSubmit}>
							<InputField
								label="Email"
								placeholder="example@email.com"
								autocomplete="username"
								inputRef={emailRef}
							/>
							<InputField
								label="Password"
								type="password"
								autocomplete="current-password"
								helperText={<a href="/password-reset">Forgot Password</a>}
								inputRef={passwordRef}
							/>
							<InputField error={loginError}>
								<Button
									name="login"
									type="submit"
									className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY}`}
									onClick={onLoginSubmit}
									text="Login"
									loading={loginLoading}
								/>
							</InputField>
						</form>

						<a href="/signup" className="switch-message">
							Don&apos;t have a PubPub account? Click to Signup
						</a>
					</div>
				)}
				{loginData.id && (
					<NonIdealState
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ visual: Element; title: string; action: El... Remove this comment to see the full error message
						visual={
							<Avatar
								initials={loginData.initials}
								avatar={loginData.avatar}
								width={100}
							/>
						}
						title="Already Logged In"
						action={
							<div>
								<AnchorButton
									className={`${Classes.LARGE} action-button`}
									text="View Profile"
									href={`/user/${loginData.slug}`}
								/>
								<Button
									className={`${Classes.LARGE} action-button`}
									text="Logout"
									onClick={onLogoutSubmit}
									loading={logoutLoading}
								/>
							</div>
						}
					/>
				)}
			</GridWrapper>
		</div>
	);
};

export default Login;
