import React, { useState } from 'react';
import { Team, Game, News, Player } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Save, Trash2, Trophy, Newspaper, Calendar, Users, Settings } from 'lucide-react';

interface AdminPanelProps {
  teams: Team[];
  games: Game[];
  news: News[];
  players: Player[];
  onClose: () => void;
}

export default function AdminPanel({ teams, games, news, players, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'games' | 'teams' | 'players'>('news');

  // Unified collapse toggles
  const [showAddNews, setShowAddNews] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // NEWS HANDLERS
  const handleAddNews = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newsData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      imageUrl: formData.get('imageUrl') as string || 'https://picsum.photos/seed/news/' + Math.floor(Math.random() * 1000) + '/800/400',
      date: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'news'), newsData);
      alert('新闻发布成功！');
      (e.target as HTMLFormElement).reset();
      setShowAddNews(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'news');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('确定要删除这条新闻吗？')) return;
    try {
      await deleteDoc(doc(db, 'news', id));
      alert('新闻删除成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `news/${id}`);
    }
  };

  // GAMES HANDLERS
  const handleAddGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const gameData = {
      homeTeamId: formData.get('homeTeamId') as string,
      awayTeamId: formData.get('awayTeamId') as string,
      homeScore: Number(formData.get('homeScore') || 0),
      awayScore: Number(formData.get('awayScore') || 0),
      date: formData.get('date') as string,
      venue: formData.get('venue') as string || '联赛球馆',
      status: formData.get('status') as string || 'scheduled',
    };

    if (gameData.homeTeamId === gameData.awayTeamId) {
      alert('主队和客队不能是同一支球队！');
      return;
    }

    try {
      await addDoc(collection(db, 'games'), gameData);
      alert('比赛日程发布成功！');
      (e.target as HTMLFormElement).reset();
      setShowAddGame(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    }
  };

  const handleUpdateGame = async (
    gameId: string, 
    homeScore: number, 
    awayScore: number, 
    status: string, 
    venue: string, 
    date: string,
    homeTeamId: string,
    awayTeamId: string
  ) => {
    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, { 
        homeScore, 
        awayScore, 
        status, 
        venue, 
        date,
        homeTeamId,
        awayTeamId
      });
      alert('赛程比分更新成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm('确定要删除这场比赛及所有比分记录吗？')) return;
    try {
      await deleteDoc(doc(db, 'games', id));
      alert('比赛记录删除成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${id}`);
    }
  };

  // TEAMS HANDLERS
  const handleAddTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teamData = {
      name: formData.get('name') as string,
      logoUrl: formData.get('logoUrl') as string || 'https://picsum.photos/seed/' + Math.floor(Math.random() * 100) + '/250/250',
      wins: Number(formData.get('wins') || 0),
      losses: Number(formData.get('losses') || 0),
      pointsFor: Number(formData.get('pointsFor') || 0),
      pointsAgainst: Number(formData.get('pointsAgainst') || 0),
    };

    try {
      await addDoc(collection(db, 'teams'), teamData);
      alert('新球队录入成功！');
      (e.target as HTMLFormElement).reset();
      setShowAddTeam(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teams');
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent<HTMLFormElement>, teamId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        name: formData.get('name') as string,
        logoUrl: formData.get('logoUrl') as string,
        wins: Number(formData.get('wins')),
        losses: Number(formData.get('losses')),
        pointsFor: Number(formData.get('pointsFor')),
        pointsAgainst: Number(formData.get('pointsAgainst')),
      });
      alert('球队信息与战绩保存成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('确定要删除这家球队吗？\n注意：这会导致该球队的所有现有比赛日程和球队球员失去关联。')) return;
    try {
      await deleteDoc(doc(db, 'teams', id));
      alert('球队已彻底移除。');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teams/${id}`);
    }
  };

  // PLAYERS HANDLERS
  const handleAddPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const playerData = {
      name: formData.get('name') as string,
      number: Number(formData.get('number') || 0),
      position: formData.get('position') as string || '锋线',
      teamId: formData.get('teamId') as string,
      gamesPlayed: Number(formData.get('gamesPlayed') || 0),
      avgPoints: Number(formData.get('avgPoints') || 0),
      avgRebounds: Number(formData.get('avgRebounds') || 0),
      avgSteals: Number(formData.get('avgSteals') || 0),
      avgBlocks: Number(formData.get('avgBlocks') || 0),
    };

    try {
      await addDoc(collection(db, 'players'), playerData);
      alert('新球员录入成功！');
      (e.target as HTMLFormElement).reset();
      setShowAddPlayer(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'players');
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent<HTMLFormElement>, playerId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, {
        name: formData.get('name') as string,
        number: Number(formData.get('number')),
        position: formData.get('position') as string,
        teamId: formData.get('teamId') as string,
        gamesPlayed: Number(formData.get('gamesPlayed')),
        avgPoints: Number(formData.get('avgPoints')),
        avgRebounds: Number(formData.get('avgRebounds')),
        avgSteals: Number(formData.get('avgSteals')),
        avgBlocks: Number(formData.get('avgBlocks')),
      });
      alert('球员资料及平均数据保存成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `players/${playerId}`);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('确定要移出这名球员的档案吗？')) return;
    try {
      await deleteDoc(doc(db, 'players', id));
      alert('球员档案已彻底移除。');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `players/${id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <Card className="w-full max-w-5xl max-h-[90vh] bg-slate-900/90 border-white/10 overflow-hidden flex flex-col shadow-2xl shadow-accent-gold/5 rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4 px-6 bg-black/30">
          <CardTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3 font-heading text-white">
            <div className="p-2 bg-accent-gold/10 rounded-xl">
              <Settings className="text-accent-gold animate-spin-slow" size={20} />
            </div>
            MEBA 联盟管理后台
          </CardTitle>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white border border-white/10 group"
            aria-label="关闭面板"
          >
            <span className="text-sm font-bold opacity-60 group-hover:opacity-100">返回首页</span>
            <X size={20} />
          </button>
        </CardHeader>
        
        <div className="flex border-b border-white/5 overflow-x-auto bg-black/20">
          <button 
            onClick={() => setActiveTab('news')}
            className={`flex-1 min-w-[120px] py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'news' ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5' : 'text-slate-400 hover:text-white'}`}
          >
            <Newspaper size={14} /> 新闻与动态
          </button>
          <button 
            onClick={() => setActiveTab('games')}
            className={`flex-1 min-w-[120px] py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'games' ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar size={14} /> 联赛赛程表
          </button>
          <button 
            onClick={() => setActiveTab('teams')}
            className={`flex-1 min-w-[120px] py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'teams' ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5' : 'text-slate-400 hover:text-white'}`}
          >
            <Trophy size={14} /> 参赛球队档案
          </button>
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex-1 min-w-[120px] py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'players' ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={14} /> 联赛球员档案
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/*=================== TAB: NEWS ===================*/}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white font-heading">联赛动态管理</h4>
                <button 
                  onClick={() => setShowAddNews(!showAddNews)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-gold hover:bg-yellow-500 text-black rounded-lg text-xs font-bold transition-all"
                >
                  <Plus size={14} /> {showAddNews ? '收起面板' : '撰写新动态'}
                </button>
              </div>

              {showAddNews && (
                <form onSubmit={handleAddNews} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2 text-accent-gold"><Plus size={16} /> 发布新新闻 / 动态</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">动态标题</label>
                      <input name="title" placeholder="输入极具张力的新闻主标题..." required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none w-full text-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">题图 URL (可选)</label>
                      <input name="imageUrl" placeholder="HTTPS 图片网络链接..." className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none w-full text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">正文内容</label>
                    <textarea name="content" placeholder="输入文章段落..." required rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-gold outline-none text-white whitespace-pre-wrap" />
                  </div>
                  <button type="submit" className="bg-accent-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all text-xs">立即发布动态</button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-3">
                {news.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} alt="" className="w-16 h-10 object-cover rounded-lg bg-zinc-800" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold text-white text-sm line-clamp-1">{item.title}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteNews(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="删除">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {news.length === 0 && <div className="text-center py-8 text-slate-500 italic text-sm">暂无新闻，点击右上角发布一条吧！</div>}
              </div>
            </div>
          )}

          {/*=================== TAB: GAMES ===================*/}
          {activeTab === 'games' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white font-heading">赛程日程管理</h4>
                <button 
                  onClick={() => setShowAddGame(!showAddGame)}
                  disabled={teams.length < 2}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-gold hover:bg-yellow-500 text-black rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Plus size={14} /> {showAddGame ? '收起面板' : '添加赛程日程'}
                </button>
              </div>

              {teams.length < 2 && (
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-orange-400 text-xs font-medium">
                  提示：创建赛程需要至少两支球队档案。如果目前为空，请在 “参赛球队档案” 栏先录入球队。
                </div>
              )}

              {showAddGame && (
                <form onSubmit={handleAddGame} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2 text-accent-gold"><Plus size={16} /> 编辑并发布新赛令</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold">主队</label>
                      <select name="homeTeamId" required className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white font-bold h-[38px]">
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold">客队</label>
                      <select name="awayTeamId" required className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white font-bold h-[38px]">
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold">举行球馆</label>
                      <input name="venue" placeholder="例如：中心体育中心 / 东部竞技馆" required defaultValue="中土大球馆" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold">开赛日期与时间</label>
                      <input name="date" type="datetime-local" required defaultValue="2026-05-30T19:30" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold">初始主队得分 (可选)</label>
                      <input name="homeScore" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold">初始客队得分 (可选)</label>
                      <input name="awayScore" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>
                  </div>
                  <button type="submit" className="bg-accent-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all text-xs">生成并保存赛令</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map(game => {
                  const homeTeam = teams.find(t => t.id === game.homeTeamId);
                  const awayTeam = teams.find(t => t.id === game.awayTeamId);
                  return (
                    <div key={game.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4 relative group">
                      <button 
                        onClick={() => handleDeleteGame(game.id)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="删除整场比赛"
                      >
                        <Trash2 size={15} />
                      </button>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">赛事时间与球馆</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            id={`date-${game.id}`}
                            defaultValue={game.date} 
                            placeholder="时间日期 (ISO)" 
                            className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-accent-gold"
                          />
                          <input 
                            type="text" 
                            id={`venue-${game.id}`}
                            defaultValue={game.venue} 
                            placeholder="举行地点"
                            className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-accent-gold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 py-1.5">
                        <div className="flex-1 text-center space-y-1.5">
                          <img src={homeTeam?.logoUrl} alt="" className="w-10 h-10 mx-auto rounded-full bg-black/40 object-cover" referrerPolicy="no-referrer" />
                          <div className="font-bold text-xs text-slate-300 line-clamp-1">{homeTeam?.name || '未知主队'}</div>
                          <input 
                            type="number" 
                            defaultValue={game.homeScore} 
                            className="w-16 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-sm text-white"
                            id={`home-${game.id}`}
                          />
                        </div>

                        <div className="text-xs font-black text-slate-600">VS</div>

                        <div className="flex-1 text-center space-y-1.5">
                          <img src={awayTeam?.logoUrl} alt="" className="w-10 h-10 mx-auto rounded-full bg-black/40 object-cover" referrerPolicy="no-referrer" />
                          <div className="font-bold text-xs text-slate-300 line-clamp-1">{awayTeam?.name || '未知客队'}</div>
                          <input 
                            type="number" 
                            defaultValue={game.awayScore} 
                            className="w-16 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-sm text-white"
                            id={`away-${game.id}`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <select 
                          id={`status-${game.id}`}
                          defaultValue={game.status}
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none"
                        >
                          <option value="scheduled">未开始</option>
                          <option value="live">进行中</option>
                          <option value="finished">已结束</option>
                        </select>
                        
                        <button 
                          onClick={() => {
                            const homeScore = Number((document.getElementById(`home-${game.id}`) as HTMLInputElement).value);
                            const awayScore = Number((document.getElementById(`away-${game.id}`) as HTMLInputElement).value);
                            const status = (document.getElementById(`status-${game.id}`) as HTMLSelectElement).value;
                            const venue = (document.getElementById(`venue-${game.id}`) as HTMLInputElement).value;
                            const date = (document.getElementById(`date-${game.id}`) as HTMLInputElement).value;
                            handleUpdateGame(game.id, homeScore, awayScore, status, venue, date, game.homeTeamId, game.awayTeamId);
                          }}
                          className="bg-accent-gold text-black px-3.5 py-1.5 rounded-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-1 text-xs font-bold"
                        >
                          <Save size={14} /> 保存
                        </button>
                      </div>
                    </div>
                  );
                })}
                {games.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 italic text-sm">暂无赛程比分记录</div>}
              </div>
            </div>
          )}

          {/*=================== TAB: TEAMS ===================*/}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white font-heading">参赛球队管理</h4>
                <button 
                  onClick={() => setShowAddTeam(!showAddTeam)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-gold hover:bg-yellow-500 text-black rounded-lg text-xs font-bold transition-all"
                >
                  <Plus size={14} /> {showAddTeam ? '收起面板' : '注册新球队'}
                </button>
              </div>

              {showAddTeam && (
                <form onSubmit={handleAddTeam} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2 text-accent-gold"><Plus size={16} /> 录入新加盟球队</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">球队名称</label>
                      <input name="name" placeholder="球队全名..." required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">队徽 Logo图片URL</label>
                      <input name="logoUrl" placeholder="输入HTTPS图片地址或留空随机" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">胜场</label>
                      <input name="wins" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">负场</label>
                      <input name="losses" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">总得分数</label>
                      <input name="pointsFor" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">总失分数</label>
                      <input name="pointsAgainst" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>
                  </div>
                  <button type="submit" className="bg-accent-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all text-xs">立即加入数据库</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map(team => (
                  <form key={team.id} onSubmit={(e) => handleUpdateTeam(e, team.id)} className="bg-slate-900 border border-white/5 p-6 rounded-2xl relative space-y-4">
                    <button 
                      type="button"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="解散/删除球队"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-4 mb-2">
                      <img src={team.logoUrl} alt="" className="w-14 h-14 rounded-full bg-black/40 p-1 bg-white/5 object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-slate-500 font-bold uppercase">球队名称</label>
                          <input name="name" defaultValue={team.name} className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-bold text-white outline-none focus:border-accent-gold" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-slate-500 font-bold uppercase">LOGO 图片链接</label>
                          <input name="logoUrl" defaultValue={team.logoUrl} className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-400 outline-none focus:border-accent-gold font-mono" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">胜场</label>
                        <input name="wins" type="number" defaultValue={team.wins} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">负场</label>
                        <input name="losses" type="number" defaultValue={team.losses} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">总得分</label>
                        <input name="pointsFor" type="number" defaultValue={team.pointsFor} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center font-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">总失分</label>
                        <input name="pointsAgainst" type="number" defaultValue={team.pointsAgainst} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center font-none" />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-accent-gold/40 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <Save size={14} /> 保存球队档案
                    </button>
                  </form>
                ))}
                {teams.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 italic text-sm">暂无球队加盟，点击右上角录入一家球队！</div>}
              </div>
            </div>
          )}

          {/*=================== TAB: PLAYERS ===================*/}
          {activeTab === 'players' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white font-heading">联盟合同员管理</h4>
                <button 
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  disabled={teams.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-gold hover:bg-yellow-500 text-black rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Plus size={14} /> {showAddPlayer ? '收起面板' : '录入新球员'}
                </button>
              </div>

              {teams.length === 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-orange-400 text-xs font-medium">
                  提示：录入球员需要先创建至少一个球队。请在 “参赛球队档案” 栏先录入球队档案。
                </div>
              )}

              {showAddPlayer && (
                <form onSubmit={handleAddPlayer} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2 text-accent-gold"><Plus size={16} /> 录入并注册新球员</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">球员姓名</label>
                      <input name="name" placeholder="英文或中文名称..." required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase font-mono">球衣号码</label>
                      <input name="number" type="number" placeholder="球衣号码" required min="0" max="99" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">场上位置</label>
                      <select name="position" className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]">
                        <option value="中锋 (C)">中锋 (C)</option>
                        <option value="大前锋 (PF)">大前锋 (PF)</option>
                        <option value="小前锋 (SF)">小前锋 (SF)</option>
                        <option value="得分后卫 (SG)">得分后卫 (SG)</option>
                        <option value="控球后卫 (PG)">控球后卫 (PG)</option>
                        <option value="锋卫摇摆人 (G/F)">锋卫摇摆人 (G/F)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">效力球队</label>
                      <select name="teamId" required className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px] font-bold">
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">出场次数</label>
                      <input name="gamesPlayed" type="number" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">场均得分 (PPG)</label>
                      <input name="avgPoints" type="number" step="0.1" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">场均篮板 (RPG)</label>
                      <input name="avgRebounds" type="number" step="0.1" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">场均抢断 (SPG)</label>
                      <input name="avgSteals" type="number" step="0.1" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">场均盖帽 (BPG)</label>
                      <input name="avgBlocks" type="number" step="0.1" defaultValue="0" min="0" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-accent-gold outline-none text-white h-[38px]" />
                    </div>
                  </div>
                  <button type="submit" className="bg-accent-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all text-xs">立即加入自由球员名单</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(player => (
                  <form key={player.id} onSubmit={(e) => handleUpdatePlayer(e, player.id)} className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors space-y-3 relative group">
                    <button 
                      type="button"
                      onClick={() => handleDeletePlayer(player.id)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="注销球员档案"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 flex-1">
                          <label className="text-[8px] text-slate-500 font-bold">姓名</label>
                          <input name="name" defaultValue={player.name} className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 font-bold text-sm text-white" />
                        </div>
                        <div className="flex flex-col gap-0.5 w-14">
                          <label className="text-[8px] text-slate-500 font-bold">号码</label>
                          <input name="number" type="number" min="0" max="99" defaultValue={player.number} className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-center font-bold text-xs text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[8px] text-slate-500 font-bold">位置</label>
                          <input name="position" defaultValue={player.position} className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[8px] text-slate-500 font-bold">出场</label>
                          <input name="gamesPlayed" type="number" min="0" defaultValue={player.gamesPlayed || 0} className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300 text-center" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] text-slate-500 font-bold">效力球队</label>
                        <select name="teamId" defaultValue={player.teamId} className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none w-full h-[26px]">
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      <div className="space-y-0.5 text-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">得分 (PPG)</label>
                        <input name="avgPoints" type="number" step="0.1" defaultValue={player.avgPoints} className="w-full bg-black/60 border border-white/5 rounded-lg px-0.5 py-1 text-xs font-bold text-center text-accent-gold" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">篮板 (RPG)</label>
                        <input name="avgRebounds" type="number" step="0.1" defaultValue={player.avgRebounds} className="w-full bg-black/60 border border-white/5 rounded-lg px-0.5 py-1 text-xs font-bold text-center text-zinc-300" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">抢断 (SPG)</label>
                        <input name="avgSteals" type="number" step="0.1" defaultValue={player.avgSteals} className="w-full bg-black/60 border border-white/5 rounded-lg px-0.5 py-1 text-xs font-bold text-center text-zinc-300" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">盖帽 (BPG)</label>
                        <input name="avgBlocks" type="number" step="0.1" defaultValue={player.avgBlocks} className="w-full bg-black/60 border border-white/5 rounded-lg px-0.5 py-1 text-xs font-bold text-center text-zinc-300" />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-white/5 hover:bg-white/10 hover:border-accent-gold/20 text-white py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/5">
                      <Save size={12} /> 保存更变
                    </button>
                  </form>
                ))}
                {players.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 italic text-sm">暂无球员在注册册里，先录入一个吧！</div>}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
