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

	# Check if user has EDO User role
	if "EDO User" in frappe.get_roles(user):
		return True

	return False


@frappe.whitelist()
def get_portal_documents():
	"""Get list of documents for portal user"""
	user = frappe.session.user

	if not user or user == "Guest":
		return []

	# Check if user has EDO User role
	if "EDO User" not in frappe.get_roles(user):
		return []

	documents = frappe.get_all(
		"EDO Document",
		fields=["name", "title", "document_type", "status", "document_date"],
		order_by="creation desc"
	)

	return documents
