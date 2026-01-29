# Поднятие отдельного React-портала для роли во Frappe

Пошаговая инструкция: как запустить свой React-фронт как страницу портала для выбранной роли (по образцу EDO).

---

## 1. Структура приложения

Предполагается, что у вас уже есть Frappe-приложение (например, `my_app`) и отдельная папка с React-проектом (например, `frontend/`).

Нужная структура:

```
my_app/
├── my_app/
│   ├── www/                    # Страницы портала (HTML + Python)
│   │   ├── my_portal.html      # шаблон страницы
│   │   └── my_portal.py        # контекст (js/css из manifest)
│   ├── public/
│   │   └── dist/               # сюда собирается фронт (Vite build)
│   │       ├── .vite/
│   │       │   └── manifest.json
│   │       └── assets/
│   ├── utils/
│   │   └── routing.py          # перехват маршрутов для SPA
│   └── hooks.py
└── frontend/                   # React (Vite + React Router)
    ├── src/
    │   ├── main.tsx            # точка входа, createRoot(#root)
    │   └── App.tsx
    ├── vite.config.ts
    └── package.json
```

---

## 2. Сборка фронта в папку приложения

В **vite.config.ts** укажите вывод в `public/dist` вашего приложения и включите manifest:

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../my_app/public/dist',   // путь относительно frontend/
    emptyOutDir: false,
    manifest: true,
    copyPublicDir: true,
    rollupOptions: {
      input: {
        'my-portal': path.resolve(__dirname, 'src/main.tsx'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
})
```

Соберите:

```bash
cd frontend && npm run build
```

После сборки в `my_app/public/dist/.vite/manifest.json` должен появиться entry (часто с ключом `src/main.tsx`) и файлы в `assets/`.

---

## 3. Страница портала (HTML + Python)

### 3.1. Python-контекст: `my_app/www/my_portal.py`

Страница должна отдать в шаблон пути к JS и CSS из manifest:

```python
import frappe
import json
import os

def get_context(context):
    context.no_cache = 1
    context.show_sidebar = True

    manifest_path = frappe.get_app_path('my_app', 'public', 'dist', '.vite', 'manifest.json')

    if os.path.exists(manifest_path):
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            # Ключ в manifest обычно "src/main.tsx" (как в Vite)
            entry = manifest.get('src/main.tsx', {})
            context.js_file = entry.get('file')
            context.css_files = entry.get('css', [])
    else:
        context.js_file = None
        context.css_files = []

    return context
```

Если в вашем manifest ключ entry другой — подставьте его вместо `'src/main.tsx'`.

### 3.2. Шаблон страницы: `my_app/www/my_portal.html`

- Наследуем `templates/web.html`.
- В `page_content` — контейнер `<div id="root">` (в него монтируется React в `main.tsx`).
- Подключаем CSS из контекста и один script (entry JS).
- Путь к статике: `/assets/my_app/dist/` (Frappe отдаёт `public/` как `/assets/<app_name>/`).

Пример:

```html
{% extends "templates/web.html" %}

{% block title %}{{ _("My Portal") }}{% endblock %}

{% block head_include %}
{% if css_files %}
  {% for css_file in css_files %}
  <link rel="stylesheet" href="/assets/my_app/dist/{{ css_file }}">
  {% endfor %}
{% endif %}
<style>
  .navbar, .web-footer, footer, .web-sidebar, .sidebar-column { display: none !important; }
  html, body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
  #root {
    position: fixed !important;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100% !important; height: 100% !important;
    margin: 0 !important; padding: 0 !important;
    overflow: hidden !important;
  }
</style>
{% endblock %}

{% block page_content %}
<div id="root">
  <div style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
    <div style="text-align: center;"><h2>Загрузка...</h2></div>
  </div>
</div>

{% if js_file %}
<script type="module" src="/assets/my_app/dist/{{ js_file }}"></script>
{% else %}
<script>
  document.getElementById('root').innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>Ошибка загрузки</h2><p>Пересоберите фронт: cd frontend && npm run build</p></div>';
