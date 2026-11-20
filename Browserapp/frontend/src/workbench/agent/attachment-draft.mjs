const defaultMime = 'application/octet-stream';
const folderMime = 'inode/directory';
const imageTypes = { avif: 'image/avif', bmp: 'image/bmp', gif: 'image/gif', jpeg: 'image/jpeg', jpg: 'image/jpeg',
  png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp' };
const fileId = kind => `local${kind ? `-${kind}` : ''}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function typeOf(name, type) {
  if (type && type !== defaultMime) return type;
  const suffix = name.split('.').at(-1)?.toLowerCase();
  return Object.hasOwn(imageTypes, suffix) ? imageTypes[suffix] : defaultMime;
}

const image = (name, mime) => mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(name);

export function releasePreviews(files) {
  for (const { preview } of files ?? []) if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
}

export function fileDraft(file) {
  const mimeType = typeOf(file.name, file.type);
  return { fileId: fileId(''), kind: 'file', fileName: file.name, mimeType, size: file.size,
    preview: image(file.name, mimeType) ? URL.createObjectURL(file) : undefined, localFile: file, uploadStatus: 'uploading' };
}

export function folderDraft({ name, files: selection, path }) {
  const files = selection ?? [];
  return { fileId: fileId('folder'), kind: 'folder', fileName: name, mimeType: folderMime,
    size: files.reduce((bytes, file) => bytes + file.size, 0), localFiles: files.length ? files : undefined, localPath: path,
    uploadStatus: path ? 'uploaded' : 'uploading' };
}

export function pathDraft({ kind, name, path }) {
  const mimeType = kind === 'folder' ? folderMime : typeOf(name);
  return { fileId: fileId('path'), kind, fileName: name, mimeType, localPath: path,
    preview: kind === 'file' && image(name, mimeType) ? globalThis.__attachmentPreviewPath(path) : undefined, uploadStatus: 'uploaded' };
}

export function localAttachmentRefs(files) {
  return files.flatMap(({ kind, fileName, mimeType, localPath }) => localPath ? [{ kind, fileName, mimeType, localPath }] : []);
}

export function mergeUploadedFiles(files, completed) {
  const uploaded = [...completed];
  return files.map(file => {
    let index = uploaded.findIndex(candidate => candidate.fileId === file.fileId);
    if (index < 0 && file.kind === 'file' && file.localPath) {
      index = uploaded.findIndex(candidate => candidate.kind === 'file' && candidate.fileName === file.fileName);
    }
    if (index < 0) return file;
    const [result] = uploaded.splice(index, 1);
    const { localFile, localFiles, localPath, ...details } = file;
    return { ...details, ...result, kind: file.kind, ...(file.preview && { preview: file.preview }), uploadStatus: 'uploaded' };
  });
}
