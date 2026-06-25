export const dressImages: Record<string, string[]> = {
  "dune-evening-line": ["/assets/dresses/dune-evening-line/1.jpeg"],
  "ivory-column-edit": ["/assets/dresses/ivory-column-edit/1.jpeg"],
  "moonstone-drape-set": ["/assets/dresses/moonstone-drape-set/1.jpeg"],
  "porcelain-lounge-coord": ["/assets/dresses/porcelain-lounge-coord/1.jpeg"],
  "sage-atelier-set": ["/assets/dresses/sage-atelier-set/1.jpeg"],
  "sandstone-tailored-set": ["/assets/dresses/sandstone-tailored-set/1.jpeg"],
};

export const imagesForDress = (slug: string, fallback: string[]) =>
  dressImages[slug]?.length ? dressImages[slug] : fallback;
