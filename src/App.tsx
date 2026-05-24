/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ScoreTicker from './components/ScoreTicker';
import StandingsTable from './components/StandingsTable';
import ScheduleList from './components/ScheduleList';
import PlayerStats from './components/PlayerStats';
import AdminPanel from './components/AdminPanel';
import Playoffs from './components/Playoffs';
import TeamLogo from './components/TeamLogo';
import NewsImage from './components/NewsImage';
import { Team, Player, Game, News } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { LogIn, LogOut, Settings, Database, Loader2, Share2, X, Clock } from 'lucide-react';
import { MOCK_TEAMS, MOCK_PLAYERS, MOCK_GAMES, MOCK_NEWS } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Interactive modal states
  const [selectedTeamIdForModal, setSelectedTeamIdForModal] = useState<string | null>(null);
  const [selectedGameIdForModal, setSelectedGameIdForModal] = useState<string | null>(null);
  const [selectedNewsIdForModal, setSelectedNewsIdForModal] = useState<string | null>(null);

  const isAdmin = user?.email === 'j2113715863@gmail.com';

  const handleShare = async () => {
    if (isSharing) return;
    
    // Use the origin URL for sharing as it's the most stable entry point
    const shareUrl = window.location.origin;
    
    const shareData = {
      title: 'MEBA 中土篮球联赛',
      text: '快来查看 MEBA 中土篮球联赛的最新赛程和排名！',
      url: shareUrl,
    };

    setIsSharing(true);
    try {
      // Always copy to clipboard first as requested
      await navigator.clipboard.writeText(shareUrl);
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert('网站链接已复制到剪贴板！您可以直接发给他人查看。');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Share was cancelled by user');
      } else {
        console.error('Share failed:', err);
        alert('网站链接已复制到剪贴板！您可以直接发给他人查看。');
      }
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    // Real-time listeners
    const qTeams = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamsData);
      // Only set loading to false if we have teams or if it's an empty collection
      setLoading(false);
    }, (error) => {
      console.error("Teams fetch error:", error);
      setLoading(false);
    });

    // Fallback timeout to clear loading if Firestore is slow/blocked
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const qPlayers = query(collection(db, 'players'));
    const unsubscribePlayers = onSnapshot(qPlayers, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersData);
    }, (error) => console.error("Players fetch error:", error));

    const qGames = query(collection(db, 'games'), orderBy('date', 'desc'));
    const unsubscribeGames = onSnapshot(qGames, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      setGames(gamesData);
    }, (error) => console.error("Games fetch error:", error));

    const qNews = query(collection(db, 'news'), orderBy('date', 'desc'));
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
      setNews(newsData);
    }, (error) => console.error("News fetch error:", error));

    return () => {
      clearTimeout(timeout);
      unsubscribeAuth();
      unsubscribeTeams();
      unsubscribePlayers();
      unsubscribeGames();
      unsubscribeNews();
    };
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      // Ensure we are using popup for better compatibility in this environment
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed', error);
      
      // If the user cancelled or another popup was already open, just log and return
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Login popup request was superseded by a new one');
        return;
      }
      
      let message = '登录失败，请稍后重试。';
      
      // Handle specific Firebase Auth error codes
      if (error.code === 'auth/internal-error') {
        message = 'Firebase 内部错误 (auth/internal-error)。这通常是由于浏览器拦截了第三方 Cookie、广告拦截插件或网络限制导致的。';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = '登录窗口被关闭。请确保完成登录流程。';
      } else if (error.code === 'auth/popup-blocked') {
        message = '登录窗口被浏览器拦截。请在地址栏点击“允许弹出窗口”，或点击右上角图标在独立页面打开应用。';
      } else if (error.code === 'auth/network-request-failed') {
        message = '网络连接失败。如果您在受限网络环境下，请尝试使用 VPN 或更换网络。';
      } else if (error.code === 'auth/unauthorized-domain') {
        message = '当前域名未在 Firebase 中授权。请联系管理员添加授权域名。';
      } else if (error.message) {
        message = `登录失败: ${error.message}`;
      }
      
      alert(`${message}\n\n解决建议：\n1. 请点击预览窗口右上角的“在新标签页中打开”图标，在独立页面中进行登录。\n2. 检查并暂时关闭您的广告拦截插件（如 AdBlock, uBlock Origin）。\n3. 确保浏览器设置中允许“第三方 Cookie”。\n4. 如果您在中国大陆，请确保您的网络环境可以稳定访问 Google 服务。`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const seedDatabase = async () => {
    if (!isAdmin || isSeeding) return;
    setIsSeeding(true);
    try {
      // Helper to clear a collection
      const clearCollection = async (collectionName: string) => {
        const snapshot = await getDocs(collection(db, collectionName));
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      };

      // Clear all relevant collections first to ensure a clean slate
      await clearCollection('teams');
      await clearCollection('players');
      await clearCollection('games');
      await clearCollection('news');

      const batch = writeBatch(db);
      
      // Seed Teams
      for (const team of MOCK_TEAMS) {
        const teamRef = doc(db, 'teams', team.id);
        batch.set(teamRef, team);
      }

      // Seed Players
      for (const player of MOCK_PLAYERS) {
        const playerRef = doc(db, 'players', player.id);
        batch.set(playerRef, player);
      }

      // Seed Games
      for (const game of MOCK_GAMES) {
        const gameRef = doc(db, 'games', game.id);
        batch.set(gameRef, game);
      }

      // Seed News
      for (const item of MOCK_NEWS) {
        const newsRef = doc(db, 'news', item.id);
        batch.set(newsRef, item);
      }

      await batch.commit();
      alert('数据库已重置！旧数据已彻底清除，新名单已载入。');
    } catch (error) {
      console.error('Seeding failed', error);
      alert('初始化失败，请检查网络或权限。');
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-accent-cyan animate-spin" />
        <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Initializing MEBA Network...</p>
      </div>
    );
  }

  // Enrich teams with high-fidelity logos and standard IDs if there are mismatches or older database versions
  const displayTeams = teams.map(t => {
    const mock = MOCK_TEAMS.find(m => m.name === t.name || m.id === t.id);
    return mock ? { ...t, id: mock.id, logoUrl: mock.logoUrl || t.logoUrl } : t;
  });

  // Ensure game relationships map perfectly to standard team IDs for logos and schedules
  const displayGames = games.map(g => {
    const homeTeamFromDb = teams.find(t => t.id === g.homeTeamId);
    const mockHome = homeTeamFromDb ? MOCK_TEAMS.find(m => m.name === homeTeamFromDb.name) : null;
    
    const awayTeamFromDb = teams.find(t => t.id === g.awayTeamId);
    const mockAway = awayTeamFromDb ? MOCK_TEAMS.find(m => m.name === awayTeamFromDb.name) : null;

    return {
      ...g,
      homeTeamId: mockHome?.id || g.homeTeamId,
      awayTeamId: mockAway?.id || g.awayTeamId,
    };
  });

  // Map players to standard team IDs for stats correctness
  const displayPlayers = players.map(p => {
    const teamFromDb = teams.find(t => t.id === p.teamId);
    const mockTeam = teamFromDb ? MOCK_TEAMS.find(m => m.name === teamFromDb.name) : null;
    return mockTeam ? { ...p, teamId: mockTeam.id } : p;
  });

  // Match news item images with stable Unsplash URLs and provide beautiful fallbacks
  const displayNews = news.map(n => {
    // Force the custom-designed tournament playoff flyer for the main playoff news n2
    if (n.id === 'n2' || n.title?.includes('常规赛收官') || n.title?.includes('季后赛战鼓')) {
      return { ...n, imageUrl: '/meba_banner.png' };
    }
    const mock = MOCK_NEWS.find(m => m.id === n.id || m.title === n.title);
    let imageUrl = n.imageUrl || '';
    if (mock) {
      imageUrl = mock.imageUrl;
    }
    // Fallback if empty or using picsum
    if (!imageUrl || imageUrl.includes('picsum.photos')) {
      const fallbackImages = [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800', // basketball game
        'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=800', // court
        'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800', // hoop
        'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&q=80&w=800'  // court floor
      ];
      // Consistent selection
      const index = Math.abs((n.title || '').length) % fallbackImages.length;
      imageUrl = fallbackImages[index];
    }
    return { ...n, imageUrl };
  });

  const isEmpty = teams.length === 0 && news.length === 0;

  return (
    <div className="min-h-screen text-white pb-32 font-sans selection:bg-accent-cyan selection:text-black">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/10 shadow-xl"
        >
          <Share2 size={16} className="text-accent-gold" />
          分享网站
        </button>

        {user ? (
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1 pr-4 rounded-full border border-white/10 shadow-xl">
            <img src={user.photoURL || undefined} alt="" className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
            <span className="text-xs font-bold hidden md:block">{user.displayName}</span>
            <button onClick={handleLogout} className="p-2 hover:text-accent-cyan transition-colors" title="退出登录">
              <LogOut size={16} />
            </button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  className="p-2 text-accent-gold hover:text-yellow-400 transition-colors"
                  title="管理面板"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={seedDatabase} 
                  disabled={isSeeding}
                  className="p-2 text-accent-gold hover:text-yellow-400 transition-colors disabled:opacity-50"
                  title="初始化演示数据"
                >
                  {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                </button>
              </>
            )}
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-accent-gold hover:bg-yellow-500 text-black px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-accent-gold/20"
          >
            <LogIn size={16} />
            管理员登录
          </button>
        )}
      </div>

      {showAdminPanel && (
        <AdminPanel 
          teams={displayTeams} 
          games={displayGames} 
          news={displayNews} 
          players={players}
          onClose={() => setShowAdminPanel(false)} 
        />
      )}

      <ScoreTicker games={displayGames} teams={displayTeams} />
      
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero />
            
            <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20 space-y-16">
              {displayTeams.length === 0 && !loading && (
                <div className="max-w-4xl mx-auto py-20 text-center">
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 shadow-2xl">
                    <Database className="w-16 h-16 text-accent-gold mx-auto mb-6 opacity-50" />
                    <h2 className="text-3xl font-bold text-white mb-4">联赛数据准备中</h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                      目前数据库尚未初始化。如果您是管理员，请登录并点击右上角的“初始化”按钮来载入球队和球员名单。
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={seedDatabase}
                        disabled={isSeeding}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-accent-gold hover:bg-yellow-500 text-black rounded-2xl font-bold transition-all shadow-xl shadow-accent-gold/20 disabled:opacity-50"
                      >
                        {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                        立即初始化数据库
                      </button>
                    )}
                  </div>
                </div>
              )}
              {isEmpty && isAdmin && (
                <Card className="bg-accent-gold/5 border-accent-gold/20 border-dashed rounded-3xl">
                  <CardContent className="py-12 text-center">
                    <p className="text-accent-gold font-bold mb-6 text-lg">数据库目前为空。作为管理员，您可以初始化演示数据来查看效果。</p>
                    <button 
                      onClick={seedDatabase}
                      disabled={isSeeding}
                      className="bg-accent-gold text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-500 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-accent-gold/20"
                    >
                      {isSeeding ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                      立即初始化演示数据
                    </button>
                  </CardContent>
                </Card>
              )}

              {/* Latest News */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-4xl font-bold tracking-tight font-heading">
                    最新 <span className="text-accent-gold">动态</span>
                  </h2>
                  <button onClick={() => setActiveTab('home')} className="text-accent-gold font-bold hover:text-yellow-400 transition-colors flex items-center gap-1">
                    刷新大厅
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayNews.length > 0 ? displayNews.map((item) => (
                    <Card 
                      key={item.id} 
                      className="bg-slate-900/40 backdrop-blur-md border-white/5 overflow-hidden group hover:border-accent-gold/30 transition-all rounded-3xl cursor-pointer"
                      onClick={() => setSelectedNewsIdForModal(item.id)}
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <NewsImage 
                          newsId={item.id}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="text-slate-500 text-xs font-bold mb-2 tracking-widest uppercase">
                          {new Date(item.date).toLocaleDateString('zh-CN')}
                        </div>
                        <CardTitle className="text-white group-hover:text-accent-gold transition-colors font-heading text-xl leading-snug">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{item.content}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-20 text-slate-500 font-medium border border-dashed border-white/10 rounded-3xl bg-white/5">暂无新闻动态</div>
                  )}
                </div>
              </section>

              {/* Quick Standings Preview */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-4xl font-bold tracking-tight font-heading">
                      联赛 <span className="text-accent-gold">排名</span>
                    </h2>
                    <button onClick={() => setActiveTab('standings')} className="text-accent-gold font-bold hover:text-yellow-400 transition-colors">详情</button>
                  </div>
                  <StandingsTable teams={displayTeams} onSelectTeam={setSelectedTeamIdForModal} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-4xl font-bold tracking-tight font-heading">
                      得分 <span className="text-accent-gold">榜</span>
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {[...displayPlayers].sort((a, b) => b.avgPoints - a.avgPoints).slice(0, 5).map((player, i) => (
                      <div key={player.id} className="flex items-center justify-between p-5 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-accent-gold/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <span className={`text-3xl font-black italic ${i === 0 ? 'text-accent-gold' : 'text-slate-800 group-hover:text-slate-700'}`}>{i + 1}</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{player.name}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{displayTeams.find(t => t.id === player.teamId)?.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-white group-hover:text-accent-gold transition-colors">{player.avgPoints}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">PPG</div>
                        </div>
                      </div>
                    ))}
                    {displayPlayers.length === 0 && <div className="text-center py-12 text-slate-500 font-medium border border-dashed border-white/10 rounded-3xl bg-white/5">暂无球员数据</div>}
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-5xl mx-auto px-4 pt-32"
          >
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-12">赛程与比分</h1>
            <ScheduleList games={displayGames} teams={displayTeams} onSelectGame={setSelectedGameIdForModal} />
          </motion.div>
        )}

        {activeTab === 'standings' && (
          <motion.div
            key="standings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto px-4 pt-32"
          >
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-12">数据统计</h1>
            <Tabs defaultValue="teams" className="w-full">
              <TabsList className="bg-slate-900/50 border border-white/10 mb-8 rounded-full p-1">
                <TabsTrigger value="teams" className="data-[state=active]:bg-accent-gold data-[state=active]:text-black rounded-full px-8 py-2 font-bold transition-all">球队排名</TabsTrigger>
                <TabsTrigger value="players" className="data-[state=active]:bg-accent-gold data-[state=active]:text-black rounded-full px-8 py-2 font-bold transition-all">球员数据</TabsTrigger>
              </TabsList>
              <TabsContent value="teams">
                <StandingsTable teams={displayTeams} onSelectTeam={setSelectedTeamIdForModal} />
              </TabsContent>
              <TabsContent value="players">
                <PlayerStats players={displayPlayers} teams={displayTeams} />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {activeTab === 'teams' && (
          <motion.div
            key="teams"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto px-4 pt-32"
          >
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-12">参赛球队</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayTeams.map((team) => (
                <Card 
                  key={team.id} 
                  className="bg-slate-900/40 backdrop-blur-md border-white/10 overflow-hidden group hover:border-accent-gold/50 transition-all rounded-3xl cursor-pointer"
                  onClick={() => setSelectedTeamIdForModal(team.id)}
                >
                  <CardHeader className="items-center pb-2">
                    <TeamLogo 
                      teamId={team.id}
                      logoUrl={team.logoUrl} 
                      className="w-32 h-32 rounded-full bg-zinc-800 object-cover border-4 border-white/5 group-hover:scale-110 transition-transform duration-500"
                    />
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardTitle className="text-2xl font-black italic uppercase mb-4 font-heading">{team.name}</CardTitle>
                    <div className="flex justify-center gap-8 text-sm font-bold">
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase text-[10px] tracking-widest">胜</span>
                        <span className="text-2xl text-green-500">{team.wins}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase text-[10px] tracking-widest">负</span>
                        <span className="text-2xl text-red-500">{team.losses}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {displayTeams.length === 0 && <div className="col-span-full text-center py-12 text-zinc-500 italic border border-dashed border-white/10 rounded-xl">暂无球队信息</div>}
            </div>
          </motion.div>
        )}

        {activeTab === 'playoffs' && (
          <motion.div
            key="playoffs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto px-4 pt-32"
          >
            <Playoffs games={displayGames} teams={displayTeams} isAdmin={isAdmin} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roster & Stats detail modal */}
      {selectedTeamIdForModal && (
        (() => {
          const team = displayTeams.find(t => t.id === selectedTeamIdForModal);
          if (!team) return null;
          const teamPlayers = displayPlayers.filter(p => p.teamId === team.id);
          const totalGames = team.wins + team.losses;
          const winRate = totalGames > 0 ? ((team.wins / totalGames) * 100).toFixed(1) : "0.0";
          const diff = team.pointsFor - team.pointsAgainst;

          return (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-white/10 overflow-hidden flex flex-col shadow-2xl rounded-3xl"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4 p-6 bg-black/40">
                  <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                    <span className="text-accent-gold">🏆</span> 球队详情与阵容
                  </h3>
                  <button 
                    onClick={() => setSelectedTeamIdForModal(null)} 
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center bg-white/5 p-6 rounded-2xl border border-white/5">
                    <TeamLogo 
                      teamId={team.id}
                      logoUrl={team.logoUrl} 
                      className="w-24 h-24 rounded-full bg-zinc-800 object-cover border-2 border-white/10"
                    />
                    <div className="text-center md:text-left space-y-2 flex-1">
                      <h4 className="text-3xl font-black italic uppercase text-white">{team.name}</h4>
                      <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-400 justify-center md:justify-start">
                        <span>战绩: <span className="text-green-500">{team.wins}胜</span> - <span className="text-red-500">{team.losses}负</span></span>
                        <span>|</span>
                        <span>胜率: <span className="text-zinc-200">{winRate}%</span></span>
                        <span>|</span>
                        <span>得分: <span className="text-zinc-200">{team.pointsFor}</span></span>
                        <span>|</span>
                        <span>失分: <span className="text-zinc-200">{team.pointsAgainst}</span></span>
                        <span>|</span>
                        <span>净胜分: <span className={diff >= 0 ? 'text-accent-gold' : 'text-red-500'}>{diff > 0 ? `+${diff}` : diff}</span></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-lg font-bold mb-3 font-heading text-accent-gold">球队阵容 ({teamPlayers.length} 人)</h5>
                    <div className="rounded-xl border border-white/5 bg-slate-950/50 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5 text-left text-zinc-400 font-bold whitespace-nowrap">
                            <th className="py-3 px-4 w-16 text-center">号码</th>
                            <th className="py-3 px-4">球员</th>
                            <th className="py-3 px-4 text-center">位置</th>
                            <th className="py-3 px-4 text-center">出战</th>
                            <th className="py-3 px-4 text-center">场均得分</th>
                            <th className="py-3 px-4 text-center">场均篮板</th>
                            <th className="py-3 px-4 text-center">场均抢断</th>
                            <th className="py-3 px-4 text-center">场均盖帽</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamPlayers.map(p => (
                            <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-center font-mono text-accent-gold font-bold">#{p.number}</td>
                              <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                              <td className="py-3 px-4 text-center text-slate-300 font-medium">{p.position}</td>
                              <td className="py-3 px-4 text-center font-mono text-slate-500">{p.gamesPlayed}</td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-white">{p.avgPoints}</td>
                              <td className="py-3 px-4 text-center font-mono text-slate-300">{p.avgRebounds}</td>
                              <td className="py-3 px-4 text-center font-mono text-slate-300">{p.avgSteals}</td>
                              <td className="py-3 px-4 text-center font-mono text-slate-300">{p.avgBlocks}</td>
                            </tr>
                          ))}
                          {teamPlayers.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center py-6 text-slate-500">
                                参赛名录准备中
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()
      )}

      {/* Game details modal */}
      {selectedGameIdForModal && (
        (() => {
          const game = displayGames.find(g => g.id === selectedGameIdForModal);
          if (!game) return null;
          
          let homeTeam = displayTeams.find(t => t.id === game.homeTeamId);
          let awayTeam = displayTeams.find(t => t.id === game.awayTeamId);

          if (game.id.startsWith('g_playoff_f') || (game.stage?.includes('final') && !game.stage?.includes('semi'))) {
            const sf1 = displayGames.find(g => g.id === 'g_playoff_sf1');
            const sf2 = displayGames.find(g => g.id === 'g_playoff_sf2');
            
            const sf1Finished = sf1?.status === 'finished';
            const sf2Finished = sf2?.status === 'finished';

            const sf1WinnerId = sf1Finished ? (sf1.homeScore > sf1.awayScore ? sf1.homeTeamId : sf1.awayTeamId) : null;
            const sf2WinnerId = sf2Finished ? (sf2.homeScore > sf2.awayScore ? sf2.homeTeamId : sf2.awayTeamId) : null;

            if (!sf1WinnerId) {
              homeTeam = { id: 'pending-sf1', name: '半决赛 1 胜者 (暂定)', wins: 0, losses: 0, rank: 0, pointsFor: 0, pointsAgainst: 0, logoUrl: '' };
            } else {
              homeTeam = displayTeams.find(t => t.id === sf1WinnerId);
            }

            if (!sf2WinnerId) {
              awayTeam = { id: 'pending-sf2', name: '半决赛 2 胜者 (暂定)', wins: 0, losses: 0, rank: 0, pointsFor: 0, pointsAgainst: 0, logoUrl: '' };
            } else {
              awayTeam = displayTeams.find(t => t.id === sf2WinnerId);
            }
          }

          const date = new Date(game.date);
          const isGameTentative = game.isTentative || (game.id.startsWith('g_playoff_') && game.status !== 'finished');

          return (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xl bg-slate-900 border border-white/10 overflow-hidden flex flex-col shadow-2xl rounded-3xl"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4 p-6 bg-black/40">
                  <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                    <span className="text-accent-gold">🏀</span> 比赛详情
                  </h3>
                  <button 
                    onClick={() => setSelectedGameIdForModal(null)} 
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="text-slate-400 text-sm font-bold">
                      {date.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                      {isGameTentative && <span className="text-accent-gold text-xs ml-1">(暂定)</span>}
                    </div>
                    {isGameTentative ? (
                      <div className="text-accent-gold text-lg font-black flex items-center justify-center gap-1.5 animate-pulse bg-accent-gold/10 border border-accent-gold/20 px-4 py-1.5 rounded-full inline-flex mx-auto scale-95">
                        <Clock size={16} />
                        时间暂定
                      </div>
                    ) : (
                      <div className="text-accent-gold text-lg font-black flex items-center justify-center gap-1.5">
                        <Clock size={16} />
                        {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                      </div>
                    )}
                    <div className="text-slate-500 text-sm font-medium">球馆: {isGameTentative ? '地点暂定' : game.venue}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-6 bg-white/5 rounded-2xl px-6 border border-white/5">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <TeamLogo 
                        teamId={homeTeam?.id || ''}
                        logoUrl={homeTeam?.logoUrl} 
                        className="w-20 h-20 rounded-full bg-zinc-800 object-cover border border-white/10"
                      />
                      <span className="font-bold text-white text-lg text-center leading-tight">{homeTeam?.name || '主队'}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <span className={game.homeScore > game.awayScore ? 'text-accent-gold' : ''}>{game.homeScore}</span>
                        <span className="text-zinc-700 text-2xl">:</span>
                        <span className={game.awayScore > game.homeScore ? 'text-accent-gold' : ''}>{game.awayScore}</span>
                      </div>
                      <span className={`uppercase text-[10px] font-black tracking-widest px-3 py-1 border rounded-full ${game.status === 'live' ? 'bg-red-500/15 border-red-500/30 text-red-500' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                        {game.status === 'finished' ? '已结束' : game.status === 'live' ? '进行中' : '未开始'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2 flex-1">
                      <TeamLogo 
                        teamId={awayTeam?.id || ''}
                        logoUrl={awayTeam?.logoUrl} 
                        className="w-20 h-20 rounded-full bg-zinc-800 object-cover border border-white/10"
                      />
                      <span className="font-bold text-white text-lg text-center leading-tight">{awayTeam?.name || '客队'}</span>
                    </div>
                  </div>

                  <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                    中土篮球联赛 · MEBA Spring Season 2026
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()
      )}

      {/* News details modal */}
      {selectedNewsIdForModal && (
        (() => {
          const item = displayNews.find(n => n.id === selectedNewsIdForModal);
          if (!item) return null;
          return (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 overflow-hidden flex flex-col shadow-2xl rounded-3xl"
              >
                <div className="aspect-[16/9] w-full overflow-hidden relative">
                  <NewsImage 
                    newsId={item.id}
                    imageUrl={item.imageUrl}
                    title={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/60 flex items-start justify-between p-6">
                    <span className="bg-accent-gold text-black px-3 py-1 rounded-full text-xs font-bold font-mono">
                      {new Date(item.date).toLocaleDateString('zh-CN')}
                    </span>
                    <button 
                      onClick={() => setSelectedNewsIdForModal(null)} 
                      className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full transition-colors text-white border border-white/15"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight font-heading">{item.title}</h3>
                  <div className="border-t border-white/5 pt-4">
                    {item.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="text-slate-300 text-base leading-relaxed mb-4 text-justify whitespace-pre-wrap">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

