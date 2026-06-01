import React from 'react';
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
import { ToastContainer } from './components/Toast';
import { CharacterPreviewScreen } from './screens/CharacterPreviewScreen';

const App: React.FC = () => {
  const { screen, rulesReturnScreen, setScreen } = useStore();
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const preview = params?.get('preview');
  const forceRules = params?.get('rules') === '1';
  const autostart = params?.get('autostart') === '1';

  // Dev visual harness: ?preview=avatars (does not affect normal navigation)
  if (preview === 'avatars') {
    return <CharacterPreviewScreen />;
  }

  // Dev QA harness: ?rules=1 opens the same rules screen used by the top menu.
  if (forceRules) {
    return <OnboardingScreen mode="rules" onComplete={() => setScreen(screen === 'onboarding' ? 'lobby' : screen)} />;
  }

  // Dev QA harness: ?autostart=1 lets mobile screenshots skip onboarding.
  if (screen === 'onboarding' && autostart) {
    return <LobbyScreen />;
  }

  // Onboarding first
  if (screen === 'onboarding') {
    return <OnboardingScreen mode="start" onComplete={() => setScreen('lobby')} />;
  }

  // Rules/help screen from the top menu
  if (screen === 'rules') {
    return <OnboardingScreen mode="rules" onComplete={() => setScreen(rulesReturnScreen)} />;
  }

  // Settings as overlay/full screen
  if (screen === 'settings') {
    return <SettingsScreen onClose={() => setScreen('main')} />;
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
      <ToastContainer />
    </div>
  );
};

export default App;
