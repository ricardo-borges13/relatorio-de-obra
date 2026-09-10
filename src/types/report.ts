export type ReportStatus = "draft" | "finished";

export interface Report {
  id: string;
  workName: string;
  contractor?: string;
  engineer: string;
  serviceDate: string;
  location?: string;
  serviceDescription: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFormValues {
  workName: string;
  contractor: string;
  engineer: string;
  serviceDate: string;
  location: string;
  serviceDescription: string;
}
