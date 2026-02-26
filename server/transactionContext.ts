import { clsNamespace, sequelize } from './sequelize';

// runs `fn` inside a transaction. if there is already a transaction
// in the async context, reuses it instead of creating a nested one.
export const withTransaction = async <T>(fn: () => Promise<T>): Promise<T> => {
	if (clsNamespace.get('transaction')) {
		return fn();
	}
	return sequelize.transaction(() => fn());
};
