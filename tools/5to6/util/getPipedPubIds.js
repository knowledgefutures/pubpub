module.exports = () =>
	new Promise((resolve) => {
		const ids = [];
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', (data) => {
			ids.push(...data.trim().split('\n'));
		});
		process.stdin.on('end', () => resolve(ids));
	});
