# Copyright (c) 2026, Publish and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class EDOStampFieldMapping(Document):
	pass


def get_document_field_options():
	"""
	Получить опции для поля document_field.
	Используется Frappe автоматически через get_options hook в JSON.
	Этот метод вызывается Frappe автоматически при загрузке формы.
	"""
	from edo.edo.doctype.edo_stamp.edo_stamp import get_document_fields
	fields = get_document_fields()
	# Возвращаем список строк (Frappe автоматически объединит через \n)
	return fields
