/* ═══════════════════════════════════════════════════
   DJANGO PILOT — script.js
   Orion Labs © 2025
═══════════════════════════════════════════════════ */

'use strict';

/* ────────────────────────────────────────────────────
   MOCK DATA
──────────────────────────────────────────────────── */

const MOCK_PROJECTS = {
  blog: {
    name: 'Blog App',
    files: [
      { type: 'folder', name: 'myblog/', level: 0 },
      { type: 'file',   name: 'manage.py',       level: 1, tab: 'fullcode'   },
      { type: 'file',   name: 'settings.py',     level: 1, tab: 'fullcode'   },
      { type: 'folder', name: 'blog/',            level: 1 },
      { type: 'file',   name: 'models.py',        level: 2, tab: 'models'    },
      { type: 'file',   name: 'views.py',         level: 2, tab: 'views'     },
      { type: 'file',   name: 'urls.py',          level: 2, tab: 'urls'      },
      { type: 'folder', name: 'templates/',       level: 2 },
      { type: 'file',   name: 'base.html',        level: 3, tab: 'templates' },
      { type: 'file',   name: 'post_list.html',   level: 3, tab: 'templates' },
      { type: 'file',   name: 'post_detail.html', level: 3, tab: 'templates' },
    ],
    code: {
      structure: `<span class="cm"># Django Pilot — Generated Project Structure</span>
<span class="cm"># Blog App with Authentication & Comments</span>

myblog/
├── manage.py
├── requirements.txt
├── myblog/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── blog/
    ├── models.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    ├── forms.py
    └── templates/
        ├── base.html
        ├── post_list.html
        ├── post_detail.html
        ├── post_form.html
        └── registration/
            ├── login.html
            └── register.html`,

      models: `<span class="kw">from</span> django.db <span class="kw">import</span> models
<span class="kw">from</span> django.contrib.auth.models <span class="kw">import</span> User

<span class="cm"># ── Tag Model ──────────────────────────────</span>
<span class="kw">class</span> <span class="cl">Tag</span>(models.Model):
    name  = models.<span class="fn">CharField</span>(max_length=<span class="nm">50</span>, unique=<span class="kw">True</span>)
    slug  = models.<span class="fn">SlugField</span>(unique=<span class="kw">True</span>)

    <span class="kw">def</span> <span class="fn">__str__</span>(self):
        <span class="kw">return</span> self.name

<span class="cm"># ── Post Model ─────────────────────────────</span>
<span class="kw">class</span> <span class="cl">Post</span>(models.Model):
    title      = models.<span class="fn">CharField</span>(max_length=<span class="nm">200</span>)
    slug       = models.<span class="fn">SlugField</span>(unique=<span class="kw">True</span>)
    body       = models.<span class="fn">TextField</span>()
    author     = models.<span class="fn">ForeignKey</span>(
                    User, on_delete=models.CASCADE,
                    related_name=<span class="str">'posts'</span>)
    tags       = models.<span class="fn">ManyToManyField</span>(Tag, blank=<span class="kw">True</span>)
    created_at = models.<span class="fn">DateTimeField</span>(auto_now_add=<span class="kw">True</span>)
    updated_at = models.<span class="fn">DateTimeField</span>(auto_now=<span class="kw">True</span>)
    published  = models.<span class="fn">BooleanField</span>(default=<span class="kw">False</span>)

    <span class="kw">class</span> <span class="cl">Meta</span>:
        ordering = [<span class="str">'-created_at'</span>]

    <span class="kw">def</span> <span class="fn">__str__</span>(self):
        <span class="kw">return</span> self.title

<span class="cm"># ── Comment Model ──────────────────────────</span>
<span class="kw">class</span> <span class="cl">Comment</span>(models.Model):
    post       = models.<span class="fn">ForeignKey</span>(
                    Post, on_delete=models.CASCADE,
                    related_name=<span class="str">'comments'</span>)
    author     = models.<span class="fn">ForeignKey</span>(
                    User, on_delete=models.CASCADE)
    text       = models.<span class="fn">TextField</span>()
    created_at = models.<span class="fn">DateTimeField</span>(auto_now_add=<span class="kw">True</span>)

    <span class="kw">def</span> <span class="fn">__str__</span>(self):
        <span class="kw">return</span> <span class="fn">f</span><span class="str">f'Comment by {self.author} on {self.post}'</span>`,

      views: `<span class="kw">from</span> django.shortcuts <span class="kw">import</span> render, get_object_or_404, redirect
<span class="kw">from</span> django.contrib.auth.decorators <span class="kw">import</span> login_required
<span class="kw">from</span> django.contrib <span class="kw">import</span> messages
<span class="kw">from</span> .models <span class="kw">import</span> Post, Comment
<span class="kw">from</span> .forms <span class="kw">import</span> PostForm, CommentForm

<span class="dec">@login_required</span>
<span class="kw">def</span> <span class="fn">post_list</span>(request):
    posts = Post.objects.<span class="fn">filter</span>(published=<span class="kw">True</span>)
    <span class="kw">return</span> <span class="fn">render</span>(request, <span class="str">'blog/post_list.html'</span>, {<span class="str">'posts'</span>: posts})

<span class="kw">def</span> <span class="fn">post_detail</span>(request, slug):
    post = <span class="fn">get_object_or_404</span>(Post, slug=slug, published=<span class="kw">True</span>)
    comments = post.comments.<span class="fn">all</span>()
    form = <span class="fn">CommentForm</span>()

    <span class="kw">if</span> request.method == <span class="str">'POST'</span>:
        form = <span class="fn">CommentForm</span>(request.POST)
        <span class="kw">if</span> form.<span class="fn">is_valid</span>():
            comment = form.<span class="fn">save</span>(commit=<span class="kw">False</span>)
            comment.post   = post
            comment.author = request.user
            comment.<span class="fn">save</span>()
            messages.<span class="fn">success</span>(request, <span class="str">'Comment added!'</span>)
            <span class="kw">return</span> <span class="fn">redirect</span>(<span class="str">'post_detail'</span>, slug=slug)

    <span class="kw">return</span> <span class="fn">render</span>(request, <span class="str">'blog/post_detail.html'</span>, {
        <span class="str">'post'</span>: post, <span class="str">'comments'</span>: comments, <span class="str">'form'</span>: form
    })

<span class="dec">@login_required</span>
<span class="kw">def</span> <span class="fn">post_create</span>(request):
    form = <span class="fn">PostForm</span>(request.POST <span class="kw">or</span> <span class="kw">None</span>)
    <span class="kw">if</span> form.<span class="fn">is_valid</span>():
        post = form.<span class="fn">save</span>(commit=<span class="kw">False</span>)
        post.author = request.user
        post.<span class="fn">save</span>()
        form.<span class="fn">save_m2m</span>()
        <span class="kw">return</span> <span class="fn">redirect</span>(<span class="str">'post_detail'</span>, slug=post.slug)
    <span class="kw">return</span> <span class="fn">render</span>(request, <span class="str">'blog/post_form.html'</span>, {<span class="str">'form'</span>: form})`,

      urls: `<span class="kw">from</span> django.urls <span class="kw">import</span> path
<span class="kw">from</span> . <span class="kw">import</span> views

app_name = <span class="str">'blog'</span>

urlpatterns = [
    path(<span class="str">''</span>,                   views.<span class="fn">post_list</span>,   name=<span class="str">'post_list'</span>),
    path(<span class="str">'post/&lt;slug:slug&gt;/'</span>,  views.<span class="fn">post_detail</span>, name=<span class="str">'post_detail'</span>),
    path(<span class="str">'post/new/'</span>,          views.<span class="fn">post_create</span>, name=<span class="str">'post_create'</span>),
    path(<span class="str">'post/&lt;slug:slug&gt;/edit/'</span>,
                               views.<span class="fn">post_edit</span>,   name=<span class="str">'post_edit'</span>),
    path(<span class="str">'post/&lt;slug:slug&gt;/delete/'</span>,
                               views.<span class="fn">post_delete</span>, name=<span class="str">'post_delete'</span>),
    path(<span class="str">'tag/&lt;slug:slug&gt;/'</span>,   views.<span class="fn">tag_posts</span>,   name=<span class="str">'tag_posts'</span>),
]`,

      templates: `<span class="cm">&lt;!-- base.html ─────────────────────────────────── --&gt;</span>
<span class="str">&lt;!</span><span class="cl">DOCTYPE</span> <span class="kw">html</span><span class="str">&gt;</span>
<span class="str">&lt;</span><span class="cl">html</span> lang=<span class="str">"en"</span><span class="str">&gt;</span>
<span class="str">&lt;</span><span class="cl">head</span><span class="str">&gt;</span>
  <span class="str">&lt;</span><span class="cl">meta</span> charset=<span class="str">"UTF-8"</span><span class="str">&gt;</span>
  <span class="str">&lt;</span><span class="cl">title</span><span class="str">&gt;</span>{% block title %}My Blog{% endblock %}<span class="str">&lt;/</span><span class="cl">title</span><span class="str">&gt;</span>
  <span class="str">&lt;</span><span class="cl">link</span> rel=<span class="str">"stylesheet"</span> href=<span class="str">"{% static 'css/style.css' %}"</span><span class="str">&gt;</span>
<span class="str">&lt;/</span><span class="cl">head</span><span class="str">&gt;</span>
<span class="str">&lt;</span><span class="cl">body</span><span class="str">&gt;</span>
  <span class="str">&lt;</span><span class="cl">nav</span> class=<span class="str">"navbar"</span><span class="str">&gt;</span>
    <span class="str">&lt;</span><span class="cl">a</span> href=<span class="str">"{% url 'blog:post_list' %}"</span><span class="str">&gt;</span>My Blog<span class="str">&lt;/</span><span class="cl">a</span><span class="str">&gt;</span>
    {% if user.is_authenticated %}
      <span class="str">&lt;</span><span class="cl">a</span> href=<span class="str">"{% url 'blog:post_create' %}"</span><span class="str">&gt;</span>+ New Post<span class="str">&lt;/</span><span class="cl">a</span><span class="str">&gt;</span>
      <span class="str">&lt;</span><span class="cl">a</span> href=<span class="str">"{% url 'logout' %}"</span><span class="str">&gt;</span>Logout<span class="str">&lt;/</span><span class="cl">a</span><span class="str">&gt;</span>
    {% else %}
      <span class="str">&lt;</span><span class="cl">a</span> href=<span class="str">"{% url 'login' %}"</span><span class="str">&gt;</span>Login<span class="str">&lt;/</span><span class="cl">a</span><span class="str">&gt;</span>
    {% endif %}
  <span class="str">&lt;/</span><span class="cl">nav</span><span class="str">&gt;</span>

  <span class="str">&lt;</span><span class="cl">main</span><span class="str">&gt;</span>
    {% if messages %}{% for msg in messages %}
      <span class="str">&lt;</span><span class="cl">div</span> class=<span class="str">"alert"</span><span class="str">&gt;</span>{{ msg }}<span class="str">&lt;/</span><span class="cl">div</span><span class="str">&gt;</span>
    {% endfor %}{% endif %}
    {% block content %}{% endblock %}
  <span class="str">&lt;/</span><span class="cl">main</span><span class="str">&gt;</span>
<span class="str">&lt;/</span><span class="cl">body</span><span class="str">&gt;&lt;/</span><span class="cl">html</span><span class="str">&gt;</span>`,

      fullcode: `<span class="cm"># requirements.txt ─────────────────────────────</span>
<span class="str">Django==4.2</span>
<span class="str">Pillow==10.0</span>
<span class="str">django-crispy-forms==2.0</span>
<span class="str">python-decouple==3.8</span>

<span class="cm"># manage.py ──────────────────────────────────────</span>
<span class="kw">import</span> os, sys

<span class="kw">def</span> <span class="fn">main</span>():
    os.environ.<span class="fn">setdefault</span>(
        <span class="str">'DJANGO_SETTINGS_MODULE'</span>,
        <span class="str">'myblog.settings'</span>
    )
    <span class="kw">from</span> django.core.management <span class="kw">import</span> execute_from_command_line
    <span class="fn">execute_from_command_line</span>(sys.argv)

<span class="kw">if</span> __name__ == <span class="str">'__main__'</span>:
    <span class="fn">main</span>()

<span class="cm"># myblog/settings.py (excerpt) ───────────────────</span>
<span class="kw">from</span> decouple <span class="kw">import</span> config

SECRET_KEY = <span class="fn">config</span>(<span class="str">'SECRET_KEY'</span>)
DEBUG      = <span class="fn">config</span>(<span class="str">'DEBUG'</span>, cast=<span class="fn">bool</span>, default=<span class="kw">False</span>)

INSTALLED_APPS = [
    <span class="str">'django.contrib.admin'</span>,
    <span class="str">'django.contrib.auth'</span>,
    <span class="str">'django.contrib.contenttypes'</span>,
    <span class="str">'django.contrib.staticfiles'</span>,
    <span class="str">'crispy_forms'</span>,
    <span class="str">'blog'</span>,
]

LOGIN_URL          = <span class="str">'/accounts/login/'</span>
LOGIN_REDIRECT_URL = <span class="str">'/'</span>
CRISPY_TEMPLATE_PACK = <span class="str">'bootstrap5'</span>`
    }
  },

  ecommerce: {
    name: 'E-Commerce Store',
    files: [
      { type: 'folder', name: 'shop/', level: 0 },
      { type: 'file',   name: 'manage.py',   level: 1, tab: 'fullcode' },
      { type: 'folder', name: 'store/',      level: 1 },
      { type: 'file',   name: 'models.py',   level: 2, tab: 'models'   },
      { type: 'file',   name: 'views.py',    level: 2, tab: 'views'    },
      { type: 'file',   name: 'urls.py',     level: 2, tab: 'urls'     },
      { type: 'folder', name: 'cart/',       level: 1 },
      { type: 'file',   name: 'cart.py',     level: 2, tab: 'fullcode' },
    ],
    code: {
      structure: `shop/\n├── manage.py\n├── store/\n│   ├── models.py\n│   ├── views.py\n│   └── urls.py\n└── cart/\n    ├── cart.py\n    └── views.py`,
      models: `<span class="kw">class</span> <span class="cl">Product</span>(models.Model):\n    name  = models.<span class="fn">CharField</span>(max_length=<span class="nm">200</span>)\n    price = models.<span class="fn">DecimalField</span>(max_digits=<span class="nm">10</span>, decimal_places=<span class="nm">2</span>)\n    stock = models.<span class="fn">IntegerField</span>(default=<span class="nm">0</span>)\n    image = models.<span class="fn">ImageField</span>(upload_to=<span class="str">'products/'</span>)\n\n<span class="kw">class</span> <span class="cl">Order</span>(models.Model):\n    user       = models.<span class="fn">ForeignKey</span>(User, on_delete=models.CASCADE)\n    created_at = models.<span class="fn">DateTimeField</span>(auto_now_add=<span class="kw">True</span>)\n    paid       = models.<span class="fn">BooleanField</span>(default=<span class="kw">False</span>)`,
      views: `<span class="kw">def</span> <span class="fn">product_list</span>(request):\n    products = Product.objects.<span class="fn">filter</span>(stock__gt=<span class="nm">0</span>)\n    <span class="kw">return</span> <span class="fn">render</span>(request, <span class="str">'store/list.html'</span>, {<span class="str">'products'</span>: products})`,
      urls: `urlpatterns = [\n    path(<span class="str">''</span>, views.<span class="fn">product_list</span>, name=<span class="str">'list'</span>),\n    path(<span class="str">'cart/'</span>, views.<span class="fn">cart_detail</span>, name=<span class="str">'cart'</span>),\n    path(<span class="str">'checkout/'</span>, views.<span class="fn">checkout</span>, name=<span class="str">'checkout'</span>),\n]`,
      templates: `<span class="cm">&lt;!-- product_list.html --&gt;</span>\n{% for product in products %}\n<span class="str">&lt;</span><span class="cl">div</span> class=<span class="str">"product-card"</span><span class="str">&gt;</span>\n  <span class="str">&lt;</span><span class="cl">img</span> src=<span class="str">"{{ product.image.url }}"</span><span class="str">&gt;</span>\n  <span class="str">&lt;</span><span class="cl">h3</span><span class="str">&gt;</span>{{ product.name }}<span class="str">&lt;/</span><span class="cl">h3</span><span class="str">&gt;</span>\n  <span class="str">&lt;</span><span class="cl">p</span><span class="str">&gt;</span>{{ product.price }}<span class="str">&lt;/</span><span class="cl">p</span><span class="str">&gt;</span>\n<span class="str">&lt;/</span><span class="cl">div</span><span class="str">&gt;</span>\n{% endfor %}`,
      fullcode: `<span class="cm"># E-Commerce Django project generated by Django Pilot</span>\n<span class="cm"># Includes: Product catalog, Cart, Orders, Stripe payments</span>`
    }
  },

  api: {
    name: 'REST API',
    files: [
      { type: 'folder', name: 'myapi/', level: 0 },
      { type: 'file',   name: 'manage.py',    level: 1, tab: 'fullcode' },
      { type: 'folder', name: 'api/',         level: 1 },
      { type: 'file',   name: 'models.py',    level: 2, tab: 'models'   },
      { type: 'file',   name: 'serializers.py',level: 2, tab: 'fullcode'},
      { type: 'file',   name: 'views.py',     level: 2, tab: 'views'    },
      { type: 'file',   name: 'urls.py',      level: 2, tab: 'urls'     },
    ],
    code: {
      structure: `myapi/\n├── manage.py\n├── requirements.txt\n└── api/\n    ├── models.py\n    ├── serializers.py\n    ├── views.py\n    └── urls.py`,
      models: `<span class="kw">class</span> <span class="cl">Article</span>(models.Model):\n    title   = models.<span class="fn">CharField</span>(max_length=<span class="nm">200</span>)\n    content = models.<span class="fn">TextField</span>()\n    author  = models.<span class="fn">ForeignKey</span>(User, on_delete=models.CASCADE)\n    created = models.<span class="fn">DateTimeField</span>(auto_now_add=<span class="kw">True</span>)`,
      views: `<span class="kw">from</span> rest_framework <span class="kw">import</span> viewsets\n<span class="kw">from</span> .serializers <span class="kw">import</span> ArticleSerializer\n\n<span class="kw">class</span> <span class="cl">ArticleViewSet</span>(viewsets.ModelViewSet):\n    queryset = Article.objects.<span class="fn">all</span>()\n    serializer_class = ArticleSerializer\n    permission_classes = [IsAuthenticated]`,
      urls: `<span class="kw">from</span> rest_framework.routers <span class="kw">import</span> DefaultRouter\nrouter = <span class="fn">DefaultRouter</span>()\nrouter.<span class="fn">register</span>(<span class="str">'articles'</span>, ArticleViewSet)`,
      templates: `<span class="cm"># No templates — this is a pure REST API</span>\n<span class="cm"># Use the browsable API at /api/</span>`,
      fullcode: `<span class="cm"># REST API with JWT Auth — Django Pilot</span>\n<span class="cm"># djangorestframework + SimpleJWT</span>`
    }
  }
};

