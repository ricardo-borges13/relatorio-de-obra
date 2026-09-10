import type { ImageDiagnostics } from "@/types/report-photo";

export type { ImageDiagnostics } from "@/types/report-photo";

export interface ProcessedImage {
  file: File;
  diagnostics: ImageDiagnostics;
}
