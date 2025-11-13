import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.tsx'
import ProductCard from '../components/ProductCard.tsx'
import { products } from '../data/products'

const collections = [
  { id: 'best-sellers', title: 'Best Sellers', description: 'Our most loved fragrances' },
  { id: 'new-arrivals', title: 'New Arrivals', description: 'Fresh scents just launched' },
  { id: 'special-offers', title: 'Special Offers', description: 'Limited time offers' },
]

export default function Collections() {
  const featured = products.slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <header className="bg-gradient-to-r from-pink-50 to-yellow-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Collections</h1>
          <p className="text-lg text-muted-foreground">Explore curated sets and themes</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Collection Tiles */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {collections.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
              <p className="text-muted-foreground mb-4">{c.description}</p>
              <a href={`/collections/${c.id}`} className="text-primary underline">Shop {c.title}</a>
            </div>
          ))}
        </section>

        {/* Featured products */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        <section className="bg-card rounded-lg p-6 mt-12">
          <h3 className="text-lg font-semibold mb-2">Why our collections?</h3>
          <p className="text-muted-foreground">Each collection is curated to help you find the right scent for the moment — from date night to everyday wear.</p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
