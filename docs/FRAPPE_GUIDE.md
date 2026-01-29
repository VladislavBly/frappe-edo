# Полное руководство по Frappe Framework

## 📖 Что такое Frappe Framework?

Frappe Framework - это полнофункциональный веб-фреймворк на Python для создания бизнес-приложений. Он включает:
- **ORM** для работы с БД (автоматическая генерация таблиц из моделей)
- **REST API** из коробки
- **Веб-портал** для пользователей
- **Админ-панель** (Desk) для управления
- **Система прав доступа** (Permissions)
- **Файловое хранилище** с версионированием
- **Мультиязычность** (i18n)
- **Кеширование** и оптимизация запросов

---

## 🏗️ Основные концепции

### 1. DocType - Модель данных

**DocType** - это основная единица данных в Frappe. Это как таблица в БД, но с дополнительными возможностями:
- Автоматическое создание таблицы в БД
- REST API из коробки
- Форма редактирования в Desk
- Система прав доступа
- Аудит изменений
- Версионирование

---

#### 1.1 Типы DocType

| Тип | Описание | Пример |
|-----|----------|--------|
| **Regular** | Обычный DocType, много записей | EDO Document, User |
| **Child Table** | Вложенная таблица (строки в родителе) | EDO Co-Executor, EDO Attachment |
| **Single** | Только одна запись (настройки) | System Settings, Website Settings |
| **Submittable** | С возможностью Submit/Cancel | Invoice, Journal Entry |

---

#### 1.2 Создание DocType через UI (Frappe Desk)

**Шаг 1: Открыть создание DocType**
```
Desk → Search "DocType" → New DocType
```

**Шаг 2: Заполнить основные настройки**
- **Name**: Название DocType (например, `EDO Task`)
- **Module**: Модуль приложения (например, `EDO`)
- **Naming**: Способ именования (autoname)

**Шаг 3: Добавить поля**
В секции "Fields" добавьте поля через кнопку "Add Row":

| Label | Fieldname | Fieldtype | Options |
|-------|-----------|-----------|---------|
| Title | title | Data | - |
| Status | status | Select | Новый\nВ работе\nЗавершено |
| Assigned To | assigned_to | Link | User |
| Description | description | Text Editor | - |
| Due Date | due_date | Date | - |

**Шаг 4: Настроить права (Permissions)**
В секции "Permission Rules" добавьте роли:

| Role | Read | Write | Create | Delete | Submit |
|------|------|-------|--------|--------|--------|
| System Manager | ✓ | ✓ | ✓ | ✓ | - |
| EDO User | ✓ | ✓ | ✓ | - | - |

**Шаг 5: Сохранить**
- Нажать **Save**
- Frappe автоматически создаст таблицу в БД

---

#### 1.3 Создание DocType через файлы (вручную)

Этот способ предпочтителен для production - изменения версионируются в Git.

**Шаг 1: Создать структуру папок**

```bash
# Создать папку DocType
mkdir -p edo/edo/doctype/edo_task

# Создать файлы
touch edo/edo/doctype/edo_task/__init__.py
touch edo/edo/doctype/edo_task/edo_task.py
touch edo/edo/doctype/edo_task/edo_task.json
```

**Структура:**
```
edo/edo/doctype/edo_task/
├── __init__.py        # Пустой файл (обязательно!)
├── edo_task.json      # Метаданные DocType
├── edo_task.py        # Python контроллер
└── edo_task.js        # JavaScript (опционально)
```

**Шаг 2: Создать edo_task.json**

```json
{
    "doctype": "DocType",
    "name": "EDO Task",
    "module": "EDO",
    "engine": "InnoDB",
    "naming_rule": "By \"Naming Series\" field",
    "autoname": "naming_series:",
    "title_field": "title",
    "search_fields": "title,status,assigned_to",
    "sort_field": "creation",
    "sort_order": "DESC",

    "fields": [
        {
            "fieldname": "naming_series",
            "fieldtype": "Select",
            "label": "Series",
            "options": "TASK-.YYYY.-.####",
            "default": "TASK-.YYYY.-.####",
            "reqd": 1
        },
        {
            "fieldname": "title",
            "fieldtype": "Data",
            "label": "Название",
            "reqd": 1,
            "in_list_view": 1,
            "in_standard_filter": 1
        },
        {
            "fieldname": "column_break_1",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "status",
            "fieldtype": "Select",
            "label": "Статус",
            "options": "Новый\nВ работе\nЗавершено\nОтменено",
            "default": "Новый",
            "in_list_view": 1,
            "in_standard_filter": 1
        },
        {
            "fieldname": "section_details",
            "fieldtype": "Section Break",
            "label": "Детали"
        },
        {
            "fieldname": "assigned_to",
            "fieldtype": "Link",
            "label": "Исполнитель",
            "options": "User",
            "in_list_view": 1
        },
        {
            "fieldname": "due_date",
            "fieldtype": "Date",
            "label": "Срок"
        },
        {
            "fieldname": "column_break_2",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "priority",
            "fieldtype": "Select",
            "label": "Приоритет",
            "options": "Низкий\nСредний\nВысокий",
            "default": "Средний"
        },
        {
            "fieldname": "section_description",
            "fieldtype": "Section Break",
            "label": "Описание"
        },
        {
            "fieldname": "description",
            "fieldtype": "Text Editor",
            "label": "Описание задачи"
        }
    ],

    "permissions": [
        {
            "role": "System Manager",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1,
            "export": 1,
            "import": 1,
            "report": 1
        },
        {
            "role": "EDO Admin",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1
        },
        {
            "role": "EDO User",
            "read": 1,
            "write": 1,
            "create": 1
        }
    ],

    "allow_rename": 1,
    "track_changes": 1,
    "track_views": 1
}
```

**Шаг 3: Создать edo_task.py**

```python
# Copyright (c) 2026, Your Company
# License: MIT

import frappe
from frappe.model.document import Document


class EDOTask(Document):
    """Контроллер для EDO Task"""

    def validate(self):
        """Валидация перед сохранением"""
        self.validate_due_date()

    def validate_due_date(self):
        """Проверить что срок не в прошлом"""
        if self.due_date and self.due_date < frappe.utils.today():
            frappe.throw("Срок не может быть в прошлом")

    def before_save(self):
        """Перед сохранением"""
        if not self.title:
            frappe.throw("Название обязательно")

    def after_insert(self):
        """После создания"""
        # Отправить уведомление исполнителю
        if self.assigned_to:
            frappe.publish_realtime(
                "new_task",
                {"task": self.name, "title": self.title},
                user=self.assigned_to
            )

    def on_update(self):
        """После обновления"""
        pass
```

**Шаг 4: Применить изменения (Миграция)**

```bash
# Запустить миграцию - создаст таблицу в БД
bench --site your-site.local migrate

# Перезапустить сервер
bench restart

# Очистить кеш (если DocType не появился)
bench --site your-site.local clear-cache
```

---

#### 1.4 Как сделать DocType видимым в приложении

После создания DocType его нужно добавить в **Workspace** чтобы пользователи могли его найти.

**Способ 1: Через UI**

```
Desk → Search "Workspace" → Открыть ваш Workspace (например "EDO")
→ Edit → Add Shortcut → Выбрать DocType "EDO Task" → Save
```

**Способ 2: Через файл workspace.json**

Отредактируйте `edo/edo/workspace/edo/edo.json`:

```json
{
    "doctype": "Workspace",
    "name": "EDO",
    "module": "EDO",
    "label": "EDO",
    "shortcuts": [
        {
            "label": "EDO Document",
            "link_to": "EDO Document",
            "type": "DocType"
        },
        {
            "label": "EDO Task",
            "link_to": "EDO Task",
            "type": "DocType"
        }
    ],
    "links": [
        {
            "label": "Документы",
            "links": [
                {
                    "label": "Все документы",
                    "link_to": "EDO Document",
                    "link_type": "DocType",
                    "type": "Link"
                },
                {
                    "label": "Задачи",
                    "link_to": "EDO Task",
                    "link_type": "DocType",
                    "type": "Link"
                }
            ],
            "type": "Card Break"
        }
    ]
}
```

**Способ 3: Программно через Python**

```python
def add_doctype_to_workspace():
    """Добавить DocType в Workspace"""
    workspace = frappe.get_doc("Workspace", "EDO")

    # Проверить что шортката ещё нет
    exists = any(s.link_to == "EDO Task" for s in workspace.shortcuts)

    if not exists:
        workspace.append("shortcuts", {
            "label": "EDO Task",
            "link_to": "EDO Task",
            "type": "DocType"
        })
        workspace.save(ignore_permissions=True)
```

---

#### 1.5 Типы полей (Fieldtypes) - Полный список

**Текстовые поля:**
| Fieldtype | Описание | Пример |
|-----------|----------|--------|
| `Data` | Короткий текст (до 140 символов) | Название, Email |
| `Small Text` | Текст до 255 символов | Краткое описание |
| `Text` | Многострочный текст | Комментарий |
| `Long Text` | Большой текст | Содержание документа |
| `Text Editor` | WYSIWYG редактор с форматированием | Описание с HTML |
| `Code` | Код с подсветкой синтаксиса | JSON, Python |
| `Password` | Пароль (скрытый) | API ключ |
| `Read Only` | Только для чтения | Вычисляемое поле |

**Числовые поля:**
| Fieldtype | Описание | Пример |
|-----------|----------|--------|
| `Int` | Целое число | Количество |
| `Float` | Дробное число | Процент |
| `Currency` | Денежная сумма | Цена |
| `Percent` | Процент (0-100) | Скидка |
| `Rating` | Рейтинг (звёзды) | Оценка |

**Дата и время:**
| Fieldtype | Описание | Пример |
|-----------|----------|--------|
| `Date` | Дата | Дата рождения |
| `Datetime` | Дата и время | Дата создания |
| `Time` | Время | Время начала |
| `Duration` | Длительность | Время работы |

**Связи:**
| Fieldtype | Описание | Пример |
|-----------|----------|--------|
| `Link` | Связь с другим DocType | `options: "User"` |
| `Dynamic Link` | Динамическая связь | Связь с разными DocTypes |
| `Table` | Child Table (вложенная таблица) | `options: "Item Row"` |
| `Table MultiSelect` | Множественный выбор через таблицу | Теги |

**Выбор:**
| Fieldtype | Описание | Пример |
|-----------|----------|--------|
| `Select` | Выпадающий список | `options: "A\nB\nC"` |
| `Check` | Чекбокс (0 или 1) | Активен |
| `Autocomplete` | Автодополнение | Город |

**Файлы:**
| Fieldtype | Описание | Пример |
|-----------|----------|--------|
| `Attach` | Файл любого типа | Документ |
| `Attach Image` | Изображение | Фото |
| `Signature` | Подпись (рисование) | Подпись клиента |

**Разметка формы:**
| Fieldtype | Описание |
|-----------|----------|
| `Section Break` | Новая секция (горизонтальная линия) |
| `Column Break` | Новая колонка (разделить на 2 столбца) |
| `Tab Break` | Новая вкладка |
| `HTML` | Произвольный HTML |
| `Heading` | Заголовок |

**Специальные:**
| Fieldtype | Описание |
|-----------|----------|
| `Color` | Выбор цвета |
| `Geolocation` | Координаты на карте |
| `Barcode` | Штрих-код |
| `JSON` | JSON данные |

---

#### 1.6 Создание Child Table (Вложенная таблица)

Child Table - это DocType для хранения строк внутри родительского документа.

**Пример: EDO Task Item (подзадачи)**

**Шаг 1: Создать Child DocType**

`edo/edo/doctype/edo_task_item/edo_task_item.json`:
```json
{
    "doctype": "DocType",
    "name": "EDO Task Item",
    "module": "EDO",
    "istable": 1,
    "editable_grid": 1,

    "fields": [
        {
            "fieldname": "item_name",
            "fieldtype": "Data",
            "label": "Подзадача",
            "reqd": 1,
            "in_list_view": 1
        },
        {
            "fieldname": "completed",
            "fieldtype": "Check",
            "label": "Выполнено",
            "in_list_view": 1
        },
        {
            "fieldname": "notes",
            "fieldtype": "Small Text",
            "label": "Заметки"
        }
    ],

    "permissions": []
}
```

