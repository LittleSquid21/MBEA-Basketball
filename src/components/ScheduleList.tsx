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

        const homeTeam = getTeamDetails(game.homeTeamId);
        const awayTeam = getTeamDetails(game.awayTeamId);
        const date = new Date(game.date);

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
                  <div className="text-zinc-400 text-sm font-bold mb-1">
                    {date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </div>
                  <div className="flex items-center gap-1 text-white font-black mb-2">
                    <Clock size={14} className="text-orange-600" />
                    {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                  </div>
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
                    <span className="font-bold text-white text-center">{homeTeam?.name}</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                      <span className={game.homeScore > game.awayScore ? 'text-orange-600' : ''}>{game.homeScore}</span>
                      <span className="text-zinc-700 text-2xl">:</span>
                      <span className={game.awayScore > game.homeScore ? 'text-orange-600' : ''}>{game.awayScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
                      <MapPin size={12} />
                      {game.venue}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamLogo 
                      teamId={awayTeam?.id || ''}
                      logoUrl={awayTeam?.logoUrl} 
                      className="w-16 h-16 rounded-full bg-zinc-800 object-cover border-2 border-white/5 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold text-white text-center">{awayTeam?.name}</span>
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