const AI_RESPONSES = {
  default: [
    "Analyzing your idea…",
    "Designing data models…",
    "Generating views and URLs…",
    "Building templates…",
    "Wiring authentication…",
    "Project ready! ✓"
  ]
};

/* ────────────────────────────────────────────────────
   STATE
──────────────────────────────────────────────────── */
let currentProject = null;
let currentTab     = 'structure';
let isGenerating   = false;
let isDark         = true;
let sidebarOpen    = true;

/* ────────────────────────────────────────────────────
   PARTICLES CANVAS
──────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function mkParticle() {
    return {
      x:   Math.random() * W,
      y:   Math.random() * H,
      r:   Math.random() * 1.5 + 0.3,
      vx:  (Math.random() - 0.5) * 0.3,
      vy:  (Math.random() - 0.5) * 0.3,
      o:   Math.random() * 0.5 + 0.1
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const color = isDark ? '255,255,255' : '79,142,255';
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

/* ────────────────────────────────────────────────────
   SCROLL ANIMATIONS
──────────────────────────────────────────────────── */
(function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); }
    }),
    { threshold: 0.15 }
  );

  document.querySelectorAll('.feature-card, .demo-mockup').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
})();

/* ────────────────────────────────────────────────────
   NAV SCROLL EFFECT
──────────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('landing-nav');
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

 

function showExport() {
  const bar = document.getElementById('export-bar');
  if (bar) {
    bar.style.display = 'flex';
    bar.style.animation = 'fadeIn 0.3s ease';
  }
}

/* ────────────────────────────────────────────────────
   SIDEBAR
──────────────────────────────────────────────────── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sidebarOpen = !sidebarOpen;
  sb.classList.toggle('collapsed', !sidebarOpen);
}

function switchNav(el) {
  document.querySelectorAll('.snav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

/* ────────────────────────────────────────────────────
   DARK MODE
──────────────────────────────────────────────────── */
function toggleDarkMode() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
  showToast(isDark ? 'Dark mode on' : 'Light mode on');
}

