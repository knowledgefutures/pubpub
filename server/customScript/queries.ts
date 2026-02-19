import type { CustomScripts, CustomScriptType } from 'types';

import { getFeatureFlagForUserAndCommunity } from 'server/featureFlag/queries';
import { CustomScript } from 'server/models';
import { createLogger } from 'server/utils/queryHelpers/communityGet';

export const setCustomScriptForCommunity = async (
	communityId: string,
	type: CustomScriptType,
	content: string,
) => {
	const existingScriptForType = await CustomScript.findOne({ where: { communityId, type } });
	if (existingScriptForType) {
		existingScriptForType.content = content;
		await existingScriptForType.save();
	} else {
		await CustomScript.create({ communityId, type, content });
	}
};

// Bit of a hack: this function takes a nullable-ish communityId for ergonomics where it is called
// with fake communityData when isBasePubPub = true.
export const getCustomScriptsForCommunity = async (
	communityId: null | undefined | string,
): Promise<CustomScripts> => {
	const { end, log } = createLogger('getCommunityScripts');
	if (typeof communityId !== 'string') {
		return { js: null, css: null };
	}
	const customScriptsEnabled = await log(
		'featureFlags',
		getFeatureFlagForUserAndCommunity(null, communityId, 'customScripts'),
	);
	const customScripts = await log(
		'customScripts',
		CustomScript.findAll({ where: { communityId } }),
	);
	const css = customScripts.find((s) => s.type === 'css');
	if (!customScriptsEnabled) {
		end();
		return { js: null, css: css?.content || null };
	}
	const js = customScripts.find((s) => s.type === 'js');
	end();
	return {
		js: js?.content || null,
		css: css?.content || null,
	};
};
