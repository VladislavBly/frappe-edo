"""
Setup permissions for EDO roles
Run this script after installing the app to set up permissions for EDO Admin role
"""
import frappe

def setup_admin_permissions():
	"""Setup permissions for all EDO roles"""
	
	# All EDO roles
	edo_roles = ["EDO User", "EDO Admin", "EDO Observer", "EDO Executor", "EDO Manager", "EDO Director"]
	
	# Check if roles exist
	for role in edo_roles:
		if not frappe.db.exists("Role", role):
			print(f"Role {role} does not exist. Please install fixtures first:")
			print("bench --site your-site.local migrate")
			return
	
	# List of doctypes
	doctypes = [
		"EDO Document",
		"Comment",
	]
	
	# Permissions for different roles
	# Admin gets all permissions
	# Other roles get read permission
	role_permissions = {
		"EDO Admin": ["read", "write", "delete", "submit", "cancel", "amend"],
		"EDO User": ["read"],
		"EDO Observer": ["read"],
		"EDO Executor": ["read"],
		"EDO Manager": ["read"],
		"EDO Director": ["read"],
	}
	
	for doctype in doctypes:
		# Get the doctype document
		if not frappe.db.exists("DocType", doctype):
			print(f"DocType {doctype} does not exist, skipping...")
			continue
			
		doc = frappe.get_doc("DocType", doctype)
		has_changes = False
		
		# Setup permissions for each role
		for role in edo_roles:
			permissions = role_permissions.get(role, ["read"])
			
			# Check if permission already exists for this role
			existing_perm = None
			for perm in doc.permissions:
				if perm.role == role:
					existing_perm = perm
					break
			
			if not existing_perm:
				# Create new permission entry with all flags
				perm_data = {
					"role": role,
					"read": 1 if "read" in permissions else 0,
					"write": 1 if "write" in permissions else 0,
					"delete": 1 if "delete" in permissions else 0,
					"submit": 1 if "submit" in permissions else 0,
					"cancel": 1 if "cancel" in permissions else 0,
					"amend": 1 if "amend" in permissions else 0,
					"create": 1 if "write" in permissions else 0,
					"email": 1 if "read" in permissions else 0,
					"export": 1 if "read" in permissions else 0,
					"print": 1 if "read" in permissions else 0,
					"report": 1 if "read" in permissions else 0,
					"share": 1 if "read" in permissions else 0,
				}
				
				doc.append("permissions", perm_data)
				has_changes = True
				print(f"Added permissions for {role} on {doctype}: {', '.join(permissions)}")
			else:
				# Update existing permission
				updated = False
				if "read" in permissions and not existing_perm.read:
					existing_perm.read = 1
					updated = True
				if "write" in permissions and not existing_perm.write:
					existing_perm.write = 1
					existing_perm.create = 1
					updated = True
				if "delete" in permissions and not existing_perm.delete:
					existing_perm.delete = 1
					updated = True
				if "submit" in permissions and not existing_perm.submit:
					existing_perm.submit = 1
					updated = True
				if "cancel" in permissions and not existing_perm.cancel:
					existing_perm.cancel = 1
					updated = True
				if "amend" in permissions and not existing_perm.amend:
					existing_perm.amend = 1
					updated = True
				
				if updated:
					has_changes = True
					print(f"Updated permissions for {role} on {doctype}")
				else:
					print(f"Permissions for {role} on {doctype} already set")
		
		# Save doctype with all new permissions
		if has_changes:
			doc.save(ignore_permissions=True)
			frappe.db.commit()
			print(f"Saved permissions for {doctype}")

if __name__ == "__main__":
	frappe.init(site="your-site.local")
	frappe.connect()
	setup_admin_permissions()
	frappe.db.commit()
