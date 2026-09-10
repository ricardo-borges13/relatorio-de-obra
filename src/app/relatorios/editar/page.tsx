"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ReportEditor from "@/components/ReportEditor";

function ReportEditorContent() {
  const reportId = useSearchParams().get("id")?.trim();

  if (!reportId) {
    return (
      <main>
        <p>Relatório não informado.</p>
        <Link href="/">Voltar para relatórios</Link>
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
