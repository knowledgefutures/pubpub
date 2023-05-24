import { getFeatureFlagForUserAndCommunity } from 'server/featureFlag/queries';
import { CustomScript } from 'server/models';
import { CustomScriptType, CustomScripts } from 'types';

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
	if (typeof communityId !== 'string') {
		return { js: null, css: null };
	}
	const customScriptsEnabled = await getFeatureFlagForUserAndCommunity(
		null,
		communityId,
		'customScripts',
	);
	const customScripts = await CustomScript.findAll({ where: { communityId } });
	const css = customScripts.find((s) => s.type === 'css');
	if (!customScriptsEnabled) {
		return { js: null, css: css?.content || null };
	}
	const js = customScripts.find((s) => s.type === 'js');
	return {
		js: js?.content || null,
		css: css?.content || null,
	};
};
