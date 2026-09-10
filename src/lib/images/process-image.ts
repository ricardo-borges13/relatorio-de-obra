import { IMAGE_PROCESSING_CONFIG } from "./config";
import type { ProcessedImage } from "./types";

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

const getResizedDimensions = (width: number, height: number) => {
  const largestDimension = Math.max(width, height);

  if (largestDimension <= IMAGE_PROCESSING_CONFIG.maxDimension) {
    return { width, height };
  }

  const scale = IMAGE_PROCESSING_CONFIG.maxDimension / largestDimension;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

const createCanvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Não foi possível gerar a imagem otimizada."));
      },
      IMAGE_PROCESSING_CONFIG.mimeType,
      IMAGE_PROCESSING_CONFIG.quality,
    );
  });

const loadImageElement = (file: File) => {
  const sourceUrl = URL.createObjectURL(file);
  const image = new Image();

  return new Promise<DecodedImage>((resolve, reject) => {
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        dispose: () => URL.revokeObjectURL(sourceUrl),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("Não foi possível carregar esta imagem."));
    };
    image.src = sourceUrl;
  });
};

const decodeImage = async (file: File): Promise<DecodedImage> => {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // The image element fallback keeps the flow available in browsers without ImageBitmap support.
    }
  }

  return loadImageElement(file);
};

const createOptimizedFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "foto";

  return `${baseName}.jpg`;
};

export const isSupportedImage = (file: File) => file.type.startsWith("image/");

export const processImage = async (file: File): Promise<ProcessedImage> => {
  if (!isSupportedImage(file)) {
    throw new Error("O arquivo selecionado não é uma imagem.");
  }

  const decodedImage = await decodeImage(file);
  const { width, height } = getResizedDimensions(decodedImage.width, decodedImage.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  try {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar a imagem para processamento.");
    }

    context.drawImage(decodedImage.source, 0, 0, width, height);
    const blob = await createCanvasBlob(canvas);

    return {
      file: new File([blob], createOptimizedFileName(file.name), {
        type: IMAGE_PROCESSING_CONFIG.mimeType,
        lastModified: Date.now(),
      }),
      diagnostics: {
        originalWidth: decodedImage.width,
        originalHeight: decodedImage.height,
        originalSize: file.size,
        optimizedWidth: width,
        optimizedHeight: height,
        optimizedSize: blob.size,
      },
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    decodedImage.dispose();
  }
};
