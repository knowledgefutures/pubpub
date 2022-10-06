import chalk from 'chalk';

import { isProd } from 'utils/environment';
import { addWorkerTask } from 'server/utils/workers';
import { sendEmail } from 'server/utils/email';
import * as facets from 'server/facets';
import { getPubDraftDoc, getPubDraftRef, editFirebaseDraftByRef } from 'server/utils/firebaseAdmin';
import * as featureFlags from 'server/featureFlag/interface';
import * as tasks from 'workers/tasks';
import * as models from 'server/models';

const pilcrow = '¶';
const prompt = isProd() ? chalk.redBright(`[PROD] ${pilcrow} `) : chalk.greenBright(`${pilcrow} `);

const banner = () => {
	const color = isProd() ? chalk.redBright : chalk.greenBright;
	console.log(
		color(isProd() ? 'PubPub PROD devshell. Use caution.' : 'Welcome to the PubPub devshell.'),
	);
	console.log(color("Call scope() to see what's in scope."));
};

const generateFindFunctions = () => {
	return Object.fromEntries(
		['Collection', 'Community', 'Pub', 'User'].map((modelName) => {
			const Model = models[modelName];
			const fn = (whereQuery) => Model.findOne({ where: whereQuery });
			return [`find${modelName}`, fn];
		}),
	);
};

const clear = () => {
	process.stdout.write('\u001B[2J\u001B[0;0f');
};

const scope = () => {
	console.log(Object.keys(context).join(', '));
};

const context = {
	...tasks,
	...models,
	...featureFlags,
	...facets,
	...generateFindFunctions(),
	clear,
	scope,
	addWorkerTask,
	sendEmail,
	getPubDraftDoc,
	getPubDraftRef,
	editFirebaseDraftByRef,
};

module.exports = {
	context,
	prompt,
	banner,
	enableAwait: true,
};
