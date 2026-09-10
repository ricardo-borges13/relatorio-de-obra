import type { Report } from "@/types/report";
import type { ReportPhoto } from "@/types/report-photo";

const hasContent = (value: string | undefined) => Boolean(value?.trim());

export const validateReportForPdf = (report: Report, photos: ReportPhoto[]) => {
  const missingFields = [
    !hasContent(report.workName) && "Obra",
    !hasContent(report.engineer) && "Engenheiro responsável",
    !hasContent(report.serviceDate) && "Data",
    !hasContent(report.serviceDescription) && "Descrição do serviço",
  ].filter((field): field is string => Boolean(field));

  if (missingFields.length > 0) {
    return `Preencha os campos obrigatórios: ${missingFields.join(", ")}.`;
  }

  if (photos.length === 0) {
    return "Adicione pelo menos uma fotografia para gerar o PDF.";
  }

  return null;
};
