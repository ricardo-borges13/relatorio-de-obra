import type { Report } from "@/types/report";

const sanitizeSegment = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "Sem_Obra";
};

export const getReportPdfFilename = (report: Report) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(report.serviceDate)
    ? report.serviceDate
    : new Date().toISOString().slice(0, 10);

  return `Relatorio_Obra_${sanitizeSegment(report.workName)}_${date}.pdf`;
};