**Важно для Child Table:**
- `"istable": 1` - обязательно!
- `"permissions": []` - права наследуются от родителя
- `"in_list_view": 1` - показывать в таблице

**Шаг 2: Добавить в родительский DocType**

В `edo_task.json` добавьте поле:
```json
{
    "fieldname": "items",
    "fieldtype": "Table",
    "label": "Подзадачи",
    "options": "EDO Task Item"
}
```

---

#### 1.7 Роли и Разрешения (Permissions) - Подробно

**Создание роли**

**Способ 1: Через UI**
```
Desk → Search "Role" → New Role
→ Name: "EDO Manager"
→ Save
```

**Способ 2: Через fixture**

`edo/fixtures/role.json`:
```json
[
    {
        "doctype": "Role",
        "name": "EDO Admin",
        "desk_access": 1,
        "is_custom": 1
    },
    {
        "doctype": "Role",
        "name": "EDO Manager",
        "desk_access": 1,
        "is_custom": 1
    },
    {
        "doctype": "Role",
        "name": "EDO User",
        "desk_access": 1,
        "is_custom": 1
    },
    {
        "doctype": "Role",
        "name": "EDO Viewer",
        "desk_access": 1,
        "is_custom": 1
    }
]
```

Добавить в `hooks.py`:
```python
fixtures = [
    {"dt": "Role", "filters": [["name", "like", "EDO%"]]}
]
```

**Типы разрешений**

| Право | Описание |
|-------|----------|
| `read` | Просмотр документов |
| `write` | Редактирование существующих |
| `create` | Создание новых |
| `delete` | Удаление |
| `submit` | Submit (для Submittable DocTypes) |
| `cancel` | Cancel (отмена submitted) |
| `amend` | Amend (изменение submitted) |
| `report` | Просмотр отчётов |
| `export` | Экспорт данных |
| `import` | Импорт данных |
| `print` | Печать |
| `email` | Отправка по email |
| `share` | Поделиться с другими |

**Настройка прав в DocType JSON**

```json
{
    "permissions": [
        {
            "role": "EDO Admin",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1,
            "submit": 1,
            "cancel": 1,
            "report": 1,
            "export": 1,
            "import": 1,
            "print": 1,
            "email": 1,
            "share": 1,
            "permlevel": 0
        },
        {
            "role": "EDO Manager",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 0,
            "report": 1,
            "export": 1,
            "permlevel": 0
        },
        {
            "role": "EDO User",
            "read": 1,
            "write": 1,
            "create": 1,
            "permlevel": 0
        },
        {
            "role": "EDO Viewer",
            "read": 1,
            "permlevel": 0
        }
    ]
}
```

**Уровни доступа (Permission Levels)**

`permlevel` позволяет скрыть некоторые поля от определённых ролей:

```json
{
    "fields": [
        {
            "fieldname": "title",
            "fieldtype": "Data",
            "permlevel": 0
        },
        {
            "fieldname": "secret_notes",
            "fieldtype": "Text",
            "permlevel": 1
        }
    ],
    "permissions": [
        {
            "role": "EDO Admin",
            "read": 1,
            "write": 1,
            "permlevel": 0
        },
        {
            "role": "EDO Admin",
            "read": 1,
            "write": 1,
            "permlevel": 1
        },
        {
            "role": "EDO User",
            "read": 1,
            "write": 1,
            "permlevel": 0
        }
    ]
}
```
В этом примере `secret_notes` видит только EDO Admin.

**Программная настройка прав**

```python
import frappe

def setup_permissions():
    """Настроить права для DocType"""

    doctype = frappe.get_doc("DocType", "EDO Task")

    # Удалить существующие права
    doctype.permissions = []

    # Добавить новые
    doctype.append("permissions", {
        "role": "EDO Admin",
        "read": 1,
        "write": 1,
        "create": 1,
        "delete": 1
    })

    doctype.append("permissions", {
        "role": "EDO User",
        "read": 1,
        "write": 1,
        "create": 1
    })

    doctype.save(ignore_permissions=True)
    frappe.db.commit()
```

**User Permission (Ограничение по записям)**

User Permission позволяет ограничить видимость конкретных записей:

```python
# Пользователь видит только документы своего отдела
frappe.get_doc({
    "doctype": "User Permission",
    "user": "user@example.com",
    "allow": "Department",
    "for_value": "IT Department",
    "apply_to_all_doctypes": 1
}).insert()

# Теперь user@example.com видит только записи где Department = "IT Department"
```

**Проверка прав в коде**

```python
# Проверить роль
if "EDO Admin" in frappe.get_roles(frappe.session.user):
    # Админские действия
    pass

# Проверить право на документ
doc = frappe.get_doc("EDO Task", "TASK-001")
if doc.has_permission("write"):
    doc.status = "Завершено"
    doc.save()
else:
    frappe.throw("Нет прав на редактирование", frappe.PermissionError)

# Получить документы с учётом прав
tasks = frappe.get_all(
    "EDO Task",
    filters={"status": "Новый"},
    # Frappe автоматически применяет права пользователя
)
```

**Назначение роли пользователю**

```python
# Через код
user = frappe.get_doc("User", "user@example.com")
user.append("roles", {"role": "EDO Manager"})
user.save()

# Или напрямую
frappe.get_doc({
    "doctype": "Has Role",
    "parent": "user@example.com",
    "parenttype": "User",
    "parentfield": "roles",
    "role": "EDO Manager"
}).insert()
```

---

#### 1.8 Автонумерация (Naming)

**Форматы:**
```json
// Простой счётчик
"autoname": "format:TASK-{####}"
// TASK-0001, TASK-0002, ...

// С годом
"autoname": "format:TASK-{YYYY}-{####}"
// TASK-2026-0001

// С месяцем
"autoname": "format:TASK-{YYYY}{MM}-{####}"
// TASK-202601-0001

// По полю
"autoname": "field:title"
// Значение поля title становится name

// Naming Series (выбор пользователем)
"autoname": "naming_series:"
// + добавить поле naming_series с options

// Хеш (случайный)
"autoname": "hash"
// a1b2c3d4e5

// Prompt (пользователь вводит сам)
"autoname": "prompt"
```

**Кастомный autoname в Python:**
```python
class EDOTask(Document):
    def autoname(self):
        """Кастомная логика именования"""
        from frappe.model.naming import make_autoname

        # Формат: TASK-{отдел}-{год}-{номер}
        dept = self.department[:3].upper() if self.department else "GEN"
        year = frappe.utils.nowdate()[:4]
        self.name = make_autoname(f"TASK-{dept}-{year}-.####")
```

---

### 2. Работа с документами

#### Получение документа

```python
# Получить документ по имени
doc = frappe.get_doc("EDO Document", "EDO-0001")

# Получить список документов
docs = frappe.get_all("EDO Document", filters={"status": "Новый"})

# Получить с полями
docs = frappe.get_all(
    "EDO Document",
    fields=["name", "title", "status"],
    filters={"status": "Новый"},
    limit=10,
    order_by="creation desc"
)

# Получить одно значение
title = frappe.db.get_value("EDO Document", "EDO-0001", "title")

# Получить несколько значений
data = frappe.db.get_value(
    "EDO Document",
    "EDO-0001",
    ["title", "status", "executor"],
    as_dict=True
)
```

#### Создание документа

```python
# Способ 1: Через словарь
doc = frappe.get_doc({
    "doctype": "EDO Document",
    "title": "Новый документ",
    "correspondent": "CORR-001",
    "status": "Новый"
})
doc.insert()  # Сохранить в БД

# Способ 2: Пошагово
doc = frappe.get_doc("EDO Document")
doc.title = "Новый документ"
doc.correspondent = "CORR-001"
doc.insert()

# С Child Table
doc = frappe.get_doc({
    "doctype": "EDO Document",
    "title": "Документ",
    "co_executors": [
        {
            "user": "user1@example.com"
        },
        {
            "user": "user2@example.com"
        }
    ]
})
doc.insert()
```

#### Обновление документа

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")
doc.title = "Обновлённый заголовок"
doc.status = "В работе"
doc.save()  # Обновить существующий

# Игнорировать проверку прав (для системных операций)
doc.save(ignore_permissions=True)
```

#### Удаление документа

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")
doc.delete()  # Мягкое удаление (is_deleted=1)

# Или напрямую
frappe.delete_doc("EDO Document", "EDO-0001")
```

#### Преобразование в словарь

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")
data = doc.as_dict()  # Все поля в виде словаря

# С включением связанных данных
data = doc.as_dict(include_children=True)  # Включая Child Tables
```

---

### 3. API методы (@frappe.whitelist)

**Декоратор `@frappe.whitelist()`** делает функцию доступной через HTTP API.

#### Базовый пример

```python
@frappe.whitelist()
def get_my_data():
    """Простой API метод"""
    return {"message": "Hello World"}

# Вызов:
# GET /api/method/edo.edo.doctype.my_doctype.my_doctype.get_my_data
```

#### С параметрами

```python
@frappe.whitelist()
def get_document(name):
    """Получить документ по имени"""
    if not name:
        frappe.throw("Name is required", frappe.ValidationError)
    
    doc = frappe.get_doc("EDO Document", name)
    return doc.as_dict()

# Вызов:
# GET /api/method/edo.edo.doctype.edo_document.edo_document.get_document?name=EDO-0001
```

#### POST запросы

```python
@frappe.whitelist()
def create_document(**kwargs):
    """Создать документ (POST)"""
    # kwargs содержит все переданные параметры
    
    doc = frappe.get_doc({
        "doctype": "EDO Document",
        "title": kwargs.get("title"),
        "correspondent": kwargs.get("correspondent")
    })
    doc.insert()
    
    return {"name": doc.name, "message": "Document created"}

# Вызов:
# POST /api/method/edo.edo.doctype.edo_document.edo_document.create_document
# Body: {"title": "Новый", "correspondent": "CORR-001"}
```

#### JSON параметры

```python
@frappe.whitelist()
def apply_stamps(document_name, stamps):
    """Применить штампы (stamps - JSON строка)"""
    import json
    
    # Если пришла строка, парсим
    if isinstance(stamps, str):
        stamps = json.loads(stamps)
    
    # Теперь stamps - это список словарей
    for stamp in stamps:
        print(stamp["stamp_name"])
        print(stamp["page_number"])
```

#### Проверка авторизации

```python
@frappe.whitelist()
def secure_method():
    """Безопасный метод с проверкой пользователя"""
    user = frappe.session.user
    
    if not user or user == "Guest":
        frappe.throw("Not authorized", frappe.PermissionError)
    
    # Теперь user содержит имя текущего пользователя
    return {"user": user}
```

#### Проверка ролей

```python
@frappe.whitelist()
def admin_only_method():
    """Только для администраторов"""
    user = frappe.session.user
    
    if not user or user == "Guest":
        frappe.throw("Not authorized", frappe.PermissionError)
    
    user_roles = frappe.get_roles(user)
    
    if "EDO Admin" not in user_roles:
        frappe.throw("Admin access required", frappe.PermissionError)
    
    return {"message": "Admin access granted"}
```

---

### 4. Работа с файлами

#### Загрузка файла

```python
# Создать файл из содержимого
file_doc = frappe.get_doc({
    "doctype": "File",
    "file_name": "document.pdf",
    "content": pdf_bytes,  # bytes
    "attached_to_doctype": "EDO Document",
    "attached_to_name": "EDO-0001",
    "is_private": 0  # 0 = публичный, 1 = приватный
})
file_doc.save()

# Получить URL файла
file_url = file_doc.file_url  # "/files/document.pdf"
```

#### Публичные vs Приватные файлы

**Публичные файлы (`is_private: 0`):**
- Доступны по прямой ссылке: `http://site.com/files/document.pdf`
- Можно использовать в `<img>`, `<iframe>`, `<a href>`
- Хранятся в `sites/site_name/public/files/`

**Приватные файлы (`is_private: 1`):**
- Требуют аутентификации
- Доступны через API: `/api/method/frappe.core.doctype.file.file.download_file?file_url=...`
- Хранятся в `sites/site_name/private/files/`

#### Получение пути к файлу

```python
from frappe.core.doctype.file.utils import find_file_by_url

# Найти файл по URL
file_url = "/files/document.pdf"
file = find_file_by_url(file_url)

if file:
    # Получить абсолютный путь
    file_path = file.get_full_path()
    
    # Прочитать файл
    with open(file_path, 'rb') as f:
        content = f.read()
```

