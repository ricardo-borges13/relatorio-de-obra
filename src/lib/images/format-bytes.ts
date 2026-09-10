const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const megabyteFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export const formatBytes = (bytes: number) => {
  if (bytes >= BYTES_PER_MEGABYTE) {
    return `${megabyteFormatter.format(bytes / BYTES_PER_MEGABYTE)} MB`;
  }

  if (bytes < BYTES_PER_KILOBYTE) {
    return `${integerFormatter.format(bytes)} B`;
  }

  return `${integerFormatter.format(bytes / BYTES_PER_KILOBYTE)} KB`;
};