/* ────────────────────────────────────────────────────
   CHAT
──────────────────────────────────────────────────── */
function usePrompt(btn) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = btn.textContent;
    input.focus();
  }
  // Remove suggestions after click
  btn.closest('.prompt-suggestions')?.remove();
}

function handleInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isGenerating) return;

  appendUserBubble(text);
  input.value = '';

  // Detect project type
  const lower = text.toLowerCase();
  let projectKey = 'blog';
  if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('shop') || lower.includes('cart'))
    projectKey = 'ecommerce';
  else if (lower.includes('api') || lower.includes('rest') || lower.includes('jwt'))
    projectKey = 'api';

  triggerGenerate(projectKey, text);
}

function appendUserBubble(text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-bubble user';
  div.innerHTML = `
    <div class="bubble-avatar">U</div>
    <div class="bubble-body"><p>${escapeHtml(text)}</p></div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendAiBubble(text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-bubble ai';
  div.innerHTML = `
    <div class="bubble-avatar">⬡</div>
    <div class="bubble-body"><p>${text}</p></div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function clearChat() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = `
    <div class="chat-bubble ai">
      <div class="bubble-avatar">⬡</div>
      <div class="bubble-body">
        <p>Chat cleared. Describe a new Django project to generate.</p>
      </div>
    </div>
    <div class="prompt-suggestions" id="prompt-suggestions">
      <div class="ps-label">Try an example:</div>
      <button class="ps-btn" onclick="usePrompt(this)">Blog with auth &amp; comments</button>
      <button class="ps-btn" onclick="usePrompt(this)">E-commerce store with cart</button>
      <button class="ps-btn" onclick="usePrompt(this)">REST API with JWT auth</button>
      <button class="ps-btn" onclick="usePrompt(this)">Task management app</button>
    </div>
  `;
  resetPreview();
}

