import { ZoteroIntegration } from './zotero';

export type IntegrationDataOAuth1 = {
	id: string;
	integrationId: string;
	accessToken: string;
	integration?: ZoteroIntegration;
};
