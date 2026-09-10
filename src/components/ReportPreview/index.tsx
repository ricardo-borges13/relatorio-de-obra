"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getReportPhotos } from "@/lib/db/photos";
import { getReportById } from "@/lib/db/reports";
import { paginateReportPhotos } from "@/lib/reports/paginate-photos";
import type { Report } from "@/types/report";
import type { ReportPhoto } from "@/types/report-photo";
import ReportPreviewPage from "./ReportPreviewPage";
import styles from "./styles.module.scss";

interface ReportPreviewProps {
  reportId: string;
}

interface PreviewPhoto extends ReportPhoto {
  previewUrl: string;
}

export default function ReportPreview({ reportId }: ReportPreviewProps) {
  const previewUrlsRef = useRef(new Set<string>());
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<PreviewPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const previewUrls = previewUrlsRef.current;

    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedReport, loadedPhotos] = await Promise.all([
          getReportById(reportId),
          getReportPhotos(reportId),
        ]);

        if (!loadedReport) {
          throw new Error("Relatório não encontrado neste dispositivo.");
        }

        const previewPhotos = loadedPhotos
          .sort((firstPhoto, secondPhoto) => firstPhoto.order - secondPhoto.order)
          .map((photo) => ({ ...photo, previewUrl: URL.createObjectURL(photo.blob) }));

        if (!isCurrent) {
          previewPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
          return;
        }

        previewPhotos.forEach((photo) => previewUrls.add(photo.previewUrl));
        setReport(loadedReport);
        setPhotos(previewPhotos);
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar o relatório.",
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      isCurrent = false;
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrls.clear();
    };
  }, [reportId]);

  const reportLink = `/relatorios/${reportId}`;

  if (isLoading) {
    return (
      <main className={styles.previewScreen}>
        <p className={styles.statusMessage}>Carregando prévia do relatório...</p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className={styles.previewScreen}>
        <p className={styles.statusMessage}>{error ?? "Não foi possível carregar o relatório."}</p>
        <Link className={styles.backLink} href={reportLink}>← Voltar para o relatório</Link>
      </main>
    );
  }

  const photoPages = paginateReportPhotos(photos);

  return (
    <main className={styles.previewScreen}>
      <nav className={styles.previewNavigation} aria-label="Navegação da prévia">
        <Link className={styles.backLink} href={reportLink}>← Voltar para o relatório</Link>
      </nav>

      <div className={styles.documentStack}>
        {photoPages.map((photoPage, index) => (
          <ReportPreviewPage
            isFirstPage={photoPage.isFirstPage}
            key={index}
            pageNumber={index + 1}
            photos={photoPage.photos.map((photo) => {
              const previewPhoto = photos.find((currentPhoto) => currentPhoto.id === photo.id);

              return { ...photo, previewUrl: previewPhoto?.previewUrl ?? "" };
            })}
            report={report}
            totalPages={photoPages.length}
          />
        ))}
      </div>
    </main>
  );
}
