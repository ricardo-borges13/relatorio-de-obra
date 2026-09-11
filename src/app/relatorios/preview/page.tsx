"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Static export uses document navigation to avoid App Router RSC route requests. */

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ReportPreview from "@/components/ReportPreview";

function ReportPreviewContent() {
  const reportId = useSearchParams().get("id")?.trim();

  if (!reportId) {
    return (
      <main>
        <p>Relatório não informado.</p>
        <a href="/">Voltar para relatórios</a>
      </main>
    );
  }

  return <ReportPreview reportId={reportId} />;
}

export default function PreviewReportPage() {
  return (
    <Suspense fallback={<main>Carregando relatório...</main>}>
      <ReportPreviewContent />
    </Suspense>
  );
}
