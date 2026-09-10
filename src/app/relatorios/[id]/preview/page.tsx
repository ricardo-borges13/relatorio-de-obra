import ReportPreview from "@/components/ReportPreview";

interface ReportPreviewRouteProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPreviewRoute({ params }: ReportPreviewRouteProps) {
  const { id } = await params;

  return <ReportPreview reportId={id} />;
}
