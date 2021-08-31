export type SlugStatus = 'available' | 'used' | 'reserved';

export type ForbiddenSlugStatus = Exclude<SlugStatus, 'available'>;
