
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayerName, GolfGame, RankingPeriod, PlayerStats } from './types';
import { CLUB_NAME, MEMBERS, INITIAL_GAMES } from './constants';
import PlayerRankingCard from './components/PlayerRankingCard';
import { getAICommentary } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Trophy, Calendar, Plus, BarChart3, Activity, Clock, MapPin, ChevronDown, ChevronUp, History, Settings, Download, Upload, ShieldCheck, X, Edit2, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [games, setGames] = useState<GolfGame[]>(() => {
    const saved = localStorage.getItem('clubf4_games');
    return saved ? JSON.parse(saved) : INITIAL_GAMES;
  });
  
  const [period, setPeriod] = useState<RankingPeriod>('ALL_TIME');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [editingGame, setEditingGame] = useState<GolfGame | null>(null);
  const [aiCommentary, setAiCommentary] = useState<string>("Analyzing performance data...");
  const [loadingAI, setLoadingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add/Edit
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCourse, setFormCourse] = useState('');
  const [formScores, setFormScores] = useState<Record<PlayerName, string>>({
    [PlayerName.GREGORY]: '',
    [PlayerName.BIRCHAN]: '',
    [PlayerName.PETER]: '',
    [PlayerName.SEVEN]: ''
  });

  useEffect(() => {
    localStorage.setItem('clubf4_games', JSON.stringify(games));
    if (games.length > 0) {
      generateCommentary();
    }
  }, [games]);

  const generateCommentary = async () => {
    setLoadingAI(true);
    const text = await getAICommentary(games.slice(-3));
    setAiCommentary(text);
    setLoadingAI(false);
  };

  const filteredGames = useMemo(() => {
    const now = new Date();
    return games.filter(game => {
      const gDate = new Date(game.date);
      
      if (period === 'WEEKLY') {
        const diffInDays = (now.getTime() - gDate.getTime()) / (1000 * 3600 * 24);
        return diffInDays >= 0 && diffInDays <= 7;
      }
      if (period === 'MONTHLY') {
        return gDate.getMonth() === now.getMonth() && gDate.getFullYear() === now.getFullYear();
      }
      if (period === 'QUARTERLY') {
        const q = Math.floor(now.getMonth() / 3);
        const gQ = Math.floor(gDate.getMonth() / 3);
        return q === gQ && gDate.getFullYear() === now.getFullYear();
      }
      if (period === 'SEMI_ANNUALLY') {
        const h = Math.floor(now.getMonth() / 6);
        const gH = Math.floor(gDate.getMonth() / 6);
        return h === gH && gDate.getFullYear() === now.getFullYear();
      }
      if (period === 'YEARLY') {
        return gDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [games, period]);

  const stats: PlayerStats[] = useMemo(() => {
    const playerStats: PlayerStats[] = MEMBERS.map(name => {
      const playerGames = filteredGames.map(g => g.scores.find(s => s.playerName === name)?.score).filter(Boolean) as number[];
      
      const allPlayerScores = games
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(g => g.scores.find(s => s.playerName === name)?.score)
        .filter(score => score !== undefined && score !== null);
      
      const recentScore = allPlayerScores.length > 0 ? allPlayerScores[0]! : 0;
      const totalScore = playerGames.reduce((a, b) => a + b, 0);
      const averageScore = playerGames.length > 0 ? totalScore / playerGames.length : 0;
      const bestScore = playerGames.length > 0 ? Math.min(...playerGames) : 0;
      
      return {
        playerName: name,
        averageScore,
        bestScore,
        recentScore,
        gamesPlayed: playerGames.length,
        totalScore,
        rank: 0
      };
    });

    return playerStats
      .sort((a, b) => {
        if (a.averageScore === 0) return 1;
        if (b.averageScore === 0) return -1;
        return a.averageScore - b.averageScore;
      })
      .map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [filteredGames, games]);

  const chartData = useMemo(() => {
    // 필터링된 모든 경기를 시간순으로 정렬하여 그래프에 반영
    return [...filteredGames]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(g => {
        const entry: any = { date: g.date };
        g.scores.forEach(s => { entry[s.playerName] = s.score; });
        return entry;
      });
  }, [filteredGames]);

  const handleOpenAdd = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCourse('');
    setFormScores({
      [PlayerName.GREGORY]: '',
      [PlayerName.BIRCHAN]: '',
      [PlayerName.PETER]: '',
      [PlayerName.SEVEN]: ''
    });
    setEditingGame(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (game: GolfGame) => {
    setFormDate(game.date);
    setFormCourse(game.course);
    const scoresMap: any = {};
    game.scores.forEach(s => {
      scoresMap[s.playerName] = s.score.toString();
    });
    setFormScores(scoresMap);
    setEditingGame(game);
    setShowAddForm(true);
  };

  const handleDeleteGame = (gameId: string) => {
    if (confirm('정말로 이 라운드 기록을 삭제하시겠습니까?')) {
      setGames(games.filter(g => g.id !== gameId));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scores = MEMBERS.map(m => ({
      playerName: m,
      score: parseInt(formScores[m]) || 0
    }));

    if (!formCourse || scores.some(s => s.score <= 0)) {
      alert("모든 필드를 올바르게 입력해주세요.");
      return;
    }

    if (editingGame) {
      const updatedGames = games.map(g => 
        g.id === editingGame.id 
          ? { ...g, date: formDate, course: formCourse, scores } 
          : g
      );
      setGames(updatedGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } else {
      const newGame: GolfGame = {
        id: Date.now().toString(),
        date: formDate,
        course: formCourse,
        scores
      };
      setGames([...games, newGame].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    
    setShowAddForm(false);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(games, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').split('.')[0];
    const fileName = `CLUBF4_${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          if (confirm('데이터를 복구하시겠습니까? 기존 데이터는 덮어씌워집니다.')) {
            setGames(importedData);
            alert('데이터 복구가 완료되었습니다.');
            setShowAdminModal(false);
          }
        } else {
          alert('유효한 데이터 형식이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayGames = showAllHistory ? [...games].reverse() : [...games].reverse().slice(0, 5);

  return (
    <div className="min-h-screen pb-20 bg-[#f8faf7]">
      <div className="bg-[#1e293b] border-b-4 border-[#d4af37]">
        <header className="max-w-6xl mx-auto py-10 px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 text-blue-300 text-[9px] font-bold uppercase tracking-[0.2em]">
              <Trophy size={11} /> THE PRESTIGIOUS FOURSOME
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight leading-none">{CLUB_NAME}</h1>
            <p className="text-blue-100/60 text-[11px] md:text-xs font-light max-w-2xl leading-relaxed">
              F는 FIELD이다, 그러나 필드는 늘 이들에게 침묵한다. 하여 이들은 걷고 또 걷는다
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAdminModal(true)}
              className="p-3.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700"
              title="Admin Mode"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleOpenAdd}
              className="bg-[#d4af37] text-[#1e293b] px-8 py-3 rounded-2xl font-bold shadow-2xl hover:bg-[#c19a2e] transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Plus size={16} strokeWidth={3} /> Record Round
            </button>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Leaderboard Section */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-black text-[#1e293b] flex items-center gap-3">
                  <BarChart3 className="text-[#d4af37]" size={24} /> LEADERBOARD
                </h2>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-tight">Average, Best, and Recent scores by member.</p>
              </div>
              <div className="relative group">
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value as RankingPeriod)}
                  className="appearance-none bg-[#f8faf7] border-2 border-gray-200 rounded-2xl pl-5 pr-10 py-2.5 text-sm font-bold text-[#1e293b] focus:outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 transition-all cursor-pointer shadow-inner min-w-[180px]"
                >
                  <option value="ALL_TIME">All Time</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="SEMI_ANNUALLY">Semi-Annually</option>
                  <option value="YEARLY">Yearly</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#d4af37] transition-colors" size={16} />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {stats.map(s => (
                <PlayerRankingCard key={s.playerName} stats={s} />
              ))}
            </div>
          </div>
        </section>

        {/* Recent Scores History Section */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-black text-[#1e293b] flex items-center gap-3">
                <History className="text-[#d4af37]" size={24} /> RECENT ROUNDS
              </h2>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-tight">
                {showAllHistory ? 'Viewing all round history.' : 'Showing the 5 most recent rounds.'}
              </p>
            </div>
            {games.length > 5 && (
              <button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-gray-100 text-sm font-bold text-gray-500 hover:border-[#d4af37] hover:text-[#1e293b] transition-all"
              >
                {showAllHistory ? (
                  <>Collapse <ChevronUp size={16} /></>
                ) : (
                  <>View All History <ChevronDown size={16} /></>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayGames.map(game => (
              <div key={game.id} className="bg-[#f8faf7] p-6 rounded-3xl shadow-sm border border-gray-50 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -rotate-45 translate-x-8 -translate-y-8 rounded-full"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[13px] font-black text-blue-700 tracking-widest uppercase">
                      <Calendar size={13} /> {game.date}
                    </div>
                    <div className="font-bold text-gray-900 flex items-center gap-2 text-base">
                      <MapPin size={14} className="text-[#d4af37]" /> {game.course}
                    </div>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <button 
                      onClick={() => handleOpenEdit(game)}
                      className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-600 transition-colors border border-gray-100"
                      title="Edit Round"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteGame(game.id)}
                      className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-red-600 transition-colors border border-gray-100"
                      title="Delete Round"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 pt-4 border-t border-gray-100">
                  {game.scores.map(s => (
                    <div key={s.playerName} className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-gray-400 uppercase tracking-tighter">{s.playerName}</span>
                      <span className="font-black text-gray-800 text-sm">{s.score}<span className="text-[10px] ml-0.5 text-gray-400 font-normal">pts</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {games.length === 0 && (
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-medium">No rounds recorded yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Score Trends Section */}
        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 transition-all">
          <div className="space-y-1 mb-6">
            <h3 className="text-2xl font-sans font-black text-[#1e293b] flex items-center gap-3">
              <Activity className="text-blue-700" size={24} /> SCORE TRENDS
            </h3>
            <p className="text-gray-400 text-xs font-medium">
              Performance trends for all members {period === 'ALL_TIME' ? 'over all history' : `for current ${period.toLowerCase()}`}.
            </p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#1e293b', fontWeight: 700}} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  reversed 
                  domain={['auto', 'auto']} 
                  tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '4px', color: '#1e293b', fontSize: '14px' }}
                  itemStyle={{ fontSize: '13px', padding: '2px 0' }}
                />
                <Legend 
                   verticalAlign="top" 
                   align="right" 
                   iconType="circle" 
                   wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }} 
                />
                
                <Line type="monotone" dataKey={PlayerName.GREGORY} stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="GREGORY">
                    <LabelList dataKey={PlayerName.GREGORY} position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4f46e5' }} offset={8} />
                </Line>
                <Line type="monotone" dataKey={PlayerName.BIRCHAN} stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="BIRCHAN">
                    <LabelList dataKey={PlayerName.BIRCHAN} position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#22c55e' }} offset={8} />
                </Line>
                <Line type="monotone" dataKey={PlayerName.PETER} stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="PETER">
                    <LabelList dataKey={PlayerName.PETER} position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#ec4899' }} offset={8} />
                </Line>
                <Line type="monotone" dataKey={PlayerName.SEVEN} stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="SEVEN">
                    <LabelList dataKey={PlayerName.SEVEN} position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#0ea5e9' }} offset={8} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
          {chartData.length === 0 && (
            <div className="text-center py-10 text-gray-300 italic text-sm">No trend data for selected period.</div>
          )}
        </section>

        {/* Modern AI Commentary Section */}
        <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-70"></div>
          <div className="flex items-center gap-3 mb-10 text-[#d4af37] font-black uppercase text-[10px] tracking-[0.4em] opacity-90">
            <Activity size={18} className="animate-pulse" /> F4 PROFESSIONAL ANALYSIS
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="absolute -top-10 -left-6 text-8xl text-slate-800/20 font-serif pointer-events-none">“</span>
            <p className={`text-xs md:text-base font-serif font-normal leading-[2.7] text-slate-50/90 px-4 md:px-8 text-justify tracking-wide ${loadingAI ? 'animate-pulse opacity-40' : ''}`}>
               {aiCommentary}
            </p>
            <span className="absolute -bottom-14 -right-6 text-8xl text-slate-800/20 font-serif pointer-events-none">”</span>
          </div>
          <div className="absolute bottom-[-20%] right-[-5%] p-8 opacity-[0.03] rotate-12">
             <Trophy size={300} />
          </div>
        </section>
      </main>

      <footer className="mt-24 border-t border-gray-100 py-16 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-serif text-gray-300 mb-4 tracking-widest">{CLUB_NAME}</h2>
          <div className="w-12 h-1 bg-[#d4af37] mx-auto mb-6"></div>
          <p className="text-gray-400 text-sm tracking-[0.3em] font-medium uppercase">Honor, Challenge, and Leisure</p>
          <p className="mt-8 text-gray-300 text-[10px] tracking-wider">&copy; 2024 CLUB F4. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Admin Management Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1e293b] text-white py-6 px-8 border-b-4 border-[#d4af37] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif flex items-center gap-2">
                  <ShieldCheck className="text-[#d4af37]" size={24} /> System Management
                </h2>
                <p className="text-blue-200/50 text-[10px] uppercase tracking-widest mt-1">Local Data Backup & Recovery</p>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Data Operations</h4>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={handleExportData}
                    className="flex items-center justify-between w-full bg-white border-2 border-slate-100 p-4 rounded-xl hover:border-[#d4af37] hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-[#d4af37] group-hover:text-white transition-colors">
                        <Download size={18} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-800">Backup Data</div>
                        <div className="text-[10px] text-slate-400">Save games to JSON file</div>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-between w-full bg-white border-2 border-slate-100 p-4 rounded-xl hover:border-emerald-500 hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Upload size={18} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-800">Restore Data</div>
                        <div className="text-[10px] text-slate-400">Import from backup file</div>
                      </div>
                    </div>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed text-center px-4">
                모든 데이터는 브라우저 로컬 저장소에 보관됩니다. 장치를 변경하거나 데이터를 안전하게 보관하려면 주기적인 백업을 권장합니다.
              </p>
              <button 
                onClick={() => setShowAdminModal(false)}
                className="w-full py-3.5 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Game Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-[#1e293b] text-white py-5 px-10 border-b-4 border-[#d4af37]">
              <h2 className="text-2xl font-serif mb-0.5">{editingGame ? 'Edit Round Record' : 'Add Round Record'}</h2>
              <p className="text-blue-200/60 text-[10px] font-light">Securely save members' scores.</p>
            </div>
            <form onSubmit={handleFormSubmit} className="py-5 px-10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Golf Course</label>
                  <input 
                    type="text" 
                    placeholder="Course Name"
                    value={formCourse}
                    onChange={e => setFormCourse(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {MEMBERS.map(member => (
                  <div key={member} className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{member}</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={formScores[member]}
                      onChange={e => setFormScores({...formScores, [member]: e.target.value})}
                      className="w-full bg-[#f8faf7] border-2 border-blue-100/50 rounded-2xl px-4 py-2.5 text-xl font-black text-[#1e293b] focus:border-[#d4af37] outline-none transition-all placeholder:text-blue-100 shadow-inner"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-1">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3.5 text-gray-400 font-black hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest text-[9px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3.5 bg-[#1e293b] text-white font-black rounded-xl shadow-lg hover:bg-[#334155] transition-all transform active:scale-95 uppercase tracking-widest text-[10px]"
                >
                  {editingGame ? 'Update Record' : 'Save Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
