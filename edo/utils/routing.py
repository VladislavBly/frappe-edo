import frappe

def before_route():
	"""
	Intercept all routes starting with /documents and serve edo_documents page
	This allows React Router to handle client-side routing without 404 errors
	"""
	path = frappe.local.request.path
	
	# Check if the path starts with /documents (React Router routes)
	if path.startswith('/documents'):
		# Render edo_documents page instead of redirecting
		# This preserves the URL for React Router
		frappe.local.response.type = 'page'
		frappe.local.response.page = 'edo_documents'
		return True
	
	return False
