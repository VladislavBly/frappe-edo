app_name = "edo"
app_title = "EDO"
app_publisher = "Publish"
app_description = "EDO"
app_email = "vladik.blyahin@gmail.com"
app_license = "mit"

# Fixtures
# --------
fixtures = [
	{"dt": "Role", "filters": [["name", "in", ["EDO User"]]]},
]

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "edo",
# 		"logo": "/assets/edo/logo.png",
# 		"title": "EDO",
# 		"route": "/edo",
# 		"has_permission": "edo.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/edo/css/edo.css"
# app_include_js = "/assets/edo/js/edo.js"

# include js, css files in header of web template
# web_include_css = "/assets/edo/css/edo.css"
# web_include_js = "/assets/edo/js/edo.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "edo/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "edo/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
role_home_page = {
	"EDO User": "edo_documents"
}

# Portal configuration
has_website_permission = {
	"EDO Document": "edo.edo.doctype.edo_document.edo_document.has_website_permission"
}

# Generators
# ----------

# automatically create page for each record of this doctype
website_generators = ["EDO Document"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "edo.utils.jinja_methods",
# 	"filters": "edo.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "edo.install.before_install"
# after_install = "edo.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "edo.uninstall.before_uninstall"
# after_uninstall = "edo.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "edo.utils.before_app_install"
# after_app_install = "edo.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "edo.utils.before_app_uninstall"
# after_app_uninstall = "edo.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "edo.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"edo.tasks.all"
# 	],
# 	"daily": [
# 		"edo.tasks.daily"
# 	],
# 	"hourly": [
# 		"edo.tasks.hourly"
# 	],
# 	"weekly": [
# 		"edo.tasks.weekly"
# 	],
# 	"monthly": [
# 		"edo.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "edo.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "edo.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "edo.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["edo.utils.before_request"]
# after_request = ["edo.utils.after_request"]

# Job Events
# ----------
# before_job = ["edo.utils.before_job"]
# after_job = ["edo.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"edo.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

