/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Calendar, Users, Home, Crown } from 'lucide-react';
import { motion } from 'motion/react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-full transition-all duration-300 ${
        active
          ? 'bg-accent-gold text-black shadow-lg shadow-accent-gold/20 font-bold scale-[1.02] sm:scale-100'
          : 'text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/5'
      }`}
    >
      <div className="flex-shrink-0 transition-transform active:scale-95 duration-150">
        {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      </div>
      <span className="font-semibold text-[10px] sm:text-sm tracking-tight sm:tracking-normal whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function Navbar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[480px] sm:w-auto z-50 bg-slate-950/90 backdrop-blur-2xl border border-white/10 p-1.5 sm:p-2 rounded-2xl sm:rounded-full shadow-2xl">
      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 w-full">
        <NavItem
          icon={<Home />}
          label="首页"
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <NavItem
          icon={<Calendar />}
          label="赛程"
          active={activeTab === 'schedule'}
          onClick={() => setActiveTab('schedule')}
        />
        <NavItem
          icon={<Trophy />}
          label="排名"
          active={activeTab === 'standings'}
          onClick={() => setActiveTab('standings')}
        />
        <NavItem
          icon={<Users />}
          label="球队"
          active={activeTab === 'teams'}
          onClick={() => setActiveTab('teams')}
        />
        <NavItem
          icon={<Crown className="text-accent-gold" />}
          label="季后赛"
          active={activeTab === 'playoffs'}
          onClick={() => setActiveTab('playoffs')}
        />
      </div>
    </nav>
  );
}
