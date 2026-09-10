import type { ReportPhoto } from "@/types/report-photo";

export const FIRST_PAGE_PHOTO_LIMIT = 4;
export const FOLLOWING_PAGE_PHOTO_LIMIT = 6;

export interface PhotoPage {
  photos: ReportPhoto[];
  isFirstPage: boolean;
}

export const paginateReportPhotos = (photos: ReportPhoto[]): PhotoPage[] => {
  const orderedPhotos = [...photos].sort((firstPhoto, secondPhoto) => firstPhoto.order - secondPhoto.order);
  const pages: PhotoPage[] = [
    {
      photos: orderedPhotos.slice(0, FIRST_PAGE_PHOTO_LIMIT),
      isFirstPage: true,
    },
  ];

  for (let index = FIRST_PAGE_PHOTO_LIMIT; index < orderedPhotos.length; index += FOLLOWING_PAGE_PHOTO_LIMIT) {
    pages.push({
      photos: orderedPhotos.slice(index, index + FOLLOWING_PAGE_PHOTO_LIMIT),
      isFirstPage: false,
    });
  }

  return pages;
};
