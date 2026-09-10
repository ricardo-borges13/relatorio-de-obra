import ReportEditor from "@/components/ReportEditor";

interface ExistingReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExistingReportPage({ params }: ExistingReportPageProps) {
  const { id } = await params;

  return <ReportEditor reportId={id} />;
}
