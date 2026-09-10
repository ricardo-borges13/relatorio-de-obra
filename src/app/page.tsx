"use client";

import Header from "@/components/Header";
import { deleteReport, getSavedReports } from "@/lib/db/reports";
import type { Report } from "@/types/report";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";

const formatServiceDate = (serviceDate: string) => {
  if (!serviceDate) {
    return null;
  }

  const [year, month, day] = serviceDate.split("-");

  return year && month && day ? `${day}/${month}/${year}` : serviceDate;
};

const statusLabel = {
  draft: "Rascunho",
  finished: "Finalizado",
} as const;

const getReportTitle = (report: Report) =>
  report.serviceDescription.trim() || "Rascunho em andamento";

const getReportDetails = (report: Report) => {
  const details = [
    report.workName.trim() || "Preenchimento ainda não concluído",
    formatServiceDate(report.serviceDate),
  ].filter((detail): detail is string => Boolean(detail));

  return details.join(" • ");
};

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelDeleteButtonRef = useRef<HTMLButtonElement>(null);
  const openMenuWrapRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef(new Map<string, HTMLButtonElement>());

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (reportToDelete && !isDeleting) {
        setReportToDelete(null);
        setDeleteError(null);
        return;
      }

      if (openMenuId) {
        setOpenMenuId(null);
        menuButtonRefs.current.get(openMenuId)?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, openMenuId, reportToDelete]);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && openMenuWrapRef.current?.contains(event.target)) {
        return;
      }

      setOpenMenuId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuId]);

  useEffect(() => {
    if (reportToDelete) {
      cancelDeleteButtonRef.current?.focus();
    }
  }, [reportToDelete]);

  const openDeleteConfirmation = (report: Report) => {
    setOpenMenuId(null);
    setDeleteError(null);
    setReportToDelete(report);
  };

  const closeDeleteConfirmation = () => {
    if (!isDeleting) {
      setReportToDelete(null);
      setDeleteError(null);
    }
  };

  const handleReportDeletion = async () => {
    if (!reportToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteReport(reportToDelete.id);
      setReports((currentReports) =>
        currentReports.filter((report) => report.id !== reportToDelete.id),
      );
      setReportToDelete(null);
    } catch {
      setDeleteError("Não foi possível excluir este relatório. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

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
                <article className={`${styles.reportCard} ${styles[`reportCard${report.status}`]}`} key={report.id}>
                  <Link className={styles.reportCardLink} href={report.status === "finished" ? `/relatorios/${report.id}/preview` : `/relatorios/${report.id}`}>
                    <div>
                      <p className={styles.reportService}>{getReportTitle(report)}</p>
                      <p className={styles.reportDetails}>{getReportDetails(report)}</p>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status${report.status}`]}`}>
                      {statusLabel[report.status]}
                    </span>
                  </Link>

                  <div className={styles.reportMenuWrap} ref={openMenuId === report.id ? openMenuWrapRef : undefined}>
                    <button
                      aria-expanded={openMenuId === report.id}
                      aria-haspopup="menu"
                      aria-label={`Opções do relatório ${report.workName || report.id}`}
                      className={styles.reportMenuButton}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpenMenuId((currentId) => (currentId === report.id ? null : report.id));
                      }}
                      ref={(element) => {
                        if (element) {
                          menuButtonRefs.current.set(report.id, element);
                          return;
                        }

                        menuButtonRefs.current.delete(report.id);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">⋮</span>
                    </button>

                    {openMenuId === report.id && (
                      <div className={styles.reportMenu} role="menu">
                        <Link
                          className={styles.reportMenuItem}
                          href={report.status === "finished" ? `/relatorios/${report.id}/preview` : `/relatorios/${report.id}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                          }}
                          role="menuitem"
                        >
                          {report.status === "finished" ? "Visualizar" : "Editar"}
                        </Link>
                        <button
                          className={`${styles.reportMenuItem} ${styles.deleteMenuItem}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openDeleteConfirmation(report);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {reportToDelete && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteConfirmation();
            }
          }}
        >
          <section
            aria-describedby="delete-report-description"
            aria-labelledby="delete-report-title"
            aria-modal="true"
            className={styles.deleteModal}
            role="dialog"
          >
            <h2 id="delete-report-title">Excluir relatório?</h2>
            <p id="delete-report-description">
              O relatório e todas as fotos associadas serão removidos deste dispositivo.
            </p>
            {deleteError && <p className={styles.deleteError} role="alert">{deleteError}</p>}
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelButton}
                disabled={isDeleting}
                onClick={closeDeleteConfirmation}
                ref={cancelDeleteButtonRef}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={styles.modalDeleteButton}
                disabled={isDeleting}
                onClick={() => void handleReportDeletion()}
                type="button"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
