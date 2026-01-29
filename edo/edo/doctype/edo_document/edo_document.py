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
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director", "EDO Reception"]
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
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director", "EDO Reception"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		return []

	# Build filters
	filters = []
	
	# Role-based filtering:
	# - Manager and Admin see ALL documents
	# - Directors see only documents assigned to their reception office (where director_user = user)
	# - Reception users see only documents of their reception office
	# - Executors see only documents where they are executor or co-executor
	#   AND only in status "На исполнении" or "Выполнено" (after director approval)
	
	# Filter for Directors - they see documents assigned to them OR documents in their reception office
	director_reception_offices = []
	if "EDO Director" in user_roles and "EDO Admin" not in user_roles:
		# Find reception offices where this user is director
		director_reception_offices = frappe.get_all(
			"EDO Reception Office",
			filters={"director": user},
			pluck="name"
		)
		
		if director_reception_offices:
			# Directors see documents where director_user = user
			# OR documents in their reception office with status "На рассмотрении"
			# We'll handle OR logic after getting documents
			filters.append(["director_user", "=", user])
		else:
			# If director is not assigned to any reception office, only show documents explicitly assigned
			filters.append(["director_user", "=", user])
	
	# Filter for Reception users - they see only documents of their reception office
	if "EDO Reception" in user_roles and "EDO Admin" not in user_roles:
		# Find reception office for this user
		reception_offices = frappe.get_all(
			"EDO Reception Office User",
			filters={"user": user, "parenttype": "EDO Reception Office"},
			pluck="parent"
		)
		
		if reception_offices:
			# User belongs to one or more reception offices
			filters.append(["reception_office", "in", reception_offices])
		else:
			# User doesn't belong to any reception office - return empty
			return []
	
	if "EDO Manager" not in user_roles and "EDO Director" not in user_roles and "EDO Admin" not in user_roles and "EDO Reception" not in user_roles:
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
			"executor", "director_approved", "director_rejected", "reception_office"],
		order_by="creation desc"
	)
	
	# For Directors: also get documents from their reception office with status "На рассмотрении"
	if director_reception_offices:
		# Build additional filters for documents in reception office
		additional_filters = []
		
		# Copy all filters except director_user
		for f in filters:
			if isinstance(f, list) and len(f) > 0 and f[0] != "director_user":
				additional_filters.append(f)
		
		# Add reception office and status filters
		additional_filters.append(["reception_office", "in", director_reception_offices])
		additional_filters.append(["status", "=", "На рассмотрении"])
		
		additional_docs = frappe.get_all(
			"EDO Document",
			filters=additional_filters,
			fields=["name", "title", "incoming_number", "incoming_date", "outgoing_number", "outgoing_date",
				"document_type", "status", "priority", "correspondent", "brief_content", "creation", 
				"executor", "director_approved", "director_rejected", "reception_office"],
			order_by="creation desc"
		)
		
		# Merge documents, avoiding duplicates
		existing_names = {doc["name"] for doc in documents}
		for doc in additional_docs:
			if doc["name"] not in existing_names:
				documents.append(doc)
				existing_names.add(doc["name"])

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
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director", "EDO Reception"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		frappe.throw("No permission to view documents", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)
	
	# For Directors: check if they can view this document
	# Directors can see documents assigned to them OR documents in their reception office that are ready for review
	if "EDO Director" in user_roles and "EDO Admin" not in user_roles:
		# Check if document is assigned to this director
		if doc.director_user and doc.director_user != user:
			frappe.throw("No permission to view this document. It is assigned to a different director.", frappe.PermissionError)
		
		# If director_user is not set yet, check if director is assigned to the reception office
		if not doc.director_user:
			if doc.reception_office:
				reception_office_doc = frappe.get_doc("EDO Reception Office", doc.reception_office)
				if reception_office_doc.director != user:
					frappe.throw("No permission to view this document. It belongs to a different reception office.", frappe.PermissionError)
			else:
				# Document has no reception office - director cannot view it
				frappe.throw("No permission to view this document. It is not assigned to any reception office.", frappe.PermissionError)
	
	# For Reception users: check if they can view this document
	# Reception users can only see documents of their reception office
	if "EDO Reception" in user_roles and "EDO Admin" not in user_roles:
		# Find reception office for this user
		reception_offices = frappe.get_all(
			"EDO Reception Office User",
			filters={"user": user, "parenttype": "EDO Reception Office"},
			pluck="parent"
		)
		
		if not reception_offices:
			frappe.throw("You are not assigned to any reception office", frappe.PermissionError)
		
		# Check if document belongs to user's reception office
		if doc.reception_office not in reception_offices:
			frappe.throw("No permission to view this document. It belongs to a different reception office.", frappe.PermissionError)
	
	# For executors: check if they can view this document
	# Executors can only see documents where they are executor/co-executor
	# AND only in status "На исполнении" or "Выполнено"
	if "EDO Manager" not in user_roles and "EDO Director" not in user_roles and "EDO Admin" not in user_roles and "EDO Reception" not in user_roles:
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
	
	# Get document as dict - All roles should see all fields (permissions already checked)
	result = doc.as_dict()
	
	# Ensure all history-related fields are present (even if null) for frontend history display
	# This ensures the history roadmap works correctly for all roles
	history_fields = [
		"reception_user", "reception_decision_date",
		"director_user", "director_approved", "director_rejected", "director_decision_date",
		"executor", "status"
	]
	for field in history_fields:
		if field not in result:
			result[field] = None
	
	# Expand Link fields to show names instead of just IDs
	if doc.correspondent:
		result["correspondent_name"] = frappe.db.get_value("EDO Correspondent", doc.correspondent, "correspondent_name") or doc.correspondent
	if doc.document_type:
		result["document_type_name"] = frappe.db.get_value("EDO Document Type", doc.document_type, "document_type_name") or doc.document_type
	if doc.priority:
		result["priority_name"] = frappe.db.get_value("EDO Priority", doc.priority, "priority_name") or doc.priority
	# Status is now a Select field, no need for status_name (it was for Link field compatibility)
	# Keeping status_name for backward compatibility but it's the same as status
	if doc.status:
		result["status_name"] = doc.status
	if doc.classification:
		result["classification_name"] = frappe.db.get_value("EDO Classification", doc.classification, "classification_name") or doc.classification
	if doc.delivery_method:
		result["delivery_method_name"] = frappe.db.get_value("EDO Delivery Method", doc.delivery_method, "delivery_method_name") or doc.delivery_method
	
	# Get resolution info if exists
	if doc.resolution:
		resolution_info = frappe.db.get_value("EDO Resolution", doc.resolution, ["resolution_name", "resolution_text"], as_dict=True)
		if resolution_info:
			result["resolution_name"] = resolution_info.get("resolution_name")
			result["resolution_text_from_link"] = resolution_info.get("resolution_text")
	
	# If resolution_text was entered manually (not from link), include it
	if doc.resolution_text and not doc.resolution:
		result["resolution_text"] = doc.resolution_text

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
	
	# Get reception info
	if doc.reception_user:
		reception_info = frappe.db.get_value("User", doc.reception_user, ["full_name", "user_image"], as_dict=True)
		if reception_info:
			result["reception_full_name"] = reception_info.get("full_name") or doc.reception_user
			result["reception_image"] = reception_info.get("user_image")

	# Process main_document URL - make it accessible with full URL
	if doc.main_document:
		main_doc_url = doc.main_document
		
		# If already a full URL, keep it
		if main_doc_url.startswith("http://") or main_doc_url.startswith("https://"):
			result["main_document"] = main_doc_url
		else:
			# Ensure URL starts with /
			if not main_doc_url.startswith("/"):
				main_doc_url = "/" + main_doc_url
			
			# Try to find file and make it public if it's private
			try:
				from frappe.core.doctype.file.utils import find_file_by_url
				file = find_file_by_url(main_doc_url)
				
				if file and file.is_private:
					# Make file public so it can be accessed in iframe
					file.is_private = 0
					file.save(ignore_permissions=True)
					# Update file_url if it changed
					if file.file_url != main_doc_url:
						main_doc_url = file.file_url
						if not main_doc_url.startswith("/"):
							main_doc_url = "/" + main_doc_url
			except:
				pass  # Continue even if file not found
			
			# Get full URL for public files
			full_url = frappe.utils.get_url(main_doc_url, full_address=True)
			result["main_document"] = full_url

	return result


@frappe.whitelist()
def get_comments(doctype, docname):
	"""Get comments for a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has any EDO role
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director", "EDO Reception"]
	user_roles = frappe.get_roles(user)
	
	if not any(role in user_roles for role in edo_roles):
		frappe.throw("No permission to view document", frappe.PermissionError)
	
	# Check if document exists and user has website permission
	if doctype == "EDO Document":
		doc = frappe.get_doc(doctype, docname)
		if not has_website_permission(doc, "read", user):
			frappe.throw("No permission to view document", frappe.PermissionError)

	# Получаем все типы комментариев для истории (Comment, Workflow, Info, Created, Updated и т.д.)
	comments = frappe.get_all(
		"Comment",
		filters={
			"reference_doctype": doctype,
			"reference_name": docname,
			"comment_type": ["in", ["Comment", "Workflow", "Info", "Created", "Updated", "Submitted", "Cancelled"]]
		},
		fields=["name", "content", "comment_email", "comment_by", "creation", "owner", "comment_type"],
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
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director", "EDO Reception"]
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
	
	# Также удаляем другие системные поля, которые не должны передаваться
	system_fields = ["doctype", "creation", "modified", "owner", "modified_by", "creation", "idx"]
	for field in system_fields:
		if field in kwargs:
			del kwargs[field]

	# Create document - kwargs contains all the document fields
	# Frappe will auto-generate the name based on autoname rule
	doc = frappe.get_doc({
		"doctype": "EDO Document",
		**kwargs
	})

	try:
		doc.insert(ignore_permissions=True)
	except frappe.DuplicateEntryError as e:
		# Если возникла ошибка дублирования, перегенерируем имя
		# Это может произойти, если автоименование сгенерировало существующее имя
		old_name = doc.name
		frappe.log_error(
			f"Duplicate entry: {old_name}. Regenerating name.",
			"create_document_duplicate"
		)
		# Перегенерируем имя документа
		doc.name = None
		doc.set_new_name(force=True)
		try:
			doc.insert(ignore_permissions=True)
		except frappe.DuplicateEntryError:
			# Если снова дубликат, добавляем timestamp для уникальности
			import time
			doc.name = f"EDO-{int(time.time())}"
			doc.insert(ignore_permissions=True)

	return doc.as_dict()


# Fields that Director is allowed to change when document is "На рассмотрении"
DIRECTOR_RESOLUTION_UPDATE_FIELDS = frozenset({"resolution", "resolution_text", "executor", "co_executors"})


@frappe.whitelist()
def update_document(name, **kwargs):
	"""Update an existing EDO Document with permission check"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	user_roles = frappe.get_roles(user)
	is_admin = "EDO Admin" in user_roles
	is_director = "EDO Director" in user_roles or is_admin

	doc = frappe.get_doc("EDO Document", name)

	# Director/Admin: when document is "На рассмотрении", allow updating only resolution and executors
	if is_director and doc.status == "На рассмотрении":
		requested_keys = set(k for k in kwargs.keys() if k not in ("name", "doctype", "creation", "modified", "owner"))
		if not requested_keys.issubset(DIRECTOR_RESOLUTION_UPDATE_FIELDS):
			frappe.throw("В статусе «На рассмотрении» директор может менять только резолюцию и исполнителей.", frappe.ValidationError)
		# Admin can update any doc; Director only docs assigned to them
		if not is_admin:
			if not doc.director_user or doc.director_user != user:
				frappe.throw("Вы можете изменять только документы, назначенные вашей приёмной.", frappe.PermissionError)
		for key, value in kwargs.items():
			if key not in ["name", "doctype", "creation", "modified", "owner"] and key in DIRECTOR_RESOLUTION_UPDATE_FIELDS:
				if hasattr(doc, key):
					if key == "resolution" and value:
						if not frappe.db.exists("EDO Resolution", value):
							frappe.throw(f"Резолюция «{value}» не найдена.", frappe.ValidationError)
						doc.resolution = value
						doc.resolution_text = None
					elif key == "resolution_text":
						doc.resolution_text = (value or "").strip() or None
						doc.resolution = None
					elif key == "co_executors" and isinstance(value, list):
						doc.set("co_executors", [])
						for item in value:
							doc.append("co_executors", item if isinstance(item, dict) else {"user": item})
					elif key == "executor":
						setattr(doc, key, value)
		doc.save(ignore_permissions=True)
		return doc.as_dict()

	# Обычное редактирование: только документ в статусе "Новый" и без подписей (кроме админа)
	if not is_admin:
		if doc.status != "Новый" or (doc.signatures and len(doc.signatures) > 0):
			frappe.throw("Документ уже подписан или обработан. Редактирование доступно только администратору.", frappe.PermissionError)
		can_edit = "EDO Manager" in user_roles or "EDO Director" in user_roles
		if not can_edit:
			frappe.throw("You don't have permission to edit documents", frappe.PermissionError)

	protected_fields = [
		"status", "director_approved", "director_rejected", "director_user", "director_decision_date",
		"reception_user", "reception_decision_date"
	]

	for key, value in kwargs.items():
		if key not in ["name", "doctype", "creation", "modified", "owner"]:
			if key in protected_fields:
				frappe.throw(f"Field '{key}' cannot be changed manually. It is set automatically by the workflow.", frappe.ValidationError)
			if hasattr(doc, key):
				if key == "co_executors" and isinstance(value, list):
					doc.set("co_executors", [])
					for item in value:
						doc.append("co_executors", item if isinstance(item, dict) else {"user": item})
				elif key == "attachments" and isinstance(value, list):
					doc.set("attachments", [])
					for item in value:
						doc.append("attachments", item)
				else:
					setattr(doc, key, value)

	doc.save(ignore_permissions=True)
	return doc.as_dict()