</script>
{% endif %}
{% endblock %}
```

Имя файла без расширения (`my_portal`) — это и есть **имя страницы** во Frappe (route/page id).

---

## 4. Точка входа React

В **frontend/src/main.tsx** монтируем приложение в тот же `#root`:

```tsx
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

URL при открытии страницы будет вида `https://your-site/frappe/my_portal` (или как настроен портал). Если используете React Router (HashRouter), то пути вида `...#/documents` — без дополнительной настройки сервера.

---

## 5. Hooks: домашняя страница для роли и маршруты

В **my_app/hooks.py**:

### 5.1. Домашняя страница для роли

Чтобы при входе в портал пользователь с определённой ролью сразу попадал на ваш фронт:

```python
role_home_page = {
    "My Role": "my_portal",
    "Another Role": "my_portal",
}
```

Здесь `"my_portal"` — имя страницы (имя файла без расширения в `www/`).

### 5.2. Правила маршрутов для SPA (опционально)

Если у вас в React есть пути, например `/app/...`, и вы хотите, чтобы при открытии `https://your-site/frappe/app/...` отдавалась та же страница (и дальше роутинг делал React):

```python
website_route_rules = [
    {"from_route": "/app/<path:app_path>", "to_route": "my_portal"},
    {"from_route": "/app", "to_route": "my_portal"},
]
```

Тогда и `/app`, и `/app/anything` будут открывать страницу `my_portal`, а React Router разберёт путь (если используете HashRouter — путь после `#`).

### 5.3. Перехват запроса до маршрутизации (SPA без hash)

Чтобы при заходе на `/app` или `/app/...` Frappe не отдавал 404, а сразу рендерил страницу `my_portal`, добавьте **before_route**:

```python
# В hooks.py
before_route = ["my_app.utils.routing.before_route"]
```

И создайте **my_app/utils/routing.py**:

```python
import frappe

def before_route():
    path = frappe.local.request.path
    if path.startswith('/app'):
        frappe.local.response.type = 'page'
        frappe.local.response.page = 'my_portal'
        return True
    return False
```

После этого при открытии `/app` или `/app/...` будет отдаваться страница `my_portal` с вашим React-приложением.

---

## 6. Итоговый чеклист

| Шаг | Действие |
|-----|----------|
| 1 | Собрать фронт в `my_app/public/dist` с `manifest: true` и правильным `outDir` в Vite. |
| 2 | Добавить `my_app/www/my_portal.py` (get_context с js_file, css_files из manifest). |
| 3 | Добавить `my_app/www/my_portal.html` с `#root` и подключением `/assets/my_app/dist/{{ js_file }}`. |
| 4 | В React монтировать приложение в `document.getElementById('root')` в `main.tsx`. |
| 5 | В `hooks.py` задать `role_home_page = {"Role Name": "my_portal"}`. |
| 6 | При необходимости: `website_route_rules` и `before_route` + `routing.before_route` для SPA-путей. |
| 7 | Перезапустить Frappe (или обновить приложение), проверить доступ под пользователем с нужной ролью. |

---

## 7. Проверка

1. Сборка: `cd frontend && npm run build` — в `my_app/public/dist` есть `manifest.json` и `assets/*.js`, `*.css`.
2. Открыть в браузере страницу портала: `https://your-site/frappe/my_portal` (или как настроен base URL).
3. Войти под пользователем с ролью из `role_home_page` — при переходе в портал должна открываться `my_portal` с вашим React-интерфейсом.

---

## 8. Замечания

- **Имя приложения** в путях (`my_app`, `edo` и т.д.) должно совпадать с `app_name` в `hooks.py` и с тем, как приложение смонтировано в bench.
- **Путь к статике**: `public/` отдаётся как `/assets/<app_name>/`, поэтому в HTML используется `/assets/my_app/dist/{{ css_file }}` и т.д.
- Если меняете entry в Vite (например, имя точки входа), обновите ключ в `my_portal.py` при чтении manifest (часто это `'src/main.tsx'`).
