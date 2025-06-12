import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Meta Ads Dashboard',
  description: 'Privacy Policy for Meta Ads Dashboard by Outlet Media Method',
  robots: 'index, follow',
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '10px',
        color: '#1a1a1a'
      }}>
        Privacy Policy
      </h1>
      
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', marginBottom: '30px' }}>
        <h2>Meta Ads Dashboard by Outlet Media Method</h2>
        <p>
          <strong>Company:</strong> Outlet Media LLC<br/>
          <strong>Contact:</strong> jaime@outletmedia.net<br/>
          <strong>Address:</strong> 3330 W 112th St, Hialeah Gardens, FL 33018, United States
        </p>
      </div>

      <h2>1. Information We Collect</h2>
      
      <h3>Facebook Account Information</h3>
      <p>When you connect your Facebook account through our OAuth integration, we access:</p>
      <ul>
        <li>Your Facebook user ID and name</li>
        <li>Your advertising account information</li>
        <li>Campaign data and performance metrics</li>
        <li>Ad insights and analytics data</li>
        <li>Business account information (if applicable)</li>
      </ul>

      <h3>Usage Data</h3>
      <p>We may collect information about how you use our service, including:</p>
      <ul>
        <li>Pages visited and features used</li>
        <li>Time spent on the dashboard</li>
        <li>Browser and device information</li>
        <li>IP address and general location</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Display your Facebook ad campaign data and analytics</li>
        <li>Provide insights and performance metrics</li>
        <li>Improve our dashboard functionality</li>
        <li>Ensure security and prevent unauthorized access</li>
        <li>Provide customer support when needed</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      
      <h3>Data Storage</h3>
      <ul>
        <li>Access tokens are stored securely using HTTPS and encryption</li>
        <li>Data is cached temporarily to improve performance (maximum 24 hours)</li>
        <li>No sensitive data is stored permanently on our servers</li>
        <li>All data is transmitted using SSL/TLS encryption</li>
      </ul>

      <h3>Security Measures</h3>
      <ul>
        <li>HTTPS encryption for all data transmission</li>
        <li>Secure OAuth 2.0 authentication protocols</li>
        <li>Regular security updates and monitoring</li>
        <li>Access controls and rate limiting</li>
      </ul>

      <h2>4. Data Sharing and Disclosure</h2>
      <p>We do not sell, trade, or rent your personal information to third parties. We may share data only in these limited circumstances:</p>
      <ul>
        <li>With your explicit consent</li>
        <li>To comply with legal obligations or court orders</li>
        <li>To protect our rights, safety, and property</li>
        <li>In case of business transfer or merger (with notice)</li>
      </ul>

      <h2>5. Facebook Platform Compliance</h2>
      <p>Our application complies with Facebook's Platform Policy and Data Policy:</p>
      <ul>
        <li>We only request necessary permissions for dashboard functionality</li>
        <li>We do not store Facebook data longer than necessary</li>
        <li>We respect Facebook's rate limits and usage guidelines</li>
        <li>Users can revoke access at any time through Facebook settings</li>
        <li>We comply with Facebook's data deletion requirements</li>
      </ul>

      <h2>6. Your Rights and Controls</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your data that we have collected</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Revoke Facebook app permissions at any time</li>
        <li>Disconnect your account from our service</li>
        <li>Export your data in a portable format</li>
        <li>Object to data processing</li>
        <li>Lodge a complaint with supervisory authorities</li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>We retain your data only as long as necessary to provide our services:</p>
      <ul>
        <li>Access tokens: Until you disconnect your account</li>
        <li>Cached campaign data: Automatically deleted after 24 hours</li>
        <li>Usage logs: Kept for 30 days for security purposes</li>
        <li>Account data: Deleted within 30 days of account disconnection</li>
      </ul>

      <h2>8. User Data Deletion</h2>
      <p>
        You can request deletion of your data at any time. To delete your data:
      </p>
      <ol>
        <li>Disconnect your Facebook account from our app</li>
        <li>Visit our data deletion page: <a href="https://outletmediamethod.com/data-deletion">https://outletmediamethod.com/data-deletion</a></li>
        <li>Or email us at: jaime@outletmedia.net with subject "Data Deletion Request"</li>
      </ol>
      <p>We will process deletion requests within 30 days.</p>

      <h2>9. Cookies and Tracking</h2>
      <p>We use cookies and similar technologies to:</p>
      <ul>
        <li>Maintain your login session</li>
        <li>Remember your preferences</li>
        <li>Analyze usage patterns</li>
        <li>Improve dashboard performance</li>
      </ul>
      <p>You can control cookies through your browser settings.</p>

      <h2>10. Children's Privacy</h2>
      <p>
        Our service is not intended for children under 13 years of age. We do not knowingly 
        collect personal information from children under 13. If we discover that we have 
        collected such information, we will delete it immediately.
      </p>

      <h2>11. International Data Transfers</h2>
      <p>
        Your data may be transferred to and processed in the United States and other countries. 
        We ensure that such transfers comply with applicable data protection laws and provide 
        adequate protection for your data through appropriate safeguards.
      </p>

      <h2>12. GDPR Compliance (EU Users)</h2>
      <p>For users in the European Union, our legal basis for processing includes:</p>
      <ul>
        <li><strong>Consent:</strong> When you connect your Facebook account</li>
        <li><strong>Legitimate Interest:</strong> To provide and improve our services</li>
        <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
        <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
      </ul>

      <h2>13. Changes to This Policy</h2>
      <p>
        We may update this privacy policy from time to time. We will notify you of any 
        material changes by posting the new policy on this page and updating the "Last updated" 
        date. Your continued use of the service after changes constitutes acceptance of the new policy.
      </p>

      <h2>14. Contact Information</h2>
      <div style={{ backgroundColor: '#f0f0f0', padding: '15px', marginTop: '20px' }}>
        <p><strong>For privacy-related inquiries, contact us:</strong></p>
        <p>
          <strong>Email:</strong> jaime@outletmedia.net<br/>
          <strong>Subject:</strong> Privacy Policy Inquiry<br/>
          <strong>Company:</strong> Outlet Media LLC<br/>
          <strong>Address:</strong> 3330 W 112th St, Hialeah Gardens, FL 33018, United States
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
        <p>
          <a href="/" style={{ color: '#1a73e8', textDecoration: 'none' }}>← Back to Dashboard</a>
          {' | '}
          <a href="/terms" style={{ color: '#1a73e8', textDecoration: 'none' }}>Terms of Service</a>
        </p>
      </div>
    </div>
  )
}