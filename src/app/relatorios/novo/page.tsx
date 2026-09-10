"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";

interface TemporaryPhoto {
  id: string;
  file: File;
  previewUrl: string;
  description: string;
  order: number;
}

const createPhotoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function NewReportPage() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const [photos, setPhotos] = useState<TemporaryPhoto[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrlsRef.current.clear();
    },
    [],
  );

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));

    event.currentTarget.value = "";

    if (imageFiles.length === 0) {
      setFileError(null);

      if (selectedFiles.length > 0) {
        setFileError("Selecione apenas arquivos de imagem.");
      }

      return;
    }

    const newPhotos = imageFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      return {
        id: createPhotoId(),
        file,
        previewUrl,
        description: "",
        order: 0,
      };
    });

    setPhotos((currentPhotos) => [
      ...currentPhotos,
      ...newPhotos.map((photo, index) => ({
        ...photo,
        order: currentPhotos.length + index,
      })),
    ]);
    setFileError(
      imageFiles.length < selectedFiles.length ? "Arquivos que não são imagens foram ignorados." : null,
    );
  };

  const handleDescriptionChange = (photoId: string, description: string) => {
    setPhotos((currentPhotos) =>
      currentPhotos.map((photo) => (photo.id === photoId ? { ...photo, description } : photo)),
    );
  };

  const handlePhotoRemoval = (photoId: string) => {
    const photoToRemove = photos.find((photo) => photo.id === photoId);

    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
      previewUrlsRef.current.delete(photoToRemove.previewUrl);
    }

    setPhotos((currentPhotos) =>
      currentPhotos
        .filter((photo) => photo.id !== photoId)
        .map((photo, index) => ({ ...photo, order: index })),
    );
  };

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
            <input
              accept="image/*"
              capture="environment"
              className={styles.visuallyHidden}
              onChange={handlePhotoSelection}
              ref={cameraInputRef}
              type="file"
            />
            <input
              accept="image/*"
              className={styles.visuallyHidden}
              multiple
              onChange={handlePhotoSelection}
              ref={fileInputRef}
              type="file"
            />
            <button
              className={`${styles.primaryPhotoAction} ${styles.capturePhotoAction}`}
              onClick={() => cameraInputRef.current?.click()}
              type="button"
            >
              Tirar foto
            </button>
            <button
              className={styles.secondaryPhotoAction}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Selecionar fotos
            </button>
          </div>

          {fileError && <p className={styles.fileError} role="status">{fileError}</p>}

          {photos.length === 0 ? (
            <div className={styles.photoEmptyState}>
              <p>Nenhuma foto adicionada.</p>
            </div>
          ) : (
            <div className={styles.photoGrid}>
              {photos.map((photo) => (
                <article className={styles.photoCard} key={photo.id}>
                  <div className={styles.previewWrap}>
                    {/* Local Object URLs are not supported by next/image. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`Preview da foto ${photo.order + 1}`} src={photo.previewUrl} />
                  </div>
                  <div className={styles.photoCardBody}>
                    <div className={styles.photoCardHeading}>
                      <h3>Foto {String(photo.order + 1).padStart(2, "0")}</h3>
                      <button
                        aria-label={`Excluir foto ${photo.order + 1}`}
                        className={styles.deletePhotoButton}
                        onClick={() => handlePhotoRemoval(photo.id)}
                        type="button"
                      >
                        Excluir
                      </button>
                    </div>
                    <label htmlFor={`photo-description-${photo.id}`}>Descrição da foto</label>
                    <textarea
                      id={`photo-description-${photo.id}`}
                      onChange={(event) => handleDescriptionChange(photo.id, event.target.value)}
                      rows={3}
                      value={photo.description}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className={styles.finalActions}>
          <Link className={styles.cancelButton} href="/">Cancelar</Link>
          <button className={styles.generateButton} type="button">Gerar relatório</button>
        </div>
      </main>
    </div>
  );
}
