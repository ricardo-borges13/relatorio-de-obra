import type { ReportPhoto } from "@/types/report-photo";
import styles from "./styles.module.scss";

interface PhotoPreviewItemProps {
  photo: ReportPhoto;
  previewUrl: string;
}

export default function PhotoPreviewItem({ photo, previewUrl }: PhotoPreviewItemProps) {
  const description = photo.description.trim();

  return (
    <article className={styles.photoItem}>
      <div className={styles.photoFrame}>
        {/* Object URLs are created from local IndexedDB blobs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`Foto ${String(photo.order + 1).padStart(2, "0")}`} src={previewUrl} />
      </div>
      <div className={styles.photoCaption}>
        <h3>Foto {String(photo.order + 1).padStart(2, "0")}</h3>
        {description && <p>{description}</p>}
      </div>
    </article>
  );
}
