export interface ImageDiagnostics {
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  optimizedWidth: number;
  optimizedHeight: number;
  optimizedSize: number;
}

export interface ReportPhoto extends ImageDiagnostics {
  id: string;
  reportId: string;
  blob: Blob;
  description: string;
  order: number;
  createdAt: string;
}
