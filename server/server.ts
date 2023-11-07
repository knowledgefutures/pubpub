/* eslint-disable import/first, import/order */
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import enforce from 'express-sslify';
import express, { ErrorRequestHandler, RequestHandler } from 'express';
import fs from 'fs';
import noSlash from 'no-slash';
import passport from 'passport';
import path from 'path';
import CreateSequelizeStore from 'connect-session-sequelize';

import { setEnvironment, setAppCommit, isProd, getAppCommit, isQubQub } from 'utils/environment';

// ACHTUNG: These calls must appear before we import any more of our own code to ensure that
// the environment, and in particular the choice of dev vs. prod, is configured correctly!
setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ, process.env.IS_QUBQUB);
if (isQubQub() && !process.env.HEROKU_SLUG_COMMIT) {
	try {
		setAppCommit(fs.readFileSync('.app-commit').toString());
	} catch (err) {
		console.error('Unable to read app commit from .app-commit file: ', err);
	}
} else {
	setAppCommit(process.env.HEROKU_SLUG_COMMIT);
}

import 'server/utils/serverModuleOverwrite';
import { HTTPStatusError, errorMiddleware } from 'server/utils/errors';
import { deduplicateSlash } from './middleware/deduplicateSlash';

import { User } from './models';
import { sequelize } from './sequelize';
import { zoteroAuthStrategy } from './zoteroIntegration/utils/auth';
import './hooks';

type Wrap = <
	P = any,
	ResBody = any,
	ReqBody = any,
	ReqQuery = any,
	Locals extends Record<string, any> = Record<string, any>,
>(
	handler: RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>,
) => RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>;

// Wrapper for app.METHOD() handlers. Though we need this to properly catch errors in handlers that
// return a promise, i.e. those that use async/await, we should use it everywhere to be consistent.
export const wrap: Wrap =
	(routeHandlerFn) =>
	async (...args) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [req, res, next] = args;
		try {
			return await routeHandlerFn(...args);
		} catch (err) {
			return next(err);
		}
	};

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	if (!(err instanceof Error)) {
		return next(err);
	}

	if (err.message.indexOf('UseCustomDomain:') === 0) {
		const customDomain = err.message.split(':')[1];
		return res.redirect(`https://${customDomain}${req.originalUrl}`);
	}
	// Log the error if we're testing. Normally this is handled in the error middleware, but
	// that isn't active while handling individual requests in a test environment.
	if (process.env.NODE_ENV === 'test' && !(err instanceof HTTPStatusError)) {
		// eslint-disable-next-line no-console
		console.log('Got an error in an API route while testing:', err);
	}
	return next(err);
};

/* ---------------------- */
/* Initialize express app */
/* ---------------------- */
const app = express();

export default app;

import { RequestValidationError, createExpressEndpoints } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import { server } from 'utils/api/server';

if (process.env.NODE_ENV === 'production') {
	Sentry.init({
		dsn: 'https://abe1c84bbb3045bd982f9fea7407efaa@sentry.io/1505439',
		environment: isProd() ? 'prod' : 'dev',
		release: getAppCommit(),
		tracesSampleRate: 0.05,
		integrations: [
			new Sentry.Integrations.Http({ tracing: true }),
			new Sentry.Integrations.Postgres(),
			new Sentry.Integrations.Express({ app }),
		],
	});
	// The Sentry request handler must be the first middleware on the app
	app.use(Sentry.Handlers.requestHandler({ user: ['id', 'slug'] }));
	app.use(Sentry.Handlers.tracingHandler());
	app.use(enforce.HTTPS({ trustProtoHeader: true }));
}
app.use(deduplicateSlash());
app.use(noSlash());
app.use(compression());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

/* --------------------- */
/* Configure app session */
/* --------------------- */
import session from 'express-session';

const SequelizeStore = CreateSequelizeStore(session.Store);

