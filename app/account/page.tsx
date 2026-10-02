import Header from '../components/Header'
import Footer from '../components/Footer'
import AuthForm from './AuthForm'

export default function Account() {
  return <><Header/><main className="mx-auto max-w-2xl px-5 pb-24 pt-36"><p className="text-[10px] uppercase tracking-[.25em]">Your account</p><h1 className="mt-5 text-7xl tracking-[-.08em]">Welcome.</h1><AuthForm/></main><Footer/></>
}
