import { IntegrationDataOAuth1 } from 'server/models';

export const destroyIntegrationDataOAuth1 = (id: string, actorId: string) =>
	IntegrationDataOAuth1.destroy({
		where: { id },
		actorId,
	});
