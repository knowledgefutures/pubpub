export type SequelizeModel<T> = T & {
	save: () => Promise<void>;
	destroy: () => Promise<void>;
	toJSON: () => T;
};
