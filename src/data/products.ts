export type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  description: string;
  details: string[];
  fabric: string;
  sizes: string[];
  color: string;
  collection: string;
  images: string[];
  featured?: boolean;
  bestSeller?: boolean;
};

export const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export const products: Product[] = [
  {
    id: 1,
    slug: 'moonstone-drape-set',
    name: 'Moonstone Drape Set',
    price: 12490,
    description:
      'A fluid evening set with a luminous finish, soft tailoring, and a sheer drape designed for polished festive dressing.',
    details: [
      'Relaxed straight shirt with embellished neckline',
      'Wide leg trouser with soft satin movement',
      'Lightweight organza dupatta for layered elegance',
    ],
    fabric: 'Silk blend shirt and trouser with airy organza drape',
    sizes,
    color: 'Soft taupe',
    collection: 'Occasionwear',
    images: ['/assets/dresses/moonstone-drape-set/1.jpeg'],
    featured: true,
    bestSeller: true,
  },
  {
    id: 2,
    slug: 'porcelain-lounge-coord',
    name: 'Porcelain Lounge Coord',
    price: 9890,
    description:
      'An elevated day set cut in an easy silhouette, balancing delicate texture with graceful volume.',
    details: [
      'Textured short kurta with clean neckline',
      'Fluid palazzo trouser for airy comfort',
      'Ideal for brunch, travel, and light festive styling',
    ],
    fabric: 'Textured cotton jacquard with soft crepe bottom',
    sizes,
    color: 'Off-white',
    collection: 'Daywear',
    images: ['/assets/dresses/porcelain-lounge-coord/1.jpeg'],
    featured: true,
    bestSeller: true,
  },
  {
    id: 3,
    slug: 'sage-atelier-set',
    name: 'Sage Atelier Set',
    price: 11200,
    description:
      'Contemporary separates with clean lines and a muted palette, created for understated statement dressing.',
    details: [
      'Structured kurta with refined seam detail',
      'Straight trouser with relaxed drape',
      'Soft tone designed for transitional styling',
    ],
    fabric: 'Premium lawn blend with polished matte texture',
    sizes,
    color: 'Muted sage',
    collection: 'Signature Basics',
    images: ['/assets/dresses/sage-atelier-set/1.jpeg'],
    featured: true,
  },
  {
    id: 4,
    slug: 'sandstone-tailored-set',
    name: 'Sandstone Tailored Set',
    price: 10650,
    description:
      'A softly tailored co-ord with clean proportions and minimal finishing for effortless luxury.',
    details: [
      'Straight hem shirt for polished layering',
      'Wide silhouette trouser with elegant fall',
      'Designed to move from day to evening seamlessly',
    ],
    fabric: 'Breathable crepe with soft hand feel',
    sizes,
    color: 'Sand beige',
    collection: 'Signature Basics',
    images: ['/assets/dresses/sandstone-tailored-set/1.jpeg'],
    bestSeller: true,
  },
  {
    id: 5,
    slug: 'ivory-column-edit',
    name: 'Ivory Column Edit',
    price: 9450,
    description:
      'A minimal monochrome set with clean surfaces and elegant fall, made for refined daily wear.',
    details: [
      'Lightweight tunic with modern proportions',
      'Full-length trouser for elongated shape',
      'Pairs easily with tonal accessories',
    ],
    fabric: 'Soft cotton blend with fluid crepe trouser',
    sizes,
    color: 'Cream ivory',
    collection: 'Daywear',
    images: ['/assets/dresses/ivory-column-edit/1.jpeg'],
  },
  {
    id: 6,
    slug: 'dune-evening-line',
    name: 'Dune Evening Line',
    price: 13200,
    description:
      'A refined formal silhouette finished in a warm neutral palette with graceful movement and subtle shine.',
    details: [
      'Delicate finish through neckline and sleeve line',
      'Coordinated straight trouser for balanced drape',
      'Elegant neutral intended for intimate celebrations',
    ],
    fabric: 'Lustre satin blend with airy organza detail',
    sizes,
    color: 'Warm dune',
    collection: 'Occasionwear',
    images: ['/assets/dresses/dune-evening-line/1.jpeg'],
  },
];

export const getProductBySlug = (slug?: string) =>
  products.find((product) => product.slug === slug);
