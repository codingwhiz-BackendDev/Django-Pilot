import os
from pathlib import Path
from dotenv import load_dotenv

# ----------------------------
# BASE DIR
# ----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ----------------------------
# LOAD ENV VARIABLES
# ----------------------------
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ----------------------------
# SECURITY SETTINGS
# ----------------------------
SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = True  # Change to False in production

ALLOWED_HOSTS = []

# ----------------------------
# APPLICATION DEFINITION
# ----------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles', 
    'django.contrib.sites',
    'App', 
    
    'allauth',
    'allauth.account',
    'allauth.socialaccount',

    
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'DjangoPilot.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'DjangoPilot.wsgi.application'

# ----------------------------
# DATABASE (Default SQLite)
# ----------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1

# ----------------------------
# PASSWORD VALIDATION
# ----------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {
            'prompt': 'select_account'
        }
    },
    'github': {
        'SCOPE': [
            'user',
            'user:email',
        ],
    }
}


# ----------------------------
# INTERNATIONALIZATION
# ----------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ----------------------------
# STATIC FILES
# ----------------------------
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / "static"]

# ----------------------------
# MEDIA FILES
# ----------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ----------------------------
# DEFAULT PRIMARY KEY
# ----------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ----------------------------
# EMAIL SETTINGS (FROM ENV)
# ----------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

# ----------------------------
# ALLAUTH SETTINGS
# ----------------------------
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

ACCOUNT_LOGOUT_ON_GET = True

# ----------------------------
# ANTHROPIC (CLAUDE API)
# ----------------------------
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
SOCIALACCOUNT_LOGIN_ON_GET = True