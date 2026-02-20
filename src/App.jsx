import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Mattress recommendations based on room size
const MATTRESS_SIZES = {
  small: { label: 'Twin or Twin XL', description: 'Perfect for smaller rooms or growing kids', minSize: '7x10 ft' },
  medium: { label: 'Full or Queen', description: 'Ideal for average bedrooms and solo sleepers', minSize: '10x12 ft' },
  large: { label: 'Queen or King', description: 'Great for couples or those who want extra space', minSize: '12x14 ft' },
  xlarge: { label: 'King or California King', description: 'Maximum space for couples and pet owners', minSize: '14x16 ft+' }
}

// Mattress types based on sleep position
const MATTRESS_TYPES = {
  back: { 
    name: 'Support Plus Hybrid', 
    type: 'Hybrid',
    description: 'Optimal support for spinal alignment with pressure-relieving comfort layers',
    firmness: 'Medium-Firm',
    features: ['Coil support core', 'Memory foam comfort', 'Edge reinforcement']
  },
  side: { 
    name: 'Pressure Relief Foam', 
    type: 'Memory Foam',
    description: 'Conforms to your curves, relieving pressure on shoulders and hips',
    firmness: 'Soft-Medium',
    features: ['Gel-infused foam', 'Adaptive response', 'Motion isolation']
  },
  stomach: { 
    name: 'Firm Support Core', 
    type: 'Innerspring',
    description: 'Firm support to keep hips from sinking and maintain proper alignment',
    firmness: 'Firm',
    features: ['Steel coil system', 'Firm comfort layer', 'Breathable design']
  },
  combo: { 
    name: 'Versa Comfort Hybrid', 
    type: 'Hybrid',
    description: 'Versatile support that adapts to any sleeping position',
    firmness: 'Medium',
    features: ['Adaptive foam layers', 'Responsive coils', 'All-position comfort']
  }
}

// Price tiers
const PRICE_TIERS = [
  { id: 'essential', name: 'Essential', range: '$500-$1,500', discount: 0 },
  { id: 'performance', name: 'Performance', range: '$1,500-$3,500', discount: 10 },
  { id: 'premium', name: 'Premium', range: '$3,500-$6,000', discount: 15 },
  { id: 'luxury', name: 'Luxury', range: '$6,000-$15,000', discount: 20 }
]

// Bundle items with prices
const BUNDLE_ITEMS = {
  mattress: { name: 'Mattress', basePrice: 2499 },
  base: { name: 'Adjustable Base', basePrice: 899 },
  pillows: { name: 'Premium Pillows (2)', basePrice: 199 },
  protector: { name: 'Mattress Protector', basePrice: 89 },
  sheets: { name: 'Sheets Set', basePrice: 149 }
}

