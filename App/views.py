from __future__ import annotations

from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model, login as auth_login 
from django.contrib.auth.models import auth
from django.contrib.auth.hashers import make_password 
from django.contrib.auth.decorators import login_required
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail, BadHeaderError
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django_ratelimit.decorators import ratelimit
from .tokens import email_verification_token, password_reset_token
from django.utils import timezone 

User = get_user_model()


"""
DjangoPilot AI Engine — views.py
=================================
Production-grade AI project generator using Claude API.
 
Pipeline:
  1. Classify   → claude-haiku-4-5  (cheap, fast)
  2. Plan       → claude-sonnet-4-6 (structured file manifest)
  3. Generate   → claude-sonnet-4-6 (file-by-file, streamed)
  4. Review     → claude-sonnet-4-6 (security + bug audit)
  5. Cache      → SHA-256 hash key  (never re-generate identical prompts)
"""
 

 
import hashlib
import json
import logging
import time
from typing import Generator
 
from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
 
from .models import AIProjectCache, GeneratedFile
from .prompts import (
    BACKEND_FILE_PROMPT,
    CLASSIFICATION_PROMPT,
    FRONTEND_FILE_PROMPT,
    PLANNING_PROMPT,
    REVIEW_PROMPT,
)
 
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client — instantiated once, reused across requests 
# ---------------------------------------------------------------------------
client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)




# ─────────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────────
@ratelimit(key='ip', rate='5/m', block=True)
def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '').strip()
        last_name  = request.POST.get('last_name', '').strip()
        email      = request.POST.get('email', '').strip().lower()
        password   = request.POST.get('password', '').strip()
        password2  = request.POST.get('confirm_password', '').strip()

        # Validation
        if not first_name or not last_name:
            messages.error(request, "First and last name are required.")
            return render(request, 'register.html')

        if not email:
            messages.error(request, "Email address is required.")
            return render(request, 'register.html')

        if not password or not password2:
            messages.error(request, "Please fill in both password fields.")
            return render(request, 'register.html')

        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "Please enter a valid email address.")
            return render(request, 'register.html')

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters.")
            return render(request, 'register.html')

        if password != password2:
            messages.error(request, "Passwords do not match.")
            return render(request, 'register.html')

        if User.objects.filter(email=email).exists():
            messages.error(request, "An account with that email already exists.")
            return render(request, 'register.html')

        # Username generation
        base_username = f"{first_name}_{last_name}".lower()
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Create user FIRST (inactive)
        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=make_password(password),
            is_active=False,
        )

        try:
            domain = get_current_site(request).domain
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token.make_token(user)

            verification_link = f"http://{domain}/verify-email/{uid}/{token}/"

            send_mail(
                subject="Verify your DjangoPilot account",
                message=(
                    f"Welcome to DjangoPilot!\n\n"
                    f"Click the link below to verify your email:\n\n"
                    f"{verification_link}\n\n"
                    f"This link expires in 24 hours."
                ),
                from_email="noreply@djangopilot.com",
                recipient_list=[email],
                fail_silently=False,
            )

        except BadHeaderError:
            user.delete()
            messages.error(request, "Invalid email header.")
            return render(request, 'register.html')

        except Exception: 
            user.delete()
            messages.error(request, "Email address does not exist or could not receive mail.")
            return render(request, 'register.html')

        return render(request, 'verify_pending.html', {'email': email})

    return render(request, 'register.html')


# ─────────────────────────────────────────────
# EMAIL VERIFICATION
# ─────────────────────────────────────────────
def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        return render(request, 'verify_result.html', {
            'status': 'invalid',
            'heading': 'Invalid link',
            'message': 'Verification link is invalid.',
        })

    if email_verification_token.check_token(user, token):
        user.is_active = True
        user.is_email_verified = True
        user.save()

        return render(request, 'verify_result.html', {
            'status': 'success',
            'heading': 'Email verified',
            'message': 'Your account is now active.',
        })

    return render(request, 'verify_result.html', {
        'status': 'expired',
        'heading': 'Link expired',
        'message': 'Verification link expired.',
    })
    