/* ────────────────────────────────────────────────────
   GENERATE
──────────────────────────────────────────────────── */
function triggerGenerate(projectKey, userPrompt) {
  if (isGenerating) return;
  if (!projectKey) {
    const input = document.getElementById('chat-input');
    const text = input?.value?.trim();
    if (!text) { showToast('Enter a project description first'); return; }
    sendMessage(); return;
  }

  isGenerating = true;
  const project = MOCK_PROJECTS[projectKey] || MOCK_PROJECTS.blog;
  currentProject = project;

  setStatus('loading', 'Generating…');
  const genBtn = document.getElementById('generate-btn');
  if (genBtn) { genBtn.classList.add('generating'); genBtn.querySelector('span').textContent = '⚡ Working…'; }

  // Show loading in preview
  showLoading(true);
  document.getElementById('export-bar').style.display = 'none';

  // Animate through AI steps in chat
  const steps = AI_RESPONSES.default;
  let stepIdx = 0;
  const thinkBubble = appendAiBubble(`<span class="typing-dots"><span></span><span></span><span></span></span>`);

  const stepInterval = setInterval(() => {
    const label = document.getElementById('loading-label');
    if (label && stepIdx < steps.length) {
      label.textContent = steps[stepIdx];
    }
    stepIdx++;
    if (stepIdx >= steps.length) {
      clearInterval(stepInterval);
      setTimeout(() => {
        finishGenerate(project, thinkBubble);
      }, 400);
    }
  }, 500);
}

