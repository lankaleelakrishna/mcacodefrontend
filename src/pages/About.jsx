import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.tsx'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
  <h1 className="text-3xl font-bold mb-4">About MCA Fashion</h1>
        <p className="text-lg text-muted-foreground mb-6">
          MCA Fashion designs women's wear crafted with attention to detail and
          high-quality materials. Our mission is to create timeless pieces that
          celebrate individuality and confidence.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
          <p className="text-base text-muted-foreground">
            We strive to combine artisanal craftsmanship with modern design to
            create clothing that is memorable, elegant, and made to last.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Our Team</h2>
          <p className="text-base text-muted-foreground">
            Our team is made up of designers, pattern-makers and product experts who
            care deeply about quality, fit and customer experience.
          </p>
        </section>

        <section className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="mb-4 text-muted-foreground">
            Have questions or want to collaborate? Reach out and we'll get back
            to you.
          </p>
          <a href="/contact" className="inline-block bg-primary text-white px-4 py-2 rounded">
            Contact
          </a>
        </section>
      </main>
      <Footer />
    </div>
  )
}
