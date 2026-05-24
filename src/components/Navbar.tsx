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
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
        active
          ? 'bg-accent-gold text-black shadow-lg shadow-accent-gold/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function Navbar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
      <div className="flex items-center gap-1">
        <NavItem
          icon={<Home size={20} />}
          label="首页"
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <NavItem
          icon={<Calendar size={20} />}
          label="赛程"
          active={activeTab === 'schedule'}
          onClick={() => setActiveTab('schedule')}
        />
        <NavItem
          icon={<Trophy size={20} />}
          label="排名"
          active={activeTab === 'standings'}
          onClick={() => setActiveTab('standings')}
        />
        <NavItem
          icon={<Users size={20} />}
          label="球队"
          active={activeTab === 'teams'}
          onClick={() => setActiveTab('teams')}
        />
        <NavItem
          icon={<Crown size={20} className="text-accent-gold" />}
          label="季后赛"
          active={activeTab === 'playoffs'}
          onClick={() => setActiveTab('playoffs')}
        />
      </div>
    </nav>
  );
}