#### Сделать файл публичным

```python
from frappe.core.doctype.file.utils import find_file_by_url

file_url = "/private/files/document.pdf"
file = find_file_by_url(file_url)

if file and file.is_private:
    file.is_private = 0
    file.save(ignore_permissions=True)
    # Теперь файл доступен по /files/document.pdf
```

#### Получить полный URL файла

```python
file_url = "/files/document.pdf"

# Получить полный URL с доменом
full_url = frappe.utils.get_url(file_url, full_address=True)
# http://localhost:8000/files/document.pdf
```

#### Пример из проекта: Обработка main_document

```python
@frappe.whitelist()
def get_document(name):
    doc = frappe.get_doc("EDO Document", name)
    result = doc.as_dict()
    
    if doc.main_document:
        main_doc_url = doc.main_document
        
        # Если уже полный URL, оставляем как есть
        if main_doc_url.startswith("http://") or main_doc_url.startswith("https://"):
            result["main_document"] = main_doc_url
        else:
            # Нормализуем URL
            if not main_doc_url.startswith("/"):
                main_doc_url = "/" + main_doc_url
            
            # Делаем файл публичным если он приватный
            try:
                from frappe.core.doctype.file.utils import find_file_by_url
                file = find_file_by_url(main_doc_url)
                
                if file and file.is_private:
                    file.is_private = 0
                    file.save(ignore_permissions=True)
            except:
                pass
            
            # Получаем полный URL
            full_url = frappe.utils.get_url(main_doc_url, full_address=True)
            result["main_document"] = full_url
    
    return result
```

---

### 5. Права доступа (Permissions)

#### Проверка прав на документ

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")

# Проверить право чтения
if not doc.has_permission("read"):
    frappe.throw("No permission to read", frappe.PermissionError)

# Проверить право записи
if not doc.has_permission("write"):
    frappe.throw("No permission to write", frappe.PermissionError)
```

#### Получение ролей пользователя

```python
user = frappe.session.user
user_roles = frappe.get_roles(user)

# Проверить наличие роли
if "EDO Director" in user_roles:
    # Логика для директора
    pass
```

#### Фильтрация по правам в запросах

```python
# Получить только документы, к которым есть доступ
docs = frappe.get_all(
    "EDO Document",
    filters={"status": "Новый"},
    # Frappe автоматически применяет permissions
)

# Для более сложной фильтрации используйте apply_permissions
from frappe.permissions import apply_permissions
filters = apply_permissions("EDO Document", {"status": "Новый"})
docs = frappe.get_all("EDO Document", filters=filters)
```

#### Настройка прав в DocType

В `my_doctype.json`:
```json
{
  "permissions": [
    {
      "role": "EDO Admin",
      "read": 1,
      "write": 1,
      "delete": 1,
      "create": 1,
      "submit": 1,
      "cancel": 1
    },
    {
      "role": "EDO User",
      "read": 1,
      "export": 1,
      "print": 1
    }
  ]
}
```

#### Программная настройка прав

```python
# В utils/setup_permissions.py
def setup_permissions():
    doctype = frappe.get_doc("DocType", "EDO Document")
    
    # Добавить новое право
    doctype.append("permissions", {
        "role": "EDO Manager",
        "read": 1,
        "write": 1,
        "create": 1
    })
    
    doctype.save(ignore_permissions=True)
```

#### Website Permissions (для портала)

```python
# В hooks.py
has_website_permission = {
    "EDO Document": "edo.edo.doctype.edo_document.edo_document.has_website_permission"
}

# В edo_document.py
def has_website_permission(doc, ptype, user, verbose=False):
    """Проверка прав для доступа через портал"""
    if not user or user == "Guest":
        return False
    
    # Проверяем наличие EDO роли
    edo_roles = ["EDO User", "EDO Admin", "EDO Director"]
    user_roles = frappe.get_roles(user)
    
    return any(role in user_roles for role in edo_roles)
```

---

### 6. Обработка ошибок

#### Типы исключений Frappe

```python
# Валидационная ошибка (400)
frappe.throw("Invalid data", frappe.ValidationError)

# Ошибка прав доступа (403)
frappe.throw("No permission", frappe.PermissionError)

# Не найдено (404)
frappe.throw("Document not found", frappe.NotFound)

# Общая ошибка (500)
frappe.throw("Internal error", frappe.UnknownError)
```

#### Логирование ошибок

```python
import traceback

try:
    # Код, который может упасть
    doc = frappe.get_doc("EDO Document", "EDO-0001")
    doc.delete()
except Exception as e:
    # Записать в Error Log
    frappe.log_error(
        f"Failed to delete document: {str(e)}\n{traceback.format_exc()}",
        "delete_document_error"
    )
    # Показать пользователю
    frappe.throw(f"Failed to delete: {str(e)}", frappe.ValidationError)
```

#### Просмотр Error Log

```python
# В консоли Frappe
bench --site your-site.local console

>>> import frappe
>>> frappe.init(site="your-site.local")
>>> frappe.connect()
>>> 
>>> # Получить последние ошибки
>>> errors = frappe.get_all(
...     "Error Log",
...     fields=["name", "error", "creation"],
...     order_by="creation desc",
...     limit=10
... )
>>> for err in errors:
...     print(f"{err.creation}: {err.error[:100]}")
```

---

### 7. Работа с Child Tables

#### Добавление записей в Child Table

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")

# Добавить соисполнителя
doc.append("co_executors", {
    "user": "user@example.com"
})

# Добавить несколько
doc.append("co_executors", {
    "user": "user1@example.com"
})
doc.append("co_executors", {
    "user": "user2@example.com"
})

doc.save()
```

#### Получение Child Table записей

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")

# Итерация по Child Table
for co_exec in doc.co_executors:
    print(co_exec.user)

# Получить как список словарей
co_executors = [row.as_dict() for row in doc.co_executors]
```

#### Удаление из Child Table

```python
doc = frappe.get_doc("EDO Document", "EDO-0001")

# Удалить все записи
doc.co_executors = []

# Или удалить конкретную
for i, co_exec in enumerate(doc.co_executors):
    if co_exec.user == "user@example.com":
        doc.co_executors.pop(i)
        break

doc.save()
```

---

### 8. Сложные кейсы

#### Обработка PDF (пример из проекта)

```python
@frappe.whitelist()
def apply_stamps_to_pdf(document_name, stamps):
    """Применить штампы к PDF документу"""
    import io
    import json
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from PIL import Image
    
    # 1. Проверка прав
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.throw("Not authorized", frappe.PermissionError)
    
    # 2. Парсинг параметров
    if isinstance(stamps, str):
        stamps = json.loads(stamps)
    
    # 3. Получение документа
    doc = frappe.get_doc("EDO Document", document_name)
    
    # 4. Получение пути к файлу
    from frappe.core.doctype.file.utils import find_file_by_url
    file = find_file_by_url(doc.main_document)
    pdf_path = file.get_full_path()
    
    # 5. Чтение PDF
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    
    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
    pdf_writer = PdfWriter()
    
    # 6. Обработка каждой страницы
    for page_idx, page in enumerate(pdf_reader.pages):
        # Применить штампы к странице
        # ... (логика наложения штампов)
        pdf_writer.add_page(page)
    
    # 7. Сохранение результата
    output = io.BytesIO()
    pdf_writer.write(output)
    output_bytes = output.getvalue()
    
    # 8. Создание нового файла
    new_file = frappe.get_doc({
        "doctype": "File",
        "file_name": f"stamped_{doc.name}.pdf",
        "content": output_bytes,
        "attached_to_doctype": "EDO Document",
        "attached_to_name": document_name,
        "is_private": 0
    })
    new_file.save(ignore_permissions=True)
    
    # 9. Обновление документа
    doc.main_document = new_file.file_url
    doc.save(ignore_permissions=True)
    
    return {
        "success": True,
        "new_file_url": new_file.file_url
    }
```

#### Работа с датами

```python
from frappe.utils import now, today, add_days, add_months

# Текущая дата/время
current_datetime = now()  # "2026-01-28 12:00:00"
current_date = today()    # "2026-01-28"

# Добавить дни
future_date = add_days(today(), 7)

# Добавить месяцы
future_date = add_months(today(), 1)

# Форматирование
from frappe.utils import formatdate, format_datetime
formatted = formatdate(today())  # "28.01.2026"
```

#### Работа с пользователями

```python
# Получить информацию о пользователе
user_info = frappe.db.get_value(
    "User",
    "user@example.com",
    ["full_name", "user_image", "email"],
    as_dict=True
)

# Получить всех пользователей с ролью
users = frappe.get_all(
    "Has Role",
    filters={"role": "EDO Director", "parenttype": "User"},
    pluck="parent"
)
```

#### Кеширование

```python
from frappe.cache import cache

# Сохранить в кеш
cache().set_value("my_key", {"data": "value"}, expires_in_sec=3600)

# Получить из кеша
cached_data = cache().get_value("my_key")

# Удалить из кеша
cache().delete_value("my_key")
```

---

### 9. Роутинг и веб-страницы

#### Создание веб-страницы

**1. Создать файл `www/my_page.py`:**
```python
import frappe

def get_context(context):
    context.title = "Моя страница"
    context.data = frappe.get_all("EDO Document", limit=10)
    return context
```

**2. Создать шаблон `www/my_page.html`:**
```html
{% extends "templates/web.html" %}

{% block page_content %}
<h1>{{ title }}</h1>
<ul>
{% for doc in data %}
    <li>{{ doc.name }} - {{ doc.title }}</li>
{% endfor %}
</ul>
{% endblock %}
```

**3. Доступ:** `http://site.com/my_page`

#### Роутинг для SPA (Single Page Application)

**В `hooks.py`:**
```python
# Правила роутинга
website_route_rules = [
    {
        "from_route": "/documents/<path:app_path>",
        "to_route": "edo_documents"
    }
]

# Перехват роутов
before_route = ["edo.utils.routing.before_route"]
```

**В `utils/routing.py`:**
```python
def before_route():
    """Перехватывает все /documents/* роуты"""
    path = frappe.local.request.path
    
    if path.startswith('/documents'):
        frappe.local.response.type = 'page'
        frappe.local.response.page = 'edo_documents'
        return True
    
    return False
```

#### Website Generators (автогенерация страниц)

**В `hooks.py`:**
```python
website_generators = ["EDO Document"]
```

**В `edo_document.py`:**
```python
from frappe.website.website_generator import WebsiteGenerator

class EDODocument(WebsiteGenerator):
    def get_context(self, context):
        """Контекст для веб-страницы документа"""
        context.no_cache = 1
        return context
```

**Автоматически создаётся страница:** `http://site.com/edo-document/EDO-0001`

---

### 10. Hooks (Точки интеграции)

Hooks - это способ подключить свой код в различные точки Frappe.

**В `hooks.py`:**

```python
# После установки приложения
after_install = "edo.utils.setup_permissions.setup_admin_permissions"

# Перед каждым запросом
before_request = ["edo.utils.before_request"]

# После каждого запроса
after_request = ["edo.utils.after_request"]

# Перехват роутов
before_route = ["edo.utils.routing.before_route"]

# Домашняя страница по ролям
role_home_page = {
    "EDO User": "edo_documents",
    "EDO Director": "edo_documents"
}

# Начальные данные (fixtures)
fixtures = [
    "edo/fixtures/edo_priority.json",
    "edo/fixtures/edo_document_type.json"
]

# Генерация веб-страниц
website_generators = ["EDO Document"]

# Проверка прав для портала
has_website_permission = {
    "EDO Document": "edo.edo.doctype.edo_document.edo_document.has_website_permission"
}
```

---

### 11. Миграции и обновление структуры

#### Изменение DocType

1. **Изменить `my_doctype.json`** (добавить/изменить поля)
2. **Запустить миграцию:**
   ```bash
   bench --site your-site.local migrate
   ```
3. Frappe автоматически обновит структуру БД

#### Создание патча

**В `patches.txt`:**
```
execute:edo.patches.v1_0.update_something
```