function App() {
  const [roomDimensions, setRoomDimensions] = useState({ width: 12, length: 14 })
  const [sleepPosition, setSleepPosition] = useState('back')
  const [budget, setBudget] = useState(3000)
  const [selectedTier, setSelectedTier] = useState('performance')
  const [bundle, setBundle] = useState({
    mattress: true,
    base: true,
    pillows: true,
    protector: true,
    sheets: true
  })
  const bundleRef = useRef(null)

  // Calculate recommended mattress size based on room dimensions
  const getRecommendedSize = () => {
    const roomArea = roomDimensions.width * roomDimensions.length
    if (roomArea <= 80) return MATTRESS_SIZES.small
    if (roomArea <= 130) return MATTRESS_SIZES.medium
    if (roomArea <= 180) return MATTRESS_SIZES.large
    return MATTRESS_SIZES.xlarge
  }

  // Get mattress type based on sleep position
  const getMattressType = () => MATTRESS_TYPES[sleepPosition]

  // Get tier based on budget
  const getTier = () => {
    if (budget < 1500) return PRICE_TIERS[0]
    if (budget < 3500) return PRICE_TIERS[1]
    if (budget < 6000) return PRICE_TIERS[2]
    return PRICE_TIERS[3]
  }

  // Calculate bundle total
  const calculateTotal = () => {
    const tier = PRICE_TIERS.find(t => t.id === selectedTier)
    const discount = tier?.discount || 0
    
    let total = 0
    Object.entries(bundle).forEach(([key, included]) => {
      if (included && BUNDLE_ITEMS[key]) {
        total += BUNDLE_ITEMS[key].basePrice * (1 - discount / 100)
      }
    })
    return total
  }

  // Calculate financing options
  const calculateFinancing = () => {
    const total = calculateTotal()
    const months = [12, 24, 36]
    
    return months.map(m => ({
      months: m,
      monthlyPayment: Math.round(total / m)
    }))
  }

  // Export PDF
  const exportPDF = async () => {
    if (!bundleRef.current) return
    
    try {
      const canvas = await html2canvas(bundleRef.current, {
        backgroundColor: '#12121a',
        scale: 2
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.setFillColor(10, 10, 15)
      pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F')
      
      pdf.setTextColor(248, 250, 252)
      pdf.setFontSize(24)
      pdf.text('Your Sleep System Configuration', 20, 25)
      
      pdf.setFontSize(12)
      pdf.setTextColor(148, 163, 184)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35)
      
      pdf.addImage(imgData, 'PNG', 15, 45, pdfWidth - 30, pdfHeight - 10)
      
      const tier = PRICE_TIERS.find(t => t.id === selectedTier)
      pdf.setFontSize(14)
      pdf.setTextColor(139, 92, 246)
      pdf.text(`Selected Tier: ${tier?.name} (${tier?.discount}% discount)`, 20, pdfHeight + 55)
      
      pdf.setFontSize(11)
      pdf.setTextColor(148, 163, 184)
      pdf.text(`Room: ${roomDimensions.width}' x ${roomDimensions.length}' | Sleep Position: ${sleepPosition}`, 20, pdfHeight + 63)
      pdf.text(`Budget: $${budget.toLocaleString()} | Total: $${calculateTotal().toLocaleString()}`, 20, pdfHeight + 70)
      
      const financing = calculateFinancing()
      pdf.setFontSize(10)
      pdf.text('Financing Options:', 20, pdfHeight + 82)
      financing.forEach((opt, i) => {
        pdf.text(`${opt.months} months: $${opt.monthlyPayment}/mo`, 20, pdfHeight + 90 + (i * 7))
      })
      
      pdf.save('sleep-system-config.pdf')
    } catch (error) {
      console.error('PDF export failed:', error)
    }
  }

  const recommendedSize = getRecommendedSize()
  const mattressType = getMattressType()
  const currentTier = getTier()
  const financing = calculateFinancing()

  return (
    <div className="min-h-screen gradient-bg pb-20">
      {/* Header */}
      <header className="card-elevated border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Sleep System Configurator</h1>
                <p className="text-xs text-slate-400">Mattress Firm Pro Tool</p>
              </div>
            </div>
            <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Room Configuration */}
        <section className="card p-6 mb-8 opacity-0 animate-fade-in stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Room Dimensions</h2>
              <p className="text-sm text-slate-400">Enter room size for mattress recommendations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Room Width (feet)</label>
              <input
                type="number"
                value={roomDimensions.width}
                onChange={(e) => setRoomDimensions({ ...roomDimensions, width: Number(e.target.value) })}
                min="5"
                max="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Room Length (feet)</label>
              <input
                type="number"
                value={roomDimensions.length}
                onChange={(e) => setRoomDimensions({ ...roomDimensions, length: Number(e.target.value) })}
                min="5"
                max="30"
              />
            </div>
          </div>

          <div className="card-elevated p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400">✓</span>
              <span className="font-medium">Recommended: {recommendedSize.label}</span>
            </div>
            <p className="text-sm text-slate-400">{recommendedSize.description}</p>
            <p className="text-xs text-slate-500 mt-1">Minimum room size: {recommendedSize.minSize}</p>
          </div>
        </section>

        {/* Sleep Position */}
        <section className="card p-6 mb-8 opacity-0 animate-fade-in stagger-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sleep Position</h2>
              <p className="text-sm text-slate-400">How do you primarily sleep?</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {['back', 'side', 'stomach', 'combo'].map((pos) => (
              <button
                key={pos}
                onClick={() => setSleepPosition(pos)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  sleepPosition === pos
                    ? 'border-purple-500 bg-purple-500/20 animate-pulse-glow'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-2xl mb-2">
                  {pos === 'back' && '😴'}
                  {pos === 'side' && '🛏️'}
                  {pos === 'stomach' && '🥄'}
                  {pos === 'combo' && '🔄'}
                </div>
                <div className="font-medium capitalize">{pos}</div>
              </button>
            ))}
          </div>

          <div className="card-elevated p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-lg">{mattressType.name}</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">{mattressType.type}</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">{mattressType.description}</p>
            <div className="flex flex-wrap gap-2">
              {mattressType.features.map((feature, i) => (
                <span key={i} className="px-2 py-1 rounded bg-white/5 text-xs text-slate-300">{feature}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Budget & Tier */}
        <section className="card p-6 mb-8 opacity-0 animate-fade-in stagger-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Budget & Tier</h2>
              <p className="text-sm text-slate-400">Set your budget to find the perfect tier</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Budget Range</span>
              <span className="font-semibold text-purple-400">${budget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="15000"
              step="100"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>$500</span>
              <span>$15,000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRICE_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedTier === tier.id
                    ? 'border-teal-500 bg-teal-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="font-semibold mb-1">{tier.name}</div>
                <div className="text-xs text-slate-400">{tier.range}</div>
                {tier.discount > 0 && (
                  <div className="mt-2 text-xs text-teal-400">-{tier.discount}% off</div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Bundle Builder */}
        <section className="card p-6 mb-8 opacity-0 animate-fade-in stagger-4" ref={bundleRef}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m10M4 8 4v7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your Sleep Bundle</h2>
              <p className="text-sm text-slate-400">Customize your complete sleep system</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(BUNDLE_ITEMS).map(([key, item], index) => (
              <div
                key={key}
                className={`card-elevated p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  bundle[key]
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-white/5 opacity-50'
                }`}
                onClick={() => setBundle({ ...bundle, [key]: !bundle[key] })}
              >
                <div className="text-3xl mb-3 text-center">
                  {key === 'mattress' && '🛏️'}
                  {key === 'base' && '🔧'}
                  {key === 'pillows' && '💆'}
                  {key === 'protector' && '🛡️'}
                  {key === 'sheets' && '🧵'}
                </div>
                <div className="text-center font-medium mb-1">{item.name}</div>
                <div className="text-center text-purple-400 text-sm">${item.basePrice}</div>
                <div className={`mt-3 text-center text-xs ${bundle[key] ? 'text-teal-400' : 'text-slate-500'}`}>
                  {bundle[key] ? '✓ Included' : 'Click to add'}
                </div>
              </div>
            ))}
          </div>

          {/* Total & Financing */}
          <div className="card-elevated p-6 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">Total ({currentTier.name} Tier)</div>
                <div className="text-4xl font-bold gradient-text">${calculateTotal().toLocaleString()}</div>
                {currentTier.discount > 0 && (
                  <div className="text-sm text-teal-400 mt-1">Includes {currentTier.discount}% discount</div>
                )}
              </div>

              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-3">Financing Options (0% APR)</div>
                <div className="grid grid-cols-3 gap-3">
                  {financing.map((opt) => (
                    <div key={opt.months} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">${opt.monthlyPayment}</div>
                      <div className="text-xs text-slate-400">/mo for {opt.months}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="card p-6 opacity-0 animate-fade-in stagger-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Configuration Summary</h2>
              <p className="text-sm text-slate-400">Your personalized sleep system</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-elevated p-4 rounded-lg">
              <div className="text-xs text-slate-400 uppercase mb-1">Room Size</div>
              <div className="font-semibold">{roomDimensions.width}' x {roomDimensions.length}'</div>
              <div className="text-sm text-purple-400">{recommendedSize.label}</div>
            </div>
            <div className="card-elevated p-4 rounded-lg">
              <div className="text-xs text-slate-400 uppercase mb-1">Sleep Style</div>
              <div className="font-semibold capitalize">{sleepPosition}</div>
              <div className="text-sm text-blue-400">{mattressType.type}</div>
            </div>
            <div className="card-elevated p-4 rounded-lg">
              <div className="text-xs text-slate-400 uppercase mb-1">Budget</div>
              <div className="font-semibold">${budget.toLocaleString()}</div>
              <div className="text-sm text-teal-400">{currentTier.name} Tier</div>
            </div>
            <div className="card-elevated p-4 rounded-lg">
              <div className="text-xs text-slate-400 uppercase mb-1">Monthly</div>
              <div className="font-semibold">${financing[1].monthlyPayment}/mo</div>
              <div className="text-sm text-slate-400">24 months</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-500 text-sm">
        <p>Sleep System Configurator • Mattress Firm Pro Tool • Powered by OpenClaw</p>
      </footer>
    </div>
  )
}

export default App
