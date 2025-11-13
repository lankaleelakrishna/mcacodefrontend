import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

        <p className="text-sm text-muted-foreground mb-6">Effective date: January 1, 2025</p>

        <p className="text-lg text-muted-foreground mb-6">
          MCA Fashion ("we", "us") respects your privacy and is committed to protecting
          it through our compliance with this policy.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Contact information (name, email, phone, shipping address)</li>
            <li>Payment information (processed securely through our payment provider)</li>
            <li>Shopping preferences and order history</li>
            <li>Device and usage information when you use our website</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and updates</li>
            <li>Provide customer support</li>
            <li>Improve our website and services</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Information Security</h2>
          <p className="text-muted-foreground mb-4">
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>SSL encryption for all data transmissions</li>
            <li>Secure payment processing through trusted providers</li>
            <li>Regular security audits and updates</li>
            <li>Limited staff access to personal information</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Privacy Rights</h2>
          <p className="text-muted-foreground mb-4">
            Depending on your location, you may have the following rights:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Access and receive a copy of your personal data</li>
            <li>Correct or update inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent for future processing</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">International Data Transfers</h2>
          <p className="text-muted-foreground mb-4">
            We may process your information in countries outside your home country. 
            When we do, we implement appropriate safeguards to protect your data in 
            accordance with this Privacy Policy and applicable law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            For privacy-related inquiries or to exercise your rights:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">
              Privacy Officer<br />
              MCA Fashion<br />
              Email: privacy@mcafashion.com<br />
              Phone: +1 (555) 123-4567<br />
              Address: 123 Fashion Ave, New York, NY 10001
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            We aim to respond to all legitimate requests within 30 days.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