**Создать `patches/v1_0/update_something.py`:**
```python
import frappe

def execute():
    """Обновить все документы"""
    docs = frappe.get_all("EDO Document")
    
    for doc_name in docs:
        doc = frappe.get_doc("EDO Document", doc_name)
        # Изменения
        doc.new_field = "value"
        doc.save(ignore_permissions=True)
```

---

### 12. Отладка и решение проблем

#### Консоль Frappe

```bash
bench --site your-site.local console
```

```python
>>> import frappe
>>> frappe.init(site="your-site.local")
>>> frappe.connect()
>>> 
>>> # Теперь можно выполнять код
>>> doc = frappe.get_doc("EDO Document", "EDO-0001")
>>> print(doc.title)
```

#### Логирование

```python
# Обычное логирование
frappe.log_error("Something went wrong", "error_type")

# С деталями
import traceback
try:
    # код
except Exception as e:
    frappe.log_error(
        f"Error: {str(e)}\n{traceback.format_exc()}",
        "error_type"
    )
```

#### Просмотр логов

```bash
# Логи сервера
tail -f logs/web.log

# Логи воркера
tail -f logs/worker.log

# Error Log в БД
bench --site your-site.local console
>>> errors = frappe.get_all("Error Log", limit=10)
```

#### Проверка прав

```python
# Проверить права пользователя на документ
doc = frappe.get_doc("EDO Document", "EDO-0001")
print(doc.has_permission("read"))
print(doc.has_permission("write"))

# Проверить роли
user_roles = frappe.get_roles(frappe.session.user)
print(user_roles)
```

#### Проверка файлов

```python
# Найти файл
from frappe.core.doctype.file.utils import find_file_by_url
file = find_file_by_url("/files/document.pdf")

if file:
    print(f"File exists: {file.name}")
    print(f"Path: {file.get_full_path()}")
    print(f"Is private: {file.is_private}")
else:
    print("File not found")
```

---

### 13. Best Practices

#### 1. Всегда проверяйте права доступа

```python
@frappe.whitelist()
def my_method():
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.throw("Not authorized", frappe.PermissionError)
    
    # Дальнейшая логика
```

#### 2. Используйте правильные типы исключений

```python
# Валидация данных
if not name:
    frappe.throw("Name is required", frappe.ValidationError)

# Права доступа
if not doc.has_permission("read"):
    frappe.throw("No permission", frappe.PermissionError)

# Не найдено
if not doc:
    frappe.throw("Document not found", frappe.NotFound)
```

#### 3. Логируйте ошибки

```python
try:
    # Код
except Exception as e:
    frappe.log_error(
        f"Error: {str(e)}\n{traceback.format_exc()}",
        "method_name"
    )
    frappe.throw("User-friendly message", frappe.ValidationError)
```

#### 4. Используйте `frappe.get_all()` для списков

```python
# ✅ Хорошо - быстро
docs = frappe.get_all("EDO Document", fields=["name", "title"])

# ❌ Плохо - медленно
docs = []
for name in frappe.get_all("EDO Document", pluck="name"):
    doc = frappe.get_doc("EDO Document", name)
    docs.append(doc)
```

#### 5. Используйте `pluck` для одного поля

```python
# ✅ Хорошо
names = frappe.get_all("EDO Document", pluck="name")

# ❌ Плохо
docs = frappe.get_all("EDO Document", fields=["name"])
names = [doc.name for doc in docs]
```

#### 6. Делайте файлы публичными для iframe

```python
# Если файл нужен для iframe, делайте его публичным
file.is_private = 0
file.save(ignore_permissions=True)
```

#### 7. Используйте `ignore_permissions=True` только для системных операций

```python
# ✅ Хорошо - системная операция
file.is_private = 0
file.save(ignore_permissions=True)

# ❌ Плохо - пользовательская операция
doc.title = "New title"
doc.save(ignore_permissions=True)  # НЕ ДЕЛАТЬ ТАК!
```

#### 8. Нормализуйте URL файлов

```python
file_url = doc.main_document
if not file_url.startswith("/"):
    file_url = "/" + file_url
```

#### 9. Используйте `as_dict=True` для получения словарей

```python
# ✅ Хорошо
data = frappe.db.get_value(
    "EDO Document",
    "EDO-0001",
    ["title", "status"],
    as_dict=True
)
# data = {"title": "...", "status": "..."}

# ❌ Плохо
title, status = frappe.db.get_value(
    "EDO Document",
    "EDO-0001",
    ["title", "status"]
)
```

---

### 14. Полезные команды

```bash
# Перезапустить сервер
bench restart

# Миграция БД
bench --site your-site.local migrate

# Консоль Frappe
bench --site your-site.local console

# Очистить кеш
bench --site your-site.local clear-cache

# Создать новый DocType
bench --site your-site.local make-doctype "My DocType"

# Установить приложение
bench --site your-site.local install-app edo

# Обновить приложение
bench --site your-site.local migrate
```

---

### 15. Частые проблемы и решения

#### Проблема: "Document not found"

```python
# ✅ Проверяйте существование
if not frappe.db.exists("EDO Document", name):
    frappe.throw("Document not found", frappe.NotFound)

doc = frappe.get_doc("EDO Document", name)
```

#### Проблема: Файл не доступен в iframe

```python
# ✅ Делайте файл публичным
file = find_file_by_url(file_url)
if file and file.is_private:
    file.is_private = 0
    file.save(ignore_permissions=True)
```

#### Проблема: "Permission denied"

```python
# ✅ Проверяйте права перед операцией
if not doc.has_permission("write"):
    frappe.throw("No permission", frappe.PermissionError)

doc.save()  # Без ignore_permissions
```

#### Проблема: Медленные запросы

```python
# ✅ Используйте frappe.get_all с fields
docs = frappe.get_all(
    "EDO Document",
    fields=["name", "title"],  # Только нужные поля
    limit=100
)

# ❌ Не загружайте все документы
docs = frappe.get_all("EDO Document")  # Загрузит ВСЕ поля
```

---

### 16. Print Formats (Форматы печати)

Frappe позволяет создавать красивые печатные формы для документов.

#### Типы Print Formats

| Тип | Описание |
|-----|----------|
| **Standard** | Автогенерируемый формат из полей DocType |
| **Custom HTML** | Кастомный HTML/Jinja шаблон |
| **JS** | JavaScript шаблон (устаревший) |

#### Создание Print Format через UI

```
Desk → Search "Print Format" → New Print Format
→ DocType: EDO Document
→ Print Format Type: Jinja
→ HTML: (ваш шаблон)
→ Save
```

#### Пример Jinja шаблона

```html
<style>
    .print-format {
        font-family: Arial, sans-serif;
        padding: 20px;
    }
    .header {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    .title {
        font-size: 24px;
        font-weight: bold;
    }
    .field-label {
        font-weight: bold;
        color: #666;
    }
    .field-value {
        margin-bottom: 10px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }
    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    th {
        background-color: #f5f5f5;
    }
    .signature-block {
        margin-top: 50px;
        display: flex;
        justify-content: space-between;
    }
    .signature-line {
        width: 200px;
        border-top: 1px solid #000;
        text-align: center;
        padding-top: 5px;
    }
</style>

<div class="print-format">
    <div class="header">
        <div class="title">{{ doc.title or "Документ" }}</div>
        <div>№ {{ doc.name }} от {{ frappe.format_date(doc.creation) }}</div>
    </div>

    <div class="field-value">
        <span class="field-label">Корреспондент:</span>
        {{ doc.correspondent_name or doc.correspondent }}
    </div>

    <div class="field-value">
        <span class="field-label">Тип документа:</span>
        {{ doc.document_type_name or doc.document_type }}
    </div>

    <div class="field-value">
        <span class="field-label">Статус:</span>
        {{ doc.status }}
    </div>

    <div class="field-value">
        <span class="field-label">Приоритет:</span>
        {{ doc.priority_name or doc.priority }}
    </div>

    {% if doc.brief_content %}
    <div class="field-value">
        <span class="field-label">Краткое содержание:</span>
        <p>{{ doc.brief_content }}</p>
    </div>
    {% endif %}

    {% if doc.co_executors %}
    <h3>Соисполнители</h3>
    <table>
        <tr>
            <th>#</th>
            <th>Пользователь</th>
        </tr>
        {% for row in doc.co_executors %}
        <tr>
            <td>{{ loop.index }}</td>
            <td>{{ row.user }}</td>
        </tr>
        {% endfor %}
    </table>
    {% endif %}

    {% if doc.resolution_text %}
    <div class="field-value">
        <span class="field-label">Резолюция:</span>
        <p>{{ doc.resolution_text }}</p>
    </div>
    {% endif %}

    <div class="signature-block">
        <div>
            <div class="signature-line">Исполнитель</div>
        </div>
        <div>
            <div class="signature-line">Директор</div>
        </div>
    </div>
</div>
```

#### Доступные переменные в шаблоне

```python
doc              # Текущий документ
frappe           # Модуль frappe
nowdate          # Текущая дата
frappe.format_date(date)      # Форматировать дату
frappe.format_datetime(dt)    # Форматировать дату и время
frappe.format_value(value, df) # Форматировать значение по типу поля
frappe.utils.fmt_money(amount) # Форматировать деньги
```

#### Программное получение PDF

```python
import frappe
from frappe.utils.pdf import get_pdf

@frappe.whitelist()
def get_document_pdf(docname):
    """Получить PDF документа"""
    doc = frappe.get_doc("EDO Document", docname)

    # HTML из Print Format
    html = frappe.get_print(
        "EDO Document",
        docname,
        print_format="EDO Document Print",  # Имя Print Format
        as_pdf=False
    )

    # Конвертировать в PDF
    pdf = get_pdf(html)

    return pdf  # bytes

@frappe.whitelist()
def download_pdf(docname):
    """Скачать PDF"""
    pdf = get_document_pdf(docname)

    frappe.local.response.filename = f"{docname}.pdf"
    frappe.local.response.filecontent = pdf
    frappe.local.response.type = "pdf"
```

#### Letter Head (Бланк)

```python
# Создать Letter Head через Desk → Letter Head
# Затем использовать:

html = frappe.get_print(
    "EDO Document",
    docname,
    print_format="EDO Document Print",
    letterhead="Company Letterhead"  # Имя Letter Head
)
```

---

### 17. Reports (Отчёты)

Frappe поддерживает несколько типов отчётов.

#### Типы отчётов

| Тип | Описание | Сложность |
|-----|----------|-----------|
| **Report Builder** | Визуальный конструктор в UI | Простой |
| **Query Report** | SQL запрос | Средний |
| **Script Report** | Python + JavaScript | Сложный |

#### Query Report

**Создание:** Desk → Search "Report" → New Report

```sql
-- Report Type: Query Report
-- DocType: EDO Document

SELECT
    name as `ID:Link/EDO Document:150`,
    title as `Название:Data:200`,
    status as `Статус:Data:100`,
    correspondent as `Корреспондент:Link/EDO Correspondent:150`,
    executor as `Исполнитель:Link/User:150`,
    creation as `Создан:Date:100`
FROM
    `tabEDO Document`
WHERE
    status = %(status)s
    AND creation >= %(from_date)s
ORDER BY
    creation DESC
```

**Фильтры (Filters JSON):**
```json
[
    {
        "fieldname": "status",
        "label": "Статус",
        "fieldtype": "Select",
        "options": "Новый\nНа рассмотрении\nНа исполнении\nВыполнено",
        "default": "Новый"
    },
    {
        "fieldname": "from_date",
        "label": "С даты",
        "fieldtype": "Date",
        "default": "Today"
    }
]
```

#### Script Report

**Структура файлов:**
```
edo/edo/report/edo_documents_report/
├── edo_documents_report.json    # Метаданные
├── edo_documents_report.py      # Python логика
└── edo_documents_report.js      # JavaScript (фильтры)
```

**edo_documents_report.json:**
```json
{
    "doctype": "Report",
    "name": "EDO Documents Report",
    "module": "EDO",
    "ref_doctype": "EDO Document",
    "report_type": "Script Report",
    "is_standard": "Yes"
}
```

