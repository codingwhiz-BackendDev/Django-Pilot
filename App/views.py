from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib import messages
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django_ratelimit.decorators import ratelimit
from .tokens import email_verification_token

User = get_user_model()


# ─────────────────────────────────────────────
#  REGISTER
# ─────────────────────────────────────────────
@ratelimit(key='ip', rate='5/m', block=True)
def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '').strip()
        last_name  = request.POST.get('last_name',  '').strip()
        email      = request.POST.get('email',      '').strip().lower()
        password   = request.POST.get('password',   '').strip()
        password2  = request.POST.get('confirm_password', '').strip()

        # ── Validate fields before touching the DB ──────────────
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "Please enter a valid email address.")
            return render(request, 'register.html')   # stay on page — user sees the error

        if password != password2:
            messages.error(request, "Passwords do not match.")
            return render(request, 'register.html')

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters.")
            return render(request, 'register.html')

        if User.objects.filter(email=email).exists():
            messages.error(request, "An account with that email already exists.")
            return render(request, 'register.html')

        # ── Create user ─────────────────────────────────────────
        base_username = f"{first_name}_{last_name}".lower()
        username = base_username
        counter  = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=make_password(password),
            is_active=False,
        )

        # ── Send verification email ─────────────────────────────
        try:
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token.make_token(user)
            domain = get_current_site(request).domain
            verification_link = f"http://{domain}/verify-email/{uid}/{token}/"

            send_mail(
                subject="Verify your DjangoPilot account",
                message=f"""Welcome to DjangoPilot 🚀

Click the link below to verify your email and activate your account:

{verification_link}

This link expires in 24 hours. If you didn't sign up, ignore this email.""",
                from_email="noreply@djangopilot.com",
                recipient_list=[email],
                fail_silently=False,
            )

        except Exception:
            # Email failed — delete the user so they can try again cleanly
            user.delete()
            messages.error(request, "Could not send verification email. Please try again.")
            return render(request, 'register.html')

        # ── Success — render a dedicated "check your email" page ─
        # Do NOT redirect here; render directly so the context is available.
        return render(request, 'verify_pending.html', {
            'email': email,
        })

    return render(request, 'register.html')


# ─────────────────────────────────────────────
#  EMAIL VERIFICATION
# ─────────────────────────────────────────────
def verify_email(request, uidb64, token):
    """
    Handles the link from the verification email.
    Renders verify_result.html with a status context so the template
    can show success, already-verified, or error states.
    """
    try:
        uid  = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, OverflowError, TypeError):
        return render(request, 'verify_result.html', {
            'status': 'invalid',
            'heading': 'Link not recognised',
            'message': 'This verification link is invalid. Please register again or contact support.',
        })

    # Already verified
    if getattr(user, 'is_email_verified', False) and user.is_active:
        return render(request, 'verify_result.html', {
            'status': 'already',
            'heading': 'Already verified',
            'message': 'Your email is already verified. Go ahead and sign in.',
        })

    # Check token
    if email_verification_token.check_token(user, token):
        user.is_active          = True
        user.is_email_verified  = True
        user.save(update_fields=['is_active', 'is_email_verified'])

        return render(request, 'verify_result.html', {
            'status': 'success',
            'heading': 'Email verified!',
            'message': 'Your account is now active. You can sign in to DjangoPilot.',
        })

    # Token invalid / expired
    return render(request, 'verify_result.html', {
        'status': 'expired',
        'heading': 'Link expired',
        'message': 'This verification link has expired. Request a new one below.',
        'email': user.email,   # used by resend link in the template
    })


# ─────────────────────────────────────────────
#  RESEND VERIFICATION EMAIL  (optional helper)
# ─────────────────────────────────────────────
def resend_verification(request):
    """POST endpoint — resend the verification email to a given address."""
    if request.method != 'POST':
        return redirect('register')

    email = request.POST.get('email', '').strip().lower()

    try:
        user = User.objects.get(email=email, is_active=False)
    except User.DoesNotExist:
        # Don't reveal whether the address is registered
        return render(request, 'verify_pending.html', {'email': email})

    try:
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)
        domain = get_current_site(request).domain
        verification_link = f"http://{domain}/verify-email/{uid}/{token}/"

        send_mail(
            subject="Verify your DjangoPilot account (resend)",
            message=f"""Hi {user.first_name},

Here is a fresh verification link for your DjangoPilot account:

{verification_link}

This link expires in 24 hours.""",
            from_email="noreply@djangopilot.com",
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        messages.error(request, "Could not resend email. Please try again later.")

    return render(request, 'verify_pending.html', {'email': email, 'resent': True})

def index(request):
    return render(request, 'index.html')

def login(request):
    return render(request, 'login.html')

def dashboard(request):
    return render(request, 'dashboard.html')

