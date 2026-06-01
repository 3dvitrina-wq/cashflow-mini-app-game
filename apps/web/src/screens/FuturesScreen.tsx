import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

export const FuturesScreen: React.FC = () => {
  const { setScreen, match } = useStore();
  const [position, setPosition] = useState<'none' | 'long' | 'short'>('none');
  const [leverage, setLeverage] = useState(2);
  const [pnl, setPnl] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tokens = [
    { name: 'NEON', price: 42.5, change: +12, color: '#5BD7E0' },
    { name: 'DRIFT', price: 18.3, change: -8, color: '#A78BFA' },
    { name: 'IRON', price: 95.1, change: +1, color: '#B8B6A9' },
    { name: 'VOLT', price: 7.8, change: -22, color: '#D7445B' },
  ];

  const [selectedToken, setSelectedToken] = useState(tokens[0]);

  // Generate fake chart data
  const chartData = useRef<number[]>([]);
  useEffect(() => {
    const data: number[] = [50];
    for (let i = 1; i < 60; i++) {
      data.push(data[i - 1] + (Math.random() - 0.48) * 8);
    }
    chartData.current = data;
  }, [selectedToken]);

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
  }, [selectedToken]);

  const handleTrade = () => {
    setLoading(true);
    // Fake "ping" delay for comedy
    setTimeout(() => {
      const result = Math.random() > 0.5;
      const amount = Math.floor(Math.random() * 2000 * leverage);
      setPnl(result ? amount : -amount);
      setLoading(false);
    }, 1500 + Math.random() * 2000);
  };

  const hostLines = [
    "HODL? More like HODL on for dear life.",
    "Charts don't lie, but they do mislead.",
    "Your portfolio called. It's crying.",
    "Congratulations, you're now a financial analyst!",
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setScreen('main')} className="text-text-secondary text-xl">✕</button>
        <h2 className="text-lg font-bold">📈 FUTURES</h2>
        <span className="text-xs text-text-muted">Mini-game</span>
      </div>

      {/* Token selector */}
      <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar">
        {tokens.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelectedToken(t)}
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
            <span className="text-text-secondary">LEVERAGE</span>
            <span className="font-bold text-accent-warning">{leverage}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full accent-accent-warning"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>1x Safe</span>
            <span>3x Risky</span>
            <span>5x YOLO</span>
          </div>
          {leverage >= 4 && (
            <p className="text-[10px] text-accent-debt mt-1 font-semibold">
              ⚠ Margin call territory. You sure about this?
            </p>
          )}
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
      {pnl !== null && (
        <div className={`mx-4 mt-3 rounded-2xl p-4 text-center border ${
          pnl >= 0 ? 'bg-accent-cash/10 border-accent-cash' : 'bg-accent-debt/10 border-accent-debt'
        }`}>
          <p className="text-2xl font-extrabold">
            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {pnl >= 0 ? 'You beat the market! (this time)' : 'The market beat you. Again.'}
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
          Exit
        </button>
        <button
          onClick={handleTrade}
          disabled={position === 'none' || loading}
          className="flex-1 h-14 rounded-2xl bg-accent-epoch text-canvas font-bold text-sm
            disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {loading ? '⏳ Connecting...' : `🚀 ${position.toUpperCase()} ${leverage}x`}
        </button>
      </div>
    </div>
  );
};
