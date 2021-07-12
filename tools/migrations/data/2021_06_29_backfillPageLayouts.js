import { Page } from 'server/models';
import { generateDefaultPageLayout } from 'utils/pages';

export const up = async () => {
	const defaultLayout = generateDefaultPageLayout();
	const [numAffectedRows] = await Page.update(
		{ layout: defaultLayout },
		{ where: { layout: null } },
	);
	// eslint-disable-next-line no-console
	console.log(`Updated ${numAffectedRows} Pages`);
};
