# Copyright (c) 2026, Publish and contributors
# Patches for EDO app (run on bench migrate)

import frappe


def add_user_fiska_priority_custom_field():
	"""Add custom field edo_fiska_priority to User doctype for fiska co_executors priority."""
	if frappe.db.exists("Custom Field", "User-edo_fiska_priority"):
		return
	frappe.get_doc({
		"doctype": "Custom Field",
		"dt": "User",
		"fieldname": "edo_fiska_priority",
		"fieldtype": "Int",
		"label": "Priority (Fiska)",
		"default": "0",
		"in_list_view": 1,
		"module": "EDO",
		"description": "Приоритет в списке на фишке (меньше — выше в списке)",
	}).insert(ignore_permissions=True)
	frappe.db.commit()
