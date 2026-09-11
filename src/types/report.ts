export type ReportStatus = "draft" | "finished";
export type PhotoLayout = "landscape" | "portrait";

export interface Report {
  id: string;
  workName: string;
  contractor?: string;
  engineer: string;
  serviceDate: string;
  location?: string;
  serviceDescription: string;
  /** Optional only to keep reports created before this field compatible. */
  photoLayout?: PhotoLayout;
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
