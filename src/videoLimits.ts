export const MAX_SOURCE_VIDEO_BYTES = 100 * 1024 * 1024
export const MAX_UPLOAD_VIDEO_BYTES = 49 * 1024 * 1024
export const TARGET_COMPRESSED_VIDEO_BYTES = 44 * 1024 * 1024

export function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}
