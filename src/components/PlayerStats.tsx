/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Player, Team } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

interface PlayerStatsProps {
  players: Player[];
  teams: Team[];
}

type SortField = 'avgPoints' | 'avgRebounds' | 'avgSteals' | 'avgBlocks' | 'gamesPlayed' | 'name';

export default function PlayerStats({ players, teams }: PlayerStatsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('avgPoints');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter players based on search query and selected team
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          player.number.toString().includes(searchQuery) ||
                          player.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = selectedTeamId === "all" || player.teamId === selectedTeamId;
    return matchesSearch && matchesTeam;
  });

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined) valA = 0;
    if (valB === undefined) valB = 0;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    // Numbers
    return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and filter action bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索球员姓名、位置或号码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-sm focus:border-accent-gold outline-none text-white placeholder:text-slate-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full md:w-48 px-4 py-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-sm focus:border-accent-gold outline-none text-white font-bold transition-colors"
          >
            <option value="all" className="bg-slate-950 text-white">所有球队</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id} className="bg-slate-950 text-white">
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-x-auto backdrop-blur-sm select-none scrollbar-thin scrollbar-thumb-white/10">
        <div className="min-w-[720px] md:min-w-0">
          <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="w-16 text-center text-zinc-400 font-bold">排名</TableHead>
              <TableHead 
                className="text-zinc-400 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('name')}
              >
                球员 {sortField === 'name' && (sortAsc ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-zinc-400 font-bold">球队</TableHead>
              <TableHead 
                className="text-center text-zinc-400 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('avgPoints')}
              >
                场均得分 {sortField === 'avgPoints' && (sortAsc ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="text-center text-zinc-400 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('avgRebounds')}
              >
                场均篮板 {sortField === 'avgRebounds' && (sortAsc ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="text-center text-zinc-400 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('avgSteals')}
              >
                场均抢断 {sortField === 'avgSteals' && (sortAsc ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="text-center text-zinc-400 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('avgBlocks')}
              >
                场均盖帽 {sortField === 'avgBlocks' && (sortAsc ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="text-center text-zinc-400 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('gamesPlayed')}
              >
                出战数 {sortField === 'gamesPlayed' && (sortAsc ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player, index) => {
              const team = teams.find(t => t.id === player.teamId);
              
              return (
                <TableRow key={player.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="text-center font-bold text-lg">
                    <span className={index < 3 ? 'text-accent-gold' : 'text-slate-500'}>
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{player.name}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        #{player.number} | {player.position}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 font-medium">{team?.name || '自由球员'}</TableCell>
                  <TableCell className="text-center font-bold text-accent-gold text-lg">{player.avgPoints}</TableCell>
                  <TableCell className="text-center text-slate-300 font-semibold">{player.avgRebounds}</TableCell>
                  <TableCell className="text-center text-slate-300 font-medium">{player.avgSteals}</TableCell>
                  <TableCell className="text-center text-slate-300 font-medium">{player.avgBlocks}</TableCell>
                  <TableCell className="text-center text-slate-500 font-mono">{player.gamesPlayed}</TableCell>
                </TableRow>
              );
            })}
            {sortedPlayers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                  没有找到符合筛选条件的球员
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
