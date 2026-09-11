"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Static export uses document navigation to avoid App Router RSC route requests. */

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ReportEditor from "@/components/ReportEditor";

function ReportEditorContent() {
  const reportId = useSearchParams().get("id")?.trim();

  if (!reportId) {
    return (
      <main>
        <p>Relatório não informado.</p>
        <a href="/">Voltar para relatórios</a>
      </main>
    );
  }

  return <ReportEditor reportId={reportId} />;
}

export default function EditReportPage() {
  return (
    <Suspense fallback={<main>Carregando relatório...</main>}>
      <ReportEditorContent />
    </Suspense>
  );
}
