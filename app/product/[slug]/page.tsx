import { notFound } from 'next/navigation'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { ProductConfigurator } from '../../components/ProductShowcase'
import { getCatalogue, getProductBySlug } from '../../lib/catalogue'

export async function generateStaticParams(){
  return (await getCatalogue()).map((product)=>({slug:product.slug}))
}

export default async function Product({params}:{params:{slug:string}}){
  const product=await getProductBySlug(params.slug)
  if(!product) notFound()
  return <><Header/><main className="site-main mx-auto max-w-7xl md:pt-36"><ProductConfigurator p={product}/></main><Footer/></>
}
