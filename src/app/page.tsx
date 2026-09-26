import Link from 'next/link'
import { ShieldCheck, Zap, Lock, ArrowRight } from 'lucide-react'
import { QuickVerifyForm } from '@/components/warranties/quick-verify-form'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-950" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">e-warrant360</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-blue-200 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-blue-400 hover:bg-blue-300 text-blue-950 font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-blue-800/50 text-blue-200 text-sm px-4 py-2 rounded-full mb-8 border border-blue-700">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Built for Sri Lankan Businesses
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Digital Warranties,{' '}
          <span className="text-blue-300">Done Right</span>
        </h1>
        <p className="text-xl text-blue-200 mb-10 max-w-2xl leading-relaxed">
          Issue, manage and verify product warranties digitally. Simple enough for any shop,
          powerful enough for growing businesses.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-300 text-blue-950 font-bold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/verify"
            className="inline-flex items-center justify-center border border-blue-500 text-blue-200 hover:bg-blue-800/50 px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Verify a Warranty
          </Link>
        </div>

        {/* Quick Customer Lookup */}
        <div className="w-full max-w-md pt-2">
          <p className="text-xs text-blue-300/80 mb-2 uppercase tracking-wider font-semibold">
            Or quick check warranty by number:
          </p>
          <QuickVerifyForm />
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Instant Warranties',
              desc: 'Create a digital warranty in seconds. No paper, no hassle.',
            },
            {
              icon: ShieldCheck,
              title: 'QR Verification',
              desc: 'Customers scan to verify warranty status anytime, anywhere.',
            },
            {
              icon: Lock,
              title: 'Bank-Grade Security',
              desc: 'Multi-tenant isolation, encrypted data, secure access controls.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-blue-800/30 border border-blue-700/50 rounded-2xl p-6 text-center"
            >
              <div className="flex justify-center mb-3">
                <f.icon className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-blue-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-blue-400 text-sm pb-8">
        © {new Date().getFullYear()} e-warrant360. Built for Sri Lanka 🇱🇰
      </footer>
    </div>
  )
}
