export const dressImages: Record<string, string[]> = {
  "blushstone-tailored-set": ["/assets/dresses/blushstone-tailored-set/1.jpeg","/assets/dresses/blushstone-tailored-set/2.jpeg","/assets/dresses/blushstone-tailored-set/3.jpeg"],
  "dune-evening-line": ["/assets/dresses/dune-evening-line/1.jpeg","/assets/dresses/dune-evening-line/2.jpeg"],
  "ivory-column-edit": ["/assets/dresses/ivory-column-edit/1.jpeg","/assets/dresses/ivory-column-edit/2.jpeg","/assets/dresses/ivory-column-edit/3.jpeg"],
  "moonstone-drape-set": ["/assets/dresses/moonstone-drape-set/1.jpeg","/assets/dresses/moonstone-drape-set/2.jpeg"],
  "porcelain-lounge-coord": ["/assets/dresses/porcelain-lounge-coord/1.jpeg"],
  "rouge-evening": ["/assets/dresses/rouge-evening/1.jpeg","/assets/dresses/rouge-evening/2.jpeg","/assets/dresses/rouge-evening/3.jpeg"],
  "sage-atelier-set": ["/assets/dresses/sage-atelier-set/1.jpeg","/assets/dresses/sage-atelier-set/2.jpeg","/assets/dresses/sage-atelier-set/3.jpeg","/assets/dresses/sage-atelier-set/4.jpeg"],
  "sandstone-tailored-set": ["/assets/dresses/sandstone-tailored-set/1.jpeg"],
};

export const imagesForDress = (slug: string, fallback: string[]) =>
  dressImages[slug]?.length ? dressImages[slug] : fallback;
