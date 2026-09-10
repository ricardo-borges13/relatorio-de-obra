export const downloadReportPdf = (pdfBlob: Blob, filename: string) => {
  const url = URL.createObjectURL(pdfBlob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
