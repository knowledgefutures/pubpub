/* eslint-disable no-console */
const diff = require('diff');
const chalk = require('chalk');
const stableStringify = require('json-stable-stringify');

const { storage, pubIds } = require('./setup');

const printDiffs = (errors) => {
	errors.forEach(({ payload }) => {
		if (payload && payload.isDiff) {
			const { closest, actual } = payload;
			const closestString = stableStringify(closest, { space: ' ' });
			const actualString = stableStringify(actual, { space: ' ' });
			diff.diffTrimmedLines(closestString, actualString).forEach((part) => {
				if (part.added) {
					console.log(chalk.green(part.value));
				} else if (part.removed) {
					console.log(chalk.red(part.value));
				}
			});
			console.log('\n');
		}
	});
};

const getStatus = () =>
	pubIds.reduce(
		(current, pubId) => {
			const { transformed, warning, error, unstarted } = current;
			const pubDir = storage.within(`pubs/${pubId}`);
			if (pubDir.exists('problems.json')) {
				const problems = JSON.parse(pubDir.read('problems.json'));
				if (problems.errors.length) {
					return { ...current, error: { ...error, [pubId]: problems } };
				}
				if (problems.warnings.length) {
					return { ...current, warning: { ...warning, [pubId]: problems } };
				}
			}
			if (pubDir.exists('transformed.json')) {
				return { ...current, transformed: { ...transformed, [pubId]: true } };
			}
			return { ...current, unstarted: { ...unstarted, [pubId]: true } };
		},
		{ transformed: {}, warning: {}, error: {}, unstarted: {} },
	);

const main = () => {
	const shouldPrintStatuses = [process.argv.find((x) => x.startsWith('--print-status'))]
		.filter((x) => x)
		.map((arg) => arg.split('=')[1].split(','))[0];
	const filterMessage = [process.argv.find((x) => x.startsWith('--filter-message'))]
		.filter((x) => x)
		.map((arg) => arg.split('=')[1])[0];
	const shouldPrintAllStatuses = shouldPrintStatuses && shouldPrintStatuses[0] === 'all';
	const shouldPrintDiffs = process.argv.includes('--print-diffs');
	const shouldPrintProblems = process.argv.includes('--print-problems');
	const shouldPrintTotals = process.argv.includes('--print-totals');
	const status = getStatus();
	Object.entries(status).forEach(([key, pubInfo]) => {
		const pubIdsForKey = Object.keys(pubInfo);
		if (shouldPrintTotals) {
			console.log(`${key}: ${pubIdsForKey.length}`);
		}
		if (shouldPrintAllStatuses || (shouldPrintStatuses && shouldPrintStatuses.includes(key))) {
			pubIdsForKey.forEach((id) => {
				const problems = pubInfo[id];
				if (filterMessage) {
					if (problems) {
						if (
							![...problems.warnings, ...problems.errors].some((problem) => {
								const message =
									problem.message || (typeof problem === 'string' ? problem : '');
								return message.toLowerCase().includes(filterMessage.toLowerCase());
							})
						) {
							return;
						}
					} else {
						return;
					}
				}
				console.log(id);
				if (shouldPrintProblems) {
					console.log(
						JSON.stringify(
							{
								...problems,
								errors: (problems.errors || []).map((error) => {
									if (typeof error === 'string') {
										return error;
									}
									return {
										...error,
										payload:
											error.payload && error.payload.isDiff
												? '[Hiding large diff payload]'
												: error.payload,
									};
								}),
							},
							null,
							2,
						),
					);
				}
				if (shouldPrintDiffs) {
					printDiffs(problems.errors);
				}
			});
		}
	});
};

main();