**edo_documents_report.py:**
```python
import frappe
from frappe import _

def execute(filters=None):
    """Главная функция отчёта"""
    columns = get_columns()
    data = get_data(filters)
    chart = get_chart(data)
    summary = get_summary(data)

    return columns, data, None, chart, summary

def get_columns():
    """Определить колонки"""
    return [
        {
            "fieldname": "name",
            "label": _("ID"),
            "fieldtype": "Link",
            "options": "EDO Document",
            "width": 150
        },
        {
            "fieldname": "title",
            "label": _("Название"),
            "fieldtype": "Data",
            "width": 200
        },
        {
            "fieldname": "status",
            "label": _("Статус"),
            "fieldtype": "Data",
            "width": 100
        },
        {
            "fieldname": "correspondent_name",
            "label": _("Корреспондент"),
            "fieldtype": "Data",
            "width": 150
        },
        {
            "fieldname": "executor_name",
            "label": _("Исполнитель"),
            "fieldtype": "Data",
            "width": 150
        },
        {
            "fieldname": "creation",
            "label": _("Создан"),
            "fieldtype": "Date",
            "width": 100
        }
    ]

def get_data(filters):
    """Получить данные"""
    conditions = []
    values = {}

    if filters.get("status"):
        conditions.append("d.status = %(status)s")
        values["status"] = filters.get("status")

    if filters.get("from_date"):
        conditions.append("d.creation >= %(from_date)s")
        values["from_date"] = filters.get("from_date")

    if filters.get("to_date"):
        conditions.append("d.creation <= %(to_date)s")
        values["to_date"] = filters.get("to_date")

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    data = frappe.db.sql(f"""
        SELECT
            d.name,
            d.title,
            d.status,
            c.correspondent_name,
            u.full_name as executor_name,
            d.creation
        FROM `tabEDO Document` d
        LEFT JOIN `tabEDO Correspondent` c ON d.correspondent = c.name
        LEFT JOIN `tabUser` u ON d.executor = u.name
        WHERE {where_clause}
        ORDER BY d.creation DESC
    """, values, as_dict=True)

    return data

def get_chart(data):
    """График для отчёта"""
    # Подсчёт по статусам
    status_count = {}
    for row in data:
        status = row.get("status", "Unknown")
        status_count[status] = status_count.get(status, 0) + 1

    return {
        "data": {
            "labels": list(status_count.keys()),
            "datasets": [
                {
                    "name": "Документы",
                    "values": list(status_count.values())
                }
            ]
        },
        "type": "bar",  # bar, line, pie, donut
        "colors": ["#7cd6fd", "#5e64ff", "#743ee2"]
    }

def get_summary(data):
    """Сводка внизу отчёта"""
    total = len(data)
    completed = len([d for d in data if d.get("status") == "Выполнено"])

    return [
        {
            "value": total,
            "label": _("Всего документов"),
            "datatype": "Int"
        },
        {
            "value": completed,
            "label": _("Выполнено"),
            "datatype": "Int",
            "indicator": "green"
        },
        {
            "value": total - completed,
            "label": _("В работе"),
            "datatype": "Int",
            "indicator": "orange"
        }
    ]
```

**edo_documents_report.js:**
```javascript
frappe.query_reports["EDO Documents Report"] = {
    filters: [
        {
            fieldname: "status",
            label: __("Статус"),
            fieldtype: "Select",
            options: ["", "Новый", "На рассмотрении", "На исполнении", "Выполнено"],
            default: ""
        },
        {
            fieldname: "from_date",
            label: __("С даты"),
            fieldtype: "Date",
            default: frappe.datetime.add_months(frappe.datetime.get_today(), -1)
        },
        {
            fieldname: "to_date",
            label: __("По дату"),
            fieldtype: "Date",
            default: frappe.datetime.get_today()
        }
    ],

    // Форматирование ячеек
    formatter: function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);

        if (column.fieldname === "status") {
            if (data.status === "Выполнено") {
                value = `<span style="color: green; font-weight: bold">${value}</span>`;
            } else if (data.status === "На исполнении") {
                value = `<span style="color: orange">${value}</span>`;
            }
        }

        return value;
    },

    // Действия при клике
    onload: function(report) {
        report.page.add_inner_button(__("Экспорт в Excel"), function() {
            // Кастомный экспорт
        });
    }
};
```

---

### 18. Jinja Templates (Шаблонизация)

Frappe использует Jinja2 для шаблонов.

#### Основные конструкции

```jinja2
{# Комментарий #}

{# Переменные #}
{{ doc.name }}
{{ doc.title | upper }}
{{ doc.amount | fmt_money }}

{# Условия #}
{% if doc.status == "Выполнено" %}
    <span class="green">Выполнено</span>
{% elif doc.status == "В работе" %}
    <span class="orange">В работе</span>
{% else %}
    <span class="gray">{{ doc.status }}</span>
{% endif %}

{# Циклы #}
{% for item in doc.items %}
    <tr>
        <td>{{ loop.index }}</td>
        <td>{{ item.item_name }}</td>
        <td>{{ item.qty }}</td>
    </tr>
{% endfor %}

{# Цикл с else (если список пустой) #}
{% for item in doc.items %}
    <div>{{ item.name }}</div>
{% else %}
    <div>Нет элементов</div>
{% endfor %}

{# Фильтры #}
{{ doc.title | truncate(50) }}
{{ doc.creation | date }}
{{ doc.amount | round(2) }}
{{ items | length }}
{{ text | e }}  {# escape HTML #}
{{ text | safe }}  {# не экранировать HTML #}

{# Включение других шаблонов #}
{% include "templates/includes/header.html" %}

{# Наследование #}
{% extends "templates/base.html" %}
{% block content %}
    Содержимое
{% endblock %}
```

#### Рендеринг шаблона в Python

```python
import frappe

# Простой рендер
html = frappe.render_template(
    "edo/templates/my_template.html",
    {"doc": doc, "user": frappe.session.user}
)

# Рендер строки
template_string = """
<h1>{{ title }}</h1>
<p>Статус: {{ status }}</p>
"""
html = frappe.render_template(
    template_string,
    {"title": "Тест", "status": "Новый"},
    is_path=False
)

# Email шаблон
frappe.sendmail(
    recipients=["user@example.com"],
    subject="Уведомление",
    message=frappe.render_template(
        "edo/templates/email/notification.html",
        {"doc": doc}
    )
)
```

#### Кастомные фильтры

```python
# В hooks.py
jinja = {
    "methods": [
        "edo.utils.jinja.format_status",
        "edo.utils.jinja.get_user_name"
    ]
}

# В utils/jinja.py
def format_status(status):
    """Форматировать статус с цветом"""
    colors = {
        "Новый": "blue",
        "В работе": "orange",
        "Выполнено": "green"
    }
    color = colors.get(status, "gray")
    return f'<span style="color: {color}">{status}</span>'

def get_user_name(user_id):
    """Получить полное имя пользователя"""
    return frappe.db.get_value("User", user_id, "full_name") or user_id
```

```jinja2
{# Использование в шаблоне #}
{{ format_status(doc.status) | safe }}
{{ get_user_name(doc.executor) }}
```

---

### 19. frappe.utils - Полезные утилиты

#### Работа с датами

```python
from frappe.utils import (
    now, today, nowdate, nowtime,
    add_days, add_months, add_years,
    date_diff, time_diff, time_diff_in_hours,
    get_datetime, getdate, get_time,
    formatdate, format_datetime, format_time,
    get_first_day, get_last_day,
    get_weekday, get_year_start, get_year_ending
)

# Текущая дата/время
now()          # "2026-01-28 14:30:00"
today()        # "2026-01-28"
nowdate()      # "2026-01-28"
nowtime()      # "14:30:00"

# Арифметика с датами
add_days(today(), 7)       # Через 7 дней
add_days(today(), -7)      # 7 дней назад
add_months(today(), 1)     # Через месяц
add_years(today(), 1)      # Через год

# Разница между датами
date_diff("2026-02-01", "2026-01-01")  # 31 (дней)
time_diff_in_hours("18:00:00", "09:00:00")  # 9.0

# Конвертация
get_datetime("2026-01-28 14:30:00")  # datetime object
getdate("2026-01-28")  # date object
get_time("14:30:00")   # time object

# Форматирование
formatdate("2026-01-28")  # "28.01.2026" (по настройкам)
format_datetime("2026-01-28 14:30:00")  # "28.01.2026 14:30"

# Первый/последний день месяца
get_first_day("2026-01-15")  # "2026-01-01"
get_last_day("2026-01-15")   # "2026-01-31"

# День недели (0 = понедельник)
get_weekday("2026-01-28")  # 1 (вторник)
```

#### Работа со строками

```python
from frappe.utils import (
    cstr, cint, flt,
    strip_html, strip_html_tags,
    escape_html, scrub,
    encode, quoted
)

# Преобразование типов (безопасное)
cstr(None)      # ""
cstr(123)       # "123"
cint("123")     # 123
cint(None)      # 0
cint("abc")     # 0
flt("123.45")   # 123.45
flt(None)       # 0.0

# Работа с HTML
strip_html("<p>Hello <b>World</b></p>")  # "Hello World"
escape_html("<script>alert('xss')</script>")  # "&lt;script&gt;..."

# Преобразование в snake_case
scrub("My DocType Name")  # "my_doctype_name"

# URL encoding
quoted("Hello World")  # "Hello%20World"
```

#### Форматирование

```python
from frappe.utils import (
    fmt_money, money_in_words,
    format_value, flt
)

# Деньги
fmt_money(1234567.89)  # "1,234,567.89"
fmt_money(1234567.89, currency="RUB")  # "₽ 1,234,567.89"

# Число прописью
money_in_words(1234.56, currency="RUB")  # "Одна тысяча двести..."

# Форматирование по типу поля
format_value(123456, {"fieldtype": "Currency"})  # "123,456.00"
format_value("2026-01-28", {"fieldtype": "Date"})  # "28.01.2026"
```

#### Прочие утилиты

```python
from frappe.utils import (
    get_url, get_site_url,
    random_string, get_fullname,
    validate_email_address,
    unique, comma_and
)

# URL
get_url()  # "http://localhost:8000"
get_url("/api/method/test")  # "http://localhost:8000/api/method/test"

# Случайная строка
random_string(10)  # "aB3xK9mNp2"

# Имя пользователя
get_fullname("user@example.com")  # "Иван Иванов"

# Валидация email
validate_email_address("test@example.com")  # True
validate_email_address("invalid")  # False

# Работа со списками
unique([1, 2, 2, 3, 3])  # [1, 2, 3]
comma_and(["A", "B", "C"])  # "A, B and C"
```

---

### 20. Фильтры в frappe.get_all

#### Все операторы фильтрации

```python
# Равенство
frappe.get_all("EDO Document", filters={"status": "Новый"})

# Не равно
frappe.get_all("EDO Document", filters={"status": ["!=", "Выполнено"]})

# Больше / меньше
frappe.get_all("EDO Document", filters={"creation": [">", "2026-01-01"]})
frappe.get_all("EDO Document", filters={"creation": [">=", "2026-01-01"]})
frappe.get_all("EDO Document", filters={"creation": ["<", "2026-01-01"]})
frappe.get_all("EDO Document", filters={"creation": ["<=", "2026-01-01"]})

# LIKE (поиск подстроки)
frappe.get_all("EDO Document", filters={"title": ["like", "%договор%"]})

# NOT LIKE
frappe.get_all("EDO Document", filters={"title": ["not like", "%тест%"]})

# IN (один из списка)
frappe.get_all("EDO Document", filters={
    "status": ["in", ["Новый", "На рассмотрении", "На исполнении"]]
})

# NOT IN
frappe.get_all("EDO Document", filters={
    "status": ["not in", ["Выполнено", "Отказан"]]
})

# BETWEEN (диапазон)
frappe.get_all("EDO Document", filters={
    "creation": ["between", ["2026-01-01", "2026-01-31"]]
})

# IS NULL / IS NOT NULL
frappe.get_all("EDO Document", filters={"executor": ["is", "set"]})
frappe.get_all("EDO Document", filters={"executor": ["is", "not set"]})

# Регулярные выражения (MySQL REGEXP)
frappe.get_all("EDO Document", filters={
    "title": ["regexp", "^[A-Z]"]
})
```

#### Комбинация фильтров (AND)

```python
# Все условия через AND
frappe.get_all("EDO Document", filters={
    "status": "На исполнении",
    "executor": "user@example.com",
    "creation": [">", "2026-01-01"]
})
```

#### OR фильтры

