import type { ReportPhoto } from "@/types/report-photo";
import type { PhotoLayout } from "@/types/report";

export const DEFAULT_PHOTO_LAYOUT: PhotoLayout = "landscape";

export const PHOTO_PAGE_CAPACITY: Record<PhotoLayout, { firstPage: number; followingPages: number }> = {
  landscape: { firstPage: 4, followingPages: 6 },
  portrait: { firstPage: 2, followingPages: 4 },
};

export const getPhotoLayout = (photoLayout: PhotoLayout | undefined): PhotoLayout =>
  photoLayout ?? DEFAULT_PHOTO_LAYOUT;

export const getPhotoPageRows = (photoLayout: PhotoLayout | undefined, isFirstPage: boolean) => {
  const layout = getPhotoLayout(photoLayout);

  if (layout === "portrait") {
    return isFirstPage ? 1 : 2;
  }

  return isFirstPage ? 2 : 3;
};

export interface PhotoPage {
  photos: ReportPhoto[];
  isFirstPage: boolean;
}

export const paginateReportPhotos = (
  photos: ReportPhoto[],
  photoLayout: PhotoLayout | undefined = DEFAULT_PHOTO_LAYOUT,
): PhotoPage[] => {
  const capacity = PHOTO_PAGE_CAPACITY[getPhotoLayout(photoLayout)];
  const orderedPhotos = [...photos].sort((firstPhoto, secondPhoto) => firstPhoto.order - secondPhoto.order);
  const pages: PhotoPage[] = [
    {
      photos: orderedPhotos.slice(0, capacity.firstPage),
      isFirstPage: true,
    },
  ];

  for (let index = capacity.firstPage; index < orderedPhotos.length; index += capacity.followingPages) {
    pages.push({
      photos: orderedPhotos.slice(index, index + capacity.followingPages),
      isFirstPage: false,
    });
  }

  return pages;
};
