import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { showToast } from '../components/Toast';
import { ScreenHeader } from '../components/ScreenHeader';

export const FuturesScreen: React.FC = () => {
  const { setScreen, match, openFutures } = useStore();
  const localPlayerId = useStore((s) => s.localPlayerId);
  const marketPrices = useStore((s) => s.engineMatch?.marketPrices);
  const me = (localPlayerId ? match.players.find((p) => p.id === localPlayerId) : null) ?? match.players.find((p) => !p.isBot) ?? match.players[0];
  const [position, setPosition] = useState<'none' | 'long' | 'short'>('none');
  const [leverage, setLeverage] = useState(2);
  const [amount, setAmount] = useState(1000);
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Real prices from the engine market (baseline 100). Change% derived vs baseline.
  const TOKEN_META = [
    { name: 'NEON', color: '#5BD7E0' },
    { name: 'DRIFT', color: '#A78BFA' },
    { name: 'IRON', color: '#B8B6A9' },
    { name: 'VOLT', color: '#D7445B' },
  ];
  const tokens = TOKEN_META.map((t) => {
    const price = Math.round((marketPrices?.[t.name] ?? 100) * 10) / 10;
    const change = Math.round(price - 100);
    return { ...t, price, change };
  });

  const [selectedName, setSelectedName] = useState('NEON');
  const selectedToken = tokens.find((t) => t.name === selectedName) ?? tokens[0];

  // Generate fake chart data
  const chartData = useRef<number[]>([]);
  useEffect(() => {
    const data: number[] = [50];
    for (let i = 1; i < 60; i++) {
      data.push(data[i - 1] + (Math.random() - 0.48) * 8);
    }
    chartData.current = data;
  }, [selectedName]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#2E323B';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Chart line
    const data = chartData.current;
    if (data.length === 0) return;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = selectedToken.color;
    ctx.lineWidth = 2;
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under line
    const lastX = w;
    const lastY = h - ((data[data.length - 1] - min) / range) * (h - 20) - 10;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, selectedToken.color + '40');
    grad.addColorStop(1, selectedToken.color + '05');
    ctx.fillStyle = grad;
    ctx.fill();
  }, [selectedName]);

  const handleTrade = () => {
    if (position === 'none') return;
    const bet = Math.min(amount, me?.cash ?? 0);
    if (bet <= 0) {
      showToast('Недостаточно средств для маржи', 'error');
      return;
    }
    setLoading(true);
    // "Ping" delay for comedy, then dispatch a real engine position.
    setTimeout(() => {
      // Engine clamps leverage to 3x and deducts the margin from cash immediately;
      // P&L resolves at the end of the round (next turn).
      const ok = openFutures(selectedToken.name, position, Math.min(3, leverage), bet);
      if (!ok) {
        setLoading(false);
        showToast('Позиция не открыта. Проверь связь и доступную маржу.', 'warning');
        return;
      }
      setOpened(true);
      setLoading(false);
      showToast(`Маржа $${bet.toLocaleString()} списана. P&L на след. ходу.`, 'info');
    }, 1500 + Math.random() * 2000);
  };

  const hostLines = [
    "HODL? Скорее держись за жизнь.",
    "Графики не лгут, но очень любят вводить в заблуждение.",
    "Твой портфель звонил. Он плакал.",
    "Поздравляю, ты теперь финансовый аналитик!",
  ];

  return (
    <div className="route-screen min-h-screen bg-canvas flex flex-col safe-bottom">
      <ScreenHeader
        eyebrow="РИСК-ЛАБОРАТОРИЯ"
        title="Futures"
        subtitle="Вымышленный рынок · не финансовый совет"
        onBack={() => setScreen('main')}
        backLabel="Вернуться к столу"
        endSlot={<span className="route-header-badge">PRO</span>}
      />

      {/* Token selector */}
      <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar">
        {tokens.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelectedName(t.name)}
            className={`flex-shrink-0 rounded-xl px-3 py-2 border transition-all ${
              selectedToken.name === t.name
                ? 'border-accent-epoch bg-surface'
                : 'border-border-subtle bg-surface-elev/50'
            }`}
          >
            <span className="text-sm font-bold">{t.name}</span>
            <span className={`text-xs ml-2 ${t.change >= 0 ? 'text-accent-cash' : 'text-accent-debt'}`}>
              {t.change >= 0 ? '+' : ''}{t.change}%
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-4 py-3">
        <div className="bg-surface rounded-2xl p-3 border border-border-subtle">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-extrabold" style={{ color: selectedToken.color }}>
              ${selectedToken.price}
            </span>
            <span className={`text-sm font-bold ${selectedToken.change >= 0 ? 'text-accent-cash' : 'text-accent-debt'}`}>
              {selectedToken.change >= 0 ? '▲' : '▼'} {Math.abs(selectedToken.change)}%
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={340}
            height={150}
            className="w-full rounded-lg"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </div>

      {/* Position */}
      <div className="px-4 flex gap-3">
        <button
          onClick={() => setPosition('long')}
          className={`flex-1 h-14 rounded-2xl font-bold text-sm active:scale-95 transition-all ${
            position === 'long'
              ? 'bg-accent-cash text-canvas'
              : 'bg-surface-elev text-accent-cash border border-accent-cash/30'
          }`}
        >
          📈 LONG
        </button>
        <button
          onClick={() => setPosition('short')}
          className={`flex-1 h-14 rounded-2xl font-bold text-sm active:scale-95 transition-all ${
            position === 'short'
              ? 'bg-accent-debt text-white'
              : 'bg-surface-elev text-accent-debt border border-accent-debt/30'
          }`}
        >
          📉 SHORT
        </button>
      </div>

      {/* Leverage */}
      <div className="px-4 py-3">
        <div className="bg-surface rounded-2xl p-3 border border-border-subtle">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text-secondary">КРЕДИТНОЕ ПЛЕЧО</span>
            <span className="font-bold text-accent-warning">{leverage}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full accent-accent-warning"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>1x Безопасно</span>
            <span>2x Рискованно</span>
            <span>3x Предел</span>
          </div>
          {leverage >= 3 && (
            <p className="text-[10px] text-accent-debt mt-1 font-semibold">
              ⚠ Зона маржин-колла. Уверен?
            </p>
          )}
        </div>
      </div>

      {/* Bet size (margin) */}
      <div className="px-4 pb-1">
        <div className="bg-surface rounded-2xl p-3 border border-border-subtle">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text-secondary">МАРЖА</span>
            <span className="font-bold text-accent-epoch">${amount.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                  amount === v ? 'bg-accent-epoch text-canvas' : 'bg-surface-elev text-text-secondary border border-border-subtle'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-1">Баланс: ${(me?.cash ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Host roast */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎙</span>
          <div className="bg-accent-host/20 rounded-xl px-3 py-1.5 flex-1">
            <p className="text-xs text-accent-host">{hostLines[Math.floor(Math.random() * hostLines.length)]}</p>
          </div>
        </div>
      </div>

      {/* Result */}
      {opened && (
        <div className="mx-4 mt-3 rounded-2xl p-4 text-center border bg-accent-epoch/10 border-accent-epoch">
          <p className="text-lg font-extrabold">Позиция открыта 🚀</p>
          <p className="text-xs text-text-secondary mt-1">
            Маржа списана из баланса. Прибыль или убыток зачислятся в конце хода.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 px-4 py-4 mt-auto">
        <button
          onClick={() => setScreen('main')}
          className="flex-1 h-14 rounded-2xl bg-surface-elev border border-border-strong text-text-secondary font-bold text-sm
            active:scale-95 transition-transform"
        >
          Выход
        </button>
        <button
          onClick={handleTrade}
          disabled={position === 'none' || loading}
          className="flex-1 h-14 rounded-2xl bg-accent-epoch text-canvas font-bold text-sm
            disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {loading ? '⏳ Отправка...' : `🚀 ${position.toUpperCase()} ${leverage}x`}
        </button>
      </div>
    </div>
  );
};
