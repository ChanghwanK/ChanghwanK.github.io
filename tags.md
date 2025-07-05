---
layout: page
title: Tags
---

<div>
{% assign tags = site.tags | sort %}
{% for tag in tags %}
  <a href="#{{ tag[0] | slugify }}" class="btn btn-primary" >{{ tag[0] }} ({{ tag | last | size }})</a>
{% endfor %}
</div>

<div id="tags">
{% for tag in tags %}
  <div id="{{ tag[0] | slugify }}">
    <h2 >{{ tag[0] }}</h2>
    <ul class="post-list">
    {% for post in tag[1] %}
      <li>
        <span class="post-meta">{{ post.date | date: "%b %-d, %Y" }}</span>
        <h3>
          <a class="post-link" href="{{ post.url | relative_url }}">
            {{ post.title | escape }}
          </a>
        </h3>
      </li>
    {% endfor %}
    </ul>
  </div>
{% endfor %}
</div> 