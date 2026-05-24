/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game, Team } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { MOCK_TEAMS } from "../constants";
import TeamLogo from "./TeamLogo";

interface ScheduleListProps {
  games: Game[];
  teams: Team[];
  onSelectGame?: (gameId: string) => void;
}

export default function ScheduleList({ games, teams, onSelectGame }: ScheduleListProps) {
  return (
    <div className="space-y-4">
      {games.map((game) => {
        // Robust team resolver
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

        let homeTeam = getTeamDetails(game.homeTeamId);
        let awayTeam = getTeamDetails(game.awayTeamId);

        // Override undecided playoff finals teams in the main schedule section
        if (game.id.startsWith('g_playoff_f') || (game.stage?.includes('final') && !game.stage?.includes('semi'))) {
          const sf1 = games.find(g => g.id === 'g_playoff_sf1');
          const sf2 = games.find(g => g.id === 'g_playoff_sf2');
          
          const sf1Finished = sf1?.status === 'finished';
          const sf2Finished = sf2?.status === 'finished';

          const sf1WinnerId = sf1Finished ? (sf1.homeScore > sf1.awayScore ? sf1.homeTeamId : sf1.awayTeamId) : null;
          const sf2WinnerId = sf2Finished ? (sf2.homeScore > sf2.awayScore ? sf2.homeTeamId : sf2.awayTeamId) : null;

          if (!sf1WinnerId) {
            homeTeam = { id: 'pending-sf1', name: '半决赛 1 胜者 (暂定)', wins: 0, losses: 0, rank: 0, pointsFor: 0, pointsAgainst: 0 };
          } else {
            homeTeam = getTeamDetails(sf1WinnerId);
          }

          if (!sf2WinnerId) {
            awayTeam = { id: 'pending-sf2', name: '半决赛 2 胜者 (暂定)', wins: 0, losses: 0, rank: 0, pointsFor: 0, pointsAgainst: 0 };
          } else {
            awayTeam = getTeamDetails(sf2WinnerId);
          }
        }

        const date = new Date(game.date);
        const isTentative = game.isTentative || (game.id.startsWith('g_playoff_') && game.status !== 'finished');

        return (
          <Card 
            key={game.id} 
            className={`bg-zinc-900/50 border-white/10 overflow-hidden hover:border-orange-600/50 transition-all group ${onSelectGame ? 'cursor-pointer' : ''}`}
            onClick={() => onSelectGame?.(game.id)}
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center">
                {/* Game Info */}
                <div className="w-full md:w-48 p-6 bg-white/5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                  <div className="text-zinc-400 text-sm font-bold mb-1 flex items-center gap-1">
                    {date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    {isTentative && <span className="text-accent-gold text-xs">(暂定)</span>}
                  </div>
                  {isTentative ? (
                    <div className="flex items-center gap-1 text-accent-gold font-bold mb-2 text-xs bg-accent-gold/10 border border-accent-gold/20 px-2 py-0.5 rounded-full">
                      <Clock size={12} className="text-accent-gold" />
                      时间暂定
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-white font-black mb-2">
                      <Clock size={14} className="text-orange-600" />
                      {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                    </div>
                  )}
                  <Badge variant={game.status === 'live' ? 'destructive' : 'secondary'} className="uppercase text-[10px] font-black tracking-widest">
                    {game.status === 'finished' ? '已结束' : game.status === 'live' ? '进行中' : '未开始'}
                  </Badge>
                </div>

                {/* Matchup */}
                <div className="flex-1 p-6 flex items-center justify-between gap-4 w-full">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamLogo 
                      teamId={homeTeam?.id || ''}
                      logoUrl={homeTeam?.logoUrl} 
                      className="w-16 h-16 rounded-full bg-zinc-800 object-cover border-2 border-white/5 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold text-white text-center text-sm md:text-base">{homeTeam?.name}</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                      <span className={game.homeScore > game.awayScore ? 'text-orange-600' : ''}>{game.homeScore}</span>
                      <span className="text-zinc-700 text-2xl">:</span>
                      <span className={game.awayScore > game.homeScore ? 'text-orange-600' : ''}>{game.awayScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
                      <MapPin size={12} />
                      {isTentative ? '地点暂定' : game.venue}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamLogo 
                      teamId={awayTeam?.id || ''}
                      logoUrl={awayTeam?.logoUrl} 
                      className="w-16 h-16 rounded-full bg-zinc-800 object-cover border-2 border-white/5 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold text-white text-center text-sm md:text-base">{awayTeam?.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
