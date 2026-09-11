"use client";

import Header from "@/components/Header";
import {
  addReportPhotos,
  deleteReportPhoto,
  getReportPhotos,
  updateReportPhotoDescription,
} from "@/lib/db/photos";
import {
  createDraftReport,
  createUnsavedDraftReport,
  getReportById,
  getReportFormValues,
  markReportFinished,
  saveReport,
  saveReportPhotoLayout,
  touchReport,
} from "@/lib/db/reports";
import { formatBytes } from "@/lib/images/format-bytes";
import { isSupportedImage, processImage } from "@/lib/images/process-image";
import type { ProcessedImage } from "@/lib/images/types";
import { downloadReportPdf } from "@/lib/pdf/download-report-pdf";
import { getReportPdfFilename } from "@/lib/pdf/filename";
import { generateReportPdf } from "@/lib/pdf/generate-report-pdf";
import { validateReportForPdf, validateRequiredReportFields } from "@/lib/pdf/validate-report-for-pdf";
import { DEFAULT_PHOTO_LAYOUT, getPhotoLayout } from "@/lib/reports/paginate-photos";
import type { PhotoLayout, Report, ReportFormValues } from "@/types/report";
import type { ReportPhoto } from "@/types/report-photo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "@/app/relatorios/novo/page.module.scss";

interface ReportEditorProps {
  reportId?: string;
}

interface EditorPhoto extends ReportPhoto {
  previewUrl: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 700;

const EMPTY_FORM_VALUES: ReportFormValues = {
  workName: "",
  contractor: "",
  engineer: "",
  serviceDate: "",
  location: "",
  serviceDescription: "",
};

const getCurrentLocalDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
};

const createNewReportFormValues = (): ReportFormValues => ({
  ...EMPTY_FORM_VALUES,
  serviceDate: getCurrentLocalDate(),
});

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const formValuesAreEqual = (first: ReportFormValues, second: ReportFormValues) =>
  first.workName === second.workName &&
  first.contractor === second.contractor &&
  first.engineer === second.engineer &&
  first.serviceDate === second.serviceDate &&
  first.location === second.location &&
  first.serviceDescription === second.serviceDescription;

const hasPersistableFormContent = (values: ReportFormValues) =>
  [
    values.workName,
    values.contractor,
    values.engineer,
    values.location,
    values.serviceDescription,
  ].some((value) => value.trim().length > 0);

const createPreviewPhoto = (photo: ReportPhoto): EditorPhoto => ({
  ...photo,
  previewUrl: URL.createObjectURL(photo.blob),
});

