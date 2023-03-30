import { ZoteroIntegration } from 'server/models';

export const getZoteroIntegration = (userId: string) =>
	ZoteroIntegration.findOne({ where: { userId } });
