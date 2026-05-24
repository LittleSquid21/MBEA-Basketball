/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Game, Team } from '../types';
import { MOCK_TEAMS } from '../constants';
import TeamLogo from './TeamLogo';

interface ScoreTickerProps {
  games: Game[];
  teams: Team[];
}

export default function ScoreTicker({ games, teams }: ScoreTickerProps) {
  const finishedGames = games.filter(g => g.status === 'finished');

  if (finishedGames.length === 0) return null;

  return (
    <div className="w-full bg-background/80 backdrop-blur-md border-b border-white/5 py-4 overflow-hidden whitespace-nowrap sticky top-0 z-40">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="inline-flex gap-8 px-4"
      >
        {[...finishedGames, ...finishedGames, ...finishedGames].map((game, i) => {
          // Robust team details resolver
          const getTeamDetails = (idOrName: string) => {
            let found = teams.find((t) => t.id === idOrName || t.name === idOrName);
            if (!found) {
              const mock = MOCK_TEAMS.find((m) => m.id === idOrName || m.name === idOrName);
              if (mock) {
                found = teams.find((t) => t.name === mock.name);
                if (found) return { ...found, id: mock.id, logoUrl: mock.logoUrl || found.logoUrl };
                return mock;
              }
            }
            return found;
          };

          const homeTeam = getTeamDetails(game.homeTeamId);
          const awayTeam = getTeamDetails(game.awayTeamId);
          
          return (
            <div key={i} className="flex items-center gap-4 bg-slate-900/60 px-5 py-2.5 rounded-2xl border border-accent-gold/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <TeamLogo 
                  teamId={homeTeam?.id || ''} 
                  logoUrl={homeTeam?.logoUrl} 
                  className="w-6 h-6 rounded-full bg-zinc-800 object-cover border border-white/5"
                />
                <span className="text-sm font-bold text-white/90">{homeTeam?.name}</span>
                <span className="text-xl font-black text-accent-gold">{game.homeScore}</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-accent-gold">{game.awayScore}</span>
                <span className="text-sm font-bold text-white/90">{awayTeam?.name}</span>
                <TeamLogo 
                  teamId={awayTeam?.id || ''} 
                  logoUrl={awayTeam?.logoUrl} 
                  className="w-6 h-6 rounded-full bg-zinc-800 object-cover border border-white/5"
                />
              </div>
              <div className="ml-2 px-2.5 py-1 rounded-full bg-accent-gold/10 text-[10px] font-bold text-accent-gold uppercase tracking-widest border border-accent-gold/20">
                Final
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
