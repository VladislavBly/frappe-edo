# Quick Start - React Development для Frappe

Краткая инструкция: написал код на React → собрал → запустил.

---

## 📦 Первоначальная установка (один раз)

```bash
cd apps/edo/frontend
yarn install
```

---

## 🔄 Типичный цикл разработки

### Вариант 1: Разработка с live reload

```bash
# 1. Запускаем dev-сервер с hot reload
cd apps/edo/frontend
yarn dev

# Откроется http://localhost:5173
# Все изменения применяются мгновенно
```

**Для работы с Frappe API во время dev:**
- Откройте в другом терминале Frappe: `bench start`
- Vite proxy перенаправит API запросы на Frappe

---

### Вариант 2: Полная сборка для Frappe

```bash
# 1. Написали код React в frontend/src/

# 2. Собираем production build
cd apps/edo/frontend
yarn build

# Файлы соберутся в ../edo/public/dist/

# 3. Очищаем кеш Frappe
cd ../../..  # вернуться в frappe-bench
bench --site your-site clear-cache
bench --site your-site clear-website-cache

# 4. Открываем в браузере
# http://localhost:8000/edo_documents
```

---

## 🚀 Команды по шагам

### Шаг 1: Разработка Frontend

```bash
cd apps/edo/frontend

# Dev mode с hot reload
yarn dev

# Или сразу build
yarn build
```

### Шаг 2: Применить изменения в Frappe

```bash
cd ../../..  # в frappe-bench

# Очистить кеш
bench --site your-site clear-cache

# Если изменили Python код или DocType
bench --site your-site migrate

# Перезапустить (если нужно)
bench restart
```

### Шаг 3: Проверить в браузере

Откройте: `http://localhost:8000/edo_documents`

---

## 📝 Частые сценарии

### Изменил React компонент

```bash
cd apps/edo/frontend
yarn build
cd ../../..
bench --site your-site clear-cache
# Обновить страницу в браузере (Ctrl+Shift+R)
```

### Изменил Frappe Python код

```bash
cd apps/edo
# Код уже изменен

cd ../../
bench restart
# Или просто обновить страницу, если bench start запущен
```

### Изменил DocType

```bash
bench --site your-site migrate
bench --site your-site clear-cache
```

### Изменил и React и Python

```bash
# 1. Build React
cd apps/edo/frontend
yarn build

# 2. Migrate + clear cache
cd ../../..
bench --site your-site migrate
bench --site your-site clear-cache
bench restart
```

---

## 🐛 Если что-то не работает

### React не загружается

```bash
# 1. Проверить что файлы собрались
ls -la apps/edo/edo/public/dist/assets/

# 2. Пересобрать
cd apps/edo/frontend
yarn build

# 3. Очистить кеш
cd ../../..
bench --site your-site clear-cache
bench --site your-site clear-website-cache
```

### Ошибки в консоли браузера

1. Открыть DevTools (F12)
2. Смотреть Console и Network tabs
3. Проверить что файлы загружаются (200 OK)

### API не работает

```bash
# Проверить что Frappe запущен
bench start

# В другом терминале проверить метод
bench --site your-site console
```

```python
# В консоли
frappe.call('edo.edo.doctype.edo_document.edo_document.get_portal_documents')
```

---

## 📂 Структура файлов

```
apps/edo/
├── frontend/              # ← Тут пишешь React код
│   ├── src/
│   │   ├── components/   # ← Компоненты
│   │   ├── lib/          # ← API клиент
│   │   └── App.tsx       # ← Главный файл
│   ├── package.json
│   └── vite.config.ts
│
└── edo/
    ├── www/              # ← HTML шаблоны для портала
    │   ├── edo_documents.html
    │   └── edo_documents.py
    └── public/
        └── dist/         # ← Сюда собирается React
            └── assets/
```

---

## ⚡ Быстрые команды

### Только разработка React (с live reload)

```bash
cd apps/edo/frontend && yarn dev
```

### Полный цикл: изменил → собрал → применил

```bash
cd apps/edo/frontend && \
yarn build && \
cd ../../.. && \
bench --site your-site clear-cache
```

### Запустить всё с нуля

```bash
# Terminal 1: Frappe
bench start

# Terminal 2: React dev server
cd apps/edo/frontend
yarn dev
```

---

## 🎯 TL;DR (самое короткое)

**Development (live reload):**
```bash
yarn dev    # в apps/edo/frontend
```

**Production (сборка для Frappe):**
```bash
yarn build                              # в apps/edo/frontend
bench --site your-site clear-cache      # в frappe-bench
```

**Открыть:**
```
http://localhost:8000/edo_documents
```

---

## 💡 Pro Tips

1. **Используйте `yarn dev` для разработки** - изменения применяются мгновенно
2. **После `yarn build` всегда делайте clear-cache** - иначе увидите старую версию
3. **Используйте Ctrl+Shift+R** для полной перезагрузки страницы без кеша
4. **Проверяйте консоль браузера (F12)** при ошибках
5. **Держите два терминала**: один для `bench start`, другой для `yarn dev`

---

**Готово!** Теперь можно разрабатывать React → собирать → тестировать в Frappe 🚀