app.use(
	session({
		secret: 'sessionsecret',
		resave: false,
		saveUninitialized: false,
		store: process.env.NODE_ENV !== 'test' ? new SequelizeStore({ db: sequelize }) : undefined,
		cookie: {
			path: '/',
			/* These are necessary for */
			/* the api cookie to set */
			/* ------- */
			httpOnly: false,
			secure: false,
			/* ------- */
			maxAge: 30 * 24 * 60 * 60 * 1000, // = 30 days.
		},
	}),
);

app.use((req, res, next) => {
	/* If on *.pubpub.org domain, set cookie to be accessible across */
	/* all subdomains to maintain login. Especially important when */
	/* creating communities. */
	const hostname = req.headers.communityhostname || req.hostname;
	if (hostname.indexOf('.pubpub.org') > -1) {
		req.session.cookie.domain = '.pubpub.org';
	}
	next();
});

/* ------------------- */
/* Configure app login */
/* ------------------- */
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.use('zotero', zoteroAuthStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* ---------------- */
/* Server Endpoints */
/* ---------------- */
app.use('/dist', [cors(), express.static(path.join(process.cwd(), 'dist/client'))]);
app.use('/static', express.static(path.join(process.cwd(), 'static')));
app.use('/service-worker.js', express.static(path.join(process.cwd(), 'static/service-worker.js')));
app.use('/favicon.png', express.static(path.join(process.cwd(), 'static/favicon.png')));
app.use('/favicon.ico', express.static(path.join(process.cwd(), 'static/favicon.png')));

/* -------------------- */
/* Set Hostname for Dev */
/* -------------------- */
app.use((req, res, next) => {
	if (req.headers.communityhostname) {
		// @ts-expect-error
		req.headers.host = req.headers.communityhostname;
	}
	if (
		process.env.PUBPUB_LOCAL_COMMUNITY ||
		req.hostname.includes('localhost') ||
		req.hostname.includes('127.0.0.1')
	) {
		req.headers.localhost = req.headers.host;
		if (process.env.PUBPUB_LOCAL_COMMUNITY) {
			const subdomain = process.env.PUBPUB_LOCAL_COMMUNITY;
			req.headers.host = `${subdomain}.duqduq.org`;
		} else {
			req.headers.host = 'demo.pubpub.org';
		}
	}
	if (req.hostname.indexOf('duqduq.org') > -1) {
		req.headers.host = req.hostname.replace('duqduq.org', 'pubpub.org');
	}
	next();
});

/* ------------------------- */
/* Create ts-rest api routes */
/* ------------------------- */
createExpressEndpoints(contract, server, app, {
	logInitialization: false,
	// eslint-disable-next-line consistent-return
	requestValidationErrorHandler: (err, req, res, next) => {
		if (err instanceof RequestValidationError) {
			if (process.env.NODE_ENV !== 'production') {
				console.error(err);
			}
			if (err.pathParams) {
				return res.status(400).json(err.pathParams);
			}
			if (err.headers) {
				return res.status(400).json(err.headers);
			}
			if (err.query) {
				return res.status(400).json(err.query);
			}
			if (err.body) {
				return res.status(400).json(err.body);
			}
		}
		next(err);
	},
	jsonQuery: true,
});

/* ------------- */
/* Import Routes */
/* ------------- */
require('./apiRoutes');
require('./routes');

/* ------------- */
/* Error Handlers */
/* ------------- */
if (process.env.NODE_ENV === 'production') {
	// The Sentry error handler must be before any other error middleware
	app.use(Sentry.Handlers.errorHandler());
}
app.use(errorHandler);
app.use(errorMiddleware);

/* ------------ */
/* Start Server */
/* ------------ */
const port = process.env.PORT || 9876;
export const startServer = () => {
	return app.listen(
		port,
		// @ts-expect-error
		(err) => {
			if (err) {
				console.error(err);
			}
			console.info(
				`==> Sequelize Max Connections:,
				${process.env.SEQUELIZE_MAX_CONNECTIONS ? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10) : 5}`,
			);
			console.info('----\n==> 🌎  API is running on port %s', port);
			console.info('==> 💻  Send requests to http://localhost:%s', port);
		},
	);
};
