import frappe
import json
import os

def get_context(context):
	context.no_cache = 1
	context.show_sidebar = True

	# Load manifest to get correct file names
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