@frappe.whitelist()
def can_edit_document(document_name=None):
	"""Check if current user can edit documents"""
	user = frappe.session.user

	if not user or user == "Guest":
		return False

	user_roles = frappe.get_roles(user)
	is_admin = "EDO Admin" in user_roles
	
	# Админ всегда может редактировать
	if is_admin:
		return True
	
	# Если указан конкретный документ, проверяем его статус
	if document_name:
		try:
			doc = frappe.get_doc("EDO Document", document_name)
			# Если документ уже не в статусе "Новый" или есть подписи, редактирование закрыто для всех кроме админа
			if doc.status != "Новый" or (doc.signatures and len(doc.signatures) > 0):
				return False
		except Exception:
			# Если документ не найден, возвращаем базовую проверку
			pass
	
	# Manager и Director могут редактировать только новые документы
	can_edit = "EDO Manager" in user_roles or "EDO Director" in user_roles
	return can_edit


@frappe.whitelist()
def director_approve_document(name, comment=None, signature=None):
	"""
	Director approves a document.
	Текущая схема: согласование через фишку (get_fiska_pdf → E-IMZO подпись PDF → director_approve_with_fiska).
	Старая схема (без фишки) закомментирована ниже.
	"""
	# --- Закомментированная старая схема (просто выставить флаг без подписи фишки) ---
	# user = frappe.session.user
	# if not user or user == "Guest":
	# 	frappe.throw("Not authorized", frappe.PermissionError)
	# user_roles = frappe.get_roles(user)
	# if "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
	# 	frappe.throw("Only Director can approve documents", frappe.PermissionError)
	# doc = frappe.get_doc("EDO Document", name)
	# if doc.status != "На рассмотрении":
	# 	frappe.throw("Document must be in 'На рассмотрении' status to be approved (Reception must process it first)", frappe.ValidationError)
	# if "EDO Admin" not in user_roles:
	# 	if not doc.director_user or doc.director_user != user:
	# 		frappe.throw("You can only approve documents assigned to your reception office", frappe.PermissionError)
	# doc.director_approved = 1
	# doc.director_rejected = 0
	# doc.director_decision_date = frappe.utils.now()
	# doc.director_comment = comment or ""
	# if doc.executor:
	# 	doc.status = "На исполнении"
	# else:
	# 	doc.status = "Согласован"
	# doc.save(ignore_permissions=True)
	# return doc.as_dict()
	frappe.throw(
		"Согласование выполняется через фишку: get_fiska_pdf → подпись E-IMZO → director_approve_with_fiska.",
		frappe.ValidationError,
	)


# --- LexDoc Fiska API (oddo.tcld.uz) — по fiska_integration.md два эндпоинта: ---
# 1) Обращаемся на ПЕРВЫЙ эндпоинт (generate_fiska_pdf) → получаем PDF (без QR).
# 2) Подписываем этот PDF (E-IMZO на клиенте).
# 3) Отправляем подписанный PDF + PKCS7 на ВТОРОЙ эндпоинт (process_signed_fiska).
# 4) Получаем PDF с QR-кодом.
# 5) Вставляем этот PDF во вложения (attachments). main_document не меняем.
# Заголовок во всех запросах: X-Api-Key.
LEXDOC_FISKA_API_KEY = "fk_3662b4f84723836346270d049aa2ae2c53065d391b5abdb7"

def _check_director_can_approve(doc, user):
	"""Проверки прав директора для согласования (общие для director_approve и fiska flow)."""
	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)
	user_roles = frappe.get_roles(user)
	if "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
		frappe.throw("Only Director can approve documents", frappe.PermissionError)
	if doc.status != "На рассмотрении":
		frappe.throw("Document must be in 'На рассмотрении' status to be approved (Reception must process it first)", frappe.ValidationError)
	if "EDO Admin" not in user_roles:
		if not doc.director_user or doc.director_user != user:
			frappe.throw("You can only approve documents assigned to your reception office", frappe.PermissionError)


@frappe.whitelist()
def get_fiska_pdf(name, resolution=None, resolution_text=None):
	"""
	Шаг 1 по MD: первый эндпоинт — получаем PDF фишки (без QR).

	Параметры из REST: name; опционально resolution, resolution_text (передаются на сервис).
	Что шлём на сервис: executor, co_executors, login, head, verification_text, execution_term, issue_date, document_number, resolution, resolution_text.

	Ответ: { "success": True, "pdf_base64": "...", "document_number": "...", "issue_date": "..." }
	"""
	import requests
	import traceback

	user = frappe.session.user
	doc = frappe.get_doc("EDO Document", name)
	_check_director_can_approve(doc, user)

	api_key = LEXDOC_FISKA_API_KEY
	url = "https://oddo.tcld.uz/api/method/lexdoc.lexdoc.api.generate_fiska_pdf"

	# Исполнитель (первый) — ФИО
	executor_name = ""
	if doc.executor:
		executor_name = frappe.db.get_value("User", doc.executor, "full_name") or doc.executor

	# Соисполнители: только из таблицы co_executors; приоритет из User.edo_fiska_priority (меньше — выше в списке на фишке)
	co_executors = []
	if doc.co_executors:
		for i, row in enumerate(doc.co_executors):
			u = getattr(row, "user", None)
			if not u:
				continue
			if u == doc.executor:
				continue
			nm = frappe.db.get_value("User", u, "full_name") or u
			prio = frappe.db.get_value("User", u, "edo_fiska_priority")
			if prio is None:
				prio = i
			co_executors.append({"name": nm, "priority": int(prio)})
		co_executors.sort(key=lambda x: x["priority"])

	# Руководитель (внизу справа от QR)
	head_name = ""
	if doc.director_user:
		head_name = frappe.db.get_value("User", doc.director_user, "full_name") or doc.director_user

	# Текст верификации (ERI, Hujjat kodi)
	verification_text = f"edoc.uztelecom.uz tizimi orqali ERI bilan tasdiqlangan, Hujjat kodi: {doc.name}"
	# Резолюция: из REST (resolution, resolution_text) или с документа (EDO Resolution / resolution_text)
	resolution_text_val = ""
	resolution_name_val = ""
	if resolution is not None and str(resolution).strip():
		resolution_name_val = str(resolution).strip()
	if resolution_text is not None and str(resolution_text).strip():
		resolution_text_val = str(resolution_text).strip()
	if not resolution_name_val or not resolution_text_val:
		if doc.resolution:
			resolution_info = frappe.db.get_value("EDO Resolution", doc.resolution, ["resolution_text", "resolution_name"], as_dict=True)
			if resolution_info:
				if not resolution_text_val:
					resolution_text_val = (resolution_info.get("resolution_text") or "").strip()
				if not resolution_name_val:
					resolution_name_val = (resolution_info.get("resolution_name") or doc.resolution or "").strip()
		if not resolution_text_val and getattr(doc, "resolution_text", None):
			resolution_text_val = (doc.resolution_text or "").strip()
	# Срок исполнения, дата выпуска, номер документа (issue_date — строка YYYY-MM-DD)
	execution_term = "10 kun"
	_creation = doc.creation or frappe.utils.now()
	issue_date = _creation.strftime("%Y-%m-%d") if hasattr(_creation, "strftime") else str(_creation)[:10]
	document_number = doc.incoming_number or doc.name

	# Тело: шлём resolution (название) и resolution_text (текст) на сервис.
	resolution_text_value = resolution_text_val or "—"
	resolution_final = resolution_name_val or resolution_text_value
	body = {
		"executor": executor_name or "—",
		"co_executors": co_executors if co_executors else [{"name": "—", "priority": 0}],
		"login": "aripov",
		"head": head_name or "—",
		"verification_text": verification_text,
		"execution_term": execution_term,
		"issue_date": issue_date,
		"document_number": document_number,
		"resolution": resolution_final,
		"resolution_text": resolution_text_value,
	}
	headers = {"Content-Type": "application/json", "X-Api-Key": api_key}

	try:
		resp = requests.post(url, json=body, headers=headers, timeout=60)
		if resp.status_code != 200:
			msg = (resp.text or resp.reason)[:500]
			frappe.log_error(f"LexDoc generate_fiska_pdf error {resp.status_code}: {msg}", "get_fiska_pdf_error")
			frappe.throw(f"Ошибка получения фишки: {msg}", frappe.ValidationError)
		data = resp.json()
		# Frappe-стиль: message может быть объектом
		payload = data.get("message") if isinstance(data.get("message"), dict) else data
		if not payload.get("success") or not payload.get("pdf_base64"):
			frappe.throw("Сервис не вернул PDF фишки", frappe.ValidationError)
		return {
			"success": True,
			"pdf_base64": payload["pdf_base64"],
			"document_number": payload.get("document_number", document_number),
			"issue_date": payload.get("issue_date", issue_date),
		}
	except requests.RequestException as e:
		frappe.log_error(f"get_fiska_pdf request error: {str(e)}\n{traceback.format_exc()}", "get_fiska_pdf_error")
		frappe.throw(f"Ошибка запроса к сервису фишки: {str(e)[:200]}", frappe.ValidationError)


