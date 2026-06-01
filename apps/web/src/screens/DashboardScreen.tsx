import React from 'react';
import { useStore } from '../store';
import iconCash from '../assets/generated/dashboard/icon-cash.svg';
import iconIncome from '../assets/generated/dashboard/icon-income.svg';
import iconExpenses from '../assets/generated/dashboard/icon-expenses.svg';
import iconAssets from '../assets/generated/dashboard/icon-assets.svg';
import iconDebt from '../assets/generated/dashboard/icon-debt.svg';
import iconBusiness from '../assets/generated/dashboard/icon-business.svg';

export const DashboardScreen: React.FC = () => {
  const match = useStore((s) => s.match);
  const me = match.players.find((p) => !p.isBot) || match.players[0];

  if (!me) {
    return (
      <div style={{ padding: 20, color: '#7D7B6F', textAlign: 'center' }}>
        Нет данных. Начните матч.
      </div>
    );
  }

  const totalExpenses = me.monthlyExpenses ?? me.debt * 500 + 1800;
  const assetValue = me.assetValue ?? me.businesses.length * 15000;
  const netWorth = me.cash + assetValue - me.debt * 5000;
  const totalIncome = me.cashflowPerMonth + me.passiveIncome;
  const cashflow = me.netCashflow ?? totalIncome - totalExpenses;
  const freedomProgress = Math.min(100, (me.passiveIncome / Math.max(1, totalExpenses)) * 100);

  return (
    <div className="dashboard-shell">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="screen-title">
          Портфель
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 900, color: '#F5C524' }}>
            ${netWorth.toLocaleString()}
          </span>
          <span style={{ fontSize: 14, color: '#7D7B6F' }}>Net Worth</span>
        </div>
      </div>

      {/* Freedom Progress */}
      <div
        className="portfolio-hero-card tactile-card"
        style={{
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span style={{ color: '#7D7B6F' }}>Финансовая свобода</span>
          <span style={{ color: '#28C76F' }}>{freedomProgress.toFixed(0)}%</span>
        </div>
        <div
          className="portfolio-progress-track"
          style={{
          }}
        >
          <div
            style={{
              width: `${freedomProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #28C76F, #34D399)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: '#7D7B6F', margin: '8px 0 0' }}>
          Пассивный доход: ${me.passiveIncome.toLocaleString()} / ${totalExpenses.toLocaleString()} расходов
        </p>
      </div>

      {/* Income vs Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div
          className="portfolio-metric-card portfolio-metric-positive tactile-card"
          style={{
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <img src={iconIncome} alt="income" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7D7B6F' }}>ДОХОД</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#28C76F' }}>
            +${totalIncome.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#7D7B6F', marginTop: 4 }}>
            Активный: ${me.cashflowPerMonth.toLocaleString()}
            <br />
            Пассивный: ${me.passiveIncome.toLocaleString()}
          </div>
        </div>

        <div
          className="portfolio-metric-card portfolio-metric-negative tactile-card"
          style={{
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <img src={iconExpenses} alt="expenses" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7D7B6F' }}>РАСХОДЫ</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#E84B2A' }}>
            -${totalExpenses.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#7D7B6F', marginTop: 4 }}>
            База: ${(totalExpenses - me.debt * 500).toLocaleString()}
            <br />
            Кредиты: ${me.debt * 500}
          </div>
        </div>
      </div>

      {/* Cashflow */}
      <div
        className="cashflow-card tactile-card"
        style={{
          background: cashflow >= 0 ? 'rgba(40, 199, 111, 0.12)' : 'rgba(232, 75, 42, 0.12)',
          marginBottom: 16,
          border: `1px solid ${cashflow >= 0 ? 'rgba(40, 199, 111, 0.3)' : 'rgba(232, 75, 42, 0.3)'}`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7D7B6F', marginBottom: 4 }}>
          CASHFLOW / МЕС
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: cashflow >= 0 ? '#28C76F' : '#E84B2A',
          }}
        >
          {cashflow >= 0 ? '+' : ''}${cashflow.toLocaleString()}
        </div>
      </div>

      {/* Assets */}
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 900,
            margin: '0 0 12px',
            color: '#F5F4ED',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <img src={iconAssets} alt="assets" style={{ width: 18, height: 18 }} />
          Активы ({me.businesses.length})
        </h2>
        {me.businesses.length === 0 ? (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#7D7B6F',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Нет активов. Купи на рынке!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {me.businesses.map((biz, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <img src={iconBusiness} alt="business" style={{ width: 24, height: 24 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{biz}</div>
                  <div style={{ fontSize: 11, color: '#28C76F' }}>В стоимости активов</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            textAlign: 'center',
          }}
        >
          <img src={iconCash} alt="cash" style={{ width: 20, height: 20, marginBottom: 4 }} />
          <div style={{ fontSize: 10, color: '#7D7B6F', marginBottom: 2 }}>CASH</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#F5C524' }}>
            ${me.cash.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>😰</div>
          <div style={{ fontSize: 10, color: '#7D7B6F', marginBottom: 2 }}>СТРЕСС</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#E84B2A' }}>{me.stress}/10</div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            textAlign: 'center',
          }}
        >
          <img src={iconDebt} alt="debt" style={{ width: 20, height: 20, marginBottom: 4 }} />
          <div style={{ fontSize: 10, color: '#7D7B6F', marginBottom: 2 }}>ДОЛГ</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#E84B2A' }}>{me.debt}/10</div>
        </div>
      </div>
    </div>
  );
};
