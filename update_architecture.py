with open('ARCHITECTURE.md', 'r', encoding='utf-16-le') as f:
    content = f.read()

# Update Inventory in module checklist
old_inventory_line = '| Inventory | ⏳ | ⏳ | ⏳ | ⏳ |'
new_inventory_line = '| Inventory | ❌ **ISSUES FOUND** | ⏳ | ⏳ | ⏳ |'
content = content.replace(old_inventory_line, new_inventory_line)

# Update Library in module checklist (DK-446 done)
old_library_line = '| Library | ⏳ | ⏳ | ⏳ | ⏳ |'
new_library_line = '| Library | ✅ | ⏳ | ⏳ | ⏳ |'
content = content.replace(old_library_line, new_library_line)

# Update Classes in module checklist (DK-325 done, fixes in review)
old_classes_line = '| Classes | 🔍 | ⏳ | ⏳ | ⏳ |'
new_classes_line = '| Classes | ❌ **ISSUES FOUND** | ⏳ | ⏳ | ⏳ |'
content = content.replace(old_classes_line, new_classes_line)

# Update Front Desk in module checklist
old_frontdesk_line = '| **Front Desk** | ❌ **ISSUES FOUND** | ⏳ | ⏳ | ⏳ |'
# Keep as is

# Add Inventory Audit Findings section before "## Pages that need alignment"
inventory_section = '''### Inventory Audit Findings (2026-05-21)
See issue DK-461 `[Design System Audit] Inventory - 2026-05-21` for full details.

1. **HeroUI imports** — Assets.jsx, Audits.jsx, Maintenance.jsx, Procurement.jsx, Vendors.jsx, InventoryTransaction.jsx, index.jsx all use @heroui/react Modal/Input/Select/Textarea/Switch/Breadcrumbs. Should use design-system primitives.
2. **Hardcoded chromatic colors** — Assets.jsx (text-green-600, text-yellow-600, text-red-600), Procurement.jsx (text-green-600 dark:text-green-400, text-red-600 dark:text-red-400), InventoryDashboard.jsx (border-gray-50 dark:border-zinc-800), StatCard.jsx (full colorMap of hardcoded Tailwind classes).
3. **List views miss canonical two-pane pattern** — Assets, Audits, Maintenance, Procurement, Transactions use raw HTML tables without URL-driven selection, detail pane, keyboard nav, or bulk selection.
4. **Toolbar patterns not aligned** — Ad-hoc flex containers instead of .toolbar, HeroUI Input/Select instead of ToolbarSearch/.seg, missing FilterPillsBar and BulkActionBar.
5. **Accessibility gaps** — Tables lack role=listbox, aria-label, keyboard handlers, focus management.
6. **index.jsx uses HeroUI Breadcrumbs** — Should use design-system Breadcrumbs from src/components/ui.
7. **StatCard shared component** — Maps color prop to hardcoded Tailwind chromatic classes. Needs token-based colorMap.

**Status:** Findings posted. Waiting for owner thumbs-up approval on which items to fix.

'''

old_marker = '## Pages that need alignment'
content = content.replace(old_marker, inventory_section + old_marker)

# Update Audit History
old_history = '''| Date | Module | Issue | Status |
|------|--------|-------|--------|
| 2026-05-18 | Front Desk | [DK-179](mention://issue/5498b6ef-b83f-4c88-9909-bfbf42250574) | Awaiting approval |'''
new_history = '''| Date | Module | Issue | Status |
|------|--------|-------|--------|
| 2026-05-18 | Front Desk | [DK-179](mention://issue/5498b6ef-b83f-4c88-9909-bfbf42250574) | Awaiting approval |
| 2026-05-20 | Classes | [DK-325](mention://issue/90097eb0-dccb-4273-ac40-66f9868c3560) | Awaiting approval |
| 2026-05-21 | Library | [DK-446](mention://issue/a9f4a638-0a47-4132-83fe-94fa913ca0e2) | Approved, fixes in review |
| 2026-05-21 | Inventory | [DK-461](mention://issue/5cd2162a-7748-43f4-a3a0-317d77a7cdee) | Awaiting approval |'''
content = content.replace(old_history, new_history)

with open('ARCHITECTURE.md', 'w', encoding='utf-16-le') as f:
    f.write(content)

print('ARCHITECTURE.md updated')
