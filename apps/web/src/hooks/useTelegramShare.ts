import { useCallback } from 'react';

export function useTelegramShare() {
  const shareMessage = useCallback((text: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.shareMessage) {
        tg.shareMessage(text);
      } else {
        // Fallback: open share URL
        const encodedText = encodeURIComponent(text);
        window.open(`https://t.me/share/url?url=${encodedText}`, '_blank');
      }
    } catch {
      // silently fail
    }
  }, []);

  const shareToStory = useCallback((text: string, mediaUrl?: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.shareMessage) {
        tg.shareMessage(text, mediaUrl ? { media: mediaUrl } : undefined);
      }
    } catch {
      // silently fail
    }
  }, []);

  const inviteFriend = useCallback(() => {
    const text = '🎲 Присоединяйся к DYOR — финансовой игре с друзьями!\n\nУправляй деньгами, заключай сделки, избегай кризисов.';
    shareMessage(text);
  }, [shareMessage]);

  const shareAchievement = useCallback((achievement: string) => {
    const text = `🏆 Я получил "${achievement}" в DYOR! Попробуй обойти меня!`;
    shareMessage(text);
  }, [shareMessage]);

  const shareMatch = useCallback((result: string) => {
    const text = `🎲 Только что сыграл матч в DYOR: ${result}`;
    shareMessage(text);
  }, [shareMessage]);

  const challengeFriend = useCallback((friendName: string) => {
    const text = `🎲 ${friendName}, вызов! Сыграем матч в DYOR?`;
    shareMessage(text);
  }, [shareMessage]);

  return {
    shareMessage,
    shareToStory,
    inviteFriend,
    shareAchievement,
    shareMatch,
    challengeFriend,
  };
}
