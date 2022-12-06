export type SequelizeModel<T> = T & {
	save: () => Promise<void>;
	destroy: () => Promise<void>;
	toJSON: () => T;
	update: (patch: Partial<T>) => Promise<void>;
};
