"""
Add permissions for EDO reference doctypes
"""
import frappe

def add_reference_permissions():
	"""Add read permissions for all EDO roles to reference doctypes"""

	# Reference doctypes that everyone should be able to read
	reference_doctypes = [
		"EDO Correspondent",
		"EDO Document Type",
		"EDO Priority",
		"EDO Status",
		"EDO Classification",
		"EDO Delivery Method",
	]

	# All EDO roles should have read access to references
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]

	for doctype_name in reference_doctypes:
		if not frappe.db.exists("DocType", doctype_name):
			print(f"DocType {doctype_name} does not exist, skipping...")
			continue

		for role in edo_roles:
			# Check if permission already exists
			existing = frappe.db.exists("Custom DocPerm", {
				"parent": doctype_name,
				"role": role
			})

			if not existing:
				# Create custom permission
				perm = frappe.get_doc({
					"doctype": "Custom DocPerm",
					"parent": doctype_name,
					"parenttype": "DocType",
					"parentfield": "permissions",
					"role": role,
					"read": 1,
					"write": 1 if role in ["EDO Admin", "EDO Manager"] else 0,
					"create": 1 if role in ["EDO Admin", "EDO Manager"] else 0,
					"delete": 1 if role == "EDO Admin" else 0,
					"submit": 0,
					"cancel": 0,
					"amend": 0,
					"email": 1,
					"print": 1,
					"export": 1,
					"report": 1,
					"share": 1,
					"permlevel": 0
				})
				perm.insert(ignore_permissions=True)
				print(f"Added permission for {role} on {doctype_name}")
			else:
				print(f"Permission for {role} on {doctype_name} already exists")

	frappe.db.commit()
	print("\nPermissions added successfully!")
	print("\nClearing cache...")
	frappe.clear_cache()

if __name__ == "__main__":
	add_reference_permissions()
