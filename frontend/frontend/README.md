# EDO Portal Frontend

Современный портал для приложения EDO, построенный на React + TypeScript + shadcn/ui.

## Технологии

- **React 19** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **Tailwind CSS** - стили
- **shadcn/ui** - компоненты
- **Lucide React** - иконки

## Разработка

### Установка зависимостей

```bash
cd frontend
yarn install
```

### Разработка с hot-reload

```bash
yarn dev
```

Откроется dev-сервер на `http://localhost:5173`

### Сборка для продакшена

```bash
yarn build
```

Собранные файлы будут в `../edo/public/dist/`

### После сборки

После сборки нужно обновить пути к файлам в `edo/www/edo_documents.html`, используя имена из манифеста:

```bash
cat ../edo/public/dist/.vite/manifest.json
```

## Структура проекта

```
frontend/
├── src/
│   ├── components/        # React компоненты
│   │   ├── ui/           # shadcn/ui компоненты
│   │   ├── DocumentList.tsx
│   │   └── DocumentDetail.tsx
│   ├── lib/              # Утилиты
│   │   ├── api.ts        # API клиент для Frappe
│   │   └── utils.ts      # Общие утилиты
│   ├── App.tsx           # Главный компонент
│   ├── main.tsx          # Точка входа
│   └── index.css         # Глобальные стили
├── public/               # Статические файлы
├── vite.config.ts        # Конфигурация Vite
├── tailwind.config.js    # Конфигурация Tailwind
└── tsconfig.json         # Конфигурация TypeScript
```

## API Integration

Приложение использует Frappe API для получения данных:

- `edo.edo.doctype.edo_document.edo_document.get_portal_documents` - список документов
- `/api/resource/EDO Document/{name}` - детали документа

## Компоненты

### DocumentList

Список всех EDO документов с фильтрацией по статусу.

### DocumentDetail

Детальное отображение одного документа.

## Стилизация

Используется Tailwind CSS с темой от shadcn/ui. Основные цвета и стили определены в `src/index.css`.

## Deployment

1. Соберите фронтенд: `yarn build`
2. Файлы автоматически попадут в `edo/public/dist/`
3. Frappe будет обслуживать их по пути `/assets/edo/dist/`
4. Обновите пути в `edo/www/edo_documents.html` если изменились хеши файлов
