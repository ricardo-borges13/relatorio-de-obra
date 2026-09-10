import { database } from "./database";
import type { Report, ReportFormValues } from "@/types/report";

const createTimestamp = () => new Date().toISOString();

const optionalValue = (value: string) => value.trim() || undefined;

export const getReportFormValues = (report: Report): ReportFormValues => ({
  workName: report.workName,
  contractor: report.contractor ?? "",
  engineer: report.engineer,
  serviceDate: report.serviceDate,
  location: report.location ?? "",
  serviceDescription: report.serviceDescription,
});

export const createDraftReport = async (id: string): Promise<Report> => {
  return database.transaction("rw", database.reports, async () => {
    const existingReport = await database.reports.get(id);

    if (existingReport) {
      return existingReport;
    }

    const timestamp = createTimestamp();
    const report: Report = {
      id,
      workName: "",
      engineer: "",
      serviceDate: "",
      serviceDescription: "",
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await database.reports.add(report);

    return report;
  });
};

export const getReportById = (id: string) => database.reports.get(id);

export const getSavedReports = () => database.reports.orderBy("updatedAt").reverse().toArray();

export const saveReport = async (
  report: Report,
  values: ReportFormValues,
): Promise<Report> => {
  const updatedReport: Report = {
    ...report,
    workName: values.workName,
    contractor: optionalValue(values.contractor),
    engineer: values.engineer,
    serviceDate: values.serviceDate,
    location: optionalValue(values.location),
    serviceDescription: values.serviceDescription,
    updatedAt: createTimestamp(),
  };

  await database.reports.put(updatedReport);

  return updatedReport;
};

export const touchReport = async (id: string) => {
  const updatedAt = createTimestamp();

  await database.reports.update(id, { updatedAt });

  return updatedAt;
};

export const deleteReport = async (reportId: string) => {
  await database.transaction("rw", database.reports, database.reportPhotos, async () => {
    await database.reportPhotos.where("reportId").equals(reportId).delete();
    await database.reports.delete(reportId);
  });
};
