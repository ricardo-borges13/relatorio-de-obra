import Header from "@/components/Header";
import Link from "next/link";
import styles from "./page.module.scss";

export default function NewReportPage() {
  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <Link className={styles.backLink} href="/">
          <span aria-hidden="true">←</span>
          Voltar
        </Link>

        <section className={styles.introduction} aria-labelledby="page-title">
          <h1 id="page-title">Novo Relatório</h1>
          <p>Preencha os dados do serviço e adicione as fotos do registro.</p>
        </section>

        <section className={styles.section} aria-labelledby="service-data-title">
          <div className={styles.sectionHeading}>
            <h2 id="service-data-title">Dados do serviço</h2>
            <p>Os campos marcados com <span aria-hidden="true">*</span> são obrigatórios.</p>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label htmlFor="work-name">
                Obra <span aria-hidden="true">*</span>
              </label>
              <input id="work-name" name="workName" required type="text" />
            </div>

            <div className={styles.field}>
              <label htmlFor="contractor">Empresa terceirizada (opcional)</label>
              <input id="contractor" name="contractor" type="text" />
            </div>

            <div className={styles.field}>
              <label htmlFor="responsible-engineer">
                Engenheiro responsável <span aria-hidden="true">*</span>
              </label>
              <input id="responsible-engineer" name="responsibleEngineer" required type="text" />
            </div>

            <div className={styles.field}>
              <label htmlFor="service-date">
                Data <span aria-hidden="true">*</span>
              </label>
              <input id="service-date" name="serviceDate" required type="date" />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="location">Local / setor (opcional)</label>
              <input id="location" name="location" type="text" />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="service-description">
                Descrição do serviço <span aria-hidden="true">*</span>
              </label>
              <textarea id="service-description" name="serviceDescription" required rows={5} />
            </div>
          </div>
        </section>

        <section className={styles.photoSection} aria-labelledby="photo-record-title">
          <div className={styles.sectionHeading}>
            <h2 id="photo-record-title">Registro fotográfico</h2>
            <p>Adicione as fotos referentes ao serviço executado.</p>
          </div>

          <div className={styles.photoActions}>
            <button className={styles.primaryPhotoAction} type="button">Tirar foto</button>
            <button className={styles.secondaryPhotoAction} type="button">Selecionar fotos</button>
          </div>

          <div className={styles.photoEmptyState}>
            <p>Nenhuma foto adicionada.</p>
          </div>
        </section>

        <div className={styles.finalActions}>
          <Link className={styles.cancelButton} href="/">Cancelar</Link>
          <button className={styles.generateButton} type="button">Gerar relatório</button>
        </div>
      </main>
    </div>
  );
}
