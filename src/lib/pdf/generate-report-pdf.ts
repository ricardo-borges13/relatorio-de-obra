import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { PDF_PAGE } from "./config";
import { paginateReportPhotos } from "@/lib/reports/paginate-photos";
import type { Report } from "@/types/report";
import type { ReportPhoto } from "@/types/report-photo";

interface EmbeddedPhoto {
  photo: ReportPhoto;
  image: PDFImage;
}

const textColor = rgb(32 / 255, 36 / 255, 37 / 255);
const mutedColor = rgb(108 / 255, 115 / 255, 113 / 255);
const lineColor = rgb(207 / 255, 211 / 255, 209 / 255);
const headerLineColor = rgb(223 / 255, 226 / 255, 224 / 255);
const subtleLineColor = rgb(225 / 255, 228 / 255, 226 / 255);
const photoBackground = rgb(242 / 255, 243 / 255, 242 / 255);
const contentWidth = PDF_PAGE.width - PDF_PAGE.marginX * 2;

const hasContent = (value: string | undefined) => Boolean(value?.trim());

const formatServiceDate = (value: string) => {
  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
};

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number) => {
  const lines: string[] = [];

  text.split(/\r?\n/).forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push("");
      return;
    }

    let line = "";

    paragraph.split(/\s+/).forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;

      if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) {
      lines.push(line);
    }
  });

  return lines;
};

const drawLines = (
  page: PDFPage,
  lines: string[],
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  lineHeight: number,
  color = textColor,
) => {
  lines.forEach((line, index) => {
    if (line) {
      page.drawText(line, { x, y: y - index * lineHeight, font, size, color });
    }
  });

  return y - lines.length * lineHeight;
};

const convertLogoToPng = async () => {
  const response = await fetch("/images/logo-riow.webp");

  if (!response.ok) {
    throw new Error("Não foi possível carregar a logo do relatório.");
  }

  const source = URL.createObjectURL(await response.blob());
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Não foi possível preparar a logo do relatório."));
      image.src = source;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar a logo do relatório.");
    }

    context.drawImage(image, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível preparar a logo do relatório."))), "image/png");
    });
    canvas.width = 0;
    canvas.height = 0;

    return pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(source);
  }
};

const drawFooter = (page: PDFPage, pageNumber: number, totalPages: number, regular: PDFFont) => {
  const y = PDF_PAGE.marginBottom - 7;
  page.drawLine({ start: { x: PDF_PAGE.marginX, y: y + 13 }, end: { x: PDF_PAGE.width - PDF_PAGE.marginX, y: y + 13 }, thickness: 0.7, color: lineColor });
  page.drawText("RIOW | Relatório de Obra", { x: PDF_PAGE.marginX, y, font: regular, size: 6.5, color: mutedColor });
  const pagination = `Página ${pageNumber} de ${totalPages}`;
  page.drawText(pagination, { x: PDF_PAGE.width - PDF_PAGE.marginX - regular.widthOfTextAtSize(pagination, 6.5), y, font: regular, size: 6.5, color: mutedColor });
};

const drawServiceData = (page: PDFPage, report: Report, regular: PDFFont, bold: PDFFont, startY: number) => {
  page.drawText("DADOS DO SERVIÇO", { x: PDF_PAGE.marginX, y: startY, font: bold, size: 8, color: textColor });
  const columnWidth = (contentWidth - 28) / 2;
  const drawColumn = (items: Array<[string, string | undefined]>, x: number) => {
    let y = startY - 17;

    items.forEach(([label, value]) => {
      if (!hasContent(value)) return;
      page.drawText(label.toUpperCase(), { x, y, font: bold, size: 6.2, color: mutedColor });
      y -= 10;
      const lines = wrapText(value ?? "", regular, 7.5, columnWidth);
      y = drawLines(page, lines, x, y, regular, 7.5, 10.4) - 3;
      page.drawLine({ start: { x, y }, end: { x: x + columnWidth, y }, thickness: 0.5, color: subtleLineColor });
      y -= 7;
    });

    return y;
  };

  const leftY = drawColumn([
    ["Obra", report.workName],
    ["Engenheiro responsável", report.engineer],
    ["Data", formatServiceDate(report.serviceDate)],
  ], PDF_PAGE.marginX);
  const rightY = drawColumn([
    ["Empresa terceirizada", report.contractor],
    ["Local / setor", report.location],
  ], PDF_PAGE.marginX + columnWidth + 28);

  return Math.min(leftY, rightY) - 8;
};

