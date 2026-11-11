#!/usr/bin/env python3
"""Empaqueta src/ en un único dist/index.html (sin dependencias externas). El resultado va en la raíz para GitHub Pages.."""
import pathlib
root = pathlib.Path(__file__).parent
SRC = root / "src"
ORDER = ["params.js", "engine.js", "validate.js", "docs.js", "charts.js", "flowsheet.js", "ui.js"]
js = "\n".join((SRC / f).read_text(encoding="utf-8") for f in ORDER).replace("</script", "<\\/script")
html = (SRC / "template.html").read_text(encoding="utf-8")
html = html.replace("/*__CSS__*/", (SRC / "styles.css").read_text(encoding="utf-8")).replace("/*__JS__*/", js)
out = root / "index.html"

out.write_text(html, encoding="utf-8")
print(f"OK -> {out} ({out.stat().st_size/1024:.0f} KB)")
