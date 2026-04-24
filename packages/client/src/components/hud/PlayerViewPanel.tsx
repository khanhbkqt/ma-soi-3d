import { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { isWolfRole, Role } from '@ma-soi/shared';
import { ROLE_COLORS, ROLE_NAMES_VI } from './constants';

export default function PlayerViewPanel() {
  const pvs = useGameStore(s => s.playerViewState);
  const obsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    obsRef.current?.scrollTo(0, obsRef.current.scrollHeight);
  }, [pvs?.observations.length]);

  if (!pvs) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-xs p-4 text-center">
      <p>Chọn 1 người chơi từ<br/>danh sách bên dưới</p>
    </div>
  );

  const roleColor = ROLE_COLORS[pvs.role];
  const roleName = ROLE_NAMES_VI[pvs.role];
  const teamLabel = isWolfRole(pvs.role) ? 'Phe Sói' : 'Phe Dân';
  const teamColor = isWolfRole(pvs.role) ? 'text-red-400' : 'text-green-400';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-cyan-800/30 bg-cyan-950/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">{pvs.personality.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-cyan-200 truncate">{pvs.playerName}</span>
              {!pvs.alive && <span className="text-[10px] px-1 py-0.5 rounded bg-red-900/50 text-red-400">ĐÃ CHẾT</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: roleColor, backgroundColor: roleColor + '20' }}>
                {roleName}
              </span>
              <span className={`text-[10px] ${teamColor}`}>{teamLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Context */}
      <RoleContextSection pvs={pvs} />

      {/* Deduction */}
      {pvs.deduction.deductionPrompt && (
        <div className="border-t border-gray-700/30">
          <div className="text-[10px] text-gray-500 font-medium px-3 py-1.5 bg-gray-900/30">🔍 PHÂN TÍCH ROLE</div>
          <div className="px-3 py-1.5 text-[11px] text-gray-300 whitespace-pre-line leading-relaxed max-h-[120px] overflow-y-auto scrollbar-thin">
            {pvs.deduction.deductionPrompt}
          </div>
        </div>
      )}

      {/* Observations */}
      <div className="border-t border-gray-700/30 flex-1 flex flex-col min-h-0">
        <div className="text-[10px] text-gray-500 font-medium px-3 py-1.5 bg-gray-900/30 flex items-center justify-between">
          <span>📜 NHẬT KÝ ({pvs.observations.length})</span>
        </div>
        <div ref={obsRef} className="flex-1 overflow-y-auto px-3 py-1 scrollbar-thin">
          {pvs.observations.map((obs, i) => {
            const isPhase = obs.startsWith('---');
            const isDeath = obs.includes('đã chết');
            const isSeer = obs.includes('soi') || obs.includes('LÀ SÓI');
            const isWolf = obs.includes('Sói cắn') || obs.includes('LÂY NHIỄM');
            return (
              <div key={i} className={`text-[11px] py-0.5 leading-snug ${
                isPhase ? 'text-gray-500 font-medium mt-1.5' :
                isDeath ? 'text-red-400' :
                isSeer ? 'text-purple-400' :
                isWolf ? 'text-red-300/70' :
                'text-gray-400'
              }`}>
                {isPhase ? obs : `• ${obs}`}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoleContextSection({ pvs }: { pvs: NonNullable<ReturnType<typeof useGameStore.getState>['playerViewState']> }) {
  const ctx = pvs.roleContext;
  const hasContext = ctx.wolfTeammates || ctx.witchPotions || ctx.lastGuardedName !== undefined ||
    ctx.coupleNames || ctx.loverName || ctx.isApprenticeSeerActivated !== undefined;

  if (!hasContext) return null;

  return (
    <div className="border-t border-gray-700/30">
      <div className="text-[10px] text-gray-500 font-medium px-3 py-1.5 bg-gray-900/30">🎯 THÔNG TIN RIÊNG</div>
      <div className="px-3 py-1.5 space-y-1">
        {/* Wolf teammates */}
        {ctx.wolfTeammates && (
          <div className="text-[11px]">
            <span className="text-red-400 font-medium">🐺 Đồng bọn: </span>
            {ctx.wolfTeammates.length === 0 ? (
              <span className="text-gray-500">Không còn ai</span>
            ) : (
              ctx.wolfTeammates.map((w, i) => (
                <span key={i} className={`${w.alive ? 'text-red-300' : 'text-gray-500 line-through'}`}>
                  {w.name}({w.role}){i < ctx.wolfTeammates!.length - 1 ? ', ' : ''}
                </span>
              ))
            )}
            {ctx.alphaInfectUsed !== undefined && (
              <div className="text-[10px] text-gray-500 mt-0.5">
                Lây nhiễm: {ctx.alphaInfectUsed ? '❌ Đã dùng' : '✅ Còn'}
              </div>
            )}
          </div>
        )}

        {/* Witch potions */}
        {ctx.witchPotions && (
          <div className="text-[11px] flex gap-3">
            <span className={ctx.witchPotions.healUsed ? 'text-gray-500' : 'text-emerald-400'}>
              💚 Cứu: {ctx.witchPotions.healUsed ? 'Đã dùng' : 'Còn'}
            </span>
            <span className={ctx.witchPotions.killUsed ? 'text-gray-500' : 'text-red-400'}>
              💀 Độc: {ctx.witchPotions.killUsed ? 'Đã dùng' : 'Còn'}
            </span>
          </div>
        )}

        {/* Guard */}
        {ctx.lastGuardedName !== undefined && (
          <div className="text-[11px] text-blue-300">
            🛡️ Bảo vệ trước: {ctx.lastGuardedName || 'Chưa bảo vệ ai'}
          </div>
        )}

        {/* Cupid couple */}
        {ctx.coupleNames && (
          <div className="text-[11px] text-pink-300">
            💘 Ghép đôi: {ctx.coupleNames[0]} ❤️ {ctx.coupleNames[1]}
          </div>
        )}

        {/* Lover */}
        {ctx.loverName && (
          <div className="text-[11px] text-pink-300">
            💕 Người yêu: {ctx.loverName}
          </div>
        )}

        {/* Apprentice Seer */}
        {ctx.isApprenticeSeerActivated !== undefined && (
          <div className="text-[11px] text-purple-300">
            🔮 {ctx.isApprenticeSeerActivated ? 'Đã kế thừa Tiên Tri!' : 'Chờ kế thừa...'}
          </div>
        )}
      </div>
    </div>
  );
}