export default function ReportEditor({ reportId: requestedReportId }: ReportEditorProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generatedReportIdRef = useRef<string | null>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const photoDescriptionTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const photoLayoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportRef = useRef<Report | null>(null);
  const photosRef = useRef<EditorPhoto[]>([]);
  const formValuesRef = useRef<ReportFormValues>(EMPTY_FORM_VALUES);
  const lastSavedFormValuesRef = useRef<ReportFormValues>(EMPTY_FORM_VALUES);
  const lastSavedPhotoLayoutRef = useRef<PhotoLayout>(DEFAULT_PHOTO_LAYOUT);
  const isPersistedRef = useRef(false);
  const isMountedRef = useRef(true);
  const [report, setReport] = useState<Report | null>(null);
  const [formValues, setFormValues] = useState<ReportFormValues>(EMPTY_FORM_VALUES);
  const [photos, setPhotos] = useState<EditorPhoto[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const revokePreviewUrl = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(previewUrl);
  };

  const setCurrentPhotos = (nextPhotos: EditorPhoto[]) => {
    photosRef.current = nextPhotos;
    setPhotos(nextPhotos);
  };

  const setCurrentReport = (nextReport: Report) => {
    reportRef.current = nextReport;
    setReport(nextReport);
  };

  const markReportUpdated = useCallback(async () => {
    const currentReport = reportRef.current;

    if (!currentReport) {
      return;
    }

    const updatedAt = await touchReport(currentReport.id);
    const updatedReport = { ...currentReport, updatedAt };

    reportRef.current = updatedReport;

    if (isMountedRef.current) {
      setReport(updatedReport);
    }
  }, []);

  const ensureReportPersisted = useCallback(async () => {
    const currentReport = reportRef.current;

    if (!currentReport) {
      return null;
    }

    if (isPersistedRef.current) {
      return currentReport;
    }

    if (isMountedRef.current) {
      setSaveStatus("saving");
    }

    try {
      const persistedReport = await createDraftReport(currentReport.id);
      isPersistedRef.current = true;
      reportRef.current = persistedReport;

      if (isMountedRef.current) {
        setReport(persistedReport);
      }

      return persistedReport;
    } catch {
      if (isMountedRef.current) {
        setSaveStatus("error");
      }

      return null;
    }
  }, []);

  const persistFormValues = useCallback(async (values: ReportFormValues) => {
    const currentReport = reportRef.current;

    if (!currentReport) {
      return false;
    }

    if (!isPersistedRef.current && !hasPersistableFormContent(values)) {
      return true;
    }

    if (formValuesAreEqual(values, lastSavedFormValuesRef.current)) {
      return Boolean(currentReport);
    }

    if (isMountedRef.current) {
      setSaveStatus("saving");
    }

    try {
      const persistedReport = await ensureReportPersisted();

      if (!persistedReport) {
        return false;
      }

      const savedReport = await saveReport(persistedReport, values);

      lastSavedFormValuesRef.current = values;
      reportRef.current = savedReport;

      if (isMountedRef.current) {
        setReport(savedReport);
        setSaveStatus("saved");
      }

      return true;
    } catch {
      if (isMountedRef.current) {
        setSaveStatus("error");
      }

      return false;
    }
  }, [ensureReportPersisted]);

  const persistPhotoDescription = useCallback(
    async (photoId: string, description: string) => {
      try {
        await updateReportPhotoDescription(photoId, description);
        await markReportUpdated();

        if (isMountedRef.current) {
          setSaveStatus("saved");
        }

        return true;
      } catch {
        if (isMountedRef.current) {
          setSaveStatus("error");
        }

        return false;
      }
    },
    [markReportUpdated],
  );

  const persistPhotoLayout = useCallback(async (photoLayout: PhotoLayout) => {
    const currentReport = reportRef.current;

    if (!currentReport || photoLayout === lastSavedPhotoLayoutRef.current) {
      return true;
    }

    if (isMountedRef.current) {
      setSaveStatus("saving");
    }

    try {
      const persistedReport = await ensureReportPersisted();

      if (!persistedReport) {
        return false;
      }

      const savedReport = await saveReportPhotoLayout(persistedReport, photoLayout);
      lastSavedPhotoLayoutRef.current = photoLayout;
      reportRef.current = savedReport;

      if (isMountedRef.current) {
        setReport(savedReport);
        setSaveStatus("saved");
      }

      return true;
    } catch {
      if (isMountedRef.current) {
        setSaveStatus("error");
      }

      return false;
    }
  }, [ensureReportPersisted]);

  useEffect(() => {
    isMountedRef.current = true;
    const previewUrls = previewUrlsRef.current;
    const photoDescriptionTimers = photoDescriptionTimersRef.current;

    return () => {
      isMountedRef.current = false;
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrls.clear();
      photoDescriptionTimers.forEach((timer) => clearTimeout(timer));
      photoDescriptionTimers.clear();
      if (photoLayoutTimerRef.current) {
        clearTimeout(photoLayoutTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadEditor = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        if (!requestedReportId) {
          const newReportId = generatedReportIdRef.current ?? createId();
          generatedReportIdRef.current = newReportId;
          const unsavedReport = createUnsavedDraftReport(newReportId);

          isPersistedRef.current = false;
          reportRef.current = unsavedReport;
          photosRef.current = [];
          const initialFormValues = createNewReportFormValues();
          formValuesRef.current = initialFormValues;
          lastSavedFormValuesRef.current = initialFormValues;
          lastSavedPhotoLayoutRef.current = DEFAULT_PHOTO_LAYOUT;
          setCurrentReport(unsavedReport);
          setCurrentPhotos([]);
          setFormValues(initialFormValues);
          setSaveStatus("idle");

          return;
        }

        const loadedReport = await getReportById(requestedReportId);

        if (!loadedReport) {
          throw new Error("Relatório não encontrado neste dispositivo.");
        }

        const loadedPhotos = await getReportPhotos(requestedReportId);
        const editorPhotos = loadedPhotos.map(createPreviewPhoto);

        if (!isCurrent) {
          editorPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
          return;
        }

        editorPhotos.forEach((photo) => previewUrlsRef.current.add(photo.previewUrl));
        const loadedFormValues = getReportFormValues(loadedReport);

        reportRef.current = loadedReport;
        isPersistedRef.current = true;
        photosRef.current = editorPhotos;
        formValuesRef.current = loadedFormValues;
        lastSavedFormValuesRef.current = loadedFormValues;
        lastSavedPhotoLayoutRef.current = getPhotoLayout(loadedReport.photoLayout);
        setCurrentReport(loadedReport);
        setCurrentPhotos(editorPhotos);
        setFormValues(loadedFormValues);
        setSaveStatus("saved");
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o relatório.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void loadEditor();

    return () => {
      isCurrent = false;
    };
  }, [requestedReportId]);

  useEffect(() => {
    if (!report || formValuesAreEqual(formValues, lastSavedFormValuesRef.current)) {
      return;
    }

    if (!isPersistedRef.current && !hasPersistableFormContent(formValues)) {
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      void persistFormValues(formValues);
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [formValues, persistFormValues, report]);

  const handleFormChange = (field: keyof ReportFormValues, value: string) => {
    setFormValues((currentValues) => {
      const nextValues = { ...currentValues, [field]: value };
      formValuesRef.current = nextValues;

      return nextValues;
    });
  };

  const handlePhotoLayoutChange = (photoLayout: PhotoLayout) => {
    const currentReport = reportRef.current;

    if (!currentReport || getPhotoLayout(currentReport.photoLayout) === photoLayout) {
      return;
    }

    const updatedReport = { ...currentReport, photoLayout };
    reportRef.current = updatedReport;
    setReport(updatedReport);
    setSaveStatus("saving");

    if (photoLayoutTimerRef.current) {
      clearTimeout(photoLayoutTimerRef.current);
    }

    photoLayoutTimerRef.current = setTimeout(() => {
      photoLayoutTimerRef.current = null;
      void persistPhotoLayout(photoLayout);
    }, AUTOSAVE_DELAY_MS);
  };

  const handlePhotoSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";

    if (selectedFiles.length === 0 || !reportRef.current) {
      setFileError(null);
      return;
    }

    setIsProcessing(true);
    setFileError(null);

    const processedImages: ProcessedImage[] = [];
    let ignoredFiles = 0;

    for (const file of selectedFiles) {
      if (!isSupportedImage(file)) {
        ignoredFiles += 1;
        continue;
      }

      try {
        processedImages.push(await processImage(file));
      } catch {
        ignoredFiles += 1;
      }
    }

    if (!isMountedRef.current || !reportRef.current) {
      return;
    }

    const reportId = reportRef.current.id;
    const startOrder = photosRef.current.length;
    const newPhotos = processedImages.map<EditorPhoto>((processedImage, index) => {
      const previewUrl = URL.createObjectURL(processedImage.file);

      return {
        id: createId(),
        reportId,
        blob: processedImage.file,
        description: "",
        order: startOrder + index,
        createdAt: new Date().toISOString(),
        ...processedImage.diagnostics,
        previewUrl,
      };
    });

    if (newPhotos.length === 0) {
      setFileError("Não foi possível processar as imagens selecionadas.");
      setIsProcessing(false);
      return;
    }

    try {
      const persistedReport = await ensureReportPersisted();

      if (!persistedReport || !await persistFormValues(formValuesRef.current)) {
        throw new Error("Não foi possível preparar o relatório para salvar as fotos.");
      }

      await addReportPhotos(
        newPhotos.map(({ previewUrl: _previewUrl, ...photo }) => photo),
      );
      await markReportUpdated();

      newPhotos.forEach((photo) => previewUrlsRef.current.add(photo.previewUrl));
      setCurrentPhotos([...photosRef.current, ...newPhotos]);
      setSaveStatus("saved");
    } catch {
      newPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      setFileError("Não foi possível salvar as fotos neste dispositivo.");
      setSaveStatus("error");
    }

    if (ignoredFiles > 0) {
      setFileError(
        processedImages.length > 0
          ? "Algumas imagens não puderam ser processadas e foram ignoradas."
          : "Não foi possível processar as imagens selecionadas.",
      );
    }

    setIsProcessing(false);
  };

  const handleDescriptionChange = (photoId: string, description: string) => {
    const existingTimer = photoDescriptionTimersRef.current.get(photoId);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const nextPhotos = photosRef.current.map((photo) =>
      photo.id === photoId ? { ...photo, description } : photo,
    );
    setCurrentPhotos(nextPhotos);
    setSaveStatus("saving");

    const timer = setTimeout(() => {
      photoDescriptionTimersRef.current.delete(photoId);
      void persistPhotoDescription(photoId, description);
    }, AUTOSAVE_DELAY_MS);

    photoDescriptionTimersRef.current.set(photoId, timer);
  };

  const handlePhotoRemoval = async (photoId: string) => {
    const photoToRemove = photosRef.current.find((photo) => photo.id === photoId);

    if (!photoToRemove || !reportRef.current) {
      return;
    }

    const descriptionTimer = photoDescriptionTimersRef.current.get(photoId);

    if (descriptionTimer) {
      clearTimeout(descriptionTimer);
      photoDescriptionTimersRef.current.delete(photoId);
    }

    try {
      await deleteReportPhoto(photoId, reportRef.current.id);
      await markReportUpdated();
      revokePreviewUrl(photoToRemove.previewUrl);
      setCurrentPhotos(
        photosRef.current
          .filter((photo) => photo.id !== photoId)
          .map((photo, index) => ({ ...photo, order: index })),
      );
      setSaveStatus("saved");
    } catch {
      setFileError("Não foi possível excluir a foto deste dispositivo.");
      setSaveStatus("error");
    }
  };

  const flushPendingChanges = useCallback(async () => {
    const pendingPhotoIds = Array.from(photoDescriptionTimersRef.current.keys());

    pendingPhotoIds.forEach((photoId) => {
      const timer = photoDescriptionTimersRef.current.get(photoId);

      if (timer) {
        clearTimeout(timer);
      }

      photoDescriptionTimersRef.current.delete(photoId);
    });

    const photoSaveResults = await Promise.all(
      pendingPhotoIds.map((photoId) => {
        const photo = photosRef.current.find((currentPhoto) => currentPhoto.id === photoId);

        return photo ? persistPhotoDescription(photoId, photo.description) : true;
      }),
    );

    if (photoLayoutTimerRef.current) {
      clearTimeout(photoLayoutTimerRef.current);
      photoLayoutTimerRef.current = null;
    }

    const photoLayoutSaved = await persistPhotoLayout(getPhotoLayout(reportRef.current?.photoLayout));

    const formSaved = await persistFormValues(formValuesRef.current);

    return formSaved && photoLayoutSaved && photoSaveResults.every(Boolean);
  }, [persistFormValues, persistPhotoDescription, persistPhotoLayout]);

  const handleCancel = async () => {
    await flushPendingChanges();
    router.push("/");
  };

  const handlePreview = async () => {
    const currentReport = reportRef.current;

    if (!currentReport || isPreviewing || isProcessing) {
      return;
    }

    setPdfError(null);
    const validationSource = !isPersistedRef.current && !hasPersistableFormContent(formValuesRef.current)
      ? currentReport
      : formValuesRef.current;
    const validationError = validateRequiredReportFields(validationSource);

    if (validationError) {
      setPdfError(validationError);
      return;
    }

    setIsPreviewing(true);
    const changesSaved = await flushPendingChanges();

    if (!changesSaved || !isMountedRef.current || !reportRef.current) {
      setIsPreviewing(false);
      return;
    }

    router.push(`/relatorios/preview?id=${encodeURIComponent(reportRef.current.id)}`);
  };

  const handleSavePdf = async () => {
    if (!reportRef.current || isGeneratingPdf || isProcessing) {
      return;
    }

    setIsGeneratingPdf(true);
    setPdfError(null);
    const changesSaved = await flushPendingChanges();
    const reportToGenerate = reportRef.current;

    if (!changesSaved || !reportToGenerate) {
      setPdfError("Não foi possível salvar os dados antes de gerar o PDF.");
      setIsGeneratingPdf(false);
      return;
    }

    const validationError = validateReportForPdf(reportToGenerate, photosRef.current);

    if (validationError) {
      setPdfError(validationError);
      setIsGeneratingPdf(false);
      return;
    }

    try {
      const pdfBlob = await generateReportPdf(reportToGenerate, photosRef.current);
      downloadReportPdf(pdfBlob, getReportPdfFilename(reportToGenerate));
      setCurrentReport(await markReportFinished(reportToGenerate));
      setSaveStatus("saved");
    } catch {
      setPdfError("Não foi possível gerar o PDF.");
    } finally {
      if (isMountedRef.current) {
        setIsGeneratingPdf(false);
      }
    }
  };

  const saveStatusText = {
    idle: "",
    saving: "Salvando...",
    saved: "Salvo neste dispositivo",
    error: "Erro ao salvar",
  }[saveStatus];
  const saveStatusClass = {
    idle: "",
    saving: styles.saveStatusSaving,
    saved: styles.saveStatusSaved,
    error: styles.saveStatusError,
  }[saveStatus];

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingState}>Carregando relatório...</p>
        </main>
      </div>
    );
  }

  if (loadError || !report) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingState}>{loadError ?? "Não foi possível carregar o relatório."}</p>
          <Link className={styles.backLink} href="/">Voltar para a Home</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <Link className={styles.backLink} href="/">
          <span aria-hidden="true">←</span>
          Voltar
        </Link>

        <section className={styles.introduction} aria-labelledby="page-title">
          <div className={styles.titleRow}>
            <h1 id="page-title">{requestedReportId ? "Editar Relatório" : "Novo Relatório"}</h1>
            {saveStatus !== "idle" && (
              <p className={`${styles.saveStatus} ${saveStatusClass}`} role="status">
                {saveStatusText}
              </p>
            )}
          </div>
          <p>Preencha os dados do serviço e adicione as fotos do registro.</p>
        </section>

        <section className={styles.section} aria-labelledby="service-data-title">
          <div className={styles.sectionHeading}>
            <h2 id="service-data-title">Dados do serviço</h2>
            <p>Os campos marcados com <span aria-hidden="true">*</span> são obrigatórios.</p>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label htmlFor="work-name">Obra <span aria-hidden="true">*</span></label>
              <input id="work-name" name="workName" onChange={(event) => handleFormChange("workName", event.target.value)} required type="text" value={formValues.workName} />
            </div>

            <div className={styles.field}>
              <label htmlFor="contractor">Empresa terceirizada (opcional)</label>
              <input id="contractor" name="contractor" onChange={(event) => handleFormChange("contractor", event.target.value)} type="text" value={formValues.contractor} />
            </div>

            <div className={styles.field}>
              <label htmlFor="responsible-engineer">Engenheiro responsável <span aria-hidden="true">*</span></label>
              <input id="responsible-engineer" name="responsibleEngineer" onChange={(event) => handleFormChange("engineer", event.target.value)} required type="text" value={formValues.engineer} />
            </div>

            <div className={styles.field}>
              <label htmlFor="service-date">Data <span aria-hidden="true">*</span></label>
              <input id="service-date" name="serviceDate" onChange={(event) => handleFormChange("serviceDate", event.target.value)} required type="date" value={formValues.serviceDate} />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="location">Local / setor (opcional)</label>
              <input id="location" name="location" onChange={(event) => handleFormChange("location", event.target.value)} type="text" value={formValues.location} />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="service-description">Descrição do serviço <span aria-hidden="true">*</span></label>
              <textarea id="service-description" name="serviceDescription" onChange={(event) => handleFormChange("serviceDescription", event.target.value)} required rows={5} value={formValues.serviceDescription} />
            </div>
          </div>
        </section>

        <section className={styles.photoSection} aria-labelledby="photo-record-title">
          <div className={styles.sectionHeading}>
            <h2 id="photo-record-title">Registro fotográfico</h2>
            <p>Adicione as fotos referentes ao serviço executado.</p>
          </div>

          <div className={styles.photoActions}>
            <input accept="image/*" capture="environment" className={styles.visuallyHidden} disabled={isProcessing} onChange={handlePhotoSelection} ref={cameraInputRef} type="file" />
            <input accept="image/*" className={styles.visuallyHidden} disabled={isProcessing} multiple onChange={handlePhotoSelection} ref={fileInputRef} type="file" />
            <button className={`${styles.primaryPhotoAction} ${styles.capturePhotoAction}`} disabled={isProcessing} onClick={() => cameraInputRef.current?.click()} type="button">
              {isProcessing ? "Processando fotos..." : "Tirar foto"}
            </button>
            <button className={styles.secondaryPhotoAction} disabled={isProcessing} onClick={() => fileInputRef.current?.click()} type="button">
              {isProcessing ? "Processando fotos..." : "Selecionar fotos"}
            </button>
          </div>

          <p className={styles.photoGuidance}>
            <strong>Dica: para melhor apresentação no relatório, prefira tirar as fotos com o celular na horizontal.</strong>
          </p>

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
                      <button aria-label={`Excluir foto ${photo.order + 1}`} className={styles.deletePhotoButton} onClick={() => void handlePhotoRemoval(photo.id)} type="button">Excluir</button>
                    </div>
                    <div className={styles.photoDiagnostics}>
                      <p>Original: {photo.originalWidth} × {photo.originalHeight} • {formatBytes(photo.originalSize)}</p>
                      <p>Otimizada: {photo.optimizedWidth} × {photo.optimizedHeight} • {formatBytes(photo.optimizedSize)}</p>
                    </div>
                    <label htmlFor={`photo-description-${photo.id}`}>Descrição da foto</label>
                    <textarea id={`photo-description-${photo.id}`} onChange={(event) => handleDescriptionChange(photo.id, event.target.value)} rows={3} value={photo.description} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {pdfError && <p className={styles.pdfError} role="status">{pdfError}</p>}

        <section className={styles.photoLayoutSection} aria-labelledby="photo-layout-title">
          <h2 id="photo-layout-title">Formato das fotos no relatório</h2>
          <div aria-label="Formato das fotos" className={styles.photoLayoutControl} role="group">
            <button
              aria-pressed={getPhotoLayout(report.photoLayout) === "landscape"}
              className={getPhotoLayout(report.photoLayout) === "landscape" ? styles.photoLayoutOptionActive : styles.photoLayoutOption}
              onClick={() => handlePhotoLayoutChange("landscape")}
              type="button"
            >
              Horizontal
            </button>
            <button
              aria-pressed={getPhotoLayout(report.photoLayout) === "portrait"}
              className={getPhotoLayout(report.photoLayout) === "portrait" ? styles.photoLayoutOptionActive : styles.photoLayoutOption}
              onClick={() => handlePhotoLayoutChange("portrait")}
              type="button"
            >
              Vertical
            </button>
          </div>
        </section>

        <div className={styles.finalActions}>
          <button className={styles.cancelButton} onClick={() => void handleCancel()} type="button">Sair</button>
          <button className={styles.previewButton} disabled={isPreviewing || isProcessing || isGeneratingPdf} onClick={() => void handlePreview()} type="button">
            {isPreviewing ? "Salvando..." : "Visualizar relatório"}
          </button>
          <button className={styles.generateButton} disabled={isPreviewing || isProcessing || isGeneratingPdf} onClick={() => void handleSavePdf()} type="button">
            {isGeneratingPdf ? "Gerando PDF..." : "Salvar PDF"}
          </button>
        </div>
      </main>
    </div>
  );
}
