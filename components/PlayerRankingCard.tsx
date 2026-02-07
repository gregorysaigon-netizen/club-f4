
import React from 'react';
import { PlayerStats, PlayerName } from '../types';
import { MEMBER_CODES } from '../constants';

interface Props {
  stats: PlayerStats;
}

const PlayerRankingCard: React.FC<Props> = ({ stats }) => {
  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return {
        border: 'border-[#d4af37]',
        bg: 'bg-gradient-to-r from-[#fffdf5] to-white',
        text: 'text-[#d4af37]',
        rankBg: 'bg-[#d4af37] text-white'
      };
      case 2: return {
        border: 'border-slate-200',
        bg: 'bg-white',
        text: 'text-slate-500',
        rankBg: 'bg-slate-400 text-white'
      };
      case 3: return {
        border: 'border-amber-100',
        bg: 'bg-white',
        text: 'text-amber-600',
        rankBg: 'bg-amber-600/80 text-white'
      };
      default: return {
        border: 'border-gray-100',
        bg: 'bg-white',
        text: 'text-gray-400',
        rankBg: 'bg-gray-100 text-gray-400'
      };
    }
  };

  const getMemberColorClass = (name: PlayerName) => {
    switch(name) {
      case PlayerName.GREGORY: return 'text-indigo-600';
      case PlayerName.BIRCHAN: return 'text-green-600';
      case PlayerName.PETER: return 'text-pink-500';
      case PlayerName.SEVEN: return 'text-sky-500';
      default: return 'text-gray-400';
    }
  };

  const style = getRankStyle(stats.rank);

  return (
    <div className={`flex items-center gap-3 p-4 md:p-5 rounded-2xl border transition-all hover:bg-gray-50 hover:shadow-md ${style.border} ${style.bg}`}>
      
      {/* Rank Indicator */}
      <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 font-black rounded-xl text-lg md:text-xl shadow-sm ${style.rankBg}`}>
        {stats.rank}
      </div>

      {/* Player Info and Stats Container */}
      <div className="flex-grow flex items-center justify-between min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight truncate">{stats.playerName}</h3>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-100 ${getMemberColorClass(stats.playerName)}`}>
              {MEMBER_CODES[stats.playerName]}
            </span>
          </div>
          <div className={`text-[9px] font-black tracking-[0.2em] uppercase ${getMemberColorClass(stats.playerName)}`}>
            Member
          </div>
        </div>

        {/* Pro Leaderboard Columns: AVG | BEST | RECENT */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Average Score */}
          <div className="text-center w-16 md:w-24">
            <div className="text-lg md:text-2xl font-black text-gray-900 leading-tight">
              {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '-'}
            </div>
            <div className="text-[11px] md:text-[12px] text-gray-400 uppercase font-black tracking-tighter">AVG</div>
          </div>
          
          {/* Best Score */}
          <div className="text-center w-16 md:w-24 border-l border-gray-100 pl-4">
            <div className="text-lg md:text-2xl font-bold text-emerald-600 leading-tight">
              {stats.bestScore > 0 ? stats.bestScore : '-'}
            </div>
            <div className="text-[11px] md:text-[12px] text-gray-400 uppercase font-black tracking-tighter">BEST</div>
          </div>

          {/* Recent Score */}
          <div className="text-center w-16 md:w-24 border-l border-gray-100 pl-4">
            <div className="text-lg md:text-2xl font-bold text-indigo-600 leading-tight">
              {stats.recentScore > 0 ? stats.recentScore : '-'}
            </div>
            <div className="text-[11px] md:text-[12px] text-gray-400 uppercase font-black tracking-tighter">RECENT</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRankingCard;
