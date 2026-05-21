import codecs

with open('school-dashboard/src/pages/IA.jsx', 'r', encoding='utf-16-le') as f:
    content = f.read()

old_inventory = '''      { name: "Inventory Dashboard", route: "/inventory", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Assets", route: "/inventory/assets", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Vendors", route: "/inventory/vendors", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Procurement", route: "/inventory/procurement", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Maintenance", route: "/inventory/maintenance", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Audits", route: "/inventory/audits", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Reports", route: "/inventory/reports", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },'''

new_inventory = '''      { name: "Inventory Dashboard", route: "/inventory", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Assets", route: "/inventory/assets", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Vendors", route: "/inventory/vendors", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Procurement", route: "/inventory/procurement", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Maintenance", route: "/inventory/maintenance", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Audits", route: "/inventory/audits", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Reports", route: "/inventory/reports", checks: { design: "done", a11y: "pending", responsive: "pending", tests: "pending" } },'''

content = content.replace(old_inventory, new_inventory)

old_library = '''      { name: "Library Dashboard", route: "/library", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Books List", route: "/library/books", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Issued Books", route: "/library/issued", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Library Reports", route: "/library/reports", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },'''

new_library = '''      { name: "Library Dashboard", route: "/library", checks: { design: "done", a11y: "done", responsive: "pending", tests: "pending" } },
      { name: "Books List", route: "/library/books", checks: { design: "done", a11y: "done", responsive: "pending", tests: "pending" } },
      { name: "Issued Books", route: "/library/issued", checks: { design: "done", a11y: "done", responsive: "pending", tests: "pending" } },
      { name: "Library Reports", route: "/library/reports", checks: { design: "done", a11y: "pending", responsive: "pending", tests: "pending" } },'''

content = content.replace(old_library, new_library)

with open('school-dashboard/src/pages/IA.jsx', 'w', encoding='utf-16-le') as f:
    f.write(content)

print('IA.jsx updated')
