import tmp from 'tmp-promise';
import dateFormat from 'dateformat';

export const getTmpFileForExtension = (extension: string) => tmp.file({ postfix: `.${extension}` });

export const formatDate = (date: Date) => dateFormat(date, 'UTC:yyyy-mm-dd');
