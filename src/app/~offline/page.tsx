import styles from "./page.module.scss";

export default function OfflinePage() {
  return (
    <main className={styles.offlinePage}>
      <section>
        <h1>Você está offline</h1>
        <p>Os relatórios salvos neste dispositivo continuam disponíveis quando a aplicação já foi carregada.</p>
      </section>
    </main>
  );
}
