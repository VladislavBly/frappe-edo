#!/usr/bin/env python3
"""
Import EDO Resolution fixtures
"""
import frappe
import json
import os

def import_resolutions():
	"""Import resolutions from fixture file"""
	# frappe.init and frappe.connect should be called from bench context
	if not frappe.db:
		raise Exception("Frappe not initialized. Run this via bench console or bench execute")
	
	# Get fixture path
	fixture_path = os.path.join(frappe.get_app_path("edo"), "fixtures", "edo_resolution.json")
	
	if not os.path.exists(fixture_path):
		print(f"Fixture file not found: {fixture_path}")
		return
	
	# Load fixture data
	with open(fixture_path, 'r', encoding='utf-8') as f:
		data = json.load(f)
	
	# Check existing resolutions
	existing = frappe.get_all('EDO Resolution', pluck='name')
	print(f"Existing resolutions: {len(existing)}")
	
	# Import resolutions
	created = 0
	updated = 0
	
	for item in data:
		resolution_name = item.get('name') or item.get('resolution_name')
		
		if frappe.db.exists('EDO Resolution', resolution_name):
			# Update existing
			try:
				doc = frappe.get_doc('EDO Resolution', resolution_name)
				for key, value in item.items():
					if key not in ['doctype', 'name'] and hasattr(doc, key):
						setattr(doc, key, value)
				doc.save(ignore_permissions=True)
				updated += 1
				print(f"  Updated: {resolution_name}")
			except Exception as e:
				print(f"  Error updating {resolution_name}: {e}")
		else:
			# Create new
			try:
				doc = frappe.get_doc(item)
				doc.insert(ignore_permissions=True)
				created += 1
				print(f"  Created: {resolution_name}")
			except Exception as e:
				print(f"  Error creating {resolution_name}: {e}")
	
	frappe.db.commit()
	
	print(f"\n✓ Import completed:")
	print(f"  Created: {created}")
	print(f"  Updated: {updated}")
	
	# List all resolutions
	all_resolutions = frappe.get_all('EDO Resolution', fields=['name', 'resolution_name', 'is_active'], order_by='resolution_name')
	print(f"\nTotal resolutions: {len(all_resolutions)}")
	for r in all_resolutions:
		status = "✓" if r.is_active else "✗"
		print(f"  {status} {r.resolution_name}")

if __name__ == "__main__":
	import_resolutions()
