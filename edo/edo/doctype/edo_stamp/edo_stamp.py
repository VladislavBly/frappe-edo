# Copyright (c) 2026, Publish and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class EDOStamp(Document):
	pass


@frappe.whitelist()
def get_document_fields():
	"""
	Получить список всех полей EDO Document для использования в настройке штампов.
	Возвращает список полей, которые можно использовать для заполнения штампов.
	"""
	fields = []
	
	# Получаем метаданные EDO Document
	doc_type = frappe.get_meta("EDO Document")
	
	# Маппинг типов полей на человекочитаемые названия
	field_type_labels = {
		"Data": "Текст",
		"Date": "Дата",
		"Datetime": "Дата и время",
		"Int": "Число",
		"Float": "Число с запятой",
		"Link": "Ссылка",
		"Select": "Выбор",
		"Text": "Текст (многострочный)",
		"Small Text": "Текст (малый)",
		"Long Text": "Текст (длинный)",
	}
	
	# Собираем все поля, которые можно использовать
	for field in doc_type.fields:
		# Пропускаем системные поля и служебные
		if field.fieldtype in ["Section Break", "Column Break", "Tab Break", "HTML", "Button", "Attach", "Attach Image", "Table", "Table MultiSelect"]:
			continue
		
		if field.hidden or field.read_only:
			continue
		
		# Формируем название поля
		field_label = field.label or field.fieldname
		field_type_label = field_type_labels.get(field.fieldtype, field.fieldtype)
		
		# Для Link полей добавляем информацию о связанной таблице
		if field.fieldtype == "Link" and field.options:
			field_label = f"{field_label} ({field.options})"
		
		# Добавляем в список
		fields.append({
			"value": field.fieldname,
			"label": f"{field_label} [{field_type_label}]"
		})
	
	# Сортируем по названию
	fields.sort(key=lambda x: x["label"])
	
	# Возвращаем опции в формате для Select поля: "value|label"
	return [f"{f['value']}|{f['label']}" for f in fields]


@frappe.whitelist()
def get_stamp_preview(stamp_name, document_name=None, show_text_area=False):
	"""
	Получить превью штампа с заполненными полями.

	Args:
		stamp_name: Имя штампа
		document_name: Имя документа для заполнения (опционально, если не указан - используется первый доступный)
		show_text_area: показывать ли рамку области текста (для админки)

	Returns:
		URL превью изображения
	"""
	# Конвертируем строку в bool если пришла из JS
	if isinstance(show_text_area, str):
		show_text_area = show_text_area.lower() in ('true', '1', 'yes')
	import os
	import base64
	from PIL import Image
	from io import BytesIO
	
	# Получаем штамп
	stamp_doc = frappe.get_doc("EDO Stamp", stamp_name)
	
	if not stamp_doc.stamp_image:
		frappe.throw("Штамп не имеет изображения")
	
	# Получаем путь к изображению
	from edo.edo.doctype.edo_document.edo_document import get_file_path
	stamp_image_path = get_file_path(stamp_doc.stamp_image)
	
	if not stamp_image_path or not os.path.exists(stamp_image_path):
		frappe.throw("Изображение штампа не найдено")
	
	# Загружаем изображение
	stamp_img = Image.open(stamp_image_path)
	if stamp_img.mode != 'RGBA':
		stamp_img = stamp_img.convert('RGBA')
	
	# Если есть field_mappings, заполняем их
	if hasattr(stamp_doc, 'field_mappings') and stamp_doc.field_mappings and len(stamp_doc.field_mappings) > 0:
		# Получаем документ для заполнения
		doc = None
		if document_name:
			try:
				doc = frappe.get_doc("EDO Document", document_name)
			except:
				pass

		# Определяем, использовать ли плейсхолдеры
		# Если show_text_area=True (админка) и нет конкретного документа - показываем плейсхолдеры
		use_placeholder = show_text_area and not document_name

		# Конвертируем field_mappings в список словарей
		field_mappings_list = []
		for mapping in stamp_doc.field_mappings:
			if hasattr(mapping, 'as_dict'):
				field_mappings_list.append(mapping.as_dict())
			elif isinstance(mapping, dict):
				field_mappings_list.append(mapping)
			else:
				field_mappings_list.append({
					"document_field": getattr(mapping, 'document_field', None),
					"position_x": getattr(mapping, 'position_x', 0),
					"position_y": getattr(mapping, 'position_y', 0),
					"font_size": getattr(mapping, 'font_size', 12),
					"color": getattr(mapping, 'color', '#000000'),
					"max_width": getattr(mapping, 'max_width', 0),
				})

		# Рендерим текст на изображении
		# В админке (show_text_area=True без document_name) показываем плейсхолдеры
		from edo.edo.doctype.edo_document.edo_document import render_text_on_stamp_image
		stamp_img = render_text_on_stamp_image(
			stamp_img, field_mappings_list, doc,
			show_text_area=show_text_area,
			use_placeholder=use_placeholder
		)
	
	# Конвертируем изображение в base64 для возврата
	buffer = BytesIO()
	stamp_img.save(buffer, format='PNG')
	img_data = base64.b64encode(buffer.getvalue()).decode()
	
	return f"data:image/png;base64,{img_data}"
