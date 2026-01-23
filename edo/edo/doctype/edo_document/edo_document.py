# Copyright (c) 2026, Publish and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.website.website_generator import WebsiteGenerator


class EDODocument(WebsiteGenerator):
	def get_context(self, context):
		"""Context for portal view"""
		context.no_cache = 1
		return context


def has_website_permission(doc, ptype, user, verbose=False):
	"""Check if user has permission to access document on portal"""
	if not user or user == "Guest":
		return False

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	user_roles = frappe.get_roles(user)
	
	if any(role in user_roles for role in edo_roles):
		return True

	return False


@frappe.whitelist()
def get_portal_documents(search=None, status=None, document_type=None, priority=None, correspondent=None):
	"""Get list of documents for portal user with search and filters"""
	user = frappe.session.user

	if not user or user == "Guest":
		return []

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		return []

	# Build filters
	filters = []
	
	# Add status filter
	if status:
		filters.append(["status", "=", status])
	
	# Add document type filter
	if document_type:
		filters.append(["document_type", "=", document_type])
	
	# Add priority filter
	if priority:
		filters.append(["priority", "=", priority])
	
	# Add correspondent filter
	if correspondent:
		filters.append(["correspondent", "=", correspondent])

	# Get documents with filters
	if filters:
		documents = frappe.get_all(
			"EDO Document",
			filters=filters,
			fields=["name", "title", "incoming_number", "incoming_date", "outgoing_number", "outgoing_date",
				"document_type", "status", "priority", "correspondent", "brief_content", "creation"],
			order_by="creation desc"
		)
	else:
		# No filters, get all documents
		documents = frappe.get_all(
			"EDO Document",
			fields=["name", "title", "incoming_number", "incoming_date", "outgoing_number", "outgoing_date",
				"document_type", "status", "priority", "correspondent", "brief_content", "creation"],
			order_by="creation desc"
		)

	# Apply search filter after getting documents (for OR search across multiple fields)
	if search and search.strip():
		search_lower = search.lower()
		documents = [
			doc for doc in documents
			if (
				search_lower in (doc.get("name") or "").lower() or
				search_lower in (doc.get("title") or "").lower() or
				search_lower in (doc.get("incoming_number") or "").lower() or
				search_lower in (doc.get("outgoing_number") or "").lower() or
				search_lower in (doc.get("brief_content") or "").lower()
			)
		]

	return documents


@frappe.whitelist()
def get_user_roles():
	"""Get current user roles"""
	user = frappe.session.user
	
	if not user or user == "Guest":
		return []
	
	return frappe.get_roles(user)


@frappe.whitelist()
def get_document(name):
	"""Get a single document by name"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		frappe.throw("No permission to view documents", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)
	
	# Check website permission
	if not has_website_permission(doc, "read", user):
		frappe.throw("No permission to view document", frappe.PermissionError)
	
	# Get document as dict
	result = doc.as_dict()
	
	# Expand Link fields to show names instead of just IDs
	if doc.correspondent:
		result["correspondent_name"] = frappe.db.get_value("EDO Correspondent", doc.correspondent, "correspondent_name") or doc.correspondent
	if doc.document_type:
		result["document_type_name"] = frappe.db.get_value("EDO Document Type", doc.document_type, "document_type_name") or doc.document_type
	if doc.priority:
		result["priority_name"] = frappe.db.get_value("EDO Priority", doc.priority, "priority_name") or doc.priority
	if doc.status:
		result["status_name"] = frappe.db.get_value("EDO Status", doc.status, "status_name") or doc.status
	if doc.classification:
		result["classification_name"] = frappe.db.get_value("EDO Classification", doc.classification, "classification_name") or doc.classification
	if doc.delivery_method:
		result["delivery_method_name"] = frappe.db.get_value("EDO Delivery Method", doc.delivery_method, "delivery_method_name") or doc.delivery_method
	
	return result


@frappe.whitelist()
def get_comments(doctype, docname):
	"""Get comments for a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		frappe.throw("No permission to view document", frappe.PermissionError)
	
	# Check if document exists and user has website permission
	if doctype == "EDO Document":
		doc = frappe.get_doc(doctype, docname)
		if not has_website_permission(doc, "read", user):
			frappe.throw("No permission to view document", frappe.PermissionError)

	comments = frappe.get_all(
		"Comment",
		filters={
			"reference_doctype": doctype,
			"reference_name": docname,
			"comment_type": "Comment"
		},
		fields=["name", "content", "comment_email", "comment_by", "creation", "owner"],
		order_by="creation asc"
	)

	return comments


@frappe.whitelist()
def add_comment(doctype, docname, content):
	"""Add a comment to a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		frappe.throw("No permission to view document", frappe.PermissionError)
	
	# Check if document exists and user has website permission
	if doctype == "EDO Document":
		doc = frappe.get_doc(doctype, docname)
		if not has_website_permission(doc, "read", user):
			frappe.throw("No permission to view document", frappe.PermissionError)

	# Create comment
	comment = frappe.get_doc({
		"doctype": "Comment",
		"comment_type": "Comment",
		"reference_doctype": doctype,
		"reference_name": docname,
		"content": content,
		"comment_email": frappe.session.user,
		"comment_by": frappe.get_value("User", user, "full_name") or user
	})
	comment.insert(ignore_permissions=True)

	return {
		"name": comment.name,
		"content": comment.content,
		"comment_email": comment.comment_email,
		"comment_by": comment.comment_by,
		"creation": comment.creation,
		"owner": comment.owner
	}


@frappe.whitelist()
def delete_comment(comment_name):
	"""Delete a comment (only for EDO Admin)"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Only EDO Admin can delete comments
	if "EDO Admin" not in frappe.get_roles(user):
		frappe.throw("Only administrators can delete comments", frappe.PermissionError)

	# Get comment to check it exists
	comment = frappe.get_doc("Comment", comment_name)
	
	# Delete comment
	frappe.delete_doc("Comment", comment_name, force=1, ignore_permissions=True)
	
	return {"success": True}


@frappe.whitelist()
def create_document(**kwargs):
	"""Create a new EDO Document with permission check"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has permission to create documents
	# Admin and Manager can create documents
	user_roles = frappe.get_roles(user)
	can_create = "EDO Admin" in user_roles or "EDO Manager" in user_roles
	
	if not can_create:
		frappe.throw("You don't have permission to create documents", frappe.PermissionError)

	# Set default status if not provided
	if "status" not in kwargs or not kwargs["status"]:
		# Try to get "Новый" status, or get the first available status
		default_status = frappe.db.get_value("EDO Status", "Новый", "name")
		if not default_status:
			# Get first status if "Новый" doesn't exist
			first_status = frappe.db.get_value("EDO Status", {}, "name", order_by="creation asc")
			if first_status:
				default_status = first_status
			else:
				frappe.throw("No status found. Please create at least one status first.", frappe.ValidationError)
		kwargs["status"] = default_status

	# Always remove 'name' from kwargs - let Frappe generate it automatically
	# This prevents duplicate entry errors and ensures unique names
	# Frappe will auto-generate unique name based on autoname rule: "format:EDO-{####}"
	if "name" in kwargs:
		del kwargs["name"]

	# Create document - kwargs contains all the document fields
	# Frappe will auto-generate the name based on autoname rule
	doc = frappe.get_doc({
		"doctype": "EDO Document",
		**kwargs
	})
	doc.insert(ignore_permissions=True)
	
	return doc.as_dict()