```python
# Использовать or_filters
frappe.get_all("EDO Document",
    filters={"status": "Новый"},
    or_filters=[
        {"executor": "user1@example.com"},
        {"executor": "user2@example.com"}
    ]
)
# SQL: status = 'Новый' AND (executor = 'user1' OR executor = 'user2')
```

#### Сложные запросы через frappe.db.sql

```python
# Когда фильтров недостаточно - используйте SQL
result = frappe.db.sql("""
    SELECT d.*
    FROM `tabEDO Document` d
    WHERE d.status IN ('Новый', 'На рассмотрении')
      AND (
          d.executor = %(user)s
          OR EXISTS (
              SELECT 1 FROM `tabEDO Co-Executor` ce
              WHERE ce.parent = d.name AND ce.user = %(user)s
          )
      )
    ORDER BY d.creation DESC
""", {"user": frappe.session.user}, as_dict=True)
```

---

### 21. Custom Fields (Пользовательские поля)

Добавление полей без изменения исходного DocType.

#### Создание через UI

```
Desk → Search "Custom Field" → New Custom Field
→ DocType: EDO Document
→ Field Label: Мой номер
→ Fieldtype: Data
→ Insert After: title
→ Save
```

#### Программное создание

```python
import frappe

def add_custom_field():
    """Добавить кастомное поле"""

    # Проверить что поля ещё нет
    if frappe.db.exists("Custom Field", "EDO Document-my_custom_field"):
        return

    custom_field = frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "EDO Document",  # DocType
        "fieldname": "my_custom_field",
        "fieldtype": "Data",
        "label": "Моё поле",
        "insert_after": "title",
        "reqd": 0,
        "read_only": 0,
        "hidden": 0,
        "description": "Описание поля"
    })
    custom_field.insert(ignore_permissions=True)

def add_custom_link_field():
    """Добавить Link поле"""

    custom_field = frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "EDO Document",
        "fieldname": "custom_department",
        "fieldtype": "Link",
        "label": "Отдел",
        "options": "Department",  # Связанный DocType
        "insert_after": "executor"
    })
    custom_field.insert(ignore_permissions=True)
```

#### Property Setter (изменение свойств полей)

```python
import frappe

def make_field_mandatory():
    """Сделать поле обязательным"""

    # Проверить существование
    if frappe.db.exists("Property Setter", {
        "doc_type": "EDO Document",
        "field_name": "title",
        "property": "reqd"
    }):
        return

    ps = frappe.get_doc({
        "doctype": "Property Setter",
        "doctype_or_field": "DocField",
        "doc_type": "EDO Document",
        "field_name": "title",
        "property": "reqd",
        "property_type": "Check",
        "value": "1"
    })
    ps.insert(ignore_permissions=True)

def change_field_options():
    """Изменить опции Select поля"""

    ps = frappe.get_doc({
        "doctype": "Property Setter",
        "doctype_or_field": "DocField",
        "doc_type": "EDO Document",
        "field_name": "status",
        "property": "options",
        "property_type": "Text",
        "value": "Новый\nНа согласовании\nСогласовано\nВ работе\nВыполнено\nОтменено"
    })
    ps.insert(ignore_permissions=True)

def hide_field():
    """Скрыть поле"""

    ps = frappe.get_doc({
        "doctype": "Property Setter",
        "doctype_or_field": "DocField",
        "doc_type": "EDO Document",
        "field_name": "secret_field",
        "property": "hidden",
        "property_type": "Check",
        "value": "1"
    })
    ps.insert(ignore_permissions=True)
```

---

### 22. Comments и Activity (Комментарии)

#### Добавление комментария к документу

```python
import frappe

# Добавить комментарий
frappe.get_doc({
    "doctype": "Comment",
    "comment_type": "Comment",
    "reference_doctype": "EDO Document",
    "reference_name": "EDO-0001",
    "content": "Это мой комментарий к документу",
    "comment_email": frappe.session.user
}).insert(ignore_permissions=True)

# Или через метод
from frappe.desk.form.utils import add_comment

add_comment(
    reference_doctype="EDO Document",
    reference_name="EDO-0001",
    content="Комментарий через API",
    comment_email=frappe.session.user
)
```

#### Получение комментариев

```python
comments = frappe.get_all(
    "Comment",
    filters={
        "reference_doctype": "EDO Document",
        "reference_name": "EDO-0001",
        "comment_type": "Comment"
    },
    fields=["content", "comment_email", "creation"],
    order_by="creation desc"
)
```

#### Activity Log (История изменений)

```python
# Получить историю изменений документа
activities = frappe.get_all(
    "Version",
    filters={
        "docname": "EDO-0001",
        "ref_doctype": "EDO Document"
    },
    fields=["data", "owner", "creation"],
    order_by="creation desc"
)

# data содержит JSON с изменениями
import json
for activity in activities:
    changes = json.loads(activity.data)
    print(f"{activity.owner} changed: {changes}")
```

#### API для комментариев (уже реализовано в проекте)

```python
@frappe.whitelist()
def get_comments(doctype, docname):
    """Получить комментарии документа"""
    return frappe.get_all(
        "Comment",
        filters={
            "reference_doctype": doctype,
            "reference_name": docname,
            "comment_type": "Comment"
        },
        fields=["name", "content", "comment_email", "creation"],
        order_by="creation desc"
    )

@frappe.whitelist()
def add_comment(doctype, docname, content):
    """Добавить комментарий"""
    comment = frappe.get_doc({
        "doctype": "Comment",
        "comment_type": "Comment",
        "reference_doctype": doctype,
        "reference_name": docname,
        "content": content,
        "comment_email": frappe.session.user
    })
    comment.insert(ignore_permissions=True)
    return comment.as_dict()
```

---

### 23. Document Links (Связанные документы)

#### Получение связанных документов

```python
import frappe

def get_linked_documents(doctype, docname):
    """Получить все связанные документы"""
    from frappe.desk.form.linked_with import get_linked_docs

    linked = get_linked_docs(doctype, docname)
    # {"User": ["user1", "user2"], "File": ["file1"], ...}

    return linked

# Или через прямой запрос
def get_files_for_document(docname):
    """Получить файлы документа"""
    files = frappe.get_all(
        "File",
        filters={
            "attached_to_doctype": "EDO Document",
            "attached_to_name": docname
        },
        fields=["name", "file_name", "file_url", "file_size"]
    )
    return files
```

#### Dynamic Link

```python
# DocType с Dynamic Link позволяет ссылаться на разные DocTypes

# В JSON DocType:
{
    "fields": [
        {
            "fieldname": "link_doctype",
            "fieldtype": "Link",
            "options": "DocType",
            "label": "Тип документа"
        },
        {
            "fieldname": "link_name",
            "fieldtype": "Dynamic Link",
            "options": "link_doctype",  # Ссылка на поле с DocType
            "label": "Документ"
        }
    ]
}

# Использование
doc = frappe.get_doc({
    "doctype": "My Activity",
    "link_doctype": "EDO Document",
    "link_name": "EDO-0001"
})
doc.insert()

# Можно связать с любым DocType
doc2 = frappe.get_doc({
    "doctype": "My Activity",
    "link_doctype": "User",
    "link_name": "user@example.com"
})
doc2.insert()
```

---

### 24. Caching (Кеширование)

#### Основные методы кеширования

```python
import frappe

# Простое кеширование
frappe.cache().set_value("my_key", {"data": "value"})
data = frappe.cache().get_value("my_key")

# С временем жизни (TTL)
frappe.cache().set_value("my_key", data, expires_in_sec=3600)  # 1 час

# Удаление
frappe.cache().delete_value("my_key")

# Удаление по паттерну
frappe.cache().delete_keys("my_prefix*")
```

#### Декоратор @frappe.cache

```python
import frappe

@frappe.whitelist()
@frappe.cache(ttl=300)  # Кешировать на 5 минут
def get_expensive_data():
    """Дорогостоящая операция"""
    # Эта функция вызовется только раз в 5 минут
    result = frappe.db.sql("""
        SELECT status, COUNT(*) as count
        FROM `tabEDO Document`
        GROUP BY status
    """, as_dict=True)
    return result
```

#### Кеширование документов

```python
# Frappe автоматически кеширует документы
doc = frappe.get_doc("EDO Document", "EDO-0001")  # Первый раз - из БД
doc = frappe.get_doc("EDO Document", "EDO-0001")  # Второй - из кеша

# Принудительно из БД (без кеша)
doc = frappe.get_doc("EDO Document", "EDO-0001", for_update=True)

# Очистить кеш документа
frappe.clear_document_cache("EDO Document", "EDO-0001")
```

#### Redis кеш напрямую

```python
from frappe.utils.background_jobs import get_redis_connection

redis = get_redis_connection()

# SET с TTL
redis.setex("my:key", 3600, "value")  # 1 час

# GET
value = redis.get("my:key")

# Hash
redis.hset("my:hash", "field1", "value1")
redis.hget("my:hash", "field1")

# List
redis.lpush("my:list", "item1")
redis.rpush("my:list", "item2")
items = redis.lrange("my:list", 0, -1)
```

---

### 25. Debugging (Отладка подробнее)

#### Логирование

```python
import frappe

# Простое логирование
frappe.log_error("Error message", "error_title")

# С traceback
import traceback
try:
    # код
except Exception as e:
    frappe.log_error(
        f"Error: {str(e)}\n{traceback.format_exc()}",
        "my_function_error"
    )

# Логирование в консоль (для разработки)
print("Debug:", variable)
frappe.logger().info("Info message")
frappe.logger().debug("Debug message")
frappe.logger().error("Error message")
```

#### Просмотр логов

```bash
# Логи веб-сервера
tail -f ~/frappe-bench/logs/web.log

# Логи воркера
tail -f ~/frappe-bench/logs/worker.log

# Логи планировщика
tail -f ~/frappe-bench/logs/scheduler.log

# Error Log в БД
bench --site your-site.local console
>>> frappe.get_all("Error Log", limit=10, order_by="creation desc")
```

#### Python Debugger (pdb)

```python
import frappe

def my_function():
    doc = frappe.get_doc("EDO Document", "EDO-0001")

    # Точка останова
    import pdb; pdb.set_trace()
    # или в Python 3.7+:
    breakpoint()

    # Теперь можно исследовать переменные:
    # (Pdb) doc.name
    # (Pdb) doc.status
    # (Pdb) n  # next line
    # (Pdb) c  # continue
    # (Pdb) q  # quit

    return doc
```

#### Профилирование

```python
import frappe
import cProfile
import pstats

def profile_function():
    """Профилирование производительности"""

    profiler = cProfile.Profile()
    profiler.enable()

    # Код для профилирования
    docs = frappe.get_all("EDO Document", limit=1000)

    profiler.disable()

    # Вывод статистики
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(10)  # Топ 10 по времени

# Профилирование SQL запросов
frappe.db.sql("SET profiling = 1")
# ... код
result = frappe.db.sql("SHOW PROFILES")
print(result)
```

#### Отладка фронтенда

```javascript
// В браузере
console.log("Debug:", data);
debugger;  // Точка останова

// Отладка Frappe API вызовов
frappe.call({
    method: "edo.api.my_method",
    args: {param: "value"},
    callback: function(r) {
        console.log("Response:", r);
    },
    error: function(r) {
        console.error("Error:", r);
    }
});
```

---

### 26. События документов (Document Events)

Frappe позволяет привязать код к различным событиям жизненного цикла документа.

#### В контроллере DocType (`my_doctype.py`)

```python
import frappe
from frappe.model.document import Document

class MyDoctype(Document):

    def validate(self):
        """Вызывается перед сохранением (insert/update)
        Используйте для валидации данных"""
        if not self.title:
            frappe.throw("Title is required")

        # Автозаполнение полей
        if not self.status:
            self.status = "Новый"

    def before_save(self):
        """Вызывается перед записью в БД
        Данные уже провалидированы"""
        self.modified_by = frappe.session.user

    def after_insert(self):
        """Вызывается после создания нового документа
        Документ уже в БД"""
        # Отправить уведомление
        frappe.publish_realtime(
            "new_document",
            {"name": self.name},
            user=self.owner
        )

    def on_update(self):
        """Вызывается после обновления существующего документа"""
        # Очистить кеш
        frappe.cache().delete_value(f"doc_{self.name}")

    def before_submit(self):
        """Вызывается перед Submit (для submittable DocTypes)"""
        if self.status != "Готов":
            frappe.throw("Cannot submit: status must be 'Готов'")

    def on_submit(self):
        """Вызывается после Submit"""
        self.db_set("submitted_by", frappe.session.user)

    def before_cancel(self):
        """Вызывается перед отменой"""
        pass

    def on_cancel(self):
        """Вызывается после отмены"""
        pass

    def on_trash(self):
        """Вызывается при удалении"""
        # Удалить связанные файлы
        frappe.delete_doc("File", {"attached_to_name": self.name})

    def after_delete(self):
        """Вызывается после удаления"""
        pass
```

