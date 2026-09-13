export const products = [
  { slug:'everyday-tee', name:'The Everyday Tee', category:'Tops', type:'Heavyweight cotton / Ink', price:2490, image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', tag:'New', colors:['Ink','Bone'], sizes:['XS','S','M','L','XL'] },
  { slug:'relaxed-overshirt', name:'Relaxed Overshirt', category:'Tops', type:'Organic twill / Bone', price:4990, image:'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=1000&q=85', colors:['Bone','Olive'], sizes:['S','M','L','XL'] },
  { slug:'studio-trouser', name:'Studio Trouser', category:'Bottoms', type:'Cotton linen / Stone', price:4490, image:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85', tag:'Bestseller', colors:['Stone','Ink'], sizes:['28','30','32','34','36'] },
  { slug:'daily-short', name:'Daily Short', category:'Bottoms', type:'Cotton poplin / Ink', price:2990, image:'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=85', colors:['Ink','Sand'], sizes:['28','30','32','34','36'] },
  { slug:'boxy-shirt', name:'Boxy Shirt', category:'Tops', type:'Washed cotton / White', price:3490, image:'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=1000&q=85', colors:['White','Blue'], sizes:['S','M','L','XL'] },
  { slug:'utility-pant', name:'Utility Pant', category:'Bottoms', type:'Cotton canvas / Olive', price:5290, image:'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1000&q=85', tag:'Low stock', colors:['Olive','Ink'], sizes:['28','30','32','34'] }
]
export const money = (n:number) => `₹${n.toLocaleString('en-IN')}`
