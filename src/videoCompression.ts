import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'
import { FFmpeg, FFFSType, type ProgressEventCallback } from '@ffmpeg/ffmpeg'
import {
  MAX_SOURCE_VIDEO_BYTES,
  MAX_UPLOAD_VIDEO_BYTES,
  TARGET_COMPRESSED_VIDEO_BYTES,
} from './videoLimits'

export type VideoCompressionProgress = {
  phase: 'loading' | 'compressing'
  percent: number
}

export async function prepareVideoForUpload(
  file: File,
  onProgress?: (progress: VideoCompressionProgress) => void,
) {
  if (file.size > MAX_SOURCE_VIDEO_BYTES) {
    throw new Error('El video supera el máximo permitido de 100 MB.')
  }

  if (file.size <= MAX_UPLOAD_VIDEO_BYTES) return file

  const duration = await getVideoDuration(file)
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('No se pudo leer la duración del video para comprimirlo.')
  }

  onProgress?.({ phase: 'loading', percent: 0 })

  const ffmpeg = new FFmpeg()
  const inputExtension = getSafeVideoExtension(file.name)
  const inputName = `input.${inputExtension}`
  const inputDirectory = '/source'
  const inputPath = `${inputDirectory}/${inputName}`
  const progressHandler: ProgressEventCallback = ({ progress }) => {
    const percent = Math.max(0, Math.min(99, Math.round(progress * 100)))
    onProgress?.({ phase: 'compressing', percent })
  }

  ffmpeg.on('progress', progressHandler)

  try {
    await ffmpeg.load({ coreURL, wasmURL })
    await ffmpeg.createDir(inputDirectory)
    await ffmpeg.mount(FFFSType.WORKERFS, {
      blobs: [{ name: inputName, data: file }],
    }, inputDirectory)

    let { videoBitrate, audioBitrate } = calculateBitrates(duration)

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const outputName = `compressed-${attempt}.mp4`
      const audioArguments = audioBitrate === null
        ? ['-an']
        : ['-c:a', 'aac', '-b:a', `${audioBitrate}k`]
      const exitCode = await ffmpeg.exec([
        '-i', inputPath,
        '-map', '0:v:0',
        ...(audioBitrate === null ? [] : ['-map', '0:a:0?']),
        '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1',
        '-r', '30',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-b:v', `${videoBitrate}k`,
        '-maxrate', `${videoBitrate}k`,
        '-bufsize', `${videoBitrate * 2}k`,
        ...audioArguments,
        '-movflags', '+faststart',
        outputName,
      ])

      if (exitCode !== 0) throw new Error('FFmpeg no pudo comprimir el video.')

      const output = await ffmpeg.readFile(outputName)
      if (!(output instanceof Uint8Array)) throw new Error('La compresión produjo un archivo inválido.')

      const bytes = output.slice()
      await ffmpeg.deleteFile(outputName)

      if (bytes.byteLength <= MAX_UPLOAD_VIDEO_BYTES) {
        onProgress?.({ phase: 'compressing', percent: 100 })
        return new File([bytes], `${stripExtension(file.name)}-comprimido.mp4`, {
          type: 'video/mp4',
          lastModified: Date.now(),
        })
      }

      videoBitrate = Math.max(12, Math.floor(videoBitrate * 0.78))
      if (audioBitrate !== null) audioBitrate = Math.max(24, Math.floor(audioBitrate * 0.86))
    }

    throw new Error('No se pudo reducir el video por debajo de 50 MB.')
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No se pudo')) throw error
    throw new Error('No se pudo comprimir el video en este navegador.')
  } finally {
    ffmpeg.off('progress', progressHandler)
    try {
      await ffmpeg.unmount(inputDirectory)
    } catch {
      // The mount may not exist when loading the WebAssembly core fails.
    }
    ffmpeg.terminate()
  }
}

function calculateBitrates(durationSeconds: number) {
  const targetTotalKbps = Math.floor((TARGET_COMPRESSED_VIDEO_BYTES * 8 * 0.96) / durationSeconds / 1000)
  const audioBitrate = targetTotalKbps < 80 ? null : targetTotalKbps < 350 ? 48 : 96
  return {
    audioBitrate,
    videoBitrate: Math.max(12, Math.min(8000, targetTotalKbps - (audioBitrate ?? 0))),
  }
}

function getVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    }

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      cleanup()
      resolve(duration)
    }
    video.onerror = () => {
      cleanup()
      reject(new Error('No se pudo leer la duración del video.'))
    }
    video.src = url
  })
}

function getSafeVideoExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return extension && extension.length <= 5 ? extension : 'mp4'
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'video'
}
