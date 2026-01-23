#!/usr/bin/env python3
"""
Update EDO Workspace with shortcuts
"""
import frappe

def update_workspace():
	"""Add shortcuts to EDO workspace"""
	frappe.init(site="site1.local")
	frappe.connect()

	# Get workspace
	if not frappe.db.exists("Workspace", "EDO"):
		print("EDO workspace not found!")
		return

	ws = frappe.get_doc("Workspace", "EDO")

	# Clear existing shortcuts
	ws.shortcuts = []

	# Add shortcuts
	shortcuts = [
		{"label": "EDO Document", "link_to": "EDO Document", "type": "DocType", "doc_view": "List"},
		{"label": "EDO Correspondent", "link_to": "EDO Correspondent", "type": "DocType", "doc_view": "List"},
		{"label": "EDO Document Type", "link_to": "EDO Document Type", "type": "DocType", "doc_view": "List"},
		{"label": "EDO Priority", "link_to": "EDO Priority", "type": "DocType", "doc_view": "List"},
		{"label": "EDO Status", "link_to": "EDO Status", "type": "DocType", "doc_view": "List"},
		{"label": "EDO Classification", "link_to": "EDO Classification", "type": "DocType", "doc_view": "List"},
		{"label": "EDO Delivery Method", "link_to": "EDO Delivery Method", "type": "DocType", "doc_view": "List"},
	]

	for shortcut in shortcuts:
		ws.append("shortcuts", shortcut)

	ws.save()
	frappe.db.commit()

	print(f"✓ Added {len(shortcuts)} shortcuts to EDO workspace")
	print("\nShortcuts:")
	for s in ws.shortcuts:
		print(f"  - {s.label} → {s.link_to}")

if __name__ == "__main__":
	update_workspace()
