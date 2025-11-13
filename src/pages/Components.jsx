import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.tsx'
import Cart from '../components/Cart.jsx'
import Categories from '../components/Categories.jsx'
import ProductCard from '../components/ProductCard.tsx'
import HeroCarousel from '../components/HeroCarousel.tsx'
import ProductCarousel from '../components/ProductCarousel.tsx'
import { Reviews } from '../components/Reviews'
import FAQ from '../components/FAQ.tsx'

const Section = ({ title, children }) => (
  <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
    <h3 className="text-lg font-semibold mb-3">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
)

export default function Components() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Component Showcase</h1>

        <Section title="Hero Carousel">
          <div className="h-48">
            <HeroCarousel />
          </div>
        </Section>

        <Section title="Navbar">
          <Navbar />
        </Section>

        <Section title="Categories">
          <Categories />
        </Section>

        <Section title="Product Card">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>
        </Section>

        <Section title="Product Carousel">
          <ProductCarousel />
        </Section>

        <Section title="Cart">
          <Cart />
        </Section>

        <Section title="Customer Reviews">
          <Reviews productId="all" />
        </Section>

        <Section title="FAQ">
          <FAQ />
        </Section>

        <Section title="Footer">
          <Footer />
        </Section>
      </main>
      <Footer />
    </div>
  )
}
