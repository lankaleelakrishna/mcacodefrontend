import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AgePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Age Policy</h1>
        <p className="text-sm text-muted-foreground mb-6">Effective date: January 1, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Our age requirement</h2>
          <p className="text-muted-foreground mb-4">
            MCA Fashion's products are intended for adult use only. By using our site
            and purchasing from us you confirm that you are at least 18 years old
            (or the minimum age in your jurisdiction) and can lawfully use and purchase
            our products. Minors must not place orders without parental consent.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Verification</h2>
          <p className="text-muted-foreground mb-4">
            For certain products or transactions, we may require additional age verification.
            This can include checking the buyer's government-issued ID or requesting other
            forms of proof at the time of delivery. We reserve the right to refuse or cancel
            any order if we suspect it was placed by a user below the required age.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Responsible marketing</h2>
          <p className="text-muted-foreground mb-4">
            Our marketing and communications are intended for adult audiences. If you believe
            you have received a promotional message in error and are under the required age,
            please contact our support team to remove your contact details from marketing lists.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">
              If you have questions about our age policy:
              <br />
              Email: legal@mcafashion.com
              <br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
