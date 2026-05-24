/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Team } from "../types";
import { Badge } from "@/components/ui/badge";
import TeamLogo from "./TeamLogo";

interface StandingsTableProps {
  teams: Team[];
  onSelectTeam?: (teamId: string) => void;
}

export default function StandingsTable({ teams, onSelectTeam }: StandingsTableProps) {
  // Automatic ranking logic: Sort by wins (descending), then by points difference (descending)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    return diffB - diffA;
  });

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-x-auto backdrop-blur-sm select-none scrollbar-thin scrollbar-thumb-white/10">
      <div className="min-w-[690px] md:min-w-0">
        <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="w-16 text-center text-zinc-400 font-bold">排名</TableHead>
            <TableHead className="text-zinc-400 font-bold">球队</TableHead>
            <TableHead className="text-center text-zinc-400 font-bold">胜</TableHead>
            <TableHead className="text-center text-zinc-400 font-bold">负</TableHead>
            <TableHead className="text-center text-zinc-400 font-bold">胜率</TableHead>
            <TableHead className="text-center text-zinc-400 font-bold">得分</TableHead>
            <TableHead className="text-center text-zinc-400 font-bold">失分</TableHead>
            <TableHead className="text-center text-zinc-400 font-bold">净胜分</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => {
            const totalGames = team.wins + team.losses;
            const winRate = totalGames > 0 ? ((team.wins / totalGames) * 100).toFixed(1) : "0.0";
            const diff = team.pointsFor - team.pointsAgainst;
            
            return (
              <TableRow 
                key={team.id} 
                className={`border-white/5 hover:bg-white/5 transition-colors ${onSelectTeam ? 'cursor-pointer' : ''}`}
                onClick={() => onSelectTeam?.(team.id)}
              >
                <TableCell className="text-center font-bold text-lg">
                  {index + 1 <= 3 ? (
                    <span className={`
                      ${index === 0 ? 'text-accent-gold' : ''}
                      ${index === 1 ? 'text-slate-300' : ''}
                      ${index === 2 ? 'text-accent-gold/70' : ''}
                    `}>
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-slate-500">{index + 1}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <TeamLogo 
                      teamId={team.id}
                      logoUrl={team.logoUrl} 
                      className="w-10 h-10 rounded-full bg-zinc-800 object-cover border border-white/10"
                    />
                    <span className="font-bold text-white">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold text-green-500">{team.wins}</TableCell>
                <TableCell className="text-center font-bold text-red-500">{team.losses}</TableCell>
                <TableCell className="text-center font-mono text-zinc-300">{winRate}%</TableCell>
                <TableCell className="text-center text-zinc-400">{team.pointsFor}</TableCell>
                <TableCell className="text-center text-zinc-400">{team.pointsAgainst}</TableCell>
                <TableCell className="text-center">
                  <Badge className={`font-mono ${diff >= 0 ? 'bg-accent-gold text-black' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