function finishGenerate(project, thinkBubble) {
  // Update thinking bubble
  if (thinkBubble) {
    const p = thinkBubble.querySelector('.bubble-body p');
    if (p) p.innerHTML = `✅ <strong>${project.name}</strong> generated! Here's your project.`;
  }

  // Build file tree
  buildFileTree(project.files);

  // Show code
  showLoading(false);
  switchTab(document.querySelector('.ctab[data-tab="structure"]'));
  showCode(project.code.structure);
  document.getElementById('export-bar').style.display = 'flex';

  setStatus('success', `${project.name} ready`);
  const genBtn = document.getElementById('generate-btn');
  if (genBtn) {
    genBtn.classList.remove('generating');
    genBtn.querySelector('span').textContent = '⚡ Generate';
  }

  isGenerating = false;
  showToast(`✅ ${project.name} generated!`);

  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function newProject() {
  clearChat();
  setStatus('idle', 'Ready');
  showToast('New project started');
}

function loadProject(key) {
  appendAiBubble(`Loading <strong>${MOCK_PROJECTS[key]?.name || key}</strong>…`);
  triggerGenerate(key, '');
}

function resetPreview() {
  showLoading(false, false);
  document.getElementById('code-placeholder').style.display = 'flex';
  document.getElementById('code-display').style.display = 'none';
  document.getElementById('ft-empty').style.display = 'block';
  document.getElementById('ft-tree').style.display = 'none';
  document.getElementById('export-bar').style.display = 'none';
  setStatus('idle', 'Ready');
  currentProject = null;
}

/* ────────────────────────────────────────────────────
   FILE TREE
──────────────────────────────────────────────────── */
function buildFileTree(files) {
  const tree = document.getElementById('ft-tree');
  const empty = document.getElementById('ft-empty');
  tree.innerHTML = '';

  files.forEach(f => {
    const el = document.createElement('div');
    const indent = f.level * 10;

    if (f.type === 'folder') {
      el.className = 'ft-folder';
      el.style.paddingLeft = `${indent + 10}px`;
      el.innerHTML = `<span>📁</span> ${f.name}`;
    } else {
      el.className = 'ft-file';
      el.style.paddingLeft = `${indent + 10}px`;
      el.innerHTML = `<span>${getFileIcon(f.name)}</span> ${f.name}`;
      el.onclick = () => selectFile(el, f.tab);
    }

    tree.appendChild(el);
  });

  empty.style.display = 'none';
  tree.style.display = 'block';
}

function selectFile(el, tab) {
  document.querySelectorAll('.ft-file').forEach(f => f.classList.remove('active'));
  el.classList.add('active');
  if (tab && currentProject) {
    const tabEl = document.querySelector(`.ctab[data-tab="${tab}"]`);
    if (tabEl) switchTab(tabEl);
  }
}

function getFileIcon(name) {
  if (name.endsWith('.py'))   return '🐍';
  if (name.endsWith('.html')) return '📄';
  if (name.endsWith('.css'))  return '🎨';
  if (name.endsWith('.txt'))  return '📝';
  if (name.endsWith('.js'))   return '⚡';
  return '📄';
}

/* ────────────────────────────────────────────────────
   TABS
──────────────────────────────────────────────────── */
function switchTab(el) {
  document.querySelectorAll('.ctab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentTab = el.dataset.tab;

  if (currentProject && currentProject.code[currentTab]) {
    showCode(currentProject.code[currentTab]);
  } else if (!currentProject) {
    // no project yet — keep placeholder
  }
}

/* ────────────────────────────────────────────────────
   CODE DISPLAY
──────────────────────────────────────────────────── */
function showLoading(show, showSkeleton = true) {
  const ph    = document.getElementById('code-placeholder');
  const load  = document.getElementById('loading-state');
  const disp  = document.getElementById('code-display');

  if (show) {
    ph.style.display   = 'none';
    load.style.display = 'flex';
    disp.style.display = 'none';
  } else {
    load.style.display = 'none';
  }
}

function showCode(html) {
  const ph   = document.getElementById('code-placeholder');
  const disp = document.getElementById('code-display');
  const content = document.getElementById('code-content');

  ph.style.display   = 'none';
  disp.style.display = 'block';
  content.innerHTML  = html;

  // Animate in
  disp.style.opacity = '0';
  requestAnimationFrame(() => {
    disp.style.transition = 'opacity 0.3s ease';
    disp.style.opacity = '1';
  });
}

/* ────────────────────────────────────────────────────
   STATUS
──────────────────────────────────────────────────── */
function setStatus(state, text) {
  const dot  = document.querySelector('.status-dot');
  const label = document.getElementById('status-text');
  if (dot)   { dot.className = `status-dot ${state}`; }
  if (label) { label.textContent = text; }
}

/* ────────────────────────────────────────────────────
   ACTIONS
──────────────────────────────────────────────────── */
function copyCode() {
  const content = document.getElementById('code-content');
  if (!content) return;
  const text = content.innerText || content.textContent;
  navigator.clipboard?.writeText(text).then(() => {
    showToast('📋 Copied to clipboard!');
  }).catch(() => {
    showToast('📋 Code copied!');
  });
}

function exportAction(type) {
  const labels = {
    zip:    '📦 Downloading ZIP…',
    github: '🐙 Pushing to GitHub…',
    deploy: '🚀 Deploying project…',
    save:   '💾 Project saved!'
  };
  showToast(labels[type] || 'Done!');

  // Simulate brief loader
  if (type !== 'save') {
    setStatus('loading', labels[type].replace('…', ''));
    setTimeout(() => {
      setStatus('success', 'Done!');
    }, 2000);
  }
}

/* ────────────────────────────────────────────────────
   TOAST
──────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ────────────────────────────────────────────────────
   RESIZE HANDLE (drag to resize panels)
──────────────────────────────────────────────────── */
(function initResize() {
  const handle = document.getElementById('resize-handle');
  const chatPanel = document.getElementById('chat-panel');
  if (!handle || !chatPanel) return;

  let dragging = false, startX = 0, startW = 0;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startW = chatPanel.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const newW = Math.max(240, Math.min(600, startW + (e.clientX - startX)));
    chatPanel.style.width = `${newW}px`;
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });
})();

/* ────────────────────────────────────────────────────
   DEMO MOCKUP TABS
──────────────────────────────────────────────────── */
document.querySelectorAll('.mp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mp-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

/* ────────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────────── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ────────────────────────────────────────────────────
   HERO HEADLINE TYPING ANIMATION (optional tagline)
──────────────────────────────────────────────────── */
(function initTagline() {
  const tagline = document.querySelector('.hero-tagline');
  if (!tagline) return;
  const texts = [
    'No config. No boilerplate. Just your idea.',
    'Django apps from natural language.',
    'Powered by Orion Labs AI.',
    'From idea to code in seconds.'
  ];
  let idx = 0;

  setInterval(() => {
    tagline.style.opacity = '0';
    tagline.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      idx = (idx + 1) % texts.length;
      tagline.textContent = texts[idx];
      tagline.style.opacity = '1';
    }, 400);
  }, 3500);
})();

/* ────────────────────────────────────────────────────
   STAGGER FEATURE CARDS
──────────────────────────────────────────────────── */
document.querySelectorAll('.feature-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.07}s`;
});