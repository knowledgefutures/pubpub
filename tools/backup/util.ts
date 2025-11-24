import dateFormat from 'dateformat';
import tmp from 'tmp-promise';

export const getTmpFileForExtension = (extension: string) => tmp.file({ postfix: `.${extension}` });

export const formatDate = (date: Date) => dateFormat(date, 'UTC:yyyy-mm-dd');
