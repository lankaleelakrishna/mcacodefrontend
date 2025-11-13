import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>

        <p className="text-sm text-muted-foreground mb-6">Last updated: January 1, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using MCA Fashion's website, you agree to be bound
            by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Shopping & Orders</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>All prices are in USD unless otherwise stated</li>
            <li>Orders are subject to availability and confirmation</li>
            <li>We reserve the right to refuse or cancel any order</li>
            <li>Shipping costs and delivery times vary by location</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Product Information & Pricing</h2>
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>All prices are in USD unless otherwise stated</li>
              <li>We strive to maintain accurate product information and pricing</li>
              <li>Product colors may vary due to monitor settings</li>
              <li>We reserve the right to modify prices without notice</li>
              <li>Promotional discounts cannot be combined unless specified</li>
            </ul>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Returns & Refunds</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              We accept returns within 30 days of purchase under these conditions:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Items must be unworn with original tags attached</li>
              <li>Original packaging must be included</li>
              <li>Valid proof of purchase is required</li>
              <li>Return shipping costs may apply</li>
              <li>Special orders or customized items are non-returnable</li>
            </ul>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
          <p className="text-muted-foreground mb-4">
            All content on this website including text, graphics, logos, images,
            and software is the property of MCA Fashion and protected by
            intellectual property laws.
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Content may not be copied or reproduced without permission</li>
            <li>Trademarks and logos are protected property</li>
            <li>User content submissions grant us usage rights</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Contact Information</h2>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">
              Legal Department<br />
              MCA Fashion<br />
              Email: legal@mcafashion.com<br />
              Phone: +1 (555) 123-4567<br />
              Hours: Monday-Friday, 9am-5pm EST
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            For urgent matters, please contact us during business hours.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
