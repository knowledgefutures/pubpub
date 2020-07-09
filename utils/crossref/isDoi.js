const PATTERN = /\b10\.(?:97[89]\.\d{2,8}\/\d{1,7}|\d{4,9}\/\S+)/;

export const isDoi = (value) => typeof value === 'string' && PATTERN.test(value);
