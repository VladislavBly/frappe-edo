import frappe

def get_context(context):
	context.no_cache = 1
	frappe.response['http_status_code'] = 404
	return context
