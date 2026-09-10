export interface ImageDiagnostics {
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  optimizedWidth: number;
  optimizedHeight: number;
  optimizedSize: number;
}

export interface ProcessedImage {
  file: File;
  diagnostics: ImageDiagnostics;
}
