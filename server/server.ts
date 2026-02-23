import * as Sentry from '@sentry/node';
// import compression from 'compression';
import CreateSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type ErrorRequestHandler, Router } from 'express';
import enforce from 'express-sslify';
import fs from 'fs';
import noSlash from 'no-slash';
import passport from 'passport';
import path from 'path';

const app = express();

const appRouter = Router();

import { getAppCommit, isProd, isQubQub, setAppCommit, setEnvironment } from 'utils/environment';

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

import { errorMiddleware, HTTPStatusError } from 'server/utils/errors';

if (process.env.NODE_ENV !== 'test') {
	require('server/utils/serverModuleOverwrite');
}

import { deduplicateSlash } from './middleware/deduplicateSlash';
import { blocklistMiddleware } from './utils/blocklist';

import './hooks';

import { User } from './models';
import { sequelize } from './sequelize';
import { zoteroAuthStrategy } from './zoteroIntegration/utils/auth';

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
		// biome-ignore lint/suspicious/noConsole: shhhhhh
		console.log('Got an error in an API route while testing:', err);
	}
	return next(err);
};

import { createExpressEndpoints, RequestValidationError } from '@ts-rest/express';

import { contract } from 'utils/api/contract';
import { server } from 'utils/api/server';

// just hardcoded blocking, very bad, but we really need it
// set process.env.BLOCKLIST_IP_ADDRESSES to comma separated list of ips (or partial ips) to block
appRouter.use(blocklistMiddleware);

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
	appRouter.use(Sentry.Handlers.requestHandler({ user: ['id', 'slug'] }));
	appRouter.use(Sentry.Handlers.tracingHandler());
	if (process.env.DISABLE_SSL_REDIRECT !== 'true') {
		appRouter.use(enforce.HTTPS({ trustProtoHeader: true }));
	}
}
appRouter.use(deduplicateSlash());
appRouter.use(noSlash());
// appRouter.use(compression());
appRouter.use(express.json({ limit: '50mb' }));
appRouter.use(express.urlencoded({ limit: '50mb', extended: true }));
appRouter.use(cookieParser());

/* --------------------- */
/* Configure app session */
/* --------------------- */
import session from 'express-session';
import { fromZodError } from 'zod-validation-error';

import { purgeMiddleware } from 'utils/caching/purgeMiddleware';
import { readOnlyMiddleware } from 'utils/caching/readOnlyMiddleware';
import { schedulePurge } from 'utils/caching/schedulePurgeWithSentry';

import { abortStorage } from './abort';
import { authTokenMiddleware } from './authToken/authTokenMiddleware';
import { bearerStrategy } from './authToken/strategy';

const SequelizeStore = CreateSequelizeStore(session.Store);

appRouter.use('/api/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

appRouter.use(
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

appRouter.use((req, res, next) => {
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
appRouter.use(passport.initialize());
appRouter.use(passport.session());
passport.use(User.createStrategy());
passport.use('zotero', zoteroAuthStrategy());
passport.use('bearer', bearerStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/* ---------------- */
/* Server Endpoints */
/* ---------------- */
appRouter.use('/dist', [cors(), express.static(path.join(process.cwd(), 'dist/client'))]);
appRouter.use('/static', express.static(path.join(process.cwd(), 'static')));
appRouter.use('/static', (req, res) => {
	res.status(404).sendFile(path.join(process.cwd(), 'static/404.html'));
});
appRouter.use(
	'/service-worker.js',
	express.static(path.join(process.cwd(), 'static/service-worker.js')),
);
appRouter.use('/favicon.png', express.static(path.join(process.cwd(), 'static/favicon.png')));
appRouter.use('/favicon.ico', express.static(path.join(process.cwd(), 'static/favicon.png')));

// extremely graceful iknow
process.on('uncaughtException', (err) => {
	// just to be sure, not every route is properly `wrap`ped
	if (err.name.includes('DatabaseRequestAbortedError')) {
		return;
	}

	throw err;
});

/** Same as Heroku's default timeout */
const TIMEOUT_MS = process.env.REQUEST_TIMEOUT_MS
	? parseInt(process.env.REQUEST_TIMEOUT_MS, 10)
	: 30_000;

appRouter.use((req, res, next) => {
	// don't abort requests in test environment
	if (process.env.NODE_ENV === 'test') {
		return next();
	}

	const abortController = new AbortController();

	abortStorage.enterWith({ abortController });

	const abort = () => {
		const store = abortStorage.getStore();
		store?.abortController.abort();
	};

	const abortTimeout = setTimeout(abort, TIMEOUT_MS);

	// manually abort the request on close, that frees up connections more quickly if eg user closes the tab
	req.on('close', () => {
		// this is any close event, including us ending the request
		// there's no problem in calling it twice
		abort();
		// clean up
		clearTimeout(abortTimeout);
	});

	return next();
});

/* -------------------- */
/* Set Hostname for Dev */
/* -------------------- */
appRouter.use((req, res, next) => {
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

appRouter.use(authTokenMiddleware);

/** Set up purge middleware before api routes are initialized and after hostname is set */
appRouter.use(purgeMiddleware(schedulePurge));

appRouter.use(readOnlyMiddleware());

const { customScript: _, ...contractWithoutCustomScript } = contract;

appRouter.use((req, res, next) => {
	const now = process.hrtime.bigint();

	let isLogged = false;
	function logger() {
		if (isLogged) {
			return;
		}
		const durationMs = Number((process.hrtime.bigint() - now) / BigInt(1_000_000));
		const host = req.headers.host ?? 'unknown';
		const userAgent = req.headers['user-agent'] ?? 'unknown';
		const contentLength = res.get('content-length') ?? '-';
		const userId = req.user?.id ?? 'anon';
		const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown';

		console.log(
			`${req.method} ${res.statusCode} ${req.path} ${durationMs}ms | host=${host} | user=${userId} | ip=${ip} | size=${contentLength} | ua=${userAgent} | origin=${req.headers.origin}`,
		);
		isLogged = true;
	}

	res.on('finish', logger);
	res.on('close', logger);
	res.on('error', logger);
	next();
});
/* ------------------------- */
/* Create ts-rest api routes */
/* ------------------------- */
createExpressEndpoints(contractWithoutCustomScript, server, appRouter, {
	logInitialization: false,

	requestValidationErrorHandler: (err, req, res, next) => {
		if (!(err instanceof RequestValidationError)) {
			next(err);
		}
		const error = Object.values(err).find(Boolean);

		if (!error) {
			next(err);
		}
		const prettifiedError = fromZodError(error);

		if (process.env.NODE_ENV !== 'production') {
			console.error(prettifiedError);
		}

		return res.status(400).json({
			...prettifiedError,
			message: prettifiedError.message,
		});
	},
	jsonQuery: true,
});

/* ------------- */
/* Import Routes */
/* ------------- */
import { apiRouter } from './apiRoutes';
import { rootRouter } from './routes';

appRouter.use(apiRouter);
appRouter.use(rootRouter);

/* ------------- */
/* Error Handlers */
/* ------------- */
if (process.env.NODE_ENV === 'production') {
	// The Sentry error handler must be before any other error middleware
	appRouter.use(Sentry.Handlers.errorHandler());
}
appRouter.use(errorHandler);
appRouter.use(errorMiddleware);

app.use(appRouter);

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

export { app as __appImmutableListenOnly };
