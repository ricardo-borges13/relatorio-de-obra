import Dexie, { type Table } from "dexie";
import type { Report } from "@/types/report";
import type { ReportPhoto } from "@/types/report-photo";

class RiowReportsDatabase extends Dexie {
  reports!: Table<Report, string>;
  reportPhotos!: Table<ReportPhoto, string>;

  constructor() {
    super("riowReportsDB");

    this.version(1).stores({
      reports: "id, updatedAt, status, serviceDate",
      reportPhotos: "id, reportId, order, [reportId+order]",
    });
  }
}

export const database = new RiowReportsDatabase();
