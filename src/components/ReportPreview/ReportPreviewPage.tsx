import Image from "next/image";
import type { Report } from "@/types/report";
import type { ReportPhoto } from "@/types/report-photo";
import PhotoPreviewItem from "./PhotoPreviewItem";
import styles from "./styles.module.scss";
import { getPhotoLayout } from "@/lib/reports/paginate-photos";

interface PreviewPhoto extends ReportPhoto {
  previewUrl: string;
}

interface ReportPreviewPageProps {
  isFirstPage: boolean;
  pageNumber: number;
  photos: PreviewPhoto[];
  report: Report;
  totalPages: number;
}

const hasContent = (value: string | undefined) => Boolean(value?.trim());

const formatServiceDate = (value: string) => {
  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
};

interface ServiceDataProps {
  label: string;
  value: string | undefined;
}

function ServiceData({ label, value }: ServiceDataProps) {
  if (!hasContent(value)) {
    return null;
  }

  return (
    <div className={styles.serviceDataItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function ReportPreviewPage({
  isFirstPage,
  pageNumber,
  photos,
  report,
  totalPages,
}: ReportPreviewPageProps) {
  const hasServiceData = [
    report.workName,
    report.contractor,
    report.engineer,
    report.serviceDate,
    report.location,
  ].some(hasContent);
  const serviceDescription = report.serviceDescription.trim();
  const photoLayout = getPhotoLayout(report.photoLayout);

  return (
    <article
      className={`${styles.a4Page} ${isFirstPage ? styles.firstPage : styles.followingPage}`}
    >
      <div className={styles.pageBody}>
        {isFirstPage ? (
          <>
            <header className={styles.firstPageHeader}>
              <Image
                alt="RIOW"
                className={styles.documentLogo}
                height={56}
                priority
                src="/images/logo-riow.webp"
                width={180}
              />
              <div>
                <p className={styles.documentEyebrow}>RIOW</p>
                <h1>Relatório de Obra</h1>
              </div>
            </header>

            {hasServiceData && (
              <section
                className={styles.serviceDataSection}
                aria-label="Dados do serviço"
              >
                <h2 >Dados do serviço</h2>
                <dl className={styles.serviceDataList}>
                  <div className={styles.serviceDataColumn}>
                    <ServiceData label="Obra" value={report.workName} />
                    <ServiceData
                      label="Engenheiro responsável"
                      value={report.engineer}
                    />
                    <ServiceData
                      label="Data"
                      value={
                        hasContent(report.serviceDate)
                          ? formatServiceDate(report.serviceDate)
                          : undefined
                      }
                    />
                  </div>
                  <div className={styles.serviceDataColumn}>
                    <ServiceData
                      label="Empresa terceirizada"
                      value={report.contractor}
                    />
                    <ServiceData
                      label="Local / setor"
                      value={report.location}
                    />
                  </div>
                </dl>
              </section>
            )}

            {serviceDescription && (
              <section
                className={styles.descriptionSection}
                aria-label="Descrição do serviço"
              >
                <h2>Descrição do serviço</h2>
                <p>{serviceDescription}</p>
              </section>
            )}
          </>
        ) : (
          <header className={styles.compactHeader}>
            <Image
              alt="RIOW"
              className={styles.compactLogo}
              height={40}
              src="/images/logo-riow.webp"
              width={128}
            />
            <p>Relatório de Obra</p>
          </header>
        )}

        <section
          className={styles.photoSection}
          aria-label="Registro fotográfico"
        >
          {isFirstPage && (
            <h2 className={styles.photoSectionTitle}>Registro Fotográfico</h2>
          )}
          <div
            className={`${styles.photoGrid} ${isFirstPage ? styles.firstPagePhotoGrid : styles.followingPagePhotoGrid} ${photoLayout === "portrait" ? styles.portraitPhotoGrid : ""} ${photoLayout === "portrait" && isFirstPage ? styles.portraitFirstPagePhotoGrid : ""} ${photoLayout === "portrait" && !isFirstPage ? styles.portraitFollowingPagePhotoGrid : ""}`}
          >
            {photos.map((photo) => (
              <PhotoPreviewItem
                key={photo.id}
                photo={photo}
                previewUrl={photo.previewUrl}
              />
            ))}
          </div>
        </section>
      </div>

      <footer className={styles.pageFooter}>
        <span>RIOW | Relatório de Obra</span>
        <span>
          Página {pageNumber} de {totalPages}
        </span>
      </footer>
    </article>
  );
}
