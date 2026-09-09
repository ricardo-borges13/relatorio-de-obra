import Header from "@/components/Header";
import styles from "./page.module.scss";

export default function Home() {
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
            <button className={styles.newReportButton} type="button">
              <span aria-hidden="true">+</span>
              Novo relatório
            </button>
          </div>
        </section>

        <section className={styles.savedReports} aria-labelledby="saved-reports-title">
          <div className={styles.sectionHeading}>
            <h2 id="saved-reports-title">Relatórios salvos</h2>
          </div>

          <div className={styles.emptyState}>
            <p className={styles.emptyStateTitle}>Nenhum relatório salvo neste dispositivo.</p>
            <p className={styles.emptyStateDescription}>
              Os relatórios criados serão armazenados localmente neste dispositivo.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
