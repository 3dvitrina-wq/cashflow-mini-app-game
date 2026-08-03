import React, { useEffect } from 'react';
import { useStore } from './store';
import { LobbyScreen } from './screens/LobbyScreen';
import { MainTurnTableScreen } from './screens/MainTurnTableScreen';
import { DealModalScreen } from './screens/DealModalScreen';
import { FuturesScreen } from './screens/FuturesScreen';
import { RecapScreen } from './screens/RecapScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { CharacterEditorScreen } from './screens/CharacterEditorScreen';
import { CharacterPreviewScreen } from './screens/CharacterPreviewScreen';
import { savePlayerData } from './store/persistence';
import { buildQuickStartRoster } from './lib/quickStartRoster';

const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

const GAME_SCREENS = new Set(['main', 'deal', 'futures', 'recap']);

const App: React.FC = () => {
  const { screen, rulesReturnScreen, settingsReturnScreen, setScreen, openRules, startMatch } = useStore();

  useEffect(() => {
    if (!tg) return;
    tg.ready();
    tg.expand();
  }, []);

  useEffect(() => {
    if (!tg) return;
    if (GAME_SCREENS.has(screen)) {
      tg.enableClosingConfirmation?.();
    } else {
      tg.disableClosingConfirmation?.();
    }
  }, [screen]);
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const preview = params?.get('preview');
  const forceRules = params?.get('rules') === '1';
  const autostart = params?.get('autostart') === '1';
  const forceLobby = params?.get('lobby') === '1';
  const forceShop = params?.get('shop') === '1';
  const forceEditor = params?.get('editor') === '1';
  // Dev visual harness: ?preview=avatars (does not affect normal navigation)
  if (preview === 'avatars') {
    return <CharacterPreviewScreen />;
  }

  // Dev QA harness: ?rules=1 opens the same rules screen used by the top menu.
  if (forceRules) {
    return <OnboardingScreen mode="rules" onComplete={() => setScreen(screen === 'onboarding' ? 'lobby' : screen)} />;
  }

  // Dev QA harness: ?shop=1 opens the real shop screen directly.
  if (forceShop) {
    return <ShopScreen />;
  }

  // Dev QA harness: ?lobby=1 opens lobby without completing onboarding or starting a match.
  if (forceLobby) {
    return <LobbyScreen />;
  }

  // Dev QA harness: ?editor=1 opens character editor directly.
  if (forceEditor) {
    return <CharacterEditorScreen onClose={() => setScreen('main')} />;
  }

  // Dev QA harness: ?autostart=1 lets mobile screenshots skip onboarding.
  if (screen === 'onboarding' && autostart) {
    return <LobbyScreen />;
  }

  // Onboarding first
  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        mode="start"
        onComplete={() => {
          savePlayerData({ onboardingComplete: true });
          startMatch(buildQuickStartRoster(), { mode: 'classic', maxRounds: 15 });
        }}
        onRules={() => {
          savePlayerData({ onboardingComplete: true });
          openRules('lobby');
        }}
      />
    );
  }

  // Rules/help screen from the top menu
  if (screen === 'rules') {
    return <OnboardingScreen mode="rules" onComplete={() => { savePlayerData({ onboardingComplete: true }); setScreen(rulesReturnScreen); }} />;
  }

  // Settings as overlay/full screen
  if (screen === 'settings') {
    return <SettingsScreen onClose={() => setScreen(settingsReturnScreen)} />;
  }

  // Character editor
  if (screen === 'editor') {
    return <CharacterEditorScreen onClose={() => setScreen('main')} />;
  }

  // Modal screens (no tab bar)
  if (screen === 'deal') {
    return <DealModalScreen />;
  }
  if (screen === 'futures') {
    return <FuturesScreen />;
  }
  if (screen === 'recap') {
    return <RecapScreen />;
  }
  if (screen === 'lobby') {
    return <LobbyScreen />;
  }
  if (screen === 'shop') {
    return <ShopScreen />;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <MainTurnTableScreen />
    </div>
  );
};

export default App;
