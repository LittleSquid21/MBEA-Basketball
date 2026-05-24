import React, { useState } from 'react';
import { Team, Game } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Clock, MapPin, ChevronRight, Save, ShieldAlert, Award, Star } from 'lucide-react';
import { MOCK_TEAMS } from '../constants';
import TeamLogo from './TeamLogo';

interface PlayoffsProps {
  games: Game[];
  teams: Team[];
  isAdmin: boolean;
}

export default function Playoffs({ games, teams, isAdmin }: PlayoffsProps) {
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<number>(0);
  const [awayScoreInput, setAwayScoreInput] = useState<number>(0);
  const [statusInput, setStatusInput] = useState<string>('scheduled');
  const [dateInput, setDateInput] = useState<string>('');
  const [venueInput, setVenueInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter regular phase from playoff games
  const playoffGames = games.filter(g => g.id.startsWith('g_playoff_') || g.stage?.includes('final') || g.stage?.includes('semifinal'));

  // If playoff matches don't exist in active Firestore list, let's extract them from default list or mock them so they fall back gracefully.
  const getPlayoffGame = (id: string, defaultHome: string, defaultAway: string, defaultStage: string, defaultDate: string) => {
    const existing = playoffGames.find(g => g.id === id || g.stage === defaultStage);
    if (existing) return existing;
    
    // Fallback if not loaded in DB yet (e.g., prior to seeding or custom database)
    return {
      id,
      homeTeamId: defaultHome,
      awayTeamId: defaultAway,
      homeScore: 0,
      awayScore: 0,
      date: defaultDate,
      status: 'scheduled' as const,
      venue: '石子山体育公园篮球场3号场（非木地板）',
      stage: defaultStage
    };
  };

  // Semifinal Games
  const sf1 = getPlayoffGame('g_playoff_sf1', 'team-green-knights', 'team-ents', 'semifinal_1', '2026-05-30T17:00:00Z');
  const sf2 = getPlayoffGame('g_playoff_sf2', 'team-black-gate', 'team-super-class', 'semifinal_2', '2026-05-30T18:30:00Z');

  // Helper to get Team Name and Logo with extreme robustness (resolving name-mismatch, id-mismatch, or fallback to mock)
  const getTeam = (id: string) => {
    // 1. Try finding in active prop teams by exact ID
    let found = teams.find(t => t.id === id);
    if (found) return found;

    // 2. Try finding by matching with mock IDs
    const mock = MOCK_TEAMS.find(m => m.id === id);
    if (mock) {
      // Find in db teams by name
      found = teams.find(t => t.name === mock.name);
      if (found) {
        return { ...found, id: mock.id, logoUrl: mock.logoUrl || found.logoUrl };
      }
      return mock;
    }

    // 3. Try matching by name as a final fallback
    found = teams.find(t => t.name === id);
    return found;
  };

  // Calculate Semifinal Winners
  const getSfWinner = (game: Game) => {
    if (game.status !== 'finished') return null;
    return game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
  };

  const sf1WinnerId = getSfWinner(sf1);
  const sf2WinnerId = getSfWinner(sf2);

  // Finals Games - Best of 3
  // If Semifinals are finished, we dynamically use those teams for the finals!
  // If not, we use the fallback seeded mock teams or placeholder names in UI.
  const finalHomeId = sf1WinnerId || sf1.homeTeamId;
  const finalAwayId = sf2WinnerId || sf2.awayTeamId;

  const f1 = getPlayoffGame('g_playoff_f1', finalHomeId, finalAwayId, 'final_1', '2026-06-06T18:00:00Z');
  
  // We can also support creating/displaying Game 2 and Game 3 of Finals
  const f2 = getPlayoffGame('g_playoff_f2', finalHomeId, finalAwayId, 'final_2', '2026-06-13T18:00:00Z');
  const f3 = getPlayoffGame('g_playoff_f3', finalHomeId, finalAwayId, 'final_3', '2026-06-20T18:00:00Z');

  // Edit controls
  const startEdit = (game: Game) => {
    if (!isAdmin) return;
    setEditingGameId(game.id);
    setHomeScoreInput(game.homeScore);
    setAwayScoreInput(game.awayScore);
    setStatusInput(game.status);
    setDateInput(game.date);
    setVenueInput(game.venue);
  };

  const cancelEdit = () => {
    setEditingGameId(null);
  };

  const saveGameUpdate = async (gameId: string) => {
    setIsSaving(true);
    try {
      // Find the game globally or prepare schema
      const originalGame = games.find(g => g.id === gameId);
      
      if (originalGame) {
        // Update in Firestore
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, {
          homeScore: Number(homeScoreInput),
          awayScore: Number(awayScoreInput),
          status: statusInput,
          date: dateInput,
          venue: venueInput
        });
      } else {
        // If it doesn't exist in collection yet (not seeded), create it!
        // We find structural templates
        let template = sf1;
        if (gameId === sf2.id) template = sf2;
        else if (gameId === f1.id) template = f1;
        else if (gameId === f2.id) template = f2;
        else if (gameId === f3.id) template = f3;

        await addDoc(collection(db, 'games'), {
          homeTeamId: template.homeTeamId,
          awayTeamId: template.awayTeamId,
          homeScore: Number(homeScoreInput),
          awayScore: Number(awayScoreInput),
          date: dateInput,
          status: statusInput,
          venue: venueInput,
          stage: template.stage
        });
      }
      
      alert('比分状态更新成功！');
      setEditingGameId(null);
    } catch (error) {
      console.error('Update playoff game failed', error);
      alert('更新失败，请确保您以管理员账号登录。');
    } finally {
      setIsSaving(false);
    }
  };

  // Render Bracket Connection Lines
  return (
    <div className="space-y-12">
      {/* Intro Bannner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-[#0A0F1D] to-slate-900 border border-white/5 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-8 items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-accent-cyan/5 blur-[120px] rounded-full" />
        
        <div className="bg-gradient-to-br from-accent-gold to-yellow-500 p-6 rounded-3xl shadow-lg shadow-accent-gold/20 flex-shrink-0">
          <Trophy className="w-16 h-16 text-black" />
        </div>
        
        <div className="space-y-4 text-center md:text-left flex-grow">
          <div className="inline-flex items-center gap-2 bg-accent-gold/15 border border-accent-gold/20 text-accent-gold px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest font-mono">
            Playoffs Mode • 季后赛阶段
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tight text-white uppercase font-heading">
            巅峰对决 <span className="bg-gradient-to-r from-accent-gold to-yellow-400 bg-clip-text text-transparent">战火重燃</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
            常规赛圆满收官！季后赛根据胜场排名，由 <strong className="text-white">第一名对战第四名</strong>（绿袍骑士 VS 树人慢脚），<strong className="text-white">第二名对战第三名</strong>（黑门 VS Super Class）。
            半决赛为一场定胜负，胜者会师最高舞台。总决赛采用三局两胜制（Best of 3）决出本届 MEBA 年度总冠军！
          </p>
        </div>
      </div>

      {/* Visual Tournament Bracket */}
      <div className="relative bg-slate-950/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 md:p-12 shadow-inner overflow-x-auto min-w-full">
        <div id="bracket-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-center min-w-[760px] relative py-8">
          
          {/* Section: Semifinals (Left, cols: 5) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-5 space-y-12">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 font-mono mb-2 flex items-center gap-2 px-1">
              <span>⚡</span> 半决赛 (一场制) • 5月30日
            </h3>

            {/* Match 1 Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition duration-500" />
              <Card className="bg-slate-900/60 backdrop-blur-xl border-white/5 relative z-10 rounded-2xl overflow-hidden hover:border-white/10 transition-all shadow-xl">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold">半决赛 1</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> 17:00</span>
                  </div>

                  <div className="space-y-3">
                    {/* Home Team (1st) */}
                    <TeamRow 
                      team={getTeam(sf1.homeTeamId)} 
                      score={sf1.homeScore} 
                      status={sf1.status} 
                      isWinner={sf1WinnerId === sf1.homeTeamId} 
                      rank={1}
                    />
                    
                    {/* Divider */}
                    <div className="h-[1px] bg-white/5" />

                    {/* Away Team (4th) */}
                    <TeamRow 
                      team={getTeam(sf1.awayTeamId)}  
                      score={sf1.awayScore} 
                      status={sf1.status} 
                      isWinner={sf1WinnerId === sf1.awayTeamId} 
                      rank={4}
                    />
                  </div>

                  {/* Match Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-500 font-bold whitespace-nowrap overflow-hidden">
                    <span className="truncate flex items-center gap-1"><MapPin size={10} /> {sf1.venue || '待定'}</span>
                    {isAdmin && (
                      <button 
                        onClick={() => startEdit(sf1)}
                        className="text-accent-gold hover:text-yellow-400 hover:underline transition-all"
                      >
                        录入比分
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Match 2 Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition duration-500" />
              <Card className="bg-slate-900/60 backdrop-blur-xl border-white/5 relative z-10 rounded-2xl overflow-hidden hover:border-white/10 transition-all shadow-xl">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-bold">半决赛 2</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> 18:30</span>
                  </div>

                  <div className="space-y-3">
                    {/* Home Team (2nd) */}
                    <TeamRow 
                      team={getTeam(sf2.homeTeamId)} 
                      score={sf2.homeScore} 
                      status={sf2.status} 
                      isWinner={sf2WinnerId === sf2.homeTeamId} 
                      rank={2}
                    />
                    
                    {/* Divider */}
                    <div className="h-[1px] bg-white/5" />

                    {/* Away Team (3rd) */}
                    <TeamRow 
                      team={getTeam(sf2.awayTeamId)} 
                      score={sf2.awayScore} 
                      status={sf2.status} 
                      isWinner={sf2WinnerId === sf2.awayTeamId} 
                      rank={3}
                    />
                  </div>

                  {/* Match Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-500 font-bold">
                    <span className="truncate flex items-center gap-1"><MapPin size={10} /> {sf2.venue || '待定'}</span>
                    {isAdmin && (
                      <button 
                        onClick={() => startEdit(sf2)}
                        className="text-accent-gold hover:text-yellow-400 hover:underline transition-all"
                      >
                        录入比分
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

          {/* Connection Visual (Middle representation, cols: 2) */}
          <div className="hidden lg:col-span-2 lg:flex flex-col justify-around h-full py-20 relative pointer-events-none text-slate-700">
            <div className="h-1/2 w-full flex items-center relative">
              <div className="w-1/2 h-[1px] bg-white/10 absolute left-0" />
              <div className="w-[1px] h-[190px] bg-white/10 absolute left-1/2 top-1/2 -translate-y-[95px]" />
              <div className="w-1/2 h-[1px] bg-gradient-to-r from-white/10 to-accent-gold/40 absolute left-1/2" />
            </div>
          </div>

          {/* Section: Finals (Right, cols: 5) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-5 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent-gold font-mono mb-2 flex items-center gap-2 px-1">
              <span>🏆</span> 总决赛 (三局两胜) • 6月6号起
            </h3>

            {/* Final Game 1 Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-gold to-yellow-500 rounded-3xl opacity-10 group-hover:opacity-20 blur-md transition duration-500" />
              <Card className="bg-slate-900/80 backdrop-blur-xl border-accent-gold/10 relative z-10 rounded-2xl overflow-hidden hover:border-accent-gold/30 transition-all shadow-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="bg-accent-gold text-black font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                      三局两胜第一场
                    </span>
                    <span className="text-slate-400 font-bold flex items-center gap-1"><Clock size={12} /> 6/6 18:00</span>
                  </div>

                  <div className="space-y-4">
                    {/* Home Winner Placeholder/Dynamic */}
                    <FinalTeamRow 
                      team={getTeam(f1.homeTeamId)} 
                      score={f1.homeScore} 
                      status={f1.status} 
                      isWinner={f1.status === 'finished' && f1.homeScore > f1.awayScore}
                      placeholderText="半决赛 1 胜者" 
                    />

                    {/* VS */}
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] bg-white/10 flex-grow" />
                      <span className="text-[10px] font-mono text-slate-600 tracking-widest font-black uppercase">VS</span>
                      <div className="h-[1px] bg-white/10 flex-grow" />
                    </div>

                    {/* Away Winner Placeholder/Dynamic */}
                    <FinalTeamRow 
                      team={getTeam(f1.awayTeamId)} 
                      score={f1.awayScore} 
                      status={f1.status} 
                      isWinner={f1.status === 'finished' && f1.awayScore > f1.homeScore}
                      placeholderText="半决赛 2 胜者" 
                    />
                  </div>

                  {/* Venue and Score controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400 font-bold">
                    <span className="truncate flex items-center gap-1"><MapPin size={10} /> {f1.venue || '待定'}</span>
                    {isAdmin && sf1WinnerId && sf2WinnerId && (
                      <button 
                        onClick={() => startEdit(f1)}
                        className="text-accent-gold hover:text-yellow-400 hover:underline transition-all"
                      >
                        录入总决赛比分
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dynamic details for best of 3 series if needed */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold text-slate-500">
              <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5 text-center space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">总决赛第二场 (G2)</div>
                <div className="text-zinc-400">6月13日 18:00</div>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5 text-center space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">总决赛第三场 (G3)</div>
                <div className="text-zinc-400">若有需要：6月20日</div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Admin Score Logging Modal (Singly used overlay for bracket page) */}
      {editingGameId && (
        (() => {
          let gameToEdit = sf1;
          if (editingGameId === sf2.id) gameToEdit = sf2;
          else if (editingGameId === f1.id) gameToEdit = f1;
          
          const homeT = getTeam(gameToEdit.homeTeamId);
          const awayT = getTeam(gameToEdit.awayTeamId);

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                  <h4 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <ShieldAlert className="text-accent-gold" size={20} /> 管理员录入 - 季后赛比赛
                  </h4>
                  <button 
                    onClick={cancelEdit} 
                    className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  >
                    取消
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Team vs Team Header */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex flex-col items-center gap-2 flex-grow">
                      <TeamLogo teamId={homeT?.id || ''} logoUrl={homeT?.logoUrl} className="w-12 h-12 rounded-full bg-slate-800 object-cover" />
                      <span className="text-sm font-black text-white text-center">{homeT?.name || '主队'}</span>
                    </div>
                    <span className="text-lg font-mono text-slate-500 uppercase font-black">VS</span>
                    <div className="flex flex-col items-center gap-2 flex-grow">
                      <TeamLogo teamId={awayT?.id || ''} logoUrl={awayT?.logoUrl} className="w-12 h-12 rounded-full bg-slate-800 object-cover" />
                      <span className="text-sm font-black text-white text-center">{awayT?.name || '客队'}</span>
                    </div>
                  </div>

                  {/* Form inputs */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Home Score */}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{homeT?.name} 比分</label>
                        <input 
                          type="number"
                          value={homeScoreInput}
                          onChange={(e) => setHomeScoreInput(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-white/10 text-white font-mono font-black text-2xl h-14 rounded-2xl p-4 text-center focus:outline-none focus:border-accent-gold/40"
                        />
                      </div>
                      {/* Away Score */}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{awayT?.name} 比分</label>
                        <input 
                          type="number"
                          value={awayScoreInput}
                          onChange={(e) => setAwayScoreInput(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-white/10 text-white font-mono font-black text-2xl h-14 rounded-2xl p-4 text-center focus:outline-none focus:border-accent-gold/40"
                        />
                      </div>
                    </div>

                    {/* Status selection */}
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">比赛状态</label>
                      <select 
                        value={statusInput} 
                        onChange={(e) => setStatusInput(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 text-white font-bold h-12 rounded-2xl px-4 focus:outline-none"
                      >
                        <option value="scheduled">未开始 (Scheduled)</option>
                        <option value="live">进行中 (Live)</option>
                        <option value="finished">已结束 (Finished)</option>
                      </select>
                    </div>

                    {/* Metadata dates & venues */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">比赛日期</label>
                        <input 
                          type="text"
                          value={dateInput}
                          onChange={(e) => setDateInput(e.target.value)}
                          placeholder="2026-05-30T17:00:00Z"
                          className="w-full bg-slate-950 border border-white/10 text-white text-xs font-mono h-12 rounded-2xl px-4 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">球馆地点</label>
                        <input 
                          type="text"
                          value={venueInput}
                          onChange={(e) => setVenueInput(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 text-white text-xs font-bold h-12 rounded-2xl px-4 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={cancelEdit}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white h-12 rounded-2xl font-bold transition-all text-sm"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => saveGameUpdate(editingGameId)}
                      disabled={isSaving}
                      className="flex-grow bg-accent-gold hover:bg-yellow-500 text-black h-12 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/15"
                    >
                      <Save size={16} />
                      {isSaving ? '保存中...' : '保存修改'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()
      )}
    </div>
  );
}

// Sub Component: Row containing Team in Bracket Matches
interface TeamRowProps {
  team?: Team;
  score: number;
  status: string;
  isWinner: boolean;
  rank: number;
}

function TeamRow({ team, score, status, isWinner, rank }: TeamRowProps) {
  if (!team) {
    return (
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          <span className="text-sm font-bold text-slate-600">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2 select-none transition-all ${isWinner ? 'text-white' : 'text-slate-500'}`}>
      <div className="flex items-center gap-3">
        {/* Logo */}
        <TeamLogo 
          teamId={team.id}
          logoUrl={team.logoUrl} 
          className={`w-8 h-8 rounded-full object-cover bg-slate-800 border ${isWinner ? 'border-accent-gold' : 'border-white/10'} transition-all`}
        />
        {/* Team Details */}
        <div className="flex flex-col">
          <span className="text-sm font-black flex items-center gap-1">
            {team.name}
            {isWinner && <Award className="w-3.5 h-3.5 text-accent-gold" />}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-bold">
            种子 #{rank} · 常规赛积分 {team.wins}胜{team.losses}负
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        {status === 'finished' ? (
          <span className={`text-xl font-black italic font-mono ${isWinner ? 'text-accent-gold' : 'text-slate-600'}`}>
            {score}
          </span>
        ) : status === 'live' ? (
          <span className="text-red-500 text-xs font-black animate-pulse flex items-center gap-1 uppercase font-mono bg-red-500/15 border border-red-500/20 px-2 py-0.5 rounded-full">
            ● 正在进行: {score}
          </span>
        ) : (
          <span className="text-xs text-slate-700 font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
            未开
          </span>
        )}
      </div>
    </div>
  );
}

// Sub Component: Final Team Row with placeholders
interface FinalTeamRowProps {
  team?: Team;
  score: number;
  status: string;
  isWinner: boolean;
  placeholderText: string;
}

function FinalTeamRow({ team, score, status, isWinner, placeholderText }: FinalTeamRowProps) {
  if (!team) {
    return (
      <div className="flex items-center justify-between p-2 text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/5 bg-slate-950 flex items-center justify-center font-black text-slate-700">?</div>
          <div className="flex flex-col">
            <span className="text-sm font-bold italic">{placeholderText}</span>
            <span className="text-[9px] font-mono tracking-widest text-slate-700 uppercase font-black">TO BE DECIDED</span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-700 uppercase tracking-widest">待定</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2 select-none transition-all ${isWinner ? 'text-white' : 'text-slate-400'}`}>
      <div className="flex items-center gap-3">
        {/* Logo */}
        <TeamLogo 
          teamId={team.id}
          logoUrl={team.logoUrl} 
          className={`w-10 h-10 rounded-full object-cover bg-slate-800 border-2 ${isWinner ? 'border-accent-gold shadow-lg shadow-accent-gold/20 scale-105' : 'border-white/10'} transition-all`}
        />
        {/* Team Details */}
        <div className="flex flex-col">
          <span className="text-base font-black flex items-center gap-1.5">
            {team.name}
            {isWinner && <Award className="w-4 h-4 text-accent-gold" />}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black flex items-center gap-1">
            <Star size={8} className="text-accent-gold" /> FEB Champion contender
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        {status === 'finished' ? (
          <span className={`text-2xl font-black italic font-mono ${isWinner ? 'text-accent-gold' : 'text-slate-600'}`}>
            {score}
          </span>
        ) : status === 'live' ? (
          <span className="text-red-500 text-xs font-black animate-pulse flex items-center gap-1 uppercase font-mono bg-red-500/15 border border-red-500/20 px-2 py-1 rounded-full">
            ● 进行中: {score}
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1 rounded-sm">
            TBD
          </span>
        )}
      </div>
    </div>
  );
}
