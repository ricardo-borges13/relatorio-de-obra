"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ReportPreview from "@/components/ReportPreview";

function ReportPreviewContent() {
  const reportId = useSearchParams().get("id")?.trim();

  if (!reportId) {
    return (
      <main>
        <p>Relatório não informado.</p>
        <Link href="/">Voltar para relatórios</Link>
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