# ─────────────────────────────────────────────
#  LOGIN  (email + password)
# ─────────────────────────────────────────────

@ratelimit(key='ip', rate='10/m', block=True)
def login(request):
    # Already authenticated — skip the login page
    if request.user.is_authenticated:
        return redirect('dashboard')
 
    if request.method == 'POST':
        email    = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '').strip()
 
        # Both fields required
        if not email or not password:
            messages.error(request, "Please enter your email and password.")
            return render(request, 'login.html')
 
        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, "No account found with that email address.")
            return render(request, 'login.html')
 
        # Account not yet verified
        if not user.is_active:
            messages.error(request, "Please verify your email before signing in.")
            return render(request, 'login.html')
 
        # Wrong password
        if not user.check_password(password):
            messages.error(request, "Incorrect password. Please try again.")
            return render(request, 'login.html')
 
        # Success — create session
        auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return redirect('dashboard')
 
    return render(request, 'login.html')
 
 

# ─────────────────────────────────────────────
# RESEND VERIFICATION
# ─────────────────────────────────────────────
def resend_verification(request):
    if request.method != 'POST':
        return redirect('register')

    email = request.POST.get('email', '').strip().lower()

    try:
        user = User.objects.get(email=email, is_active=False)
    except User.DoesNotExist:
        return render(request, 'verify_pending.html', {'email': email})

    try:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)
        domain = get_current_site(request).domain

        verification_link = f"http://{domain}/verify-email/{uid}/{token}/"

        send_mail(
            "Verify your DjangoPilot account",
            f"Click here to verify:\n{verification_link}",
            "noreply@djangopilot.com",
            [email],
            fail_silently=False,
        )

    except Exception:
        messages.error(request, "Could not resend email.")
        return render(request, 'verify_pending.html', {'email': email})

    return render(request, 'verify_pending.html', {'email': email, 'resent': True})

def logout(request):
    auth.logout(request)
    return redirect('login')

def forgot_password(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()

        if not email:
            messages.error(request, "Please enter your email.")
            return render(request, "forgot_password.html")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, "No account found with that email.")
            return render(request, "forgot_password.html")

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = password_reset_token.make_token(user)
        domain = get_current_site(request).domain

        reset_link = f"http://{domain}/reset-password/{uid}/{token}/"

        send_mail(
            "Reset your DjangoPilot password",
            f"Click the link below to reset your password:\n\n{reset_link}",
            "noreply@djangopilot.com",
            [email],
            fail_silently=False,
        )

        return render(request, "reset_email_sent.html", {"email": email})

    return render(request, "forgot_password.html")

def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        return render(request, "reset_result.html", {
            "status": "invalid",
            "message": "Invalid reset link."
        })

    if not password_reset_token.check_token(user, token):
        return render(request, "reset_result.html", {
            "status": "expired",
            "message": "Reset link expired."
        })

    if request.method == "POST":
        password = request.POST.get("password", "").strip()
        confirm = request.POST.get("confirm_password", "").strip()

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters.")
            return render(request, "reset_password.html")

        if password != confirm:
            messages.error(request, "Passwords do not match.")
            return render(request, "reset_password.html")

        user.password = make_password(password)
        user.save()

        return render(request, "reset_result.html", {
            "status": "success",
            "message": "Your password has been reset successfully."
        })

    return render(request, "reset_password.html")



def _model_for_complexity(complexity: str) -> str:
    """
    Route to the cheapest model that can handle the task.
    Currently Sonnet handles everything above classification;
    swap in Opus here if you ever need frontier-level reasoning.
    """
    return SONNET 


# ---------------------------------------------------------------------------
# Retry wrapper — handles transient API errors gracefully
# ---------------------------------------------------------------------------
 
def _call_with_retry(fn, retries: int = 3, base_delay: float = 1.5):
    """
    Calls `fn()` up to `retries` times with exponential back-off.
    Raises the last exception if all attempts fail.
    """
    for attempt in range(retries):
        try:
            return fn()
        except (APITimeoutError, RateLimitError) as exc:
            if attempt == retries - 1:
                raise
            sleep_for = base_delay * (2 ** attempt)
            logger.warning("Anthropic API transient error (%s). Retrying in %.1fs…", exc, sleep_for)
            time.sleep(sleep_for)
        except APIError as exc:
            # Non-retryable — surface immediately
            raise