@frappe.whitelist()
def director_approve_with_fiska(name, comment=None, signed_pdf_base64=None, pkcs7_base64=None):
	"""
	Шаги 3–5 по MD: отправляем подписанный PDF + PKCS7 на второй эндпоинт,
	получаем PDF с QR — вставляем во вложения. main_document не трогаем.
	POST https://oddo.tcld.uz/api/method/lexdoc.lexdoc.api.process_signed_fiska (X-Api-Key).
	Тело: pdf_base64 (подписанный PDF из шага 1), pkcs7_base64.
	Ответ: ok, pdf_base64 (PDF с QR) — этот PDF только добавляем в doc.attachments.
	"""
	import requests
	import base64
	import os
	import traceback

	user = frappe.session.user
	doc = frappe.get_doc("EDO Document", name)
	_check_director_can_approve(doc, user)

	if not signed_pdf_base64 or not pkcs7_base64:
		frappe.throw("Требуются подписанный PDF (signed_pdf_base64) и подпись PKCS7 (pkcs7_base64)", frappe.ValidationError)

	api_key = LEXDOC_FISKA_API_KEY
	url = "https://oddo.tcld.uz/api/method/lexdoc.lexdoc.api.process_signed_fiska"
	headers = {"Content-Type": "application/json", "X-Api-Key": api_key}
	body = {"pdf_base64": signed_pdf_base64, "pkcs7_base64": pkcs7_base64}

	try:
		resp = requests.post(url, json=body, headers=headers, timeout=60)
		if resp.status_code != 200:
			msg = (resp.text or resp.reason)[:500]
			frappe.log_error(f"LexDoc process_signed_fiska error {resp.status_code}: {msg}", "director_approve_fiska_error")
			frappe.throw(f"Ошибка проверки подписи/фишки: {msg}", frappe.ValidationError)
		data = resp.json()
		payload = data.get("message") if isinstance(data.get("message"), dict) else data
		if not payload.get("ok"):
			frappe.throw(payload.get("message") or "Ошибка обработки подписанной фишки", frappe.ValidationError)
		pdf_with_qr = payload.get("pdf_base64")
		verification_url = payload.get("verification_url") or ""
		# Шаг 5 по MD: полученный PDF с QR вставляем во вложения (main_document не меняем)
		if pdf_with_qr:
			try:
				pdf_bytes = base64.b64decode(pdf_with_qr)
				import re
				clean_name = re.sub(r"[^\w\-]", "_", name)[:50]
				fiska_filename = f"{clean_name}_fiska_signed.pdf"
				fiska_file = frappe.get_doc({
					"doctype": "File",
					"file_name": fiska_filename,
					"content": pdf_bytes,
					"attached_to_doctype": "EDO Document",
					"attached_to_name": name,
					"is_private": 0,
				})
				fiska_file.save(ignore_permissions=True)
				doc.append("attachments", {
					"attachment": fiska_file.file_url,
					"file_name": fiska_filename,
				})
			except Exception as e:
				frappe.log_error(
					f"Failed to save fiska PDF to attachments: {str(e)}\n{traceback.format_exc()}",
					"director_approve_fiska_attach_error",
				)
		# Обновляем только флаги/статус; main_document не меняем
		doc.director_approved = 1
		doc.director_rejected = 0
		doc.director_decision_date = frappe.utils.now()
		doc.director_comment = comment or ""
		if doc.executor:
			doc.status = "На исполнении"
		else:
			doc.status = "Согласован"
		doc.save(ignore_permissions=True)
		result = doc.as_dict()
		result["verification_url"] = verification_url
		return result
	except requests.RequestException as e:
		frappe.log_error(f"director_approve_with_fiska request error: {str(e)}\n{traceback.format_exc()}", "director_approve_fiska_error")
		frappe.throw(f"Ошибка запроса к сервису: {str(e)[:200]}", frappe.ValidationError)


