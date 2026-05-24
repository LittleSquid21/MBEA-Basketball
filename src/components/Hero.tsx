/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronRight, Trophy } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=1920"
          alt="MEBA Epic Basketball Court"
          className="w-full h-full object-cover opacity-35 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.95)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-sm font-medium mb-8">
            <Trophy size={14} />
            <span>2026 春季赛季进行中</span>
          </div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative group min-h-[200px] flex items-center justify-center">
              <div className="absolute inset-0 bg-accent-gold/20 blur-3xl rounded-full group-hover:bg-accent-gold/40 transition-all duration-1000" />
              <img 
                src="/logo.png" 
                alt="MEBA Logo" 
                className="w-64 md:w-80 h-auto mb-8 relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform duration-700 brightness-110 contrast-110"
                onError={(e) => {
                  const target = e.currentTarget;
                  // If local logo fails, try the cloud storage URL
                  if (target.src.includes('/logo.png')) {
                    target.src = "https://storage.googleapis.com/static.antigravity.dev/projects/slqto2ozpeixwteszx7rvm/Middle-Earth_Basketball_League_Logo.png";
                  } else if (!target.src.includes('889442.png')) {
                    // If cloud URL fails, try generic icon
                    target.src = "https://cdn-icons-png.flaticon.com/512/889/889442.png";
                  } else {
                    // Final fallback: hide
                    target.style.display = 'none';
                  }
                }}
                referrerPolicy="no-referrer"
              />
              {/* Text-based fallback that only shows if image fails or is loading */}
              <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-20">
                <span className="text-6xl font-bold text-accent-gold tracking-tighter">MEBA</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tight uppercase leading-none font-heading drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
              MIDDLE-EARTH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold via-accent-emerald to-accent-gold animate-gradient-x">BASKETBALL</span> LEAGUE
            </h1>
          </div>
          
          <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-lg">
            在古老的土地上，书写属于你的球场传奇。
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button className="px-10 py-4 bg-accent-gold hover:bg-yellow-500 text-black rounded-2xl font-bold transition-all flex items-center gap-2 group shadow-2xl shadow-accent-gold/20">
              立即查看赛程
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold transition-all backdrop-blur-md">
              了解联赛详情
            </button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10" />
    </div>
  );
}
