import Header from '../../components/Header'; import Footer from '../../components/Footer'; import { products } from '../../lib/data'; import { ProductConfigurator } from '../../components/ProductShowcase'
export function generateStaticParams(){ return products.map(p=>({slug:p.slug})) }
export default function Product({params}:{params:{slug:string}}){const p=products.find(x=>x.slug===params.slug)||products[0]; return <><Header/><main className="site-main mx-auto max-w-7xl md:pt-36"><ProductConfigurator p={p}/></main><Footer/></>}