#### Порядок вызова событий

**При создании (insert):**
1. `validate()`
2. `before_save()`
3. `after_insert()`
4. `on_update()` (да, вызывается и при insert)

**При обновлении (save):**
1. `validate()`
2. `before_save()`
3. `on_update()`

**При Submit:**
1. `validate()`
2. `before_submit()`
3. `on_submit()`

**При Cancel:**
1. `before_cancel()`
2. `on_cancel()`

#### Глобальные события через hooks.py

```python
# В hooks.py
doc_events = {
    "EDO Document": {
        "validate": "edo.utils.events.validate_edo_document",
        "after_insert": "edo.utils.events.after_insert_edo_document",
        "on_update": "edo.utils.events.on_update_edo_document"
    },
    # Для всех DocTypes
    "*": {
        "after_insert": "edo.utils.events.log_creation"
    }
}
```

```python
# В utils/events.py
def validate_edo_document(doc, method):
    """doc - документ, method - название метода"""
    if doc.priority == "Срочный" and not doc.executor:
        frappe.throw("Срочные документы должны иметь исполнителя")

def log_creation(doc, method):
    """Логирование создания любого документа"""
    frappe.log_error(f"Created: {doc.doctype} - {doc.name}", "audit_log")
```

---

### 17. Фоновые задачи (Background Jobs)

Frappe использует Redis Queue (RQ) для выполнения фоновых задач.

#### Запуск задачи в фоне

```python
import frappe
from frappe.utils.background_jobs import enqueue

@frappe.whitelist()
def start_heavy_task(document_name):
    """API метод для запуска фоновой задачи"""

    # Запустить задачу в фоне
    enqueue(
        "edo.utils.tasks.process_document",  # Путь к функции
        queue="default",                      # Очередь: short, default, long
        timeout=300,                          # Таймаут в секундах
        document_name=document_name           # Параметры
    )

    return {"status": "Task queued"}

# В utils/tasks.py
def process_document(document_name):
    """Функция выполняется в фоне"""
    import time

    doc = frappe.get_doc("EDO Document", document_name)

    # Долгая операция
    time.sleep(10)

    doc.status = "Обработано"
    doc.save(ignore_permissions=True)

    # Коммит транзакции (важно для фоновых задач!)
    frappe.db.commit()
```

#### Очереди

- `short` - для быстрых задач (до 5 мин)
- `default` - стандартная очередь
- `long` - для долгих задач (до 30 мин)

#### Отложенный запуск

```python
from frappe.utils.background_jobs import enqueue
from datetime import datetime, timedelta

# Запустить через 1 час
enqueue(
    "edo.utils.tasks.send_reminder",
    queue="default",
    at_front=False,
    enqueue_after_commit=True,  # Запустить после commit транзакции
    job_id="reminder_EDO-0001",  # Уникальный ID (для отмены)
    document_name="EDO-0001"
)
```

#### Проверка статуса задачи

```python
from frappe.utils.background_jobs import get_job

job = get_job("reminder_EDO-0001")
if job:
    print(f"Status: {job.get_status()}")  # queued, started, finished, failed
```

#### Real-time уведомления из фоновой задачи

```python
def process_document(document_name):
    """Фоновая задача с уведомлениями"""

    # Уведомить о начале
    frappe.publish_realtime(
        "task_progress",
        {"status": "started", "document": document_name},
        user=frappe.session.user
    )

    # Обработка...
    for i in range(100):
        # Уведомить о прогрессе
        frappe.publish_realtime(
            "task_progress",
            {"status": "progress", "percent": i},
            user=frappe.session.user
        )

    # Уведомить о завершении
    frappe.publish_realtime(
        "task_progress",
        {"status": "completed", "document": document_name},
        user=frappe.session.user
    )

    frappe.db.commit()
```

---

### 18. Планировщик задач (Scheduler)

Frappe имеет встроенный планировщик для периодических задач.

#### Настройка в hooks.py

```python
# В hooks.py

# Задачи по расписанию
scheduler_events = {
    # Каждую минуту
    "cron": {
        "0 9 * * *": [  # Каждый день в 9:00
            "edo.utils.scheduler.send_daily_report"
        ],
        "*/15 * * * *": [  # Каждые 15 минут
            "edo.utils.scheduler.check_deadlines"
        ]
    },

    # Альтернативный синтаксис
    "all": [  # Каждую минуту
        "edo.utils.scheduler.process_queue"
    ],
    "hourly": [  # Каждый час
        "edo.utils.scheduler.sync_data"
    ],
    "daily": [  # Каждый день в полночь
        "edo.utils.scheduler.cleanup_old_files"
    ],
    "weekly": [  # Каждую неделю
        "edo.utils.scheduler.generate_weekly_report"
    ],
    "monthly": [  # Каждый месяц
        "edo.utils.scheduler.archive_documents"
    ]
}
```

#### Пример функции планировщика

```python
# В utils/scheduler.py
import frappe
from frappe.utils import add_days, today

def check_deadlines():
    """Проверить просроченные документы"""

    overdue_docs = frappe.get_all(
        "EDO Document",
        filters={
            "deadline": ["<", today()],
            "status": ["not in", ["Выполнено", "Отказан"]]
        },
        fields=["name", "title", "executor", "deadline"]
    )

    for doc in overdue_docs:
        # Отправить уведомление исполнителю
        if doc.executor:
            frappe.sendmail(
                recipients=[doc.executor],
                subject=f"Просрочен документ: {doc.title}",
                message=f"Документ {doc.name} просрочен. Дедлайн был: {doc.deadline}"
            )

    frappe.db.commit()

def cleanup_old_files():
    """Удалить старые временные файлы"""

    old_date = add_days(today(), -30)

    old_files = frappe.get_all(
        "File",
        filters={
            "creation": ["<", old_date],
            "attached_to_doctype": None  # Не привязанные файлы
        },
        pluck="name"
    )

    for file_name in old_files:
        frappe.delete_doc("File", file_name, ignore_permissions=True)

    frappe.db.commit()
```

#### Управление планировщиком

```bash
# Запустить планировщик
bench --site your-site.local enable-scheduler

# Остановить
bench --site your-site.local disable-scheduler

# Проверить статус
bench --site your-site.local scheduler status

# Запустить задачу вручную
bench --site your-site.local execute edo.utils.scheduler.check_deadlines
```

---

### 19. Прямые SQL запросы

Иногда ORM недостаточно - можно использовать SQL напрямую.

#### Выполнение SELECT

```python
# Простой запрос
result = frappe.db.sql("""
    SELECT name, title, status
    FROM `tabEDO Document`
    WHERE status = %s
    LIMIT 10
""", ("Новый",), as_dict=True)

# result = [{"name": "EDO-0001", "title": "...", "status": "Новый"}, ...]
```

#### С параметрами

```python
# Безопасная передача параметров (защита от SQL injection)
result = frappe.db.sql("""
    SELECT d.name, d.title, u.full_name as executor_name
    FROM `tabEDO Document` d
    LEFT JOIN `tabUser` u ON d.executor = u.name
    WHERE d.status = %(status)s
      AND d.creation >= %(from_date)s
    ORDER BY d.creation DESC
""", {
    "status": "На исполнении",
    "from_date": "2026-01-01"
}, as_dict=True)
```

#### Агрегация

```python
# Подсчёт по статусам
stats = frappe.db.sql("""
    SELECT status, COUNT(*) as count
    FROM `tabEDO Document`
    GROUP BY status
""", as_dict=True)

# [{"status": "Новый", "count": 15}, {"status": "Выполнено", "count": 42}, ...]
```

#### INSERT, UPDATE, DELETE

```python
# UPDATE
frappe.db.sql("""
    UPDATE `tabEDO Document`
    SET status = %s, modified = NOW()
    WHERE name = %s
""", ("Выполнено", "EDO-0001"))

# INSERT (редко нужен, лучше использовать ORM)
frappe.db.sql("""
    INSERT INTO `tabEDO Document` (name, title, status, owner, creation, modified)
    VALUES (%s, %s, %s, %s, NOW(), NOW())
""", ("EDO-9999", "Test", "Новый", "Administrator"))

# DELETE
frappe.db.sql("""
    DELETE FROM `tabEDO Document`
    WHERE status = %s AND creation < %s
""", ("Отменён", "2025-01-01"))

# ВАЖНО: После изменений нужен commit
frappe.db.commit()
```

#### Полезные методы frappe.db

```python
# Проверить существование
exists = frappe.db.exists("EDO Document", "EDO-0001")

# Получить одно значение
title = frappe.db.get_value("EDO Document", "EDO-0001", "title")

# Получить несколько значений
data = frappe.db.get_value(
    "EDO Document",
    "EDO-0001",
    ["title", "status"],
    as_dict=True
)

# Установить значение (без загрузки документа)
frappe.db.set_value("EDO Document", "EDO-0001", "status", "Выполнено")

# Установить несколько значений
frappe.db.set_value("EDO Document", "EDO-0001", {
    "status": "Выполнено",
    "completed_date": frappe.utils.today()
})

# Подсчёт записей
count = frappe.db.count("EDO Document", {"status": "Новый"})
```

---

### 20. Отправка Email

#### Простая отправка

```python
import frappe

frappe.sendmail(
    recipients=["user@example.com"],
    subject="Новый документ",
    message="<p>Вам назначен новый документ EDO-0001</p>",
    now=True  # Отправить сразу (иначе через очередь)
)
```

#### С вложениями

```python
frappe.sendmail(
    recipients=["user@example.com"],
    subject="Документ с вложением",
    message="Смотрите вложение",
    attachments=[
        {
            "fname": "document.pdf",
            "fcontent": pdf_bytes  # bytes
        }
    ]
)
```

#### Использование шаблона

```python
# Создать Email Template в Frappe
# Затем использовать:

frappe.sendmail(
    recipients=["user@example.com"],
    subject="Уведомление",
    template="edo_notification",  # Имя Email Template
    args={
        "document_name": "EDO-0001",
        "title": "Важный документ",
        "user_name": "Иван Иванов"
    }
)
```

#### Массовая рассылка

```python
from frappe.utils.background_jobs import enqueue

def send_bulk_emails(recipients, subject, message):
    """Отправить письма в фоне"""
    for recipient in recipients:
        frappe.sendmail(
            recipients=[recipient],
            subject=subject,
            message=message
        )
    frappe.db.commit()

# Запуск
enqueue(
    "edo.utils.email.send_bulk_emails",
    queue="long",
    recipients=["user1@example.com", "user2@example.com"],
    subject="Важное уведомление",
    message="Текст письма"
)
```

---

### 21. Уведомления (Notifications)

#### Real-time уведомления

```python
# Отправить уведомление конкретному пользователю
frappe.publish_realtime(
    event="new_document",
    message={"document": "EDO-0001", "title": "Новый документ"},
    user="user@example.com"
)

# Всем пользователям
frappe.publish_realtime(
    event="system_message",
    message={"text": "Система обновлена"},
    user=None  # или не указывать user
)

# Подписка на фронтенде (JavaScript)
# frappe.realtime.on("new_document", (data) => {
#     console.log("New document:", data.document);
# });
```

#### System Notifications (в интерфейсе Frappe)

```python
# Создать уведомление в колокольчике
notification = frappe.get_doc({
    "doctype": "Notification Log",
    "for_user": "user@example.com",
    "type": "Alert",
    "document_type": "EDO Document",
    "document_name": "EDO-0001",
    "subject": "Вам назначен документ",
    "email_content": "Документ EDO-0001 требует вашего внимания"
})
notification.insert(ignore_permissions=True)
```

#### Настройка автоматических уведомлений

