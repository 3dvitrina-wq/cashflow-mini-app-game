# Анимированные питомцы в лобби

## Как добавить нового анимированного питомца

### 1. Создай анимацию в Kling AI
- Загрузи фото питомца
- Выбери стиль движения (idle/breathe/blink)
- **Фон должен быть чёрным** — luminance key его удалит автоматически
- Экспортируй как MP4

### 2. Скопируй файл в проект
```bash
cp ~/Downloads/kling-video-XXXX.mp4 apps/web/public/pets/<pet-name>-anim.mp4
```

Файлы в `public/pets/` раздаются напрямую без бандлинга Vite.

### 3. Добавь в petCatalog.ts
```ts
{
  id: 'pet-rabbit',
  name: 'Кролик',
  image: rabbitGroomed,       // статичная картинка (fallback)
  videoSrc: '/pets/rabbit-anim.mp4',
  videoScale: 0.6,            // 0.5 = половина размера контейнера (188px)
  // ...
}
```

### 4. Всё — больше ничего не нужно

Компонент `AnimatedPet` в `LobbyScreen.tsx` автоматически:
- Читает каждый кадр через Canvas API
- Удаляет тёмные пиксели (lum < 25 → alpha=0, 25-55 → мягкий edge)
- Рендерит с прозрачным фоном на любом устройстве (iOS + Android)
- Класс `lobby-hook-pet-stage--video` скрывает фиолетовую тень под питомцем

## Настройка порогов прозрачности

В `LobbyScreen.tsx`, компонент `AnimatedPet`:
```ts
if (lum < 25) d[i + 3] = 0;          // полностью прозрачно
else if (lum < 55) d[i + 3] = ...;   // мягкий переход
```

- Уменьши пороги (15/40) если края питомца размытые
- Увеличь (35/70) если остаётся тёмный ореол

## Почему не mix-blend-mode: screen?

`filter: drop-shadow` на контейнере создаёт isolated stacking context —
`mix-blend-mode` внутри него не видит фон страницы.
Canvas-подход работает на уровне пикселей и не зависит от CSS-контекста.
