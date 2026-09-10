"use client";

import Header from "@/components/Header";
import { getSavedReports } from "@/lib/db/reports";
import type { Report } from "@/types/report";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.scss";

const formatServiceDate = (serviceDate: string) => {
  if (!serviceDate) {
    return "Data não informada";
  }

  const [year, month, day] = serviceDate.split("-");

  return year && month && day ? `${day}/${month}/${year}` : serviceDate;
};

const statusLabel = {
  draft: "Rascunho",
  finished: "Finalizado",
} as const;

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadReports = async () => {
      try {
        const savedReports = await getSavedReports();

        if (isCurrent) {
          setReports(savedReports);
        }
      } catch {
        if (isCurrent) {
          setLoadError(true);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <section className={styles.introduction} aria-labelledby="page-title">
          <div className={styles.introductionCopy}>
            <h1 id="page-title">Relatórios de Obra</h1>
            <p className={styles.description}>
              Registre serviços terceirizados executados na obra e gere relatórios fotográficos profissionais.
            </p>
            <Link className={styles.newReportButton} href="/relatorios/novo">
              <span aria-hidden="true">+</span>
              Novo relatório
            </Link>
          </div>
        </section>

        <section className={styles.savedReports} aria-labelledby="saved-reports-title">
          <div className={styles.sectionHeading}>
            <h2 id="saved-reports-title">Relatórios salvos</h2>
          </div>

          {isLoading ? (
            <p className={styles.loadingState}>Carregando relatórios...</p>
          ) : loadError ? (
            <p className={styles.loadingState}>Não foi possível carregar os relatórios salvos.</p>
          ) : reports.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateTitle}>Nenhum relatório salvo neste dispositivo.</p>
              <p className={styles.emptyStateDescription}>
                Os relatórios criados serão armazenados localmente neste dispositivo.
              </p>
            </div>
          ) : (
            <div className={styles.reportList}>
              {reports.map((report) => (
                <Link className={styles.reportCard} href={`/relatorios/${report.id}`} key={report.id}>
                  <div>
                    <p className={styles.reportService}>
                      {report.serviceDescription || "Serviço sem descrição"}
                    </p>
                    <p className={styles.reportDetails}>
                      {report.workName || "Obra não informada"} • {formatServiceDate(report.serviceDate)}
                    </p>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[`status${report.status}`]}`}>
                    {statusLabel[report.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