```python
# В hooks.py
notification_config = "edo.utils.notifications.get_notification_config"

# В utils/notifications.py
def get_notification_config():
    return {
        "for_doctype": {
            "EDO Document": {
                "filters": [
                    {"status": "На исполнении"}
                ]
            }
        }
    }
```

---

### 22. Workflow (Официальный механизм)

Frappe имеет встроенную систему Workflow для управления состояниями документов.

#### Создание Workflow через UI

1. Перейти в **Setup > Workflow**
2. Создать новый Workflow
3. Указать DocType (например, EDO Document)
4. Настроить состояния и переходы

#### Программное создание Workflow

```python
workflow = frappe.get_doc({
    "doctype": "Workflow",
    "name": "EDO Document Workflow",
    "document_type": "EDO Document",
    "is_active": 1,
    "workflow_state_field": "workflow_state",  # Поле для хранения состояния
    "states": [
        {
            "state": "Новый",
            "doc_status": 0,
            "allow_edit": "EDO Manager"
        },
        {
            "state": "На рассмотрении",
            "doc_status": 0,
            "allow_edit": "EDO Director"
        },
        {
            "state": "На исполнении",
            "doc_status": 0,
            "allow_edit": "EDO Executor"
        },
        {
            "state": "Выполнено",
            "doc_status": 1,  # Submitted
            "allow_edit": "EDO Admin"
        }
    ],
    "transitions": [
        {
            "state": "Новый",
            "action": "Отправить на рассмотрение",
            "next_state": "На рассмотрении",
            "allowed": "EDO Manager",
            "allow_self_approval": 1
        },
        {
            "state": "На рассмотрении",
            "action": "Согласовать",
            "next_state": "На исполнении",
            "allowed": "EDO Director"
        },
        {
            "state": "На рассмотрении",
            "action": "Отклонить",
            "next_state": "Новый",
            "allowed": "EDO Director"
        },
        {
            "state": "На исполнении",
            "action": "Завершить",
            "next_state": "Выполнено",
            "allowed": "EDO Executor"
        }
    ]
})
workflow.insert()
```

#### Применение действия Workflow

```python
from frappe.model.workflow import apply_workflow

doc = frappe.get_doc("EDO Document", "EDO-0001")
apply_workflow(doc, "Согласовать")  # Название действия
doc.save()
```

#### Получение доступных действий

```python
from frappe.model.workflow import get_transitions

doc = frappe.get_doc("EDO Document", "EDO-0001")
transitions = get_transitions(doc)

# [{"action": "Согласовать", "next_state": "На исполнении"}, ...]
```

---

### 23. Server Scripts и Client Scripts

Frappe позволяет создавать скрипты прямо в интерфейсе без редактирования файлов.

#### Server Script (Python в UI)

**Создание:** Setup > Server Script

```python
# Тип: DocType Event
# DocType: EDO Document
# Event: Before Save

if doc.priority == "Срочный" and not doc.deadline:
    frappe.throw("Срочные документы должны иметь дедлайн")
```

```python
# Тип: API
# Название метода: get_custom_data

# Доступ: /api/method/get_custom_data
response = frappe.get_all("EDO Document", limit=5)
frappe.response["data"] = response
```

#### Client Script (JavaScript в UI)

**Создание:** Setup > Client Script

```javascript
// DocType: EDO Document
// Событие: form

frappe.ui.form.on('EDO Document', {
    refresh: function(frm) {
        // При загрузке формы
        if (frm.doc.status === 'Новый') {
            frm.add_custom_button('Отправить', function() {
                // Действие кнопки
            });
        }
    },

    priority: function(frm) {
        // При изменении поля priority
        if (frm.doc.priority === 'Срочный') {
            frm.set_df_property('deadline', 'reqd', 1);
        }
    },

    validate: function(frm) {
        // Валидация на клиенте
        if (!frm.doc.title) {
            frappe.throw("Title is required");
        }
    }
});
```

---

### 24. Data Import/Export

#### Export данных

```python
# Через API
docs = frappe.get_all(
    "EDO Document",
    fields=["name", "title", "status", "creation"],
    filters={"status": "Выполнено"}
)

# Экспорт в CSV
import csv
import io

output = io.StringIO()
writer = csv.DictWriter(output, fieldnames=["name", "title", "status", "creation"])
writer.writeheader()
writer.writerows(docs)
csv_content = output.getvalue()
```

#### Import данных

```python
import frappe
import json

def import_documents(data):
    """Импорт документов из JSON"""
    for item in data:
        if frappe.db.exists("EDO Document", item.get("name")):
            # Обновить существующий
            doc = frappe.get_doc("EDO Document", item["name"])
            doc.update(item)
            doc.save()
        else:
            # Создать новый
            doc = frappe.get_doc({
                "doctype": "EDO Document",
                **item
            })
            doc.insert()

    frappe.db.commit()
```

#### Data Import Tool (встроенный)

```bash
# Через CLI
bench --site your-site.local data-import --file data.csv --doctype "EDO Document"

# Экспорт
bench --site your-site.local data-export --doctype "EDO Document" --file export.csv
```

---

### 25. Virtual DocTypes

Virtual DocTypes не хранят данные в БД - они получают данные из внешних источников.

#### Создание Virtual DocType

```python
# В my_virtual_doctype.py
import frappe
from frappe.model.document import Document

class MyVirtualDoctype(Document):

    @staticmethod
    def get_list(args):
        """Получить список записей"""
        # Получить данные из внешнего API
        import requests
        response = requests.get("https://api.example.com/items")
        items = response.json()

        return [
            {
                "name": item["id"],
                "title": item["name"],
                "status": item["status"]
            }
            for item in items
        ]

    @staticmethod
    def get_count(args):
        """Получить количество записей"""
        return len(MyVirtualDoctype.get_list(args))

    @staticmethod
    def get(name):
        """Получить одну запись"""
        import requests
        response = requests.get(f"https://api.example.com/items/{name}")
        item = response.json()

        return frappe._dict({
            "name": item["id"],
            "title": item["name"],
            "status": item["status"]
        })
```

**В DocType JSON:**
```json
{
    "doctype": "DocType",
    "name": "My Virtual Doctype",
    "module": "EDO",
    "is_virtual": 1,
    "fields": [
        {"fieldname": "title", "fieldtype": "Data", "label": "Title"},
        {"fieldname": "status", "fieldtype": "Select", "label": "Status"}
    ]
}
```

---

### 26. Naming Series (Подробнее)

#### Форматы автонумерации

```json
// В DocType JSON

// Простой формат
"autoname": "format:EDO-{####}"  // EDO-0001, EDO-0002, ...

// С датой
"autoname": "format:EDO-{YYYY}-{####}"  // EDO-2026-0001

// С месяцем
"autoname": "format:EDO-{YYYY}-{MM}-{####}"  // EDO-2026-01-0001

// По полю
"autoname": "field:title"  // Значение поля title становится name

// Naming Series (выбор пользователем)
"autoname": "naming_series:"
// В полях: {"fieldname": "naming_series", "fieldtype": "Select", "options": "EDO-\nINC-\nOUT-"}
```

#### Программная генерация имени

```python
class EDODocument(Document):

    def autoname(self):
        """Кастомная логика именования"""
        from frappe.model.naming import make_autoname

        # Формат: EDO-{год}-{номер}
        year = frappe.utils.nowdate()[:4]
        self.name = make_autoname(f"EDO-{year}-.####")
```

#### Сброс счётчика

```python
# В консоли
from frappe.model.naming import revert_series_if_last

# Откатить последний номер
revert_series_if_last("EDO-", "EDO-0005")

# Установить следующий номер
frappe.db.set_value("Series", "EDO-", "current", 100)
# Следующий будет EDO-0101
```

---

### 27. Транзакции и блокировки

#### Транзакции

```python
import frappe

try:
    # Начало транзакции (автоматически)
    doc1 = frappe.get_doc("EDO Document", "EDO-0001")
    doc1.status = "В работе"
    doc1.save()

    doc2 = frappe.get_doc("EDO Document", "EDO-0002")
    doc2.status = "В работе"
    doc2.save()

    # Если всё OK - commit
    frappe.db.commit()

except Exception as e:
    # При ошибке - rollback
    frappe.db.rollback()
    frappe.throw(f"Transaction failed: {str(e)}")
```

#### Блокировки (Locks)

```python
from frappe.utils.background_jobs import get_redis_connection

def process_with_lock(document_name):
    """Обработка с блокировкой"""
    redis = get_redis_connection()
    lock_key = f"lock:edo_document:{document_name}"

    # Попытка получить блокировку
    if redis.set(lock_key, "1", nx=True, ex=300):  # 5 минут
        try:
            # Выполнить работу
            doc = frappe.get_doc("EDO Document", document_name)
            doc.status = "В обработке"
            doc.save()
            frappe.db.commit()
        finally:
            # Снять блокировку
            redis.delete(lock_key)
    else:
        frappe.throw("Document is being processed by another user")
```

---

### 28. Тестирование

#### Unit тесты

```python
# В tests/test_edo_document.py
import frappe
import unittest

class TestEDODocument(unittest.TestCase):

    def setUp(self):
        """Подготовка перед каждым тестом"""
        self.test_doc = frappe.get_doc({
            "doctype": "EDO Document",
            "title": "Test Document",
            "status": "Новый"
        })
        self.test_doc.insert()

    def tearDown(self):
        """Очистка после каждого теста"""
        if frappe.db.exists("EDO Document", self.test_doc.name):
            frappe.delete_doc("EDO Document", self.test_doc.name)

    def test_create_document(self):
        """Тест создания документа"""
        self.assertIsNotNone(self.test_doc.name)
        self.assertEqual(self.test_doc.status, "Новый")

    def test_update_status(self):
        """Тест обновления статуса"""
        self.test_doc.status = "В работе"
        self.test_doc.save()

        # Перезагрузить из БД
        doc = frappe.get_doc("EDO Document", self.test_doc.name)
        self.assertEqual(doc.status, "В работе")

    def test_validation(self):
        """Тест валидации"""
        with self.assertRaises(frappe.ValidationError):
            doc = frappe.get_doc({
                "doctype": "EDO Document",
                "title": ""  # Пустой title должен вызвать ошибку
            })
            doc.insert()
```

#### Запуск тестов

```bash
# Все тесты приложения
bench --site your-site.local run-tests --app edo

# Конкретный файл
bench --site your-site.local run-tests --module edo.tests.test_edo_document

# Конкретный тест
bench --site your-site.local run-tests --module edo.tests.test_edo_document --test test_create_document
```

---

## 📚 Дополнительные ресурсы

- **Официальная документация:** https://frappeframework.com/docs
- **API Reference:** https://frappeframework.com/docs/user/en/api
- **DocType Guide:** https://frappeframework.com/docs/user/en/doctype
- **GitHub:** https://github.com/frappe/frappe
- **Frappe Forum:** https://discuss.frappe.io
- **Frappe School:** https://frappe.school

---

## 📋 Краткая шпаргалка

### Частые операции

```python
# Получить документ
doc = frappe.get_doc("DocType", "name")

# Получить список
docs = frappe.get_all("DocType", fields=["name", "title"], filters={"status": "Active"})

# Создать документ
doc = frappe.get_doc({"doctype": "DocType", "title": "New"})
doc.insert()

# Обновить
doc.title = "Updated"
doc.save()

# Удалить
doc.delete()

# Проверить существование
exists = frappe.db.exists("DocType", "name")

# Текущий пользователь
user = frappe.session.user

# Роли пользователя
roles = frappe.get_roles(user)

# Отправить email
frappe.sendmail(recipients=["email"], subject="Subject", message="Body")

# Фоновая задача
from frappe.utils.background_jobs import enqueue
enqueue("module.function", queue="default", param=value)

# Логирование ошибок
frappe.log_error("Error message", "error_type")
```

### Полезные команды bench

```bash
bench restart                           # Перезапустить
bench --site site migrate               # Миграция
bench --site site console               # Консоль Python
bench --site site clear-cache           # Очистить кеш
bench --site site install-app app       # Установить приложение
bench --site site enable-scheduler      # Включить планировщик
bench --site site execute module.func   # Выполнить функцию
bench --site site run-tests --app app   # Запустить тесты
```

---

**Последнее обновление:** 2026-01-28

Эта документация основана на реальном опыте разработки проекта EDO и содержит практические примеры из рабочего кода.
