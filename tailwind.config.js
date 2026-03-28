@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Student theme (default) — Forest & Gold ── */
:root,
[data-theme="student"] {
  --color-primary:          #173404;
  --color-primary-mid:      #27500a;
  --color-primary-lit:      #3b6d11;
  --color-accent:           #854f0b;
  --color-accent-mid:       #ba7517;
  --color-accent-lit:       #fac775;
  --color-surface:          #eaf3de;
  --color-surface-mid:      #c0dd97;
  --color-highlight:        #faeeda;
  --color-page-bg:          #f6faf2;
  --color-nav-bg:           #173404;
  --color-nav-text:         #c0dd97;
  --color-nav-accent:       #fac775;
  --color-badge-bg:         #eaf3de;
  --color-badge-text:       #27500a;
  --color-btn-bg:           #27500a;
  --color-btn-text:         #c0dd97;
  --color-btn-hover:        #173404;
  --color-accent-btn:       #854f0b;
  --color-accent-btn-text:  #faeeda;
  --color-progress:         #27500a;
  --color-stat-a-bg:        #eaf3de;
  --color-stat-a-text:      #173404;
  --color-stat-a-sub:       #3b6d11;
  --color-stat-b-bg:        #faeeda;
  --color-stat-b-text:      #412402;
  --color-stat-b-sub:       #854f0b;
}

/* ── Tutor theme — Deep Blue & Amber ── */
[data-theme="tutor"] {
  --color-primary:          #042c53;
  --color-primary-mid:      #0c447c;
  --color-primary-lit:      #185fa5;
  --color-accent:           #ba7517;
  --color-accent-mid:       #ef9f27;
  --color-accent-lit:       #fac775;
  --color-surface:          #e6f1fb;
  --color-surface-mid:      #b5d4f4;
  --color-highlight:        #faeeda;
  --color-page-bg:          #f4f8fd;
  --color-nav-bg:           #042c53;
  --color-nav-text:         #b5d4f4;
  --color-nav-accent:       #fac775;
  --color-badge-bg:         #e6f1fb;
  --color-badge-text:       #0c447c;
  --color-btn-bg:           #0c447c;
  --color-btn-text:         #b5d4f4;
  --color-btn-hover:        #042c53;
  --color-accent-btn:       #ba7517;
  --color-accent-btn-text:  #faeeda;
  --color-progress:         #0c447c;
  --color-stat-a-bg:        #e6f1fb;
  --color-stat-a-text:      #042c53;
  --color-stat-a-sub:       #185fa5;
  --color-stat-b-bg:        #faeeda;
  --color-stat-b-text:      #412402;
  --color-stat-b-sub:       #854f0b;
}

* { box-sizing: border-box; }

body {
  font-family: system-ui, sans-serif;
  background-color: var(--color-page-bg);
  color: #111827;
  transition: background-color 0.3s ease;
}

h1, h2, h3 { font-family: Georgia, serif; }
