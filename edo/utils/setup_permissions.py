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
		"EDO Correspondent",
		"EDO Document Type",
		"EDO Priority",
		"EDO Status",
		"EDO Classification",
		"EDO Delivery Method",
		"EDO Document Attachment",
		"Comment",
	]
	
	# Permissions for different roles
	# Admin gets all permissions
	# Manager gets all permissions except delete
	# Other roles get read permission
	role_permissions = {
		"EDO Admin": ["read", "write", "delete", "submit", "cancel", "amend"],
		"EDO Manager": ["read", "write", "submit", "cancel", "amend"],
		"EDO User": ["read"],
		"EDO Observer": ["read"],
		"EDO Executor": ["read"],
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
	
	# Setup workspace shortcut for EDO Stamp
	setup_workspace_stamp_shortcut()

def setup_workspace_stamp_shortcut():
	"""Ensure EDO Stamp shortcut exists in EDO workspace"""
	if not frappe.db.exists("Workspace", "EDO"):
		print("EDO workspace not found, skipping shortcut setup")
		return
	
	try:
		ws = frappe.get_doc("Workspace", "EDO")
		
		# Check if EDO Stamp shortcut already exists
		has_stamp_shortcut = any(s.link_to == "EDO Stamp" for s in ws.shortcuts)
		
		if not has_stamp_shortcut:
			# Add EDO Stamp shortcut
			ws.append("shortcuts", {
				"doc_view": "List",
				"label": "EDO Stamp",
				"link_to": "EDO Stamp",
				"type": "DocType"
			})
			ws.save(ignore_permissions=True)
			frappe.db.commit()
			print("✓ Added EDO Stamp shortcut to workspace")
		else:
			print("✓ EDO Stamp shortcut already exists in workspace")
		
		# Also ensure it's in content (for display)
		import json
		content = json.loads(ws.content) if ws.content else []
		
		# Check if stamps section exists in content
		has_stamp_header = any(
			block.get("type") == "header" and 
			"Штампы" in str(block.get("data", {}).get("text", ""))
			for block in content
		)
		
		has_stamp_in_content = any(
			block.get("type") == "shortcut" and
			block.get("data", {}).get("shortcut_name") == "EDO Stamp"
			for block in content
		)
		
		if not has_stamp_header or not has_stamp_in_content:
			# Add stamps section if it doesn't exist
			if not has_stamp_header:
				content.append({
					"id": "edo_header_stamps",
					"type": "header",
					"data": {
						"text": '<span style="font-size: 18px;"><b>Штампы</b></span>',
						"col": 12
					}
				})
			
			if not has_stamp_in_content:
				content.append({
					"id": "edo_shortcut_stamp",
					"type": "shortcut",
					"data": {
						"shortcut_name": "EDO Stamp",
						"col": 4
					}
				})
			
			ws.content = json.dumps(content, ensure_ascii=False)
			ws.save(ignore_permissions=True)
			frappe.db.commit()
			print("✓ Updated workspace content with EDO Stamp")
		
	except Exception as e:
		print(f"Warning: Failed to setup workspace shortcut: {str(e)}")
		# Don't fail the whole installation if workspace setup fails

if __name__ == "__main__":
	frappe.init(site="your-site.local")
	frappe.connect()
	setup_admin_permissions()
	frappe.db.commit()
