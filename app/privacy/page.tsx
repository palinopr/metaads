import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meta Ads Dashboard Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Facebook Account Information</h3>
                  <p className="text-gray-700">
                    When you connect your Facebook account, we access:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Your Facebook user ID and name</li>
                    <li>Your advertising account information</li>
                    <li>Campaign data and performance metrics</li>
                    <li>Ad insights and analytics data</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Usage Data</h3>
                  <p className="text-gray-700">
                    We may collect information about how you use our service, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Pages visited and features used</li>
                    <li>Time spent on the dashboard</li>
                    <li>Browser and device information</li>
                    <li>IP address and general location</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Display your Facebook ad campaign data and analytics</li>
                <li>Provide insights and performance metrics</li>
                <li>Improve our dashboard functionality</li>
                <li>Ensure security and prevent unauthorized access</li>
                <li>Provide customer support when needed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Data Storage</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Access tokens are stored securely using encryption</li>
                    <li>Data is cached temporarily to improve performance</li>
                    <li>No sensitive data is stored permanently on our servers</li>
                    <li>All data is stored in secure, encrypted databases</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Security Measures</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>HTTPS encryption for all data transmission</li>
                    <li>Secure authentication protocols</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and monitoring</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-3">We do not sell, trade, or rent your personal information. We may share data only in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>In case of business transfer or merger</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Facebook Data Policy Compliance</h2>
              <p className="text-gray-700 mb-3">Our application complies with Facebook's Platform Policy and Data Policy:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>We only request necessary permissions for dashboard functionality</li>
                <li>We do not store Facebook data longer than necessary</li>
                <li>We respect Facebook's rate limits and usage guidelines</li>
                <li>Users can revoke access at any time through Facebook settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights and Controls</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Access your data that we have collected</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Revoke Facebook app permissions at any time</li>
                <li>Disconnect your account from our service</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-gray-700">
                We retain your data only as long as necessary to provide our services. 
                Specifically:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Access tokens are stored until you disconnect your account</li>
                <li>Cached campaign data is automatically deleted after 24 hours</li>
                <li>Usage logs are kept for 30 days for security purposes</li>
                <li>Account data is deleted within 30 days of account disconnection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-3">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns</li>
                <li>Improve dashboard performance</li>
              </ul>
              <p className="text-gray-700">
                You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for children under 13. We do not knowingly 
                collect personal information from children under 13. If we discover that 
                we have collected such information, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
              <p className="text-gray-700">
                Your data may be transferred to and processed in countries other than your 
                country of residence. We ensure that such transfers comply with applicable 
                data protection laws and provide adequate protection for your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you 
                of any material changes by posting the new policy on this page and updating 
                the "Last updated" date. Your continued use of the service after changes 
                constitutes acceptance of the new policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
              <p className="text-gray-700 mb-3">
                If you have any questions about this privacy policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@metaads-dashboard.com<br/>
                  <strong>Subject:</strong> Privacy Policy Inquiry
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Legal Basis for Processing (GDPR)</h2>
              <p className="text-gray-700 mb-3">
                For users in the European Union, our legal basis for processing your data includes:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Consent:</strong> When you connect your Facebook account</li>
                <li><strong>Legitimate Interest:</strong> To provide and improve our services</li>
                <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
              </ul>
            </section>

          </CardContent>
        </Card>

        <div className="text-center">
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