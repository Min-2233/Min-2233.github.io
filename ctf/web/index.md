---
title: Web 笔记
---

<style>
.note-list { list-style: none; padding: 0; margin: 28px 0; max-width: 760px; }
.note-list li { margin: 12px 0; }
.note-list a {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border: 1px solid #e5e7eb; border-radius: 10px;
  background: #fff; color: #111827 !important; text-decoration: none !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .05);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.note-list a:hover { border-color: #2563eb; box-shadow: 0 4px 16px rgba(37, 99, 235, .18); }
.arrow { color: #2563eb; font-weight: 700; }
</style>

# Web 笔记

<p style="color:#6b7280;">点击标题进入文章</p>

<ul class="note-list">
{% assign notes = site.pages | where_exp: "p", "p.path contains 'ctf/web/'" | where_exp: "p", "p.name != 'index.md'" | sort: "name" %}
{% for note in notes %}
  <li>
    <a href="{{ note.url | relative_url }}">
      <span>{{ note.title | default: note.name }}</span>
      <span class="arrow">→</span>
    </a>
  </li>
{% else %}
  <li><a href="#"><span>还没有笔记</span><span class="arrow">→</span></a></li>
{% endfor %}
</ul>