const drawPhotoGrid = (
  page: PDFPage,
  photos: EmbeddedPhoto[],
  startY: number,
  rows: number,
  regular: PDFFont,
  bold: PDFFont,
) => {
  const gap = 12;
  const columnWidth = (contentWidth - gap) / 2;
  const frameHeight = columnWidth * 9 / 16;
  const preparedPhotos = photos.map(({ photo, image }) => {
    const description = photo.description.trim();
    const descriptionLines = description ? wrapText(description, regular, 6.2, columnWidth - 16) : [];

    return {
      photo,
      image,
      descriptionLines,
      captionHeight: 20 + descriptionLines.length * 8,
    };
  });
  const rowHeights = Array.from({ length: rows }, (_, row) => {
    const rowPhotos = preparedPhotos.slice(row * 2, row * 2 + 2);

    return rowPhotos.length > 0
      ? frameHeight + Math.max(...rowPhotos.map(({ captionHeight }) => captionHeight))
      : 0;
  });
  const rowTopPositions = rowHeights.reduce<number[]>((positions, rowHeight, row) => {
    positions.push(row === 0 ? startY : positions[row - 1] - rowHeights[row - 1] - gap);

    return positions;
  }, []);

  preparedPhotos.forEach(({ photo, image, descriptionLines, captionHeight }, index) => {
    const row = Math.floor(index / 2);
    const column = index % 2;
    const x = PDF_PAGE.marginX + column * (columnWidth + gap);
    const top = rowTopPositions[row];
    const cardHeight = frameHeight + captionHeight;
    const frameY = top - frameHeight;

    page.drawRectangle({ x, y: top - cardHeight, width: columnWidth, height: cardHeight, borderColor: lineColor, borderWidth: 0.7 });
    page.drawRectangle({ x, y: frameY, width: columnWidth, height: frameHeight, color: photoBackground });
    page.drawImage(image, { x, y: frameY, width: columnWidth, height: frameHeight });
    page.drawLine({ start: { x, y: frameY }, end: { x: x + columnWidth, y: frameY }, thickness: 0.5, color: subtleLineColor });
    page.drawText(`Foto ${String(photo.order + 1).padStart(2, "0")}`, { x: x + 8, y: frameY - 12, font: bold, size: 6.8, color: textColor });
    if (descriptionLines.length > 0) {
      drawLines(page, descriptionLines, x + 8, frameY - 21, regular, 6.2, 8, mutedColor);
    }
  });
};

export const generateReportPdf = async (report: Report, reportPhotos: ReportPhoto[]) => {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Relatório de Obra");
  pdf.setAuthor("RIOW");
  pdf.setSubject(report.workName);

  const [regular, bold, logoData] = await Promise.all([
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
    convertLogoToPng(),
  ]);
  const logo = await pdf.embedPng(logoData);
  const embeddedPhotos = await Promise.all(
    reportPhotos.map(async (photo) => ({ photo, image: await pdf.embedJpg(await photo.blob.arrayBuffer()) })),
  );
  const photoPages = paginateReportPhotos(reportPhotos);

  photoPages.forEach((photoPage, index) => {
    const page = pdf.addPage([PDF_PAGE.width, PDF_PAGE.height]);
    const pageNumber = index + 1;
    const photos = photoPage.photos.map((photo) => embeddedPhotos.find(({ photo: sourcePhoto }) => sourcePhoto.id === photo.id)).filter((photo): photo is EmbeddedPhoto => Boolean(photo));
    let photoStartY: number;

    if (photoPage.isFirstPage) {
      const logoWidth = 112;
      const logoHeight = logo.height * (logoWidth / logo.width);
      const logoY = PDF_PAGE.height - PDF_PAGE.marginTop - logoHeight;
      page.drawImage(logo, { x: PDF_PAGE.marginX, y: logoY, width: logoWidth, height: logoHeight });
      page.drawText("RIOW", { x: PDF_PAGE.width - PDF_PAGE.marginX - 34, y: PDF_PAGE.height - PDF_PAGE.marginTop - 5, font: bold, size: 7, color: mutedColor });
      const title = "Relatório de Obra";
      page.drawText(title, { x: PDF_PAGE.width - PDF_PAGE.marginX - bold.widthOfTextAtSize(title, 17), y: PDF_PAGE.height - PDF_PAGE.marginTop - 24, font: bold, size: 17, color: textColor });
      const headerLineY = PDF_PAGE.height - PDF_PAGE.marginTop - 42;
      page.drawLine({ start: { x: PDF_PAGE.marginX, y: headerLineY }, end: { x: PDF_PAGE.width - PDF_PAGE.marginX, y: headerLineY }, thickness: 0.6, color: headerLineColor });
      const descriptionY = drawServiceData(page, report, regular, bold, headerLineY - 24);
      page.drawText("DESCRIÇÃO DO SERVIÇO", { x: PDF_PAGE.marginX, y: descriptionY, font: bold, size: 8, color: textColor });
      const descriptionLines = wrapText(report.serviceDescription.trim(), regular, 7.5, contentWidth);
      photoStartY = drawLines(page, descriptionLines, PDF_PAGE.marginX, descriptionY - 14, regular, 7.5, 10.5) - 22;
      const photoSectionTitle = "REGISTRO FOTOGRÁFICO";
      page.drawText(photoSectionTitle, {
        x: PDF_PAGE.marginX + (contentWidth - bold.widthOfTextAtSize(photoSectionTitle, 8)) / 2,
        y: photoStartY,
        font: bold,
        size: 8,
        color: textColor,
      });
      photoStartY -= 18;
    } else {
      const logoWidth = 80;
      const logoHeight = logo.height * (logoWidth / logo.width);
      const logoY = PDF_PAGE.height - PDF_PAGE.marginTop - logoHeight + 3;
      page.drawImage(logo, { x: PDF_PAGE.marginX, y: logoY, width: logoWidth, height: logoHeight });
      const title = "Relatório de Obra";
      page.drawText(title, { x: PDF_PAGE.width - PDF_PAGE.marginX - bold.widthOfTextAtSize(title, 8), y: PDF_PAGE.height - PDF_PAGE.marginTop - 15, font: bold, size: 8, color: textColor });
      const headerLineY = PDF_PAGE.height - PDF_PAGE.marginTop - 32;
      page.drawLine({ start: { x: PDF_PAGE.marginX, y: headerLineY }, end: { x: PDF_PAGE.width - PDF_PAGE.marginX, y: headerLineY }, thickness: 0.6, color: headerLineColor });
      photoStartY = headerLineY - 18;
    }

    drawPhotoGrid(page, photos, photoStartY, photoPage.isFirstPage ? 2 : 3, regular, bold);
    drawFooter(page, pageNumber, photoPages.length, regular);
  });

  return new Blob([Uint8Array.from(await pdf.save())], { type: "application/pdf" });
};
