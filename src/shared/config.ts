import { join } from 'path';

export const FILE_UPLOADS_NAME = 'static' as const;
export const FILE_UPLOADS_DIR = join(
  import.meta.dirname,
  '..',
  '..',
  FILE_UPLOADS_NAME,
);
