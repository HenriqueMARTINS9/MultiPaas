import os
from pathlib import Path

import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent


def load_dotenv_file(path):
    if not path.exists():
        return
    for raw_line in path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip().strip('"').strip("'")
        os.environ[key] = value


load_dotenv_file(BASE_DIR / '.env')


def csv_env(name, default):
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(',') if item.strip()]


def sanitize_postgres_options(db_config):
    if db_config.get('ENGINE') != 'django.db.backends.postgresql':
        return db_config
    options = db_config.get('OPTIONS')
    if not isinstance(options, dict):
        return db_config

    allowed = {
        'application_name',
        'channel_binding',
        'connect_timeout',
        'gssencmode',
        'options',
        'sslcert',
        'sslcrl',
        'sslkey',
        'sslmode',
        'sslrootcert',
        'target_session_attrs'
    }
    db_config['OPTIONS'] = {key: value for key, value in options.items() if key in allowed}
    return db_config


SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'unsafe-dev-secret-key-change-me')
DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = csv_env('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost')
if DEBUG and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'billing_api',
    'auth_api'
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware'
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages'
            ]
        }
    }
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DB_ENGINE = os.getenv('DJANGO_DB_ENGINE', 'django.db.backends.postgresql')
DB_CONN_MAX_AGE = int(os.getenv('DJANGO_DB_CONN_MAX_AGE', '60'))
DATABASE_URL = (
    os.getenv('DATABASE_URL')
    or os.getenv('POSTGRES_URL')
    or os.getenv('POSTGRES_URL_NON_POOLING')
)
if DB_ENGINE in {'sqlite', 'django.db.backends.sqlite3'}:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3'
        }
    }
elif DATABASE_URL:
    parsed_db = dj_database_url.parse(DATABASE_URL, conn_max_age=DB_CONN_MAX_AGE)
    DATABASES = {
        'default': sanitize_postgres_options(parsed_db)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': DB_ENGINE,
            'NAME': os.getenv('DJANGO_DB_NAME', 'multipaas'),
            'USER': os.getenv('DJANGO_DB_USER', 'multipaas'),
            'PASSWORD': os.getenv('DJANGO_DB_PASSWORD', 'multipaas'),
            'HOST': os.getenv('DJANGO_DB_HOST', '127.0.0.1'),
            'PORT': os.getenv('DJANGO_DB_PORT', '5432'),
            'CONN_MAX_AGE': DB_CONN_MAX_AGE
        }
    }
    DATABASES['default'] = sanitize_postgres_options(DATABASES['default'])

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'}
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = DEBUG
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = csv_env(
    'DJANGO_CORS_ALLOWED_ORIGINS',
    'http://127.0.0.1:3000,http://localhost:3000'
)
CORS_ALLOW_ALL_ORIGINS = os.getenv('DJANGO_CORS_ALLOW_ALL_ORIGINS', '1' if DEBUG else '0') == '1'
CSRF_TRUSTED_ORIGINS = csv_env(
    'DJANGO_CSRF_TRUSTED_ORIGINS',
    'http://127.0.0.1:3000,http://localhost:3000'
)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.AllowAny',)
}

STANCER_API_BASE_URL = os.getenv('STANCER_API_BASE_URL', 'https://api.stancer.com')
STANCER_PRIVATE_KEY = os.getenv('STANCER_PRIVATE_KEY', '')
STANCER_PUBLIC_KEY = os.getenv('STANCER_PUBLIC_KEY', '')
STANCER_RETURN_URL = os.getenv('STANCER_RETURN_URL', 'http://127.0.0.1:3000/billing')
