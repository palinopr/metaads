"use client";

import { useState } from "react";
import { Send, Sparkles, Zap, TrendingUp, DollarSign } from "lucide-react";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsCreating(true);
    
    try {
      // Call our Python API endpoint (or fallback to Node.js)
      const response = await fetch('/api/campaign/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          userId: 'web_user'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✨ ${data.message || 'Campaign created successfully!'}\n\nCampaign: ${data.campaign?.name || 'AI Campaign'}\nBudget: ${data.campaign?.budget || '$100/day'}`);
        setMessage("");
      } else {
        alert(`Error: ${data.error || 'Failed to create campaign'}`);
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* CEO Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Marketing on{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Autopilot
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create, optimize, and scale campaigns with AI. 
              No expertise needed. Just tell us what you want.
            </p>
            
            {/* CEO Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">30s</div>
                <div className="text-gray-400">To Launch</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">5x</div>
                <div className="text-gray-400">Better ROI</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">24/7</div>
                <div className="text-gray-400">Optimization</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Tell me about your campaign
            </h2>
            <p className="text-gray-300">
              Describe what you want to promote, who your customers are, and your budget. 
              I'll handle everything else.
            </p>
          </div>

          {/* Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              "Launch a campaign for my fitness app targeting millennials with $5k budget",
              "Promote my SaaS tool to startups, focus on free trial signups",
              "Create Instagram ads for my fashion brand, target women 25-40",
              "Help me beat my competitor who's dominating Facebook ads"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => setMessage(prompt)}
                className="text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 
                         border border-white/10 transition-all text-gray-300 text-sm"
              >
                <Sparkles className="w-4 h-4 inline mr-2 text-purple-400" />
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I want to promote my product to..."
              className="w-full p-4 pr-12 rounded-lg bg-white/5 border border-white/20 
                       text-white placeholder-gray-400 resize-none h-32
                       focus:outline-none focus:border-purple-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="absolute bottom-4 right-4 p-2 rounded-lg 
                       bg-gradient-to-r from-purple-500 to-pink-500 
                       text-white hover:from-purple-600 hover:to-pink-600 
                       disabled:opacity-50 transition-all"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Instant Creation</h3>
              <p className="text-gray-400 text-sm">
                From idea to live campaign in under 60 seconds
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">AI Optimization</h3>
              <p className="text-gray-400 text-sm">
                Continuously improves performance 24/7
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Maximum ROI</h3>
              <p className="text-gray-400 text-sm">
                Average 5x better returns than manual campaigns
              </p>
            </div>
          </div>
        </div>

        {/* CEO Note */}
        <div className="text-center mt-8 text-gray-400">
          <p className="text-sm">
            Built by marketers, powered by AI, designed for results.
          </p>
          <p className="text-xs mt-2">
            🚀 Currently in beta - First 100 users get 50% off forever
          </p>
        </div>
      </div>
    </div>
  );
}