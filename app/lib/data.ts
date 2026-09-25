export type ProductVariant = {
  id: string
  sku: string
  size: string
  colour: string
  pricePaise: number
  stockQuantity: number
}

export type Product = {
  id: string
  slug: string
  name: string
  category: string
  categorySlug: string
  collection: 'Tops' | 'Bottoms'
  type: string
  description: string
  pricePaise: number
  image: string
  tag?: string
  colors: string[]
  sizes: string[]
  variants: ProductVariant[]
}

type ProductSeed = Omit<Product, 'id' | 'variants' | 'categorySlug' | 'collection'>

const seeds: ProductSeed[] = [
  { slug:'everyday-tee', name:'The Everyday Tee', category:'Tops', type:'Heavyweight cotton / Ink', description:'A substantial everyday tee with a relaxed line and a soft, lived-in hand.', pricePaise:249000, image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', tag:'New', colors:['Ink','Bone'], sizes:['XS','S','M','L','XL'] },
  { slug:'relaxed-overshirt', name:'Relaxed Overshirt', category:'Tops', type:'Organic twill / Bone', description:'An easy layer cut with room to move, finished in weighty organic twill.', pricePaise:499000, image:'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=1000&q=85', colors:['Bone','Olive'], sizes:['S','M','L','XL'] },
  { slug:'studio-trouser', name:'Studio Trouser', category:'Bottoms', type:'Cotton linen / Stone', description:'A clean, straight trouser made from breathable cotton linen for everyday wear.', pricePaise:449000, image:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85', tag:'Bestseller', colors:['Stone','Ink'], sizes:['28','30','32','34','36'] },
  { slug:'daily-short', name:'Daily Short', category:'Bottoms', type:'Cotton poplin / Ink', description:'Lightweight pull-on shorts designed for warm days and unhurried weekends.', pricePaise:299000, image:'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=85', colors:['Ink','Sand'], sizes:['28','30','32','34','36'] },
  { slug:'boxy-shirt', name:'Boxy Shirt', category:'Tops', type:'Washed cotton / White', description:'A softly structured shirt with a cropped, boxy proportion and washed finish.', pricePaise:349000, image:'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=1000&q=85', colors:['White','Blue'], sizes:['S','M','L','XL'] },
  { slug:'utility-pant', name:'Utility Pant', category:'Bottoms', type:'Cotton canvas / Olive', description:'A practical canvas trouser with generous pockets and a relaxed tapered shape.', pricePaise:529000, image:'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1000&q=85', tag:'Low stock', colors:['Olive','Ink'], sizes:['28','30','32','34'] }
]

const skuPart = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-')

export const products: Product[] = seeds.map((product) => ({
  ...product,
  id: product.slug,
  categorySlug: product.category.toLowerCase(),
  collection: product.category === 'Tops' ? 'Tops' : 'Bottoms',
  variants: product.colors.flatMap((colour) => product.sizes.map((size, index) => ({
    id: `${product.slug}-${colour.toLowerCase()}-${size.toLowerCase()}`,
    sku: `KES-${skuPart(product.slug)}-${skuPart(colour)}-${skuPart(size)}`,
    colour,
    size,
    pricePaise: product.pricePaise,
    stockQuantity: product.slug === 'utility-pant' ? Math.max(1, 4 - index) : 12
  })))
}))

export const money = (paise:number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(paise / 100)

export const moneyRupees = (rupees:number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(rupees)

export const findProduct = (slug: string) => products.find((product) => product.slug === slug)

export const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`
