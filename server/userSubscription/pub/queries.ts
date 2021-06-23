import { createUserSubscription } from '../shared/queries';

type QueryOptions = {
	userId: string;
	pubId: string;
};

type CreateOptions = QueryOptions & {
	createdAutomatically: boolean;
};

export const createUserPubSubscription = (options: CreateOptions) => {
	// TODO(ian): In the event that we use Pub subscriptions for anything other
	// than Thread item notifciations, we'll want to add some permissions checks here.
	// As it stands, we allow any user to subscribe to a Pub by ID, but they will only receive
	// notifications about Threads that they have permission to view.
	return createUserSubscription(options);
};
