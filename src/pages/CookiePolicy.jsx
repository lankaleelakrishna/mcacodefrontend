import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>

        <p className="text-sm text-muted-foreground mb-6">Last updated: January 1, 2025</p>

        <p className="text-lg text-muted-foreground mb-6">
          This Cookie Policy explains how MCA Fashion uses cookies and similar
          technologies to provide you with a better browsing experience.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">What Are Cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small text files stored on your device when you visit
            our website. They help us remember your preferences and improve
            your shopping experience.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Types of Cookies We Use</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>
              <span className="font-medium">Essential Cookies:</span> Required for
              basic site functionality (can't be disabled)
            </li>
            <li>
              <span className="font-medium">Preference Cookies:</span> Remember
              your settings and improve usability
            </li>
            <li>
              <span className="font-medium">Analytics Cookies:</span> Help us
              understand how visitors use our site
            </li>
            <li>
              <span className="font-medium">Marketing Cookies:</span> Track
              effectiveness of our marketing campaigns
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Cookie Duration</h2>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Session Cookies</h3>
              <p className="text-muted-foreground">
                Temporary cookies that expire when you close your browser.
                Used for essential functions like keeping you logged in while shopping.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Persistent Cookies</h3>
              <p className="text-muted-foreground">
                Stay on your device for a set period. Used for remembering
                preferences and improving site performance.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Managing Your Cookie Preferences</h2>
          <p className="text-muted-foreground mb-4">
            You can control cookies in several ways:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Browser settings: Block or delete cookies</li>
            <li>Our cookie banner: Adjust preferences when visiting</li>
            <li>Private browsing: Use incognito mode to browse without cookies</li>
          </ul>
          <div className="bg-primary/10 p-4 rounded-lg mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Blocking essential cookies may affect basic
              site functionality like shopping cart and checkout.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Third-Party Cookies</h2>
          <p className="text-muted-foreground mb-4">
            We partner with trusted services that may set cookies on our behalf:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Google Analytics: Site usage analysis</li>
            <li>Payment processors: Secure transactions</li>
            <li>Social media: Share buttons and content</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">
              Cookie Policy Questions:<br />
              Email: privacy@mcafashion.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Learn more about cookies at{" "}
            <a href="https://www.aboutcookies.org" 
               className="text-primary hover:underline" 
               target="_blank" 
               rel="noopener noreferrer">
              aboutcookies.org
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
