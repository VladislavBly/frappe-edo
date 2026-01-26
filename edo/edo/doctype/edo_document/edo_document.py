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
	
	# Role-based filtering:
	# - Manager and Director see ALL documents
	# - Executors see only documents where they are executor or co-executor
	#   AND only in status "На исполнении" or "Выполнено" (after director approval)
	if "EDO Manager" not in user_roles and "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
		# For executors: filter by executor or co_executors AND status
		# Executors should only see documents that are approved and ready for execution
		# Get all documents where user is executor AND status is "На исполнении" or "Выполнено"
		executor_docs = frappe.get_all(
			"EDO Document",
			filters={
				"executor": user,
				"status": ["in", ["На исполнении", "Выполнено"]]
			},
			pluck="name"
		)
		
		# Get all documents where user is co-executor AND status is "На исполнении" or "Выполнено"
		co_executor_docs = frappe.get_all(
			"EDO Co-Executor",
			filters={"user": user, "parenttype": "EDO Document"},
			pluck="parent"
		)
		
		# Filter co-executor documents by status
		if co_executor_docs:
			co_executor_docs_filtered = frappe.get_all(
				"EDO Document",
				filters={
					"name": ["in", co_executor_docs],
					"status": ["in", ["На исполнении", "Выполнено"]]
				},
				pluck="name"
			)
		else:
			co_executor_docs_filtered = []
		
		# Combine and get unique document names
		user_doc_names = list(set(executor_docs + co_executor_docs_filtered))
		
		if user_doc_names:
			filters.append(["name", "in", user_doc_names])
		else:
			# User has no documents assigned or all documents are not in execution status
			return []
	
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
	documents = frappe.get_all(
		"EDO Document",
		filters=filters,
		fields=["name", "title", "incoming_number", "incoming_date", "outgoing_number", "outgoing_date",
			"document_type", "status", "priority", "correspondent", "brief_content", "creation", 
			"executor", "director_approved", "director_rejected"],
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
	
	# For executors: check if they can view this document
	# Executors can only see documents where they are executor/co-executor
	# AND only in status "На исполнении" or "Выполнено"
	if "EDO Manager" not in user_roles and "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
		# Check if user is executor or co-executor
		is_executor = doc.executor == user
		is_co_executor = False
		
		if doc.co_executors:
			for co_exec in doc.co_executors:
				if co_exec.user == user:
					is_co_executor = True
					break
		
		if not is_executor and not is_co_executor:
			frappe.throw("No permission to view this document", frappe.PermissionError)
		
		# Check if document is in execution status
		if doc.status not in ["На исполнении", "Выполнено"]:
			frappe.throw("Document is not available for execution yet. It must be approved by director first.", frappe.PermissionError)
	
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
		# Status is now a Select field, so status_name equals status
		result["status_name"] = doc.status
	if doc.classification:
		result["classification_name"] = frappe.db.get_value("EDO Classification", doc.classification, "classification_name") or doc.classification
	if doc.delivery_method:
		result["delivery_method_name"] = frappe.db.get_value("EDO Delivery Method", doc.delivery_method, "delivery_method_name") or doc.delivery_method

	# Get executor info with full name and image
	if doc.executor:
		executor_info = frappe.db.get_value("User", doc.executor, ["full_name", "user_image"], as_dict=True)
		if executor_info:
			result["executor_full_name"] = executor_info.get("full_name") or doc.executor
			result["executor_image"] = executor_info.get("user_image")

	# Get co-executors info with full names and images
	if doc.co_executors:
		co_executors_with_info = []
		for co_exec in doc.co_executors:
			co_exec_dict = co_exec.as_dict()
			if co_exec.user:
				user_info = frappe.db.get_value("User", co_exec.user, ["full_name", "user_image"], as_dict=True)
				if user_info:
					co_exec_dict["user_full_name"] = user_info.get("full_name") or co_exec.user
					co_exec_dict["user_image"] = user_info.get("user_image")
			co_executors_with_info.append(co_exec_dict)
		result["co_executors"] = co_executors_with_info

	# Get signatures info with full names and images
	if doc.signatures:
		signatures_with_info = []
		for sig in doc.signatures:
			sig_dict = sig.as_dict()
			if sig.user:
				user_info = frappe.db.get_value("User", sig.user, ["full_name", "user_image"], as_dict=True)
				if user_info:
					sig_dict["user_full_name"] = user_info.get("full_name") or sig.user
					sig_dict["user_image"] = user_info.get("user_image")
			signatures_with_info.append(sig_dict)
		result["signatures"] = signatures_with_info

	# Get director info
	if doc.director_user:
		director_info = frappe.db.get_value("User", doc.director_user, ["full_name", "user_image"], as_dict=True)
		if director_info:
			result["director_full_name"] = director_info.get("full_name") or doc.director_user
			result["director_image"] = director_info.get("user_image")

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
def get_users_list():
	"""Get list of enabled users for executor selection"""
	user = frappe.session.user

	if not user or user == "Guest":
		return []

	users = frappe.get_all(
		"User",
		filters={"enabled": 1},
		fields=["name", "full_name", "email", "user_image"],
		order_by="full_name asc"
	)

	# Filter out system users
	users = [u for u in users if u.name not in ["Guest", "Administrator"]]

	return users


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
		# Status is now a Select field, default to "Новый"
		kwargs["status"] = "Новый"

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


@frappe.whitelist()
def update_document(name, **kwargs):
	"""Update an existing EDO Document with permission check"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has permission to edit documents
	user_roles = frappe.get_roles(user)
	can_edit = "EDO Admin" in user_roles or "EDO Manager" in user_roles or "EDO Director" in user_roles

	if not can_edit:
		frappe.throw("You don't have permission to edit documents", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)

	# Update fields
	for key, value in kwargs.items():
		if key not in ["name", "doctype", "creation", "modified", "owner"]:
			if hasattr(doc, key):
				# Handle child table (co_executors)
				if key == "co_executors" and isinstance(value, list):
					doc.set("co_executors", [])
					for item in value:
						doc.append("co_executors", item)
				# Handle attachments child table
				elif key == "attachments" and isinstance(value, list):
					doc.set("attachments", [])
					for item in value:
						doc.append("attachments", item)
				else:
					setattr(doc, key, value)

	doc.save(ignore_permissions=True)

	return doc.as_dict()


@frappe.whitelist()
def can_edit_document():
	"""Check if current user can edit documents"""
	user = frappe.session.user

	if not user or user == "Guest":
		return False

	user_roles = frappe.get_roles(user)
	return "EDO Admin" in user_roles or "EDO Manager" in user_roles or "EDO Director" in user_roles


@frappe.whitelist()
def director_approve_document(name, comment=None):
	"""Director approves a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user is Director
	user_roles = frappe.get_roles(user)
	if "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
		frappe.throw("Only Director can approve documents", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)
	
	# Check if document is in "Новый" status
	if doc.status != "Новый":
		frappe.throw("Document must be in 'Новый' status to be approved", frappe.ValidationError)

	# Update document
	doc.director_approved = 1
	doc.director_rejected = 0
	doc.director_user = user
	doc.director_decision_date = frappe.utils.now()
	doc.director_comment = comment or ""
	
	# If document has executors, change status to "На исполнении"
	# Otherwise change to "Согласован"
	if doc.executor:
		doc.status = "На исполнении"
	else:
		doc.status = "Согласован"
	
	doc.save(ignore_permissions=True)
	
	return doc.as_dict()


@frappe.whitelist()
def director_reject_document(name, comment=None):
	"""Director rejects a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user is Director
	user_roles = frappe.get_roles(user)
	if "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
		frappe.throw("Only Director can reject documents", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)
	
	# Check if document is in "Новый" status
	if doc.status != "Новый":
		frappe.throw("Document must be in 'Новый' status to be rejected", frappe.ValidationError)

	# Update document
	doc.director_approved = 0
	doc.director_rejected = 1
	doc.director_user = user
	doc.director_decision_date = frappe.utils.now()
	doc.director_comment = comment or ""
	
	# Change status to "Отказан"
	doc.status = "Отказан"
	
	doc.save(ignore_permissions=True)
	
	return doc.as_dict()


@frappe.whitelist()
def executor_sign_document(name, comment=None):
	"""Executor signs a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)
	
	# Check if document is in "На исполнении" status
	if doc.status != "На исполнении":
		frappe.throw("Document must be in 'На исполнении' status to be signed", frappe.ValidationError)

	# Check if user is executor or co-executor
	is_executor = doc.executor == user
	is_co_executor = False
	
	if doc.co_executors:
		for co_exec in doc.co_executors:
			if co_exec.user == user:
				is_co_executor = True
				break
	
	if not is_executor and not is_co_executor:
		frappe.throw("You are not assigned as executor or co-executor for this document", frappe.PermissionError)

	# Check if user already signed
	if doc.signatures:
		for sig in doc.signatures:
			if sig.user == user:
				frappe.throw("You have already signed this document", frappe.ValidationError)

	# Add signature
	doc.append("signatures", {
		"user": user,
		"signed_at": frappe.utils.now(),
		"comment": comment or ""
	})
	
	# Get all executors (main + co-executors)
	all_executors = []
	if doc.executor:
		all_executors.append(doc.executor)
	if doc.co_executors:
		for co_exec in doc.co_executors:
			if co_exec.user:
				all_executors.append(co_exec.user)
	
	# Check if all executors have signed
	signed_users = [sig.user for sig in doc.signatures] if doc.signatures else []
	all_signed = all(user in signed_users for user in all_executors)
	
	# If all signed, change status to "Выполнено"
	if all_signed:
		doc.status = "Выполнено"
	
	doc.save(ignore_permissions=True)
	
	return doc.as_dict()


@frappe.whitelist()
def can_director_approve():
	"""Check if current user can approve/reject documents as director"""
	user = frappe.session.user

	if not user or user == "Guest":
		return False

	user_roles = frappe.get_roles(user)
	can_approve = "EDO Director" in user_roles or "EDO Admin" in user_roles
	
	# Debug logging
	frappe.log_error(f"can_director_approve check: user={user}, roles={user_roles}, can_approve={can_approve}", "EDO Debug")
	
	return can_approve


@frappe.whitelist()
def can_executor_sign(name):
	"""Check if current user can sign document as executor"""
	user = frappe.session.user

	if not user or user == "Guest":
		return False

	try:
		doc = frappe.get_doc("EDO Document", name)
		
		# Check if document is in "На исполнении" status
		if doc.status != "На исполнении":
			return False
		
		# Check if user is executor or co-executor
		is_executor = doc.executor == user
		is_co_executor = False
		
		if doc.co_executors:
			for co_exec in doc.co_executors:
				if co_exec.user == user:
					is_co_executor = True
					break
		
		if not is_executor and not is_co_executor:
			return False
		
		# Check if user already signed
		if doc.signatures:
			for sig in doc.signatures:
				if sig.user == user:
					return False
		
		return True
	except:
		return False