# ---------------------------------------------------------------------------
# Step 1 — Classification  (Haiku, ~50–100 tokens)
# ---------------------------------------------------------------------------
 
def classify_prompt(prompt: str) -> dict:
    """
    Returns a structured dict describing the project type and requirements.
    Uses the cheapest model; output is always JSON.
    """
    def _call():
        return client.messages.create(
            model=HAIKU,
            max_tokens=300,
            temperature=0,
            system=CLASSIFICATION_PROMPT["system"],
            messages=[{"role": "user", "content": CLASSIFICATION_PROMPT["user"].format(prompt=prompt)}],
        )
 
    response = _call_with_retry(_call)
    raw = response.content[0].text.strip()
 
    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Step 2 — Project Planning  (Sonnet, ~300–600 tokens)
# ---------------------------------------------------------------------------
 
def plan_project(prompt: str, classification: dict, model: str) -> dict:
    """
    Returns a manifest: ordered list of files to generate with their purpose.
    Example manifest item: {"path": "backend/models.py", "type": "backend", "description": "..."}
    """
    def _call():
        return client.messages.create(
            model=model,
            max_tokens=1000,
            temperature=0,
            system=PLANNING_PROMPT["system"],
            messages=[{
                "role": "user",
                "content": PLANNING_PROMPT["user"].format(
                    prompt=prompt,
                    classification=json.dumps(classification, indent=2),
                ),
            }],
        )
 
    response = _call_with_retry(_call)
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Step 3 — File-by-file generation  (Sonnet, streamed)
# ---------------------------------------------------------------------------
 
def generate_file(
    file_spec: dict,
    prompt: str,
    plan: dict,
    previously_generated: dict[str, str],
    model: str,
) -> str:
    """
    Generates a single file.  Passes previously-generated files as context so
    that imports, model names, and API routes stay consistent across files.
    """
    is_frontend = file_spec.get("type") == "frontend"
    template = FRONTEND_FILE_PROMPT if is_frontend else BACKEND_FILE_PROMPT
 
    context_snippet = "\n\n".join(
        f"### {path}\n```python\n{code}\n```"
        for path, code in list(previously_generated.items())[-3:]  # last 3 files only — saves tokens
    )
 
    def _call():
        return client.messages.create(
            model=model,
            max_tokens=3000,
            temperature=0.1,
            system=template["system"],
            messages=[{
                "role": "user",
                "content": template["user"].format(
                    prompt=prompt,
                    plan=json.dumps(plan, indent=2),
                    file_path=file_spec["path"],
                    file_description=file_spec["description"],
                    context=context_snippet or "No prior files yet.",
                ),
            }],
        )
 
    response = _call_with_retry(_call)
    return response.content[0].text


# ---------------------------------------------------------------------------
# Step 4 — Security + Bug Review  (Sonnet)
# ---------------------------------------------------------------------------
 
def review_project(generated_files: dict[str, str], model: str) -> str:
    """
    Audits the full generated project for security issues, bugs, and
    Django best-practice violations.  Returns a markdown report.
    """
    files_dump = "\n\n".join(
        f"### {path}\n```\n{code[:1500]}\n```"   # truncate very long files
        for path, code in generated_files.items()
    )
 
    def _call():
        return client.messages.create(
            model=model,
            max_tokens=2000,
            temperature=0,
            system=REVIEW_PROMPT["system"],
            messages=[{
                "role": "user",
                "content": REVIEW_PROMPT["user"].format(files=files_dump),
            }],
        )
 
    return _call_with_retry(_call).content[0].text



# ---------------------------------------------------------------------------
# Cache key
# ---------------------------------------------------------------------------
 
def _cache_key(prompt: str) -> str:
    """SHA-256 of the lowercased, whitespace-normalised prompt."""
    normalised = " ".join(prompt.lower().split())
    return hashlib.sha256(normalised.encode()).hexdigest()
 
 
