import { SimpleChatPrototype } from "@/components/chat/simple-chat-prototype"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Facebook Ads That Actually Make Sense
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          No jargon. No complexity. Just results.
        </p>
        <p className="text-lg text-gray-500">
          Create your first profitable campaign in under 5 minutes
        </p>
      </div>

      {/* Chat Demo */}
      <div className="pb-12">
        <SimpleChatPrototype />
      </div>

      {/* Benefits */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold text-lg mb-2">Just Have a Conversation</h3>
            <p className="text-gray-600">
              No forms, no settings. Tell us about your business like you'd tell a friend.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-semibold text-lg mb-2">Smart Defaults</h3>
            <p className="text-gray-600">
              We handle all the complex stuff. Your campaigns start optimized from day one.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-semibold text-lg mb-2">Plain English Reports</h3>
            <p className="text-gray-600">
              "8 people called you today" not "CTR: 2.3%". Updates you actually understand.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for Salespeople, Not Marketers
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700 mb-4">
                "I tried Facebook ads before and gave up after an hour. With MetaAds, 
                I had my first campaign running in 5 minutes. Got 3 leads the first day!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  JM
                </div>
                <div>
                  <p className="font-semibold">Jessica Martinez</p>
                  <p className="text-sm text-gray-500">Real Estate Agent, Miami</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700 mb-4">
                "The daily updates are perfect. I actually understand how my ads are doing 
                without needing a marketing degree. Best $49/month I spend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  RT
                </div>
                <div>
                  <p className="font-semibold">Robert Thompson</p>
                  <p className="text-sm text-gray-500">Insurance Agent, Texas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Get More Customers?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Start free. Upgrade when you see results.
        </p>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">
          Start Your First Campaign →
        </button>
        <p className="text-sm text-gray-500 mt-4">
          No credit card required • Cancel anytime
        </p>
      </div>
    </div>
  )
}