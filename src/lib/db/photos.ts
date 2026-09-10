import { database } from "./database";
import type { ReportPhoto } from "@/types/report-photo";

export const getReportPhotos = (reportId: string) =>
  database.reportPhotos.where("reportId").equals(reportId).sortBy("order");

export const addReportPhotos = async (photos: ReportPhoto[]) => {
  await database.reportPhotos.bulkAdd(photos);
};

export const updateReportPhotoDescription = async (id: string, description: string) => {
  await database.reportPhotos.update(id, { description });
};

export const deleteReportPhoto = async (id: string, reportId: string) => {
  await database.transaction("rw", database.reportPhotos, async () => {
    await database.reportPhotos.delete(id);

    const remainingPhotos = await getReportPhotos(reportId);
    await Promise.all(
      remainingPhotos.map((photo, index) =>
        photo.order === index ? undefined : database.reportPhotos.update(photo.id, { order: index }),
      ),
    );
  });
};
