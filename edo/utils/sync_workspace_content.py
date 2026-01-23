#!/usr/bin/env python3
"""
Sync workspace content with shortcuts
"""
import frappe
import json

def sync_workspace_content():
	"""Sync content field with shortcuts"""

	# Get workspace
	ws = frappe.get_doc("Workspace", "EDO")

	# Build content from shortcuts
	content_blocks = []

	# Header for Documents
	content_blocks.append({
		"id": "edo_header_docs",
		"type": "header",
		"data": {
			"text": '<span style="font-size: 18px;"><b>Документы</b></span>',
			"col": 12
		}
	})

	# Add document shortcuts
	doc_shortcuts = ["EDO Document", "EDO Correspondent", "EDO Document Type"]
	for i, shortcut_name in enumerate(doc_shortcuts, 1):
		content_blocks.append({
			"id": f"edo_shortcut_doc_{i}",
			"type": "shortcut",
			"data": {
				"shortcut_name": shortcut_name,
				"col": 4
			}
		})

	# Header for References
	content_blocks.append({
		"id": "edo_header_refs",
		"type": "header",
		"data": {
			"text": '<span style="font-size: 18px;"><b>Справочники</b></span>',
			"col": 12
		}
	})

	# Add reference shortcuts
	ref_shortcuts = ["EDO Priority", "EDO Status", "EDO Classification", "EDO Delivery Method"]
	for i, shortcut_name in enumerate(ref_shortcuts, 1):
		content_blocks.append({
			"id": f"edo_shortcut_ref_{i}",
			"type": "shortcut",
			"data": {
				"shortcut_name": shortcut_name,
				"col": 4
			}
		})

	# Convert to JSON string
	ws.content = json.dumps(content_blocks, ensure_ascii=False)

	ws.save()
	frappe.db.commit()

	print("✓ Workspace content synced with shortcuts")
	print(f"\nContent blocks: {len(content_blocks)}")
	print(f"Shortcuts in DB: {len(ws.shortcuts)}")

if __name__ == "__main__":
	sync_workspace_content()
