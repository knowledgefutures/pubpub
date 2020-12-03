import prompt from 'prompt';

export const promptOkay = async (
	message,
	{ yes = false, yesIsDefault = true, throwIfNo = false },
) => {
	if (yes) {
		return true;
	}
	const promptPromise = new Promise((resolve) => {
		prompt.start();
		prompt.get(
			{
				name: 'res',
				message: message,
				validator: /y[es]*|n[o]?/,
				warning: 'Must respond yes or no',
				default: yesIsDefault ? 'yes' : 'no',
			},
			(err, { res }) => {
				if (err) {
					resolve(false);
					return;
				}
				resolve(res.toLowerCase().startsWith('y'));
			},
		);
	});
	const value = await promptPromise;
	if (throwIfNo && !value) {
		throw new Error('Exiting.');
	}
	return value;
};