# ---------------------------------------------------------------------------
# SSE streaming helper
# ---------------------------------------------------------------------------
 
def _sse(event: str, data: dict) -> str:
    """Formats a Server-Sent Events message."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
 
 
# ---------------------------------------------------------------------------
# Main view — streaming SSE endpoint
# ---------------------------------------------------------------------------

@csrf_exempt
@require_POST
def generate_project(request):
    """
    POST /api/generate/
    Body: {"prompt": "Build a fintech SaaS with React and Django"}
 
    Returns Server-Sent Events stream so the frontend can show live progress.
    Each SSE event has a type: step_start | file_done | review_done | cached | error | done
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
 
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        return JsonResponse({"error": "prompt is required"}, status=400)
 
    def _stream() -> Generator[str, None, None]:
        cache_key = _cache_key(prompt)
 
        # ── Cache hit ──────────────────────────────────────────────────────
        cached = AIProjectCache.objects.filter(cache_key=cache_key).first()
        if cached:
            files = {f.path: f.content for f in cached.files.all()}
            yield _sse("cached", {
                "classification": cached.classification,
                "plan": cached.plan,
                "files": files,
                "review": cached.review,
            })
            return
 
        try:
            # ── Step 1: Classify ──────────────────────────────────────────
            yield _sse("step_start", {"step": "classify", "message": "Analysing your project…"})
            classification = classify_prompt(prompt)
            yield _sse("step_done", {"step": "classify", "data": classification})
 
            model = _model_for_complexity(classification.get("complexity", "medium"))
 
            # ── Step 2: Plan ──────────────────────────────────────────────
            yield _sse("step_start", {"step": "plan", "message": "Planning project structure…"})
            plan = plan_project(prompt, classification, model)
            yield _sse("step_done", {"step": "plan", "data": plan})
 
            # ── Step 3: Generate files ────────────────────────────────────
            generated: dict[str, str] = {}
            files_list: list[dict] = plan.get("files", [])
 
            for idx, file_spec in enumerate(files_list):
                yield _sse("step_start", {
                    "step": "generate",
                    "message": f"Generating {file_spec['path']} ({idx + 1}/{len(files_list)})…",
                    "file": file_spec["path"],
                })
                code = generate_file(file_spec, prompt, plan, generated, model)
                generated[file_spec["path"]] = code
                yield _sse("file_done", {"path": file_spec["path"], "content": code})
 
            # ── Step 4: Review ────────────────────────────────────────────
            yield _sse("step_start", {"step": "review", "message": "Running security & quality audit…"})
            review = review_project(generated, model)
            yield _sse("review_done", {"review": review})
 
            # ── Persist to cache ──────────────────────────────────────────
            cache_obj = AIProjectCache.objects.create(
                cache_key=cache_key,
                prompt=prompt,
                classification=classification,
                plan=plan,
                review=review,
            )
            for path, content in generated.items():
                GeneratedFile.objects.create(project=cache_obj, path=path, content=content)
 
            yield _sse("done", {"message": "Project generated successfully."})
 
        except Exception as exc:
            logger.exception("DjangoPilot generation error")
            yield _sse("error", {"message": str(exc)})
 
    return StreamingHttpResponse(_stream(), content_type="text/event-stream")
 
 
# ---------------------------------------------------------------------------
# Lightweight status / cache-check endpoint
# ---------------------------------------------------------------------------
 
@csrf_exempt
@require_POST
def check_cache(request):
    """
    POST /api/check-cache/
    Body: {"prompt": "..."}
    Returns {"cached": true/false}
    """
    try:
        body = json.loads(request.body)
        prompt = (body.get("prompt") or "").strip()
        key = _cache_key(prompt)
        exists = AIProjectCache.objects.filter(cache_key=key).exists()
        return JsonResponse({"cached": exists, "cache_key": key})
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    
    
def index(request):
    return render(request, 'index.html')
 
@login_required(login_url='login')
def dashboard(request):
    return render(request, 'dashboard.html')