@frappe.whitelist()
def director_reject_document(name, comment=None):
	"""Director rejects a document"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user is Director or Admin
	user_roles = frappe.get_roles(user)
	if "EDO Director" not in user_roles and "EDO Admin" not in user_roles:
		frappe.throw("Only Director can reject documents", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)

	# Check if document is in "На рассмотрении" status (after reception processed it)
	if doc.status != "На рассмотрении":
		frappe.throw("Document must be in 'На рассмотрении' status to be rejected (Reception must process it first)", frappe.ValidationError)
	
	# Check if this director is assigned to this document
	# Admin can reject any document, but Director can only reject documents assigned to them
	if "EDO Admin" not in user_roles:
		if not doc.director_user or doc.director_user != user:
			frappe.throw("You can only reject documents assigned to your reception office", frappe.PermissionError)

	# Update document
	doc.director_approved = 0
	doc.director_rejected = 1
	# director_user is already set by reception_submit_to_director, don't override it
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
	
	# Admin can always approve
	if "EDO Admin" in user_roles:
		return True
	
	# Director can approve only if they are assigned as director in at least one reception office
	if "EDO Director" in user_roles:
		# Check if user is director of any reception office
		reception_offices = frappe.get_all(
			"EDO Reception Office",
			filters={"director": user},
			limit=1
		)
		return len(reception_offices) > 0
	
	return False


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


# ==================== RECEPTION API ====================

@frappe.whitelist()
def can_reception_submit():
	"""Check if current user can submit documents to director (Reception role)"""
	user = frappe.session.user

	if not user or user == "Guest":
		return False

	user_roles = frappe.get_roles(user)
	result = "EDO Reception" in user_roles

	# Debug log
	frappe.log_error(f"can_reception_submit: user={user}, roles={user_roles}, result={result}", "permission_debug")

	# Только роль Reception может обрабатывать документы в приемной
	# Admin не должен иметь доступ к этой функции
	return result


@frappe.whitelist()
def reception_submit_to_director(name, resolution=None, resolution_text=None, executor=None, co_executors=None):
	"""
	Reception submits document to director after assigning executors and resolution.

	Args:
		name: Document name
		resolution: Resolution name (Link to EDO Resolution) - optional if resolution_text provided
		resolution_text: Custom resolution text (written manually) - optional if resolution provided
		executor: Main executor (User)
		co_executors: List of co-executors
	"""
	user = frappe.session.user

	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Check if user has Reception role
	user_roles = frappe.get_roles(user)
	if "EDO Reception" not in user_roles:
		frappe.throw("Only Reception can submit documents to director", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", name)

	# Check if document is in "Новый" status
	if doc.status != "Новый":
		frappe.throw("Document must be in 'Новый' status to submit to director", frappe.ValidationError)

	# Update document with resolution and executors
	# Either resolution (Link) or resolution_text (manual text) should be provided
	if resolution:
		# Validate that resolution exists
		if not frappe.db.exists("EDO Resolution", resolution):
			frappe.throw(f"Resolution '{resolution}' not found", frappe.ValidationError)
		doc.resolution = resolution
		# Clear manual text if using predefined resolution
		doc.resolution_text = None
	elif resolution_text and resolution_text.strip():
		# Use manual text resolution
		doc.resolution = None
		doc.resolution_text = resolution_text.strip()
	else:
		# Neither resolution nor resolution_text provided
		frappe.throw("Either resolution or resolution_text must be provided", frappe.ValidationError)

	if executor:
		doc.executor = executor

	# Handle co_executors
	if co_executors:
		import json
		if isinstance(co_executors, str):
			co_executors = json.loads(co_executors)
		doc.set("co_executors", [])
		for co_exec in co_executors:
			if isinstance(co_exec, dict):
				doc.append("co_executors", co_exec)
			else:
				doc.append("co_executors", {"user": co_exec})

	# Set reception info
	doc.reception_user = user
	doc.reception_decision_date = frappe.utils.now()
	
	# Get director from reception office
	if doc.reception_office:
		reception_office_doc = frappe.get_doc("EDO Reception Office", doc.reception_office)
		if reception_office_doc.director:
			# Set director_user to the director of this reception office
			doc.director_user = reception_office_doc.director
		else:
			frappe.throw(f"Reception office '{doc.reception_office}' does not have a director assigned", frappe.ValidationError)
	else:
		frappe.throw("Document must have a reception office assigned", frappe.ValidationError)

	# Change status to "На рассмотрении" (for director review)
	doc.status = "На рассмотрении"

	doc.save(ignore_permissions=True)

	return doc.as_dict()


# ==================== STAMP API ====================

@frappe.whitelist()
def get_stamps():
	"""Get list of available EDO Stamps"""
	from urllib.parse import urlparse, unquote, quote
	from frappe.core.doctype.file.utils import find_file_by_url
	
	user = frappe.session.user

	if not user or user == "Guest":
		return []

	stamps = frappe.get_all(
		"EDO Stamp",
		fields=["name", "title", "stamp_image"],
		order_by="title asc"
	)

	# Convert relative URLs to full URLs
	for stamp in stamps:
		if stamp.get("stamp_image"):
			image_url = stamp["stamp_image"]
			
			# If already a full URL, check if it's an API endpoint
			if image_url.startswith("http://") or image_url.startswith("https://"):
				# If it's already an API endpoint, keep it
				if "/api/method/" in image_url:
					continue
				# Otherwise, check if it's a private file URL that needs conversion
				if "/private/files/" in image_url:
					# Extract file path from URL
					from urllib.parse import urlparse, unquote, quote
					parsed = urlparse(image_url)
					file_path = unquote(parsed.path)
					# Use API endpoint for private files
					api_url = f"/api/method/edo.edo.doctype.edo_document.edo_document.get_stamp_image?file_url={quote(file_path, safe='')}"
					stamp["stamp_image"] = frappe.utils.get_url(api_url, full_address=True)
				continue
			
			# Ensure URL starts with /
			if not image_url.startswith("/"):
				image_url = "/" + image_url
			
			# Get the file doc to check if it's private and get proper URL
			try:
				# Try to find file by file_url
				from frappe.core.doctype.file.utils import find_file_by_url
				file = find_file_by_url(image_url)
				
				if file:
					if file.is_private:
						# For private files, use API endpoint with authentication
						# This ensures proper permission checking
						from urllib.parse import quote
						api_url = f"/api/method/edo.edo.doctype.edo_document.edo_document.get_stamp_image?file_url={quote(image_url, safe='')}"
						full_url = frappe.utils.get_url(api_url, full_address=True)
						stamp["stamp_image"] = full_url
					else:
						# For public files, use direct URL with full address
						full_url = frappe.utils.get_url(image_url, full_address=True)
						stamp["stamp_image"] = full_url
				else:
					# File not found, check if it's a private path
					if "/private/files/" in image_url or image_url.startswith("/private/"):
						# Use API endpoint for private files even if file doc not found
						from urllib.parse import quote
						api_url = f"/api/method/edo.edo.doctype.edo_document.edo_document.get_stamp_image?file_url={quote(image_url, safe='')}"
						full_url = frappe.utils.get_url(api_url, full_address=True)
						stamp["stamp_image"] = full_url
					else:
						# Try to get full URL anyway
						full_url = frappe.utils.get_url(image_url, full_address=True)
						stamp["stamp_image"] = full_url
			except Exception as e:
				# Fallback: if it looks like a private file, use API endpoint
				frappe.log_error(f"Error processing stamp image URL: {image_url}, Error: {str(e)}", "get_stamps")
				try:
					if "/private/files/" in image_url or image_url.startswith("/private/"):
						# Use API endpoint for private files
						from urllib.parse import quote
						api_url = f"/api/method/edo.edo.doctype.edo_document.edo_document.get_stamp_image?file_url={quote(image_url, safe='')}"
						full_url = frappe.utils.get_url(api_url, full_address=True)
						stamp["stamp_image"] = full_url
					else:
						full_url = frappe.utils.get_url(image_url, full_address=True)
						stamp["stamp_image"] = full_url
				except:
					# Last resort: use relative URL
					stamp["stamp_image"] = image_url

	return stamps


@frappe.whitelist()
def get_stamp_image(file_url: str):
	"""Get stamp image with proper authentication"""
	from frappe.core.doctype.file.utils import find_file_by_url
	import mimetypes
	
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)
	
	# Decode the URL
	from urllib.parse import unquote
	file_url = unquote(file_url)
	
	# Log for debugging
	frappe.log_error(f"get_stamp_image called with file_url: {file_url}, user: {user}", "get_stamp_image")
	
	# Find the file
	file = find_file_by_url(file_url)
	if not file:
		# Try alternative search methods
		# Search by file_url in File doctype
		file_doc = frappe.db.get_value("File", {"file_url": file_url}, "name")
		if file_doc:
			file = frappe.get_doc("File", file_doc)
		else:
			frappe.log_error(f"File not found for URL: {file_url}", "get_stamp_image")
			frappe.throw("File not found", frappe.NotFound)
	
	# Check permissions - use has_permission method
	try:
		if not file.has_permission("read"):
			frappe.throw("You don't have permission to access this file", frappe.PermissionError)
	except:
		# If has_permission doesn't work, check manually
		from frappe.permissions import has_permission
		if not has_permission("File", doc=file, user=user):
			frappe.throw("You don't have permission to access this file", frappe.PermissionError)
	
	# Get file content
	content = file.get_content()
	
	# Determine content type
	content_type = mimetypes.guess_type(file.file_name)[0] or "image/png"
	
	# Use Frappe's standard way to return file content
	frappe.local.response.filename = file.file_name
	frappe.local.response.filecontent = content
	frappe.local.response.type = "binary"
	frappe.local.response.headers["Content-Type"] = content_type
	frappe.local.response.headers["Cache-Control"] = "public, max-age=3600"
	frappe.local.response.headers["Content-Disposition"] = f'inline; filename="{file.file_name}"'




@frappe.whitelist()
def get_pdf_info(document_name):
	"""Get PDF metadata (page count, dimensions) for a document"""
	import io
	import os
	from pypdf import PdfReader

	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw("Not authorized", frappe.PermissionError)

	# Get document
	doc = frappe.get_doc("EDO Document", document_name)

	if not doc.main_document:
		frappe.throw("Document has no PDF attached")

	# Get file path
	file_path = get_file_path(doc.main_document)

	if not file_path:
		frappe.throw("Main document file could not be resolved")

	if not os.path.exists(file_path):
		frappe.throw(f"PDF file not found: {file_path}", frappe.NotFound)

	# Не полагаемся на расширение файла — проверяем сигнатуру PDF по содержимому
	if not is_pdf_file(file_path):
		frappe.throw("Main document is not a PDF file")

	# Read PDF
	with open(file_path, 'rb') as f:
		pdf_reader = PdfReader(f)
		page_count = len(pdf_reader.pages)

		pages = []
		for page in pdf_reader.pages:
			media_box = page.mediabox
			# Convert from points to pixels (assuming 72 DPI)
			width = float(media_box.width)
			height = float(media_box.height)
			pages.append({
				"width": width,
				"height": height
			})

	return {
		"page_count": page_count,
		"pages": pages
	}


@frappe.whitelist()
def apply_stamps_to_pdf(document_name, stamps):
	"""
	Apply multiple stamps to PDF document.

	Args:
		document_name: Name of EDO Document
		stamps: JSON list of stamps to apply
			[{
				"stamp_name": "STAMP-0001",
				"page_number": 0,  # 0-indexed
				"position": "bottom-right" | "top-left" | ... | "custom",
				"x": 100,  # Only for custom position
				"y": 100,  # Only for custom position
				"scale": 1.0
			}, ...]

	Returns:
		{success: True, new_file_url: "...", message: "..."}
	"""
	import io
	import json
	import os
	import traceback
	from pypdf import PdfReader, PdfWriter
	from reportlab.pdfgen import canvas
	from reportlab.lib.utils import ImageReader
	from PIL import Image

	try:
		user = frappe.session.user
		if not user or user == "Guest":
			frappe.throw("Not authorized", frappe.PermissionError)

		# Check permission
		user_roles = frappe.get_roles(user)
		can_stamp = any(role in user_roles for role in ["EDO Admin", "EDO Manager", "EDO Director"])
		if not can_stamp:
			frappe.throw("You don't have permission to apply stamps", frappe.PermissionError)

		# Parse stamps if string
		if isinstance(stamps, str):
			try:
				stamps = json.loads(stamps)
			except json.JSONDecodeError as e:
				frappe.log_error(f"Failed to parse stamps JSON: {stamps}, Error: {str(e)}", "apply_stamps_json_error")
				frappe.throw(f"Invalid stamps format: {str(e)}", frappe.ValidationError)

		if not stamps:
			frappe.throw("No stamps provided", frappe.ValidationError)

		if not isinstance(stamps, list):
			frappe.throw("Stamps must be a list", frappe.ValidationError)

		# Get document
		try:
			doc = frappe.get_doc("EDO Document", document_name)
		except Exception as e:
			frappe.log_error(f"Failed to get document {document_name}: {str(e)}\n{traceback.format_exc()}", "apply_stamps_doc_error")
			frappe.throw(f"Document not found: {document_name}", frappe.NotFound)

		if not doc.main_document:
			frappe.throw("Document has no PDF attached", frappe.ValidationError)

		# Get PDF file path
		# Важно: main_document может быть уже штампованным файлом, это нормально
		pdf_path = get_file_path(doc.main_document)

		if not pdf_path:
			frappe.log_error(
				f"Invalid PDF path for document {document_name}: main_document={doc.main_document}, "
				f"resolved_path={pdf_path}",
				"apply_stamps_path_error"
			)
			frappe.throw("Main document file could not be resolved", frappe.ValidationError)

		if not os.path.exists(pdf_path):
			frappe.log_error(
				f"PDF file not found at path: {pdf_path} for document {document_name}, "
				f"main_document={doc.main_document}",
				"apply_stamps_file_error"
			)
			frappe.throw(f"PDF file not found: {pdf_path}", frappe.NotFound)
		
		# Быстрая проверка PDF по сигнатуре. Расширение может отсутствовать.
		if not is_pdf_file(pdf_path):
			frappe.log_error(
				f"File is not a PDF by signature: {pdf_path} for document {document_name}, "
				f"main_document={doc.main_document}",
				"apply_stamps_not_pdf_error"
			)
			frappe.throw("Main document is not a PDF file", frappe.ValidationError)

		# Read original PDF
		try:
			with open(pdf_path, 'rb') as f:
				original_pdf_bytes = f.read()
		except Exception as e:
			frappe.log_error(f"Failed to read PDF file {pdf_path}: {str(e)}\n{traceback.format_exc()}", "apply_stamps_read_error")
			frappe.throw(f"Failed to read PDF file: {str(e)}", frappe.ValidationError)

		try:
			pdf_reader = PdfReader(io.BytesIO(original_pdf_bytes))
		except Exception as e:
			frappe.log_error(f"Failed to parse PDF: {str(e)}\n{traceback.format_exc()}", "apply_stamps_parse_error")
			frappe.throw(f"Invalid PDF file: {str(e)}", frappe.ValidationError)

		pdf_writer = PdfWriter()

		# Group stamps by page
		stamps_by_page = {}
		for stamp_info in stamps:
			if not isinstance(stamp_info, dict):
				frappe.log_error(f"Invalid stamp_info type: {type(stamp_info)}, value: {stamp_info}", "apply_stamps_validation")
				continue
			
			page_num = stamp_info.get("page_number", 0)
			if not isinstance(page_num, int) or page_num < 0:
				frappe.log_error(f"Invalid page_number: {page_num} in stamp {stamp_info}", "apply_stamps_validation")
				continue
			
			if page_num not in stamps_by_page:
				stamps_by_page[page_num] = []
			stamps_by_page[page_num].append(stamp_info)

		# Process each page
		total_stamps_to_apply = sum(len(stamps) for stamps in stamps_by_page.values())
		stamps_applied_count = 0
		
		for page_idx, page in enumerate(pdf_reader.pages):
			if page_idx in stamps_by_page:
				# Apply stamps to this page
				try:
					stamped_page, page_stamps_applied = apply_stamps_to_page(page, stamps_by_page[page_idx], doc)
					pdf_writer.add_page(stamped_page)
					stamps_applied_count += page_stamps_applied
					
					# Логируем результат применения штампов к странице
					if page_stamps_applied > 0:
						frappe.log_error(
							f"Applied {page_stamps_applied} stamps to page {page_idx}",
							"apply_stamps_page_success"
						)
					else:
						frappe.log_error(
							f"No stamps applied to page {page_idx}. Total stamps for page: {len(stamps_by_page[page_idx])}",
							"apply_stamps_page_no_stamps"
						)
				except Exception as e:
					frappe.log_error(
						f"Failed to apply stamps to page {page_idx}: {str(e)}\n{traceback.format_exc()}\nStamps: {stamps_by_page[page_idx]}",
						"apply_stamps_page_error"
					)
					# Fallback: add page without stamps
					pdf_writer.add_page(page)
			else:
				pdf_writer.add_page(page)
		
		# Проверяем, что хотя бы один штамп был применен
		if total_stamps_to_apply > 0 and stamps_applied_count == 0:
			# Логируем детальную информацию о том, почему штампы не были применены
			error_details = []
			for page_idx, stamps in stamps_by_page.items():
				error_details.append(f"Page {page_idx}: {len(stamps)} stamps")
			
			# Пытаемся получить последние ошибки из Error Log для более детального сообщения
			try:
				recent_errors = frappe.get_all(
					"Error Log",
					filters={
						"method": ["in", ["stamp_file_error", "stamp_load_error", "stamp_validation", "stamp_image_error", "stamp_draw_error", "stamp_position_error"]],
						"creation": [">", frappe.utils.add_to_date(frappe.utils.now(), minutes=-5)]
					},
					fields=["method", "error"],
					order_by="creation desc",
					limit=3
				)
				error_hints = []
				for err in recent_errors:
					# Берем первую строку ошибки для краткости
					error_first_line = err.error.split('\n')[0] if err.error else ""
					if error_first_line:
						error_hints.append(f"{err.method}: {error_first_line[:100]}")
			except:
				error_hints = []
			
			error_msg = (
				f"Не удалось применить штампы к документу. Всего штампов: {total_stamps_to_apply}, применено: {stamps_applied_count}. "
				f"Страницы со штампами: {', '.join(error_details)}. "
			)
			if error_hints:
				error_msg += f"Последние ошибки: {'; '.join(error_hints)}. "
			error_msg += "Проверьте Error Log для деталей (ищите ошибки с типами stamp_file_error, stamp_load_error, stamp_validation, stamp_image_error, stamp_draw_error)."
			
			frappe.log_error(
				f"No stamps applied. Total: {total_stamps_to_apply}, Applied: {stamps_applied_count}. "
				f"Pages with stamps: {', '.join(error_details)}. "
				f"Check Error Log for stamp_* errors.",
				"apply_stamps_no_stamps_applied"
			)
			frappe.throw(error_msg, frappe.ValidationError)

		# Write to bytes
		try:
			output = io.BytesIO()
			pdf_writer.write(output)
			output_bytes = output.getvalue()
			
			# Проверяем, что файл не пустой
			if not output_bytes or len(output_bytes) == 0:
				frappe.log_error("Stamped PDF is empty", "apply_stamps_empty_pdf")
				frappe.throw("Не удалось создать PDF со штампом: файл пуст", frappe.ValidationError)
			
			# Проверяем, что это действительно PDF (должен начинаться с %PDF)
			if not output_bytes.startswith(b'%PDF'):
				frappe.log_error(f"Stamped PDF is not a valid PDF. First bytes: {output_bytes[:20]}", "apply_stamps_invalid_pdf")
				frappe.throw("Созданный файл не является валидным PDF", frappe.ValidationError)
		except Exception as e:
			frappe.log_error(f"Failed to write PDF: {str(e)}\n{traceback.format_exc()}", "apply_stamps_write_error")
			frappe.throw(f"Failed to create stamped PDF: {str(e)}", frappe.ValidationError)

		# Generate unique filenames using content hash to avoid conflicts
		import re
		from frappe.core.doctype.file.utils import get_content_hash

		original_filename = os.path.basename(pdf_path)
		name_without_ext = os.path.splitext(original_filename)[0]

		# Очищаем имя от старых суффиксов _stamped_XXXX и _original_XXXX
		# чтобы избежать накопления суффиксов
		clean_name = re.sub(r'(_stamped_[a-f0-9]+|_original_[a-f0-9]+)+$', '', name_without_ext)
		if not clean_name:
			clean_name = "document"

		# Ограничиваем длину базового имени (оставляем место для суффикса _stamped_XXXXXXXX.pdf = 22 символа)
		max_base_length = 140 - 22
		if len(clean_name) > max_base_length:
			clean_name = clean_name[:max_base_length]

		# Читаем оригинальный контент для расчета хэша
		with open(pdf_path, 'rb') as f:
			original_content = f.read()

		# Используем хэш содержимого для уникальности имен файлов
		# Для оригинального файла
		original_content_hash = get_content_hash(original_content)
		original_hash_suffix = original_content_hash[-8:]  # Последние 8 символов хэша
		original_backup_filename = f"{clean_name}_original_{original_hash_suffix}.pdf"

		# Для файла со штампом
		stamped_content_hash = get_content_hash(output_bytes)
		stamped_hash_suffix = stamped_content_hash[-8:]  # Последние 8 символов хэша
		stamped_filename = f"{clean_name}_stamped_{stamped_hash_suffix}.pdf"
		
		# Удаляем старые файлы со штампами из attachments, чтобы избежать конфликтов
		# Ищем файлы, которые заканчиваются на _stamped.pdf или _original.pdf
		if doc.attachments:
			stamped_files_to_remove = []
			for att in doc.attachments:
				att_file_name = att.get("file_name", "")
				att_file_url = att.get("attachment", "")
				# Проверяем, является ли это старым файлом со штампом или backup
				if att_file_name and (
					att_file_name.endswith("_stamped.pdf") or 
					att_file_name.endswith("_original.pdf") or
					"_stamped_" in att_file_name or
					"_original_" in att_file_name
				):
					# Находим File документ и удаляем его
					try:
						file_doc = frappe.db.get_value("File", {"file_url": att_file_url}, "name")
						if file_doc:
							stamped_files_to_remove.append((att_file_name, file_doc))
					except:
						pass
			
			# Удаляем старые файлы
			if stamped_files_to_remove:
				# Удаляем из attachments
				for file_name, file_doc_name in stamped_files_to_remove:
					try:
						# Удаляем запись из child table
						attachments_to_keep = [
							a for a in doc.attachments 
							if a.get("file_name") != file_name and a.get("attachment") != file_doc_name
						]
						doc.set("attachments", attachments_to_keep)
						
						# Удаляем File документ (физически удаляем только если он не используется где-то еще)
						try:
							frappe.delete_doc("File", file_doc_name, force=1, ignore_permissions=True)
						except Exception as del_e:
							# Если файл используется где-то еще, просто пропускаем
							frappe.log_error(f"Could not delete file {file_doc_name}: {str(del_e)}", "apply_stamps_cleanup")
					except Exception as e:
						frappe.log_error(f"Failed to remove old stamped file {file_name}: {str(e)}", "apply_stamps_cleanup")

		# Save original to attachments (backup)
		# original_content уже прочитан выше для расчета хэша
		try:
			original_backup_file = frappe.get_doc({
				"doctype": "File",
				"file_name": original_backup_filename,
				"content": original_content,
				"attached_to_doctype": "EDO Document",
				"attached_to_name": document_name,
				"is_private": 0
			})
			original_backup_file.save(ignore_permissions=True)

			# Add original to attachments child table
			# Используем file_url для attachment поля
			doc.append("attachments", {
				"attachment": original_backup_file.file_url,
				"file_name": original_backup_filename
			})
			
			# Сохраняем документ, чтобы attachments были сохранены
			doc.save(ignore_permissions=True)
		except Exception as e:
			frappe.log_error(f"Failed to save backup: {str(e)}\n{traceback.format_exc()}", "apply_stamps_backup_error")
			# Continue even if backup fails

		# Save stamped version as new main document
		try:
			# Перезагружаем документ, чтобы получить актуальные данные
			doc.reload()
			
			stamped_file = frappe.get_doc({
				"doctype": "File",
				"file_name": stamped_filename,
				"content": output_bytes,
				"attached_to_doctype": "EDO Document",
				"attached_to_name": document_name,
				"is_private": 0
			})
			stamped_file.save(ignore_permissions=True)
			
			# Проверяем, что файл действительно создан и доступен
			stamped_file_path = get_file_path(stamped_file.file_url)
			if not stamped_file_path or not os.path.exists(stamped_file_path):
				frappe.log_error(
					f"Stamped file not found after save. URL: {stamped_file.file_url}, Path: {stamped_file_path}",
					"apply_stamps_file_not_found"
				)
				frappe.throw("Файл со штампом не был создан", frappe.ValidationError)
			
			# Проверяем размер файла
			file_size = os.path.getsize(stamped_file_path)
			if file_size == 0:
				frappe.log_error(f"Stamped file is empty. Path: {stamped_file_path}", "apply_stamps_empty_file")
				frappe.throw("Файл со штампом пуст", frappe.ValidationError)
			
			# Replace main_document with stamped version
			old_main_document = doc.main_document
			
			# Если старый main_document был файлом со штампом, удаляем его из attachments
			# (но не удаляем сам файл, так как он может быть нужен для истории)
			if old_main_document and ("_stamped" in old_main_document or "_stamped_" in old_main_document):
				# Удаляем старый файл со штампом из attachments, если он там есть
				if doc.attachments:
					attachments_to_keep = [
						a for a in doc.attachments 
						if a.get("attachment") != old_main_document
					]
					doc.set("attachments", attachments_to_keep)
			
			# Обновляем main_document на новый файл со штампом
			doc.main_document = stamped_file.file_url
			doc.save(ignore_permissions=True)
			
			# Логируем только краткую информацию (Title ограничен 140 символами)
			# Сокращаем сообщение, чтобы не превысить лимит
			short_msg = f"Stamps applied. Doc: {document_name[:30]}, File: {stamped_file.name[:30]}"
			frappe.log_error(short_msg, "apply_stamps_success")
			
			# Обновляем документ в базе данных, чтобы изменения были видны сразу
			frappe.db.commit()
		except Exception as e:
			# Сокращаем сообщение для title (ограничение 140 символов)
			error_msg = str(e)
			short_error = error_msg[:100] if len(error_msg) > 100 else error_msg
			frappe.log_error(
				f"Failed to save stamped file: {short_error}\n{traceback.format_exc()}",
				"apply_stamps_save_error"
			)
			frappe.throw(f"Failed to save stamped PDF: {error_msg}", frappe.ValidationError)

		return {
			"success": True,
			"new_file_url": stamped_file.file_url,
			"message": f"Штамп применён. Оригинал сохранён в вложениях."
		}
	except frappe.PermissionError:
		raise
	except frappe.NotFound:
		raise
	except frappe.ValidationError:
		raise
	except Exception as e:
		# Log all other errors
		frappe.log_error(
			f"Unexpected error in apply_stamps_to_pdf: {str(e)}\n{traceback.format_exc()}\n"
			f"document_name: {document_name}, stamps: {stamps}",
			"apply_stamps_unexpected_error"
		)
		frappe.throw(f"Failed to apply stamps: {str(e)}", frappe.ValidationError)


def apply_stamps_to_page(page, stamps_info, document=None):
	"""Apply multiple stamps to a single PDF page

	Args:
		page: PDF page object
		stamps_info: list of stamp info dicts
		document: EDO Document object for filling stamp fields
	"""
	import io
	import os
	import traceback
	from pypdf import PdfReader
	from reportlab.pdfgen import canvas
	from reportlab.lib.utils import ImageReader
	from PIL import Image

	# Get page dimensions
	media_box = page.mediabox
	page_width = float(media_box.width)
	page_height = float(media_box.height)

	# Create overlay with stamps
	packet = io.BytesIO()
	c = canvas.Canvas(packet, pagesize=(page_width, page_height))
	
	# Счетчик успешно примененных штампов
	stamps_applied = 0
	# Список ошибок для детального логирования
	errors = []
	
	# Логируем начало обработки штампов для отладки
	frappe.log_error(
		f"Starting to apply {len(stamps_info)} stamps to page {page_width:.2f}x{page_height:.2f}",
		"stamp_apply_start"
	)

	for stamp_info in stamps_info:
		try:
			stamp_name = stamp_info.get("stamp_name")
			if not stamp_name:
				error_msg = f"Missing stamp_name in stamp_info: {stamp_info}"
				frappe.log_error(error_msg, "stamp_validation")
				errors.append(error_msg)
				continue
			
			position = stamp_info.get("position", "bottom-right")
			try:
				# По умолчанию масштаб 0.15 (15% от оригинального размера) для меньших штампов
				scale = float(stamp_info.get("scale", 0.15))
			except (ValueError, TypeError):
				error_msg = f"Invalid scale value: {stamp_info.get('scale')} for stamp {stamp_name}"
				frappe.log_error(error_msg, "stamp_validation")
				errors.append(error_msg)
				scale = 0.15  # Fallback на 15% если значение невалидно
			
			custom_x = stamp_info.get("x")
			custom_y = stamp_info.get("y")

			# Get stamp image path
			try:
				stamp_doc = frappe.get_doc("EDO Stamp", stamp_name)
			except Exception as e:
				error_msg = f"Failed to get stamp {stamp_name}: {str(e)}"
				frappe.log_error(error_msg, "stamp_load_error")
				errors.append(error_msg)
				continue
			
			if not stamp_doc.stamp_image:
				error_msg = f"Stamp {stamp_name} has no image"
				frappe.log_error(error_msg, "stamp_validation")
				errors.append(error_msg)
				continue

			stamp_image_path = get_file_path(stamp_doc.stamp_image)
			if not stamp_image_path:
				error_msg = f"Stamp image path is None for stamp {stamp_name} (stamp_image URL: {stamp_doc.stamp_image})"
				frappe.log_error(error_msg, "stamp_file_error")
				errors.append(error_msg)
				continue
			
			if not os.path.exists(stamp_image_path):
				error_msg = f"Stamp image not found at path: {stamp_image_path} for stamp {stamp_name} (stamp_image URL: {stamp_doc.stamp_image})"
				frappe.log_error(error_msg, "stamp_file_error")
				errors.append(error_msg)
				continue

			# Load stamp image
			try:
				stamp_img = Image.open(stamp_image_path)
			except Exception as e:
				error_msg = f"Failed to open stamp image {stamp_image_path}: {str(e)}"
				frappe.log_error(error_msg, "stamp_image_error")
				errors.append(error_msg)
				continue

			# Handle transparency - convert to RGBA if needed
			if stamp_img.mode != 'RGBA':
				stamp_img = stamp_img.convert('RGBA')
			
			# Fill stamp with document data if field_mappings exist
			# Перезагружаем документ с child table для получения актуальных данных
			stamp_doc.reload()
			
			# Получаем field_mappings из child table
			field_mappings_list = []
			if hasattr(stamp_doc, 'field_mappings') and stamp_doc.field_mappings:
				# Конвертируем child table в список словарей
				for mapping in stamp_doc.field_mappings:
					if hasattr(mapping, 'as_dict'):
						field_mappings_list.append(mapping.as_dict())
					elif isinstance(mapping, dict):
						field_mappings_list.append(mapping)
					else:
						# Пытаемся получить атрибуты напрямую
						field_mappings_list.append({
							"document_field": getattr(mapping, 'document_field', None),
							"position_x": getattr(mapping, 'position_x', 0),
							"position_y": getattr(mapping, 'position_y', 0),
							"font_size": getattr(mapping, 'font_size', 12),
							"color": getattr(mapping, 'color', '#000000'),
							"max_width": getattr(mapping, 'max_width', 0),
						})
			
			if field_mappings_list and len(field_mappings_list) > 0 and document:
				try:
					stamp_img = render_text_on_stamp_image(stamp_img, field_mappings_list, document)
				except Exception as e:
					# Continue with original image if text rendering fails
					pass

			stamp_w, stamp_h = stamp_img.size
			scaled_w = stamp_w * scale
			scaled_h = stamp_h * scale

			# Validate scaled size
			if scaled_w <= 0 or scaled_h <= 0:
				error_msg = f"Invalid stamp size: {scaled_w}x{scaled_h} (original: {stamp_w}x{stamp_h}, scale: {scale}) for stamp {stamp_name}"
				frappe.log_error(error_msg, "stamp_size_error")
				errors.append(error_msg)
				continue

			# Calculate position
			try:
				x, y = calculate_stamp_position(
					page_width, page_height,
					scaled_w, scaled_h,
					position, custom_x, custom_y
				)
			except Exception as e:
				error_msg = f"Failed to calculate position for stamp {stamp_name}: {str(e)} (position={position}, custom_x={custom_x}, custom_y={custom_y})"
				frappe.log_error(error_msg, "stamp_position_error")
				errors.append(error_msg)
				continue

			# Draw stamp on canvas with transparency support
			try:
				c.drawImage(
					ImageReader(stamp_img),
					x, y,
					width=scaled_w,
					height=scaled_h,
					mask='auto'
				)
				stamps_applied += 1
				# Логируем успешное применение штампа для отладки
				frappe.log_error(
					f"Stamp {stamp_name} drawn at ({x:.2f}, {y:.2f}) size ({scaled_w:.2f}, {scaled_h:.2f})",
					"stamp_draw_success"
				)
			except Exception as e:
				error_msg = f"Failed to draw stamp {stamp_name} at ({x}, {y}) size ({scaled_w}, {scaled_h}): {str(e)}"
				frappe.log_error(f"{error_msg}\n{traceback.format_exc()}", "stamp_draw_error")
				errors.append(error_msg)
				continue
		except Exception as e:
			error_msg = f"Unexpected error processing stamp {stamp_info}: {str(e)}"
			frappe.log_error(f"{error_msg}\n{traceback.format_exc()}", "stamp_process_error")
			errors.append(error_msg)
			continue

	# Сохраняем canvas и применяем штампы только если были применены штампы
	if stamps_applied > 0:
		c.save()
		packet.seek(0)

		# Merge overlay with original page
		try:
			overlay_reader = PdfReader(packet)
			if overlay_reader.pages:
				page.merge_page(overlay_reader.pages[0])
				# Логируем успешный merge для отладки
				frappe.log_error(
					f"Successfully merged {stamps_applied} stamps to page. Returning page with {stamps_applied} stamps applied.",
					"stamp_merge_success"
				)
				return page, stamps_applied
			else:
				frappe.log_error(
					f"Overlay PDF has no pages after applying {stamps_applied} stamps. Packet size: {len(packet.getvalue())}",
					"stamp_merge_no_pages"
				)
				# Если overlay пустой, возвращаем оригинальную страницу без штампов
				# но не выбрасываем исключение - пусть вызывающий код решает
				return page, 0
		except Exception as e:
			frappe.log_error(
				f"Failed to merge stamp overlay: {str(e)}\n{traceback.format_exc()}\n"
				f"Stamps applied: {stamps_applied}, Total: {len(stamps_info)}, Packet size: {len(packet.getvalue()) if packet else 0}",
				"stamp_merge_error"
			)
			# Если merge не удался, возвращаем оригинальную страницу без штампов
			# но не выбрасываем исключение - пусть вызывающий код решает
			return page, 0
	else:
		# Если штампы не были применены, логируем предупреждение с деталями ошибок
		error_summary = f"No stamps applied. Total: {len(stamps_info)}, Applied: {stamps_applied}"
		if errors:
			error_summary += f". Errors: {'; '.join(errors[:5])}"  # Показываем первые 5 ошибок
			if len(errors) > 5:
				error_summary += f" (и еще {len(errors) - 5} ошибок)"
		frappe.log_error(error_summary, "stamp_no_stamps_applied")

	return page, stamps_applied


def calculate_stamp_position(page_width, page_height, stamp_width, stamp_height, position, custom_x=None, custom_y=None):
	"""Calculate stamp position on page"""
	margin = 20  # Margin from edges in points

	positions = {
		"top-left": (margin, page_height - stamp_height - margin),
		"top-center": ((page_width - stamp_width) / 2, page_height - stamp_height - margin),
		"top-right": (page_width - stamp_width - margin, page_height - stamp_height - margin),
		"center": ((page_width - stamp_width) / 2, (page_height - stamp_height) / 2),
		"bottom-left": (margin, margin),
		"bottom-center": ((page_width - stamp_width) / 2, margin),
		"bottom-right": (page_width - stamp_width - margin, margin),
	}

	if position == "custom" and custom_x is not None and custom_y is not None:
		# custom_x и custom_y - это центр штампа в PDF координатах
		# ReportLab использует координаты от левого нижнего угла
		# Нужно вычесть половину размера штампа, чтобы получить левый нижний угол
		x = float(custom_x) - (stamp_width / 2)
		y = float(custom_y) - (stamp_height / 2)
		# Убеждаемся, что координаты не выходят за границы страницы
		x = max(0, min(x, page_width - stamp_width))
		y = max(0, min(y, page_height - stamp_height))
		
		return (x, y)

	return positions.get(position, positions["bottom-right"])


def wrap_text(text, font, max_width, draw):
	"""
	Разбивает текст на строки, чтобы каждая строка не превышала max_width пикселей.

	Args:
		text: Текст для разбиения
		font: PIL ImageFont объект
		max_width: Максимальная ширина строки в пикселях
		draw: PIL ImageDraw объект для измерения текста

	Returns:
		Список строк
	"""
	def wrap_long_word(word, font, max_width, draw):
		"""Разбивает длинное слово на части посимвольно"""
		result = []
		current = ""
		for char in word:
			test = current + char
			bbox = draw.textbbox((0, 0), test, font=font)
			if bbox[2] - bbox[0] <= max_width:
				current = test
			else:
				if current:
					result.append(current)
				current = char
		if current:
			result.append(current)
		return result if result else [word]

	words = text.split()
	lines = []
	current_line = []

	for word in words:
		# Сначала проверяем, помещается ли слово целиком
		bbox = draw.textbbox((0, 0), word, font=font)
		word_width = bbox[2] - bbox[0]

		if word_width > max_width:
			# Слово слишком длинное - разбиваем посимвольно
			if current_line:
				lines.append(' '.join(current_line))
				current_line = []
			# Добавляем части длинного слова как отдельные строки
			word_parts = wrap_long_word(word, font, max_width, draw)
			lines.extend(word_parts[:-1])  # Все части кроме последней
			if word_parts:
				current_line = [word_parts[-1]]  # Последняя часть для продолжения
		else:
			# Проверяем ширину текущей строки + новое слово
			test_line = ' '.join(current_line + [word])
			bbox = draw.textbbox((0, 0), test_line, font=font)
			line_width = bbox[2] - bbox[0]

			if line_width <= max_width:
				current_line.append(word)
			else:
				# Если текущая строка не пустая, сохраняем её
				if current_line:
					lines.append(' '.join(current_line))
					current_line = [word]
				else:
					# Слово помещается, но строка не пустая - добавляем
					current_line.append(word)

	# Добавляем последнюю строку
	if current_line:
		lines.append(' '.join(current_line))

	return lines if lines else [text]


def render_text_on_stamp_image(stamp_img, field_mappings, document, show_text_area=False, use_placeholder=False):
	"""
	Рендерит текст на изображении штампа на основе настроек field_mappings и данных документа.

	Args:
		stamp_img: PIL Image объект штампа
		field_mappings: список настроек полей из EDO Stamp (child table)
		document: EDO Document объект с данными
		show_text_area: показывать ли рамку области текста (для превью в админке)
		use_placeholder: использовать плейсхолдер вместо реальных данных (для админки)

	Returns:
		PIL Image с нарисованным текстом
	"""
	from PIL import ImageDraw, ImageFont
	import re
	import os

	# Создаем копию изображения для рисования
	img_with_text = stamp_img.copy()
	draw = ImageDraw.Draw(img_with_text)

	# Пытаемся загрузить шрифт, если не получится - используем стандартный
	try:
		# Пробуем использовать системный шрифт
		font_paths = [
			"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
			"/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
			"/System/Library/Fonts/Helvetica.ttc",
		]
		default_font = None
		for font_path in font_paths:
			try:
				default_font = ImageFont.truetype(font_path, 12)
				break
			except:
				continue
		if not default_font:
			default_font = ImageFont.load_default()
	except:
		default_font = ImageFont.load_default()

	# Обрабатываем каждую настройку поля
	# field_mappings уже должны быть списком словарей на этом этапе
	for idx, field_mapping in enumerate(field_mappings):
		# Убеждаемся, что это словарь
		if not isinstance(field_mapping, dict):
			continue

		document_field = field_mapping.get("document_field")
		# Пропускаем только если поле не указано вообще (для плейсхолдеров показываем даже пустые поля)
		if not document_field:
			# В режиме плейсхолдеров можно показать что-то общее, но обычно это означает ошибку конфигурации
			if use_placeholder:
				# Показываем общий плейсхолдер для не настроенных полей
				field_value = "[Поле не настроено]"
				position_x = int(field_mapping.get("position_x") or 0)
				position_y = int(field_mapping.get("position_y") or 0)
				font_size = int(field_mapping.get("font_size") or 12)
				color = field_mapping.get("color") or "#000000"
				try:
					color_hex = color.lstrip('#')
					rgb_color = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
				except:
					rgb_color = (0, 0, 0)
				try:
					font = ImageFont.load_default()
					draw.text((position_x, position_y), field_value, fill=rgb_color, font=font)
				except:
					pass
			continue

		# document_field может содержать формат "fieldname|Label [Type]" - берём только fieldname
		# Сохраняем label для плейсхолдера
		field_label = None
		if "|" in document_field:
			parts = document_field.split("|")
			document_field = parts[0]
			field_label = parts[1] if len(parts) > 1 else document_field

		# Получаем параметры позиции и стиля (нужны для области и текста)
		position_x = int(field_mapping.get("position_x") or 0)
		position_y = int(field_mapping.get("position_y") or 0)
		font_size = int(field_mapping.get("font_size") or 12)
		max_width = int(field_mapping.get("max_width") or 0)
		color = field_mapping.get("color") or "#000000"

		# Рисуем область текста если show_text_area=True (независимо от document)
		if show_text_area and max_width > 0:
			# Примерная высота области (3 строки)
			estimated_height = (font_size + 4) * 3
			# Рисуем прямоугольник области красным цветом
			draw.rectangle(
				[position_x, position_y, position_x + max_width, position_y + estimated_height],
				outline=(255, 0, 0),
				width=2
			)

		# Если use_placeholder=True, показываем название поля вместо данных
		if use_placeholder:
			# Получаем читаемое название поля
			if not field_label:
				# Пытаемся получить label из метаданных
				try:
					doc_meta = frappe.get_meta("EDO Document")
					field_meta = doc_meta.get_field(document_field)
					field_label = field_meta.label if field_meta else document_field
				except:
					field_label = document_field
			# Убираем [Type] из label если есть
			if field_label and "[" in field_label:
				field_label = field_label.split("[")[0].strip()
			field_value = f"[{field_label}]"
		elif document:
			# Получаем значение поля из документа
			field_value = getattr(document, document_field, None)
		else:
			continue

		# field_value уже установлен выше (либо плейсхолдер, либо из документа)

		# Для плейсхолдеров показываем даже если поле пустое
		if use_placeholder:
			text = str(field_value)
		else:
			# Если значение None или пустое, пропускаем (только для реальных данных, не для плейсхолдеров)
			if field_value is None or field_value == "":
				continue
			
			# Получаем метаданные поля для определения типа
			doc_meta = frappe.get_meta("EDO Document")
			field_meta = doc_meta.get_field(document_field)

			# Форматируем значение в зависимости от типа
			if field_meta and field_meta.fieldtype == "Link":
				# Для Link полей получаем название связанного документа
				try:
					linked_doc = frappe.get_doc(field_meta.options, field_value)
					# Для User используем full_name, для остальных - title_field или name
					if field_meta.options == "User":
						text = getattr(linked_doc, "full_name", None) or getattr(linked_doc, "name", field_value) or field_value
					else:
						# Пытаемся получить title_field или name
						title_field = frappe.get_meta(field_meta.options).title_field or "name"
						text = getattr(linked_doc, title_field, field_value) or field_value
				except:
					text = str(field_value)
			elif isinstance(field_value, (frappe.utils.datetime.datetime, frappe.utils.datetime.date)):
				# Для дат используем форматирование
				if isinstance(field_value, frappe.utils.datetime.datetime):
					text = frappe.utils.format_datetime(field_value, "dd.MM.yyyy HH:mm")
				else:
					text = frappe.utils.formatdate(field_value, "dd.MM.yyyy")
			elif isinstance(field_value, (int, float)):
				text = str(field_value)
			else:
				text = str(field_value)

		# Парсим цвет из hex
		try:
			# Убираем # если есть
			color_hex = color.lstrip('#')
			# Конвертируем в RGB
			rgb_color = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
		except:
			rgb_color = (0, 0, 0)  # Черный по умолчанию
		
		# Загружаем шрифт нужного размера
		font = None
		font_paths = [
			"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
			"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
			"/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
			"/usr/share/fonts/truetype/freefont/FreeSans.ttf",
			"/usr/share/fonts/TTF/DejaVuSans.ttf",  # Arch/Manjaro
			"/usr/share/fonts/dejavu/DejaVuSans.ttf",  # Some distros
		]
		for font_path in font_paths:
			try:
				if os.path.exists(font_path):
					font = ImageFont.truetype(font_path, font_size)
					break
			except Exception:
				continue

		if not font:
			# Fallback to default font (small, but works)
			font = ImageFont.load_default()

		# Рисуем текст на изображении
		try:
			if max_width > 0:
				# Перенос текста по ширине
				lines = wrap_text(text, font, max_width, draw)
				y_offset = position_y
				line_height = font_size + 4  # Небольшой отступ между строками
				for line in lines:
					draw.text((position_x, y_offset), line, fill=rgb_color, font=font)
					y_offset += line_height
			else:
				# Без переноса - одна строка
				draw.text((position_x, position_y), text, fill=rgb_color, font=font)
		except Exception as e:
			# Продолжаем при ошибке рисования
			continue

	return img_with_text


def get_file_path(file_url):
	"""Get absolute file path from Frappe file URL"""
	if not file_url:
		return None

	# Сначала пытаемся найти файл через File doctype
	from frappe.core.doctype.file.utils import find_file_by_url
	from urllib.parse import urlparse

	# Если передан полный URL (http://...), извлекаем только path
	if file_url.startswith('http://') or file_url.startswith('https://'):
		parsed = urlparse(file_url)
		file_url = parsed.path  # /files/test_document.pdf

	# Нормализуем URL - добавляем / если нужно
	normalized_url = file_url if file_url.startswith('/') else '/' + file_url

	try:
		file_doc = find_file_by_url(normalized_url)
		if file_doc:
			# Используем метод File для получения пути
			return file_doc.get_full_path()
	except:
		pass

	# Fallback: пытаемся найти по file_url в базе данных
	try:
		file_name = frappe.db.get_value("File", {"file_url": normalized_url}, "name")
		if file_name:
			file_doc = frappe.get_doc("File", file_name)
			return file_doc.get_full_path()
	except:
		pass

	# Fallback: пытаемся построить путь напрямую
	# Remove leading slash if present
	if file_url.startswith('/'):
		file_url = file_url[1:]

	# Handle private files
	if file_url.startswith('private/files/'):
		return frappe.get_site_path(file_url)

	# Handle public files
	if file_url.startswith('files/'):
		return frappe.get_site_path('public', file_url)

	return None


def is_pdf_file(file_path: str) -> bool:
	"""Return True if file looks like a PDF by magic header (%PDF-)."""
	try:
		with open(file_path, "rb") as f:
			return f.read(5) == b"%PDF-"
	except Exception:
		return False


@frappe.whitelist()
def make_all_document_files_public():
	"""Make all EDO document files public so they can be viewed in iframe"""
	# Get all EDO documents
	documents = frappe.get_all("EDO Document", fields=["name", "main_document"])
	
	updated_count = 0
	for doc_data in documents:
		if not doc_data.main_document:
			continue
		
		try:
			# Get document
			doc = frappe.get_doc("EDO Document", doc_data.name)
			
			# Process main_document
			main_doc_url = doc.main_document
			if not main_doc_url.startswith("/"):
				main_doc_url = "/" + main_doc_url
			
			# Find file and make it public
			from frappe.core.doctype.file.utils import find_file_by_url
			file = find_file_by_url(main_doc_url)
			
			if file and file.is_private:
				file.is_private = 0
				file.save(ignore_permissions=True)
				updated_count += 1
			
			# Process attachments
			if doc.attachments:
				for att in doc.attachments:
					if att.attachment:
						att_url = att.attachment
						if not att_url.startswith("/"):
							att_url = "/" + att_url
						
						att_file = find_file_by_url(att_url)
						if att_file and att_file.is_private:
							att_file.is_private = 0
							att_file.save(ignore_permissions=True)
							updated_count += 1
		except Exception as e:
			frappe.log_error(f"Error processing document {doc_data.name}: {str(e)}", "make_all_document_files_public")
			continue
	
	return {
		"message": f"Updated {updated_count} files to public",
		"updated_count": updated_count
	}


@frappe.whitelist()
def sign_document_with_pkcs7(document_name, pkcs7):
	"""
	Подписать PDF документ с помощью PKCS7 подписи.
	
	Args:
		document_name: Имя документа EDO Document
		pkcs7: PKCS7 подпись в Base64
	
	Returns:
		{success: True, new_file_url: "...", message: "..."}
	"""
	import io
	import os
	import traceback
	import base64
	import requests
	from frappe.core.doctype.file.utils import get_content_hash
	
	try:
		user = frappe.session.user
		if not user or user == "Guest":
			frappe.throw("Not authorized", frappe.PermissionError)

		# Check permission
		user_roles = frappe.get_roles(user)
		can_sign = any(role in user_roles for role in ["EDO Admin", "EDO Manager", "EDO Director"])
		if not can_sign:
			frappe.throw("You don't have permission to sign documents", frappe.PermissionError)

		# Проверяем параметры (ошибки нашей стороны)
		if not document_name:
			error_obj = frappe._dict({
				"message": "Не указан документ для подписания",
				"source": "our_side",
				"error_type": "validation"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
		
		if not pkcs7:
			error_obj = frappe._dict({
				"message": "Не указана PKCS7 подпись",
				"source": "our_side",
				"error_type": "validation"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
		
		# Проверяем размер pkcs7 (не должен быть слишком большим)
		if len(pkcs7) > 10 * 1024 * 1024:  # 10 MB
			error_obj = frappe._dict({
				"message": "PKCS7 подпись слишком большая (максимум 10 MB)",
				"source": "our_side",
				"error_type": "validation"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

		# Get document
		try:
			doc = frappe.get_doc("EDO Document", document_name)
		except Exception as e:
			frappe.log_error(f"Failed to get document {document_name}: {str(e)}\n{traceback.format_exc()}", "sign_document_doc_error")
			error_obj = frappe._dict({
				"message": f"Документ не найден: {document_name}",
				"source": "our_side",
				"error_type": "not_found"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.NotFound)

		if not doc.main_document:
			error_obj = frappe._dict({
				"message": "У документа нет PDF файла для подписания",
				"source": "our_side",
				"error_type": "validation"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

		# Get PDF file path
		pdf_path = get_file_path(doc.main_document)
		if not pdf_path:
			frappe.log_error(
				f"Invalid PDF path for document {document_name}: main_document={doc.main_document}",
				"sign_document_path_error"
			)
			error_obj = frappe._dict({
				"message": "Не удалось найти файл документа",
				"source": "our_side",
				"error_type": "file_not_found"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

		if not os.path.exists(pdf_path):
			frappe.log_error(
				f"PDF file not found at path: {pdf_path} for document {document_name}",
				"sign_document_file_error"
			)
			error_obj = frappe._dict({
				"message": f"PDF файл не найден по пути: {pdf_path}",
				"source": "our_side",
				"error_type": "file_not_found"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.NotFound)
		
		# Read original PDF
		try:
			with open(pdf_path, 'rb') as f:
				original_pdf_bytes = f.read()
		except Exception as e:
			frappe.log_error(f"Failed to read PDF file {pdf_path}: {str(e)}\n{traceback.format_exc()}", "sign_document_read_error")
			error_obj = frappe._dict({
				"message": f"Не удалось прочитать PDF файл: {str(e)[:100]}",
				"source": "our_side",
				"error_type": "file_read_error"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

		# Конвертируем PDF в Base64 для отправки на LexDoc API
		pdf_base64 = base64.b64encode(original_pdf_bytes).decode('utf-8')
		
		# Проверяем размеры данных
		pdf_size_mb = len(pdf_base64) / (1024 * 1024)
		pkcs7_size_mb = len(pkcs7) / (1024 * 1024)
		total_size_mb = pdf_size_mb + pkcs7_size_mb
		
		if total_size_mb > 50:  # Если общий размер больше 50MB
			frappe.log_error(
				f"Data too large for LexDoc API: PDF={pdf_size_mb:.2f}MB, PKCS7={pkcs7_size_mb:.2f}MB, Total={total_size_mb:.2f}MB",
				"sign_document_lexdoc_size_error"
			)
			error_obj = frappe._dict({
				"message": f"Размер данных слишком большой для отправки ({total_size_mb:.2f}MB). Максимум 50MB.",
				"source": "our_side",
				"error_type": "validation"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
		
		# Получаем URL LexDoc API из настроек (или используем дефолтный)
		lexdoc_api_url = frappe.conf.get('lexdoc_api_url', 'https://oddo.tcld.uz/api/method/lexdoc.lexdoc.api.process_pdf_with_qr_code')
		
		# Отправляем PDF и PKCS7 подпись на LexDoc API согласно документации
		# LexDoc обработает PDF, вставит QR код и вернет подписанный PDF
		try:
			# Подготавливаем данные запроса
			document_title = doc.title if hasattr(doc, 'title') and doc.title else doc.name
			
			request_data = {
				"pdf_base64": pdf_base64,
				"pkcs7_base64": pkcs7,
				"document_id": document_name,  # Используем имя документа как ID
				"document_title": str(document_title),  # Убеждаемся что это строка
				"position": "bottom-right",  # Позиция QR кода
				"qr_size": 100,  # Размер QR кода
				"page_number": 1,  # Первая страница
			}
			
			# Логируем информацию о запросе (используем старый формат как в остальном коде)
			detailed_msg = (
				f"LexDoc API request\n"
				f"URL: {lexdoc_api_url}\n"
				f"PDF size: {pdf_size_mb:.2f}MB ({len(pdf_base64)} chars)\n"
				f"PKCS7 size: {pkcs7_size_mb:.2f}MB ({len(pkcs7)} chars)\n"
				f"Document: {document_name}"
			)
			# Используем старый формат: log_error(message, method) где method используется как reference_doctype
			frappe.log_error(detailed_msg, "sign_document_lexdoc_request")
			
			response = requests.post(
				lexdoc_api_url,
				json=request_data,
				headers={
					"Content-Type": "application/json",
					"Accept": "application/json",
					"X-Api-Key": LEXDOC_FISKA_API_KEY,
				},
				timeout=60  # Увеличиваем timeout для обработки PDF
			)
			
			if response.status_code != 200:
				error_text = response.text[:2000] if len(response.text) > 2000 else response.text
				# Логируем детальную информацию об ошибке
				error_details = (
					f"LexDoc API error {response.status_code}\n"
					f"URL: {lexdoc_api_url}\n"
					f"Response headers: {dict(response.headers)}\n"
					f"Response text: {error_text}\n"
					f"PDF size: {len(pdf_base64)} chars ({len(original_pdf_bytes)} bytes)\n"
					f"PKCS7 size: {len(pkcs7)} chars"
				)
				frappe.log_error(error_details, "sign_document_lexdoc_error")
				
				# Выводим ошибку в консоль для отладки
				print(f"\n{'='*80}")
				print(f"LEXDOC API ERROR {response.status_code}")
				print(f"{'='*80}")
				print(f"URL: {lexdoc_api_url}")
				print(f"Status Code: {response.status_code}")
				print(f"Response Headers: {dict(response.headers)}")
				print(f"Response Text: {error_text}")
				print(f"PDF Base64 size: {len(pdf_base64)} chars")
				print(f"PDF Binary size: {len(original_pdf_bytes)} bytes")
				print(f"PKCS7 Base64 size: {len(pkcs7)} chars")
				print(f"{'='*80}\n")
				
				# Формируем структурированное сообщение об ошибке LexDoc
				try:
					error_json = response.json()
					error_message = error_json.get('message', error_json.get('exception', error_text[:200]))
				except:
					error_message = error_text[:200]
				
				# Определяем тип ошибки и формируем сообщение
				if response.status_code == 417:
					user_msg = f"LexDoc API отклонил запрос (417). {error_message}"
					error_source = "lexdoc"
				elif response.status_code == 404:
					user_msg = f"LexDoc API endpoint не найден (404)"
					error_source = "lexdoc"
				elif response.status_code >= 500:
					user_msg = f"Ошибка сервера LexDoc API (код {response.status_code})"
					error_source = "lexdoc"
				else:
					user_msg = f"Ошибка LexDoc API (код {response.status_code}): {error_message}"
					error_source = "lexdoc"
				
				# Бросаем исключение с информацией об источнике ошибки
				error_obj = frappe._dict({
					"message": user_msg,
					"source": error_source,
					"status_code": response.status_code,
					"error_details": error_message
				})
				frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
			
			try:
				result = response.json()
			except ValueError as json_error:
				error_text = response.text[:2000] if len(response.text) > 2000 else response.text
				error_details = (
					f"LexDoc API returned non-JSON response\n"
					f"Status: {response.status_code}\n"
					f"Response: {error_text}\n"
					f"JSON parse error: {str(json_error)}"
				)
				frappe.log_error(error_details, "sign_document_lexdoc_error")
				print(f"\n{'='*80}")
				print(f"LEXDOC API NON-JSON RESPONSE")
				print(f"{'='*80}")
				print(f"Status: {response.status_code}")
				print(f"Response: {error_text}")
				print(f"{'='*80}\n")
				error_obj = frappe._dict({
					"message": f"LexDoc API вернул некорректный ответ (не JSON): {str(error_text)[:300]}",
					"source": "lexdoc",
					"error_type": "non_json",
					"status_code": response.status_code
				})
				frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

			# LexDoc API может вернуть ответ в "frappe-стиле": {"message": {...}}
			payload = result
			try:
				if isinstance(result, dict) and isinstance(result.get("message"), dict):
					payload = result.get("message")
			except Exception:
				payload = result

			# Успешность
			ok_flag = False
			try:
				ok_flag = bool(payload.get("ok")) if isinstance(payload, dict) else False
			except Exception:
				ok_flag = False

			if not ok_flag:
				raw_error_msg = result.get("message") or result.get("exception") or result.get("error") or "Unknown error"
				# Если LexDoc внезапно вернул объект вместо строки — не роняемся и не тащим pdf_base64 в ошибку
				if not isinstance(raw_error_msg, str):
					raw_error_msg = "LexDoc вернул ошибку обработки PDF"

				# Короткое резюме ответа без больших полей
				result_summary = {}
				try:
					if isinstance(result, dict):
						result_summary = {k: v for k, v in result.items() if k not in ("pdf_base64", "pkcs7_base64")}
						if "pdf_base64" in result and isinstance(result.get("pdf_base64"), str):
							result_summary["pdf_base64_len"] = len(result.get("pdf_base64"))
						if "pkcs7_base64" in result and isinstance(result.get("pkcs7_base64"), str):
							result_summary["pkcs7_base64_len"] = len(result.get("pkcs7_base64"))
				except Exception:
					result_summary = {"note": "failed to summarize result"}

				error_details = (
					f"LexDoc processing failed\n"
					f"Message: {raw_error_msg}\n"
					f"Response summary: {result_summary}"
				)
				frappe.log_error(error_details, "sign_document_lexdoc_error")
				print(f"\n{'='*80}")
				print(f"LEXDOC API PROCESSING FAILED")
				print(f"{'='*80}")
				print(f"Message: {raw_error_msg}")
				print(f"Response summary: {result_summary}")
				print(f"{'='*80}\n")
				error_obj = frappe._dict({
					"message": f"Ошибка обработки PDF в LexDoc: {str(raw_error_msg)[:300]}",
					"source": "lexdoc",
					"error_type": "processing_failed",
					"error_details": str(raw_error_msg)[:400]
				})
				frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
			
			# Извлекаем подписанный PDF с QR кодом из ответа
			signed_pdf_base64 = payload.get("pdf_base64") if isinstance(payload, dict) else None
			if not signed_pdf_base64:
				frappe.log_error("LexDoc API не вернул PDF в ответе", "sign_document_lexdoc_error")
				error_obj = frappe._dict({
					"message": "LexDoc API не вернул PDF в ответе",
					"source": "lexdoc",
					"error_type": "missing_response"
				})
				frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
			
			# Декодируем PDF из Base64
			signed_pdf_bytes = base64.b64decode(signed_pdf_base64)
			
			# Логируем успешную обработку
			verification_url = payload.get("verification_url", "") if isinstance(payload, dict) else ""
			if verification_url:
				frappe.log_error(f"LexDoc processed PDF successfully\nVerification URL: {verification_url}", "sign_document_lexdoc_success")
			else:
				frappe.log_error("LexDoc processed PDF successfully", "sign_document_lexdoc_success")
			
		except requests.exceptions.Timeout as e:
			error_msg = str(e)[:100]
			frappe.log_error(f"LexDoc API timeout\nTimeout: {error_msg}\nURL: {lexdoc_api_url}", "sign_document_lexdoc_timeout")
			error_obj = frappe._dict({
				"message": "Превышено время ожидания ответа от LexDoc API. Попробуйте позже.",
				"source": "lexdoc",
				"error_type": "timeout"
			})
			frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
		except requests.exceptions.ConnectionError as e:
			error_msg = str(e)[:100]
			frappe.log_error(f"LexDoc API connection error\nConnection error: {error_msg}\nURL: {lexdoc_api_url}", "sign_document_lexdoc_connection_error")
			error_obj = frappe._dict({
				"message": "Не удалось подключиться к LexDoc API. Проверьте доступность сервиса.",
				"source": "lexdoc",
				"error_type": "connection"
			})
			frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
		except requests.exceptions.RequestException as e:
			# Если LexDoc API недоступен, логируем ошибку и бросаем исключение
			error_msg = str(e)[:200]
			frappe.log_error(f"LexDoc API request error\nRequest error: {error_msg}\nURL: {lexdoc_api_url}", "sign_document_lexdoc_request_error")
			error_obj = frappe._dict({
				"message": f"Ошибка запроса к LexDoc API: {str(e)[:150]}",
				"source": "lexdoc",
				"error_type": "request"
			})
			frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
		except frappe.ValidationError as e:
			# Пробрасываем ValidationError как есть (уже содержит структурированную ошибку)
			raise
		except Exception as e:
			error_msg = str(e)[:200]
			frappe.log_error(f"LexDoc unexpected error\nError: {error_msg}\n{traceback.format_exc()}", "sign_document_lexdoc_error")
			# Проверяем, не является ли это ошибкой нашей стороны
			if "BytesIO" in str(e) or "expected str" in str(e):
				# Это ошибка LexDoc API
				error_obj = frappe._dict({
					"message": f"Ошибка обработки на стороне LexDoc API: {error_msg[:150]}",
					"source": "lexdoc",
					"error_type": "processing"
				})
				frappe.throw(f"LEXDOC_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
			else:
				# Это ошибка нашей стороны
				error_obj = frappe._dict({
					"message": f"Ошибка при подготовке данных для LexDoc: {error_msg[:150]}",
					"source": "our_side",
					"error_type": "internal"
				})
				frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

		# Generate unique filenames using content hash
		import re
		original_filename = os.path.basename(pdf_path)
		name_without_ext = os.path.splitext(original_filename)[0]
		clean_name = re.sub(r'(_signed_[a-f0-9]+|_original_[a-f0-9]+)+$', '', name_without_ext)
		if not clean_name:
			clean_name = "document"

		max_base_length = 140 - 22
		if len(clean_name) > max_base_length:
			clean_name = clean_name[:max_base_length]

		# Calculate hashes
		original_content_hash = get_content_hash(original_pdf_bytes)
		original_hash_suffix = original_content_hash[-8:]
		original_backup_filename = f"{clean_name}_original_{original_hash_suffix}.pdf"

		signed_content_hash = get_content_hash(signed_pdf_bytes)
		signed_hash_suffix = signed_content_hash[-8:]
		signed_filename = f"{clean_name}_signed_{signed_hash_suffix}.pdf"

		# Save original to attachments (backup)
		try:
			original_backup_file = frappe.get_doc({
				"doctype": "File",
				"file_name": original_backup_filename,
				"content": original_pdf_bytes,
				"attached_to_doctype": "EDO Document",
				"attached_to_name": document_name,
				"is_private": 0
			})
			original_backup_file.save(ignore_permissions=True)

			# Add original to attachments child table
			doc.append("attachments", {
				"attachment": original_backup_file.file_url,
				"file_name": original_backup_filename
			})
			
			doc.save(ignore_permissions=True)
		except Exception as e:
			frappe.log_error(f"Failed to save backup: {str(e)}\n{traceback.format_exc()}", "sign_document_backup_error")
			# Continue even if backup fails

		# Save signed version as new main document
		try:
			doc.reload()
			
			signed_file = frappe.get_doc({
				"doctype": "File",
				"file_name": signed_filename,
				"content": signed_pdf_bytes,
				"attached_to_doctype": "EDO Document",
				"attached_to_name": document_name,
				"is_private": 0
			})
			signed_file.save(ignore_permissions=True)
			
			# Verify file was created
			signed_file_path = get_file_path(signed_file.file_url)
			if not signed_file_path or not os.path.exists(signed_file_path):
				frappe.log_error(
					f"Signed file not found after save. URL: {signed_file.file_url}, Path: {signed_file_path}",
					"sign_document_file_not_found"
				)
				error_obj = frappe._dict({
					"message": "Не удалось сохранить подписанный файл",
					"source": "our_side",
					"error_type": "file_save_error"
				})
				frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
			
			# Replace main_document with signed version
			old_main_document = doc.main_document
			
			# Remove old signed file from attachments if it exists
			if old_main_document and ("_signed" in old_main_document or "_signed_" in old_main_document):
				if doc.attachments:
					attachments_to_keep = [
						a for a in doc.attachments 
						if a.get("attachment") != old_main_document
					]
					doc.set("attachments", attachments_to_keep)
			
			# Update main_document
			doc.main_document = signed_file.file_url
			
			# После успешной подписи переходим по статусам как раньше
			# Определяем, кто подписывает: директор или исполнитель
			is_director = "EDO Director" in user_roles or "EDO Admin" in user_roles
			is_executor = False
			
			# Проверяем, является ли пользователь исполнителем
			if doc.executor == user:
				is_executor = True
			elif doc.co_executors:
				for co_exec in doc.co_executors:
					if co_exec.user == user:
						is_executor = True
						break
			
			# Логика перехода статусов
			if is_director and doc.status == "На рассмотрении":
				# Директор подписывает документ на рассмотрении
				doc.director_approved = 1
				doc.director_rejected = 0
				doc.director_decision_date = frappe.utils.now()
				# Если есть исполнитель, переводим в "На исполнении", иначе "Согласован"
				if doc.executor:
					doc.status = "На исполнении"
				else:
					doc.status = "Согласован"
			elif is_executor and doc.status == "На исполнении":
				# Исполнитель подписывает документ на исполнении
				# Проверяем, не подписывал ли уже
				already_signed = False
				if doc.signatures:
					for sig in doc.signatures:
						if sig.user == user:
							already_signed = True
							break
				
				if not already_signed:
					# Добавляем подпись
					doc.append("signatures", {
						"user": user,
						"signed_at": frappe.utils.now(),
						"comment": ""
					})
					
					# Проверяем, все ли исполнители подписали
					all_executors = []
					if doc.executor:
						all_executors.append(doc.executor)
					if doc.co_executors:
						for co_exec in doc.co_executors:
							if co_exec.user:
								all_executors.append(co_exec.user)
					
					signed_users = [sig.user for sig in doc.signatures] if doc.signatures else []
					all_signed = all(user in signed_users for user in all_executors) if all_executors else False
					
					# Если все подписали, переводим в "Выполнено"
					if all_signed:
						doc.status = "Выполнено"
			
			doc.save(ignore_permissions=True)
			
			frappe.db.commit()
		except Exception as e:
			frappe.log_error(
				f"Failed to save signed file: {str(e)}\n{traceback.format_exc()}",
				"sign_document_save_error"
			)
			error_obj = frappe._dict({
				"message": f"Не удалось сохранить подписанный PDF: {str(e)[:150]}",
				"source": "our_side",
				"error_type": "file_save_error"
			})
			frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)

		return {
			"success": True,
			"new_file_url": signed_file.file_url,
			"message": "Документ подписан. Оригинал сохранён в вложениях."
		}
	except frappe.PermissionError:
		raise
	except frappe.NotFound:
		raise
	except frappe.ValidationError:
		raise
	except frappe.ValidationError:
		# Пробрасываем ValidationError как есть (уже содержит структурированную ошибку)
		raise
	except Exception as e:
		frappe.log_error(
			f"Unexpected error in sign_document_with_pkcs7: {str(e)}\n{traceback.format_exc()}\n"
			f"document_name: {document_name}",
			"sign_document_unexpected_error"
		)
		error_obj = frappe._dict({
			"message": f"Неожиданная ошибка при подписании документа: {str(e)[:150]}",
			"source": "our_side",
			"error_type": "unexpected"
		})
		frappe.throw(f"OUR_ERROR:{frappe.as_json(error_obj)}", frappe.ValidationError)
