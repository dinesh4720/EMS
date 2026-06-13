#!/usr/bin/env python3
"""
Bulk-replace hardcoded HeroUI semantic Tailwind classes with design-system tokens.
Run from school-dashboard directory:
    python scripts/fix_tokens.py src/pages/students/ src/components/students/
"""

import sys
import re
from pathlib import Path

REPLACEMENTS = [
    # backgrounds
    (r'\bbg-background\b', 'bg-surface'),
    (r'\bbg-content1\b', 'bg-surface'),
    (r'\bbg-default-50\b', 'bg-surface-2'),
    (r'\bbg-default-100\b', 'bg-surface-2'),
    (r'\bbg-primary-50\b', 'bg-[var(--accent-bg)]'),
    (r'\bbg-primary-50/20\b', 'bg-[var(--accent-bg)]'),
    (r'\bbg-success-50\b', 'bg-[var(--ok-bg)]'),
    (r'\bbg-success-50/50\b', 'bg-[var(--ok-bg)]'),
    (r'\bbg-danger-50\b', 'bg-[var(--danger-bg)]'),
    (r'\bbg-warning-50\b', 'bg-[var(--warn-bg)]'),
    (r'\bbg-warning-50/50\b', 'bg-[var(--warn-bg)]'),
    (r'\bbg-secondary-50\b', 'bg-[var(--info-bg)]'),
    (r'\bbg-secondary-50/50\b', 'bg-[var(--info-bg)]'),

    # borders
    (r'\bborder-default-200\b', 'border-divider'),
    (r'\bborder-default-100\b', 'border-divider'),
    (r'\bborder-default-300\b', 'border-border-token'),
    (r'\bborder-success-200\b', 'border-[var(--ok)]/20'),
    (r'\bborder-success-300\b', 'border-[var(--ok)]/20'),
    (r'\bborder-danger-200\b', 'border-[var(--danger)]/20'),
    (r'\bborder-danger-100\b', 'border-[var(--danger)]/20'),
    (r'\bborder-warning-200\b', 'border-[var(--warn)]/20'),
    (r'\bborder-warning-100\b', 'border-[var(--warn)]/20'),
    (r'\bborder-secondary-200\b', 'border-[var(--info)]/20'),
    (r'\bborder-primary-200\b', 'border-[var(--accent)]/20'),

    # text
    (r'\btext-default-500\b', 'text-fg-muted'),
    (r'\btext-default-400\b', 'text-fg-faint'),
    (r'\btext-default-600\b', 'text-fg-subtle'),
    (r'\btext-default-700\b', 'text-fg'),
    (r'\btext-default-300\b', 'text-fg-faint'),
    (r'\btext-primary-600\b', 'text-[var(--accent)]'),
    (r'\btext-primary-700\b', 'text-[var(--accent)]'),
    (r'\btext-success-700\b', 'text-[var(--ok)]'),
    (r'\btext-success-600\b', 'text-[var(--ok)]'),
    (r'\btext-danger-700\b', 'text-[var(--danger)]'),
    (r'\btext-danger-600\b', 'text-[var(--danger)]'),
    (r'\btext-warning-700\b', 'text-[var(--warn)]'),
    (r'\btext-warning-600\b', 'text-[var(--warn)]'),
    (r'\btext-secondary-700\b', 'text-[var(--info)]'),
    (r'\btext-secondary-600\b', 'text-[var(--info)]'),

    # hover borders
    (r'\bhover:border-default-300\b', 'hover:border-border-strong'),
    (r'\bhover:border-primary-400\b', 'hover:border-[var(--accent)]'),
    (r'\bhover:bg-default-50\b', 'hover:bg-surface-2'),
    (r'\bhover:bg-default-100\b', 'hover:bg-surface-2'),
    (r'\bhover:bg-success-50\b', 'hover:bg-[var(--ok-bg)]'),
]

EXTENSIONS = {'.jsx', '.js', '.tsx', '.ts'}

def process_file(path: Path):
    original = path.read_text(encoding='utf-8')
    text = original
    changed = False
    for pattern, replacement in REPLACEMENTS:
        new_text, count = re.subn(pattern, replacement, text)
        if count:
            text = new_text
            changed = True
    if changed:
        path.write_text(text, encoding='utf-8')
        print(f"  updated {path}")

def main():
    roots = sys.argv[1:] or ['src/pages/students/', 'src/components/students/']
    for root in roots:
        for path in Path(root).rglob('*'):
            if path.suffix in EXTENSIONS:
                process_file(path)

if __name__ == '__main__':
    main()
