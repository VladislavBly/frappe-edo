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
def get_portal_documents():
	"""Get list of documents for portal user"""
	user = frappe.session.user

	if not user or user == "Guest":
		return []

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		return []

	documents = frappe.get_all(
		"EDO Document",
		fields=["name", "title", "document_type", "status", "document_date"],
		order_by="creation desc"
	)

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
	
	return doc.as_dict()


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
