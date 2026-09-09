export type ReportStatus = "draft" | "finished";

export interface ReportPreview {
  id: string;
  service: string;
  workName: string;
  serviceDate: string;
  status: ReportStatus;
}
