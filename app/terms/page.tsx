import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meta Ads Dashboard Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using the Meta Ads Dashboard ("Service"), you accept and agree 
                to be bound by the terms and provision of this agreement. If you do not agree 
                to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-gray-700">
                Meta Ads Dashboard is a web-based analytics platform that helps users visualize 
                and analyze their Facebook/Meta advertising campaign data. The service connects 
                to Facebook's Marketing API to retrieve and display advertising performance metrics.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
              <p className="text-gray-700 mb-3">You agree to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Provide accurate and complete information when using the service</li>
                <li>Maintain the security of your Facebook account credentials</li>
                <li>Use the service only for lawful purposes</li>
                <li>Comply with all applicable Facebook policies and terms</li>
                <li>Not attempt to circumvent any security measures</li>
                <li>Not reverse engineer or attempt to extract source code</li>
                <li>Not use the service to violate any laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Facebook Platform Compliance</h2>
              <p className="text-gray-700 mb-3">
                This service is built on Facebook's Platform and is subject to Facebook's terms:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Users must comply with Facebook's Platform Policy</li>
                <li>Facebook may restrict or terminate access to their platform</li>
                <li>Data access is subject to Facebook's API terms and limitations</li>
                <li>Users are responsible for their Facebook account compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Service Availability</h2>
              <p className="text-gray-700">
                We strive to maintain service availability but do not guarantee uninterrupted access. 
                The service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Scheduled maintenance</li>
                <li>Facebook API limitations or outages</li>
                <li>Technical issues beyond our control</li>
                <li>Security incidents requiring service interruption</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data and Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy, which also 
                governs your use of the service, to understand our practices. By using our service, 
                you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
              <p className="text-gray-700 mb-3">
                The service and its original content, features, and functionality are owned by 
                the service provider and are protected by international copyright, trademark, 
                patent, trade secret, and other intellectual property laws.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>You retain ownership of your Facebook advertising data</li>
                <li>We retain ownership of the dashboard software and design</li>
                <li>You may not copy, modify, or distribute our software</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
              <p className="text-gray-700 mb-3">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>We do not warrant that the service will be error-free</li>
                <li>We do not guarantee the accuracy of Facebook data displayed</li>
                <li>We are not responsible for Facebook API changes or limitations</li>
                <li>Use of the service is at your own risk</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-gray-700">
                IN NO EVENT SHALL THE SERVICE PROVIDER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS 
                OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR 
                USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Account Termination</h2>
              <p className="text-gray-700 mb-3">
                We may terminate or suspend your account and access to the service:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>For violations of these terms</li>
                <li>For suspected fraudulent or illegal activity</li>
                <li>If required by law or regulation</li>
                <li>At our sole discretion with reasonable notice</li>
              </ul>
              <p className="text-gray-700">
                You may terminate your account at any time by disconnecting your Facebook account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Modifications to Service</h2>
              <p className="text-gray-700">
                We reserve the right to modify or discontinue the service (or any part thereof) 
                at any time with or without notice. We shall not be liable to you or any third 
                party for any modification, suspension, or discontinuance of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
              <p className="text-gray-700">
                These terms shall be interpreted and governed in accordance with the laws of 
                the jurisdiction where the service is operated, without regard to conflict 
                of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to update or change our Terms of Service at any time. 
                We will notify you of any material changes by posting the new Terms of Service 
                on this page and updating the "Last updated" date. Your continued use of the 
                service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
              <p className="text-gray-700 mb-3">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@metaads-dashboard.com<br/>
                  <strong>Subject:</strong> Terms of Service Inquiry
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Severability</h2>
              <p className="text-gray-700">
                If any provision of these terms is found to be unenforceable or invalid, 
                that provision shall be limited or eliminated to the minimum extent necessary 
                so that these Terms of Service shall otherwise remain in full force and effect.
              </p>
            </section>

          </CardContent>
        </Card>

        <div className="text-center space-x-4">
          <Link 
            href="/privacy" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-400">|</span>
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}