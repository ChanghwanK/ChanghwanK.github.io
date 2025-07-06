---
layout: page
title: Archive
---

<ul class="post-list">
  {%- for post in site.posts -%}
  <li>
    <h3>
      <a class="post-link" href="{{ post.url | relative_url }}">
        {{ post.title | escape }}
      </a>
    </h3>
    <span class="post-meta">{{ post.date | date: "%b %-d, %Y" }}</span>
  </li>
  {%- endfor -%}
</ul>