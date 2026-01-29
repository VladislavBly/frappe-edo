# EDO - React + Frappe Development Flow

Полное руководство по разработке современного портала на React с интеграцией в Frappe Framework.

## 📋 Содержание

1. [Архитектура проекта](#архитектура-проекта)
2. [Настройка окружения](#настройка-окружения)
3. [Flow разработки](#flow-разработки)
4. [Backend (Frappe)](#backend-frappe)
5. [Frontend (React)](#frontend-react)
6. [Интеграция](#интеграция)
7. [Деплой](#деплой)
8. [Troubleshooting](#troubleshooting)

---

## 🏗 Архитектура проекта

```
edo/
├── edo/                          # Frappe App (Backend)
│   ├── edo/
│   │   ├── doctype/             # DocTypes (модели данных)
│   │   │   └── edo_document/
│   │   │       ├── edo_document.json    # Метаданные DocType
│   │   │       ├── edo_document.py      # Python контроллер
│   │   │       └── ...
│   │   └── ...
│   ├── www/                      # Web страницы
│   │   ├── edo_documents.html   # Jinja шаблон для портала
│   │   └── edo_documents.py     # Python контекст для страницы
│   ├── public/                   # Статические файлы
│   │   └── dist/                # Собранные React файлы
│   │       ├── assets/
│   │       └── .vite/manifest.json
│   ├── fixtures/                 # Фикстуры (роли, и т.д.)
│   │   └── role.json
│   └── hooks.py                 # Хуки и конфигурация приложения
│
└── frontend/                     # React App (Frontend)
    ├── src/
    │   ├── components/          # React компоненты
    │   │   ├── ui/             # shadcn/ui компоненты
    │   │   ├── DocumentList.tsx
    │   │   └── DocumentDetail.tsx
    │   ├── lib/                # Утилиты
    │   │   ├── api.ts          # Frappe API клиент
    │   │   └── utils.ts
    │   ├── App.tsx             # Главный компонент
    │   ├── main.tsx            # Точка входа
    │   └── index.css           # Глобальные стили
    ├── public/
    ├── vite.config.ts          # Конфигурация Vite
    ├── tailwind.config.js      # Конфигурация Tailwind
    ├── package.json
    └── README.md
```

---

## 🛠 Настройка окружения

### 1. Установка Frappe Bench

```bash
# Если еще не установлен
pip install frappe-bench
bench init frappe-bench
cd frappe-bench
```

### 2. Создание сайта

```bash
bench new-site mysite.local
bench use mysite.local
```

### 3. Установка приложения EDO

```bash
bench get-app /path/to/edo
bench --site mysite.local install-app edo
```

### 4. Установка зависимостей Frontend

```bash
cd apps/edo/frontend
yarn install
```

---

## 🔄 Flow разработки

### Типичный цикл разработки

```
1. Изменения Backend (DocType, API)
   ↓
2. Миграция и тестирование
   ↓
3. Разработка Frontend (React компоненты)
   ↓
4. Локальная разработка с HMR
   ↓
5. Сборка и интеграция
   ↓
6. Тестирование в Frappe
   ↓
7. Коммит и деплой
```

---

## 🐍 Backend (Frappe)

### 1. Создание DocType

Через UI или командой:
```bash
bench --site mysite.local new-doc DocType "My DocType"
```

**Важные настройки для портала:**
- `has_web_view = 1` - включить веб-просмотр
- `route = "my-route"` - URL путь
- `allow_guest_to_view = 0` - только авторизованные пользователи

### 2. Python контроллер

**Файл:** `edo/edo/doctype/edo_document/edo_document.py`

```python
import frappe
from frappe.website.website_generator import WebsiteGenerator

class EDODocument(WebsiteGenerator):
    def get_context(self, context):
        """Контекст для портального просмотра"""
        context.no_cache = 1
        return context

def has_website_permission(doc, ptype, user, verbose=False):
    """Проверка прав доступа на портале"""
    if not user or user == "Guest":
        return False

    if "EDO User" in frappe.get_roles(user):
        return True

    return False

@frappe.whitelist()
def get_portal_documents():
    """API метод для получения списка документов"""
    user = frappe.session.user

    if "EDO User" not in frappe.get_roles(user):
        return []

    documents = frappe.get_all(
        "EDO Document",
        fields=["name", "title", "document_type", "status", "document_date"],
        order_by="creation desc"
    )

    return documents
```

### 3. Создание роли для портала

**Файл:** `edo/fixtures/role.json`

```json
[
  {
    "doctype": "Role",
    "name": "EDO User",
    "role_name": "EDO User",
    "desk_access": 0,
    "is_custom": 0,
    "disabled": 0
  }
]
```

### 4. Настройка hooks.py

**Файл:** `edo/hooks.py`

```python
# Фикстуры
fixtures = [
    {"dt": "Role", "filters": [["name", "in", ["EDO User"]]]},
]

# Домашняя страница для роли
role_home_page = {
    "EDO User": "edo_documents"
}

# Права доступа
has_website_permission = {
    "EDO Document": "edo.edo.doctype.edo_document.edo_document.has_website_permission"
}

# Website generators
website_generators = ["EDO Document"]
```

### 5. Миграция изменений

```bash
bench --site mysite.local migrate
bench --site mysite.local clear-cache
```

### 6. Создание тестовых данных

```python
# Через bench console
bench --site mysite.local console

# В консоли:
doc = frappe.get_doc({
    "doctype": "EDO Document",
    "title": "Тестовый документ",
    "document_type": "Договор",
    "status": "В процессе",
    "document_date": frappe.utils.today(),
    "author": "Иван Иванов"
})
doc.insert()
frappe.db.commit()
```

---

## ⚛️ Frontend (React)

### 1. Структура Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui компоненты
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── button.tsx
│   │   ├── DocumentList.tsx       # Список документов
│   │   └── DocumentDetail.tsx     # Детали документа
│   ├── lib/
│   │   ├── api.ts                 # API клиент
│   │   └── utils.ts               # Утилиты
│   ├── App.tsx                    # Роутинг
│   ├── main.tsx                   # Точка входа
│   └── index.css                  # Tailwind + стили
└── ...
```

### 2. API клиент для Frappe

**Файл:** `frontend/src/lib/api.ts`

```typescript
export interface EDODocument {
  name: string
  title: string
  document_type?: string
  status: string
  document_date?: string
  // ... остальные поля
}

class FrappeAPI {
  private baseURL: string

  constructor() {
    this.baseURL = window.location.origin
  }

  // Вызов серверного метода
  async call(method: string, args?: any) {
    const response = await fetch(`${this.baseURL}/api/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
      body: JSON.stringify(args || {}),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message
  }

  // Получение списка документов
  async getDocuments(): Promise<EDODocument[]> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_portal_documents')
  }

  // Получение одного документа
  async getDocument(name: string): Promise<EDODocument> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Document/${name}`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  private getCSRFToken(): string {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1]
    return token || ''
  }
}

export const api = new FrappeAPI()
```

### 3. React компонент

**Файл:** `frontend/src/components/DocumentList.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { api, type EDODocument } from '../lib/api'

export function DocumentList() {
  const [documents, setDocuments] = useState<EDODocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await api.getDocuments()
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.name}>
          <CardHeader>
            <CardTitle>{doc.title}</CardTitle>
            <Badge>{doc.status}</Badge>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
```

### 4. Разработка с HMR (Hot Module Replacement)

```bash
cd frontend
yarn dev
```

Откроется `http://localhost:5173` с живой перезагрузкой.

**Для работы с Frappe API во время разработки:**

В `vite.config.ts` добавьте proxy:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/assets': 'http://localhost:8000',
    }
  }
})
```

### 5. Сборка для продакшена

```bash
cd frontend
yarn build
```

Файлы собираются в `../edo/public/dist/`

---

## 🔗 Интеграция

### 1. Vite конфигурация

**Файл:** `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../edo/public/dist',    // Выход в Frappe public
    emptyOutDir: true,
    manifest: true,                   // Генерация манифеста
    rollupOptions: {
      input: {
        'edo-portal': './src/main.tsx',
      },
    },
  },
})
```

### 2. Страница портала (Python)

**Файл:** `edo/www/edo_documents.py`

```python
import frappe
import json
import os

def get_context(context):
    context.no_cache = 1
    context.show_sidebar = True

    # Читаем манифест для получения хешированных имен файлов
    manifest_path = frappe.get_app_path('edo', 'public', 'dist', '.vite', 'manifest.json')

    if os.path.exists(manifest_path):
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            entry = manifest.get('src/main.tsx', {})
            context.js_file = entry.get('file')
            context.css_files = entry.get('css', [])
    else:
        context.js_file = None
        context.css_files = []

    return context
```

### 3. HTML шаблон (Jinja)

**Файл:** `edo/www/edo_documents.html`

```jinja
{% extends "templates/web.html" %}

{% block title %}{{ _("EDO Documents") }}{% endblock %}

{% block head_include %}
{% if css_files %}
    {% for css_file in css_files %}
    <link rel="stylesheet" href="/assets/edo/dist/{{ css_file }}">
    {% endfor %}
{% endif %}
{% endblock %}

{% block page_content %}
<div id="root">
    <div style="text-align: center; padding: 2rem;">
        <h2>Загрузка...</h2>
    </div>
</div>

{% if js_file %}
<script type="module" src="/assets/edo/dist/{{ js_file }}"></script>
{% else %}
<script>
    document.getElementById('root').innerHTML =
        '<div style="padding: 2rem; text-align: center;">' +
        '<h2>Ошибка загрузки</h2>' +
        '<p>Пересоберите фронтенд: cd frontend && yarn build</p>' +
        '</div>';
</script>
{% endif %}
{% endblock %}
```

---

## 🚀 Деплой

### Production Build

```bash
# 1. Сборка Frontend
cd apps/edo/frontend
yarn build

# 2. Миграция Backend
cd ../../..
bench --site mysite.local migrate

# 3. Очистка кеша
bench --site mysite.local clear-cache
bench --site mysite.local clear-website-cache

# 4. Перезапуск
sudo supervisorctl restart all
```

### Git Workflow

```bash
# .gitignore должен включать:
frontend/node_modules/
frontend/dist/
edo/public/dist/
*.pyc
__pycache__/

# Коммит изменений
git add .
git commit -m "feat: Add React portal for EDO documents"
git push origin main
```

### На сервере

```bash
# Pull изменений
cd /path/to/frappe-bench
bench update --reset

# Установка frontend зависимостей
cd apps/edo/frontend
yarn install
yarn build

# Миграция
bench --site production.site migrate
bench --site production.site clear-cache

# Restart
sudo supervisorctl restart all
```

---

## 🐛 Troubleshooting

### Проблема: React приложение не загружается

**Решение:**
1. Проверьте что файлы собраны:
   ```bash
   ls -la edo/public/dist/assets/
   ```

2. Проверьте манифест:
   ```bash
   cat edo/public/dist/.vite/manifest.json
   ```

3. Очистите кеш:
   ```bash
   bench --site mysite.local clear-cache
   ```

4. Проверьте консоль браузера (F12) на ошибки

### Проблема: API вызовы возвращают 403

**Решение:**
- Проверьте что пользователь авторизован
- Проверьте что у пользователя есть роль "EDO User"
- Проверьте что метод помечен `@frappe.whitelist()`

### Проблема: CSRF token ошибки

**Решение:**
```typescript
// Убедитесь что CSRF token передается в заголовках
headers: {
  'X-Frappe-CSRF-Token': getCookieValue('csrf_token')
}
```

### Проблема: 404 на assets

**Решение:**
1. Проверьте путь в vite.config.ts:
   ```typescript
   outDir: '../edo/public/dist'
   ```

2. Проверьте что файлы доступны:
   ```
   http://localhost:8000/assets/edo/dist/assets/[filename]
   ```

### Проблема: Стили не применяются

**Решение:**
1. Проверьте что CSS файл загружается в HTML
2. Проверьте Tailwind конфигурацию
3. Убедитесь что `@tailwind` директивы есть в `index.css`

---

## 📚 Полезные команды

### Frappe

```bash
# Консоль
bench --site mysite.local console

# Миграция
bench --site mysite.local migrate

# Очистка кеша
bench --site mysite.local clear-cache
bench --site mysite.local clear-website-cache

# Перестроение assets
bench build

# Логи
bench --site mysite.local watch

# Создать нового пользователя
bench --site mysite.local add-user user@example.com
```

### Frontend

```bash
# Разработка
yarn dev

# Сборка
yarn build

# Проверка типов
yarn tsc --noEmit

# Lint
yarn lint
```

---

## 🎓 Best Practices

### 1. Разделение ответственности
- **Backend (Frappe)**: Бизнес-логика, валидация, права доступа
- **Frontend (React)**: UI, UX, интерактивность

### 2. API Design
- Используйте `@frappe.whitelist()` для публичных методов
- Всегда проверяйте права доступа
- Возвращайте структурированные данные

### 3. TypeScript
- Определяйте интерфейсы для всех данных
- Используйте `type` для импорта типов

### 4. Компоненты
- Один компонент = одна ответственность
- Переиспользуйте UI компоненты (shadcn/ui)
- Держите state близко к месту использования

### 5. Безопасность
- Никогда не доверяйте клиентским данным
- Всегда валидируйте на сервере
- Используйте CSRF токены
- Проверяйте права доступа

### 6. Performance
- Используйте `useMemo` и `useCallback` где нужно
- Lazy load компонентов
- Оптимизируйте bundle size

---

## 📖 Дополнительные ресурсы

- [Frappe Framework Documentation](https://frappeframework.com/docs)
- [React Documentation](https://react.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Автор:** EDO Development Team
**Версия:** 1.0.0
**Последнее обновление:** Январь 2026
