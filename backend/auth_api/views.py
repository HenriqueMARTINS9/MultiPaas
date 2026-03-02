import json
import re

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


@csrf_exempt
@require_POST
def login_view(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    email = (payload.get('email') or '').strip()
    password = payload.get('password') or ''

    if not email or not password:
        return JsonResponse({'detail': 'Email and password are required.'}, status=400)

    user_model = get_user_model()
    user = user_model.objects.filter(email__iexact=email).first()
    if user is None:
        return JsonResponse({'detail': 'Invalid email or password.'}, status=401)

    credentials = {
        user_model.USERNAME_FIELD: getattr(user, user_model.USERNAME_FIELD),
        'password': password
    }
    authenticated_user = authenticate(request, **credentials)
    if authenticated_user is None:
        return JsonResponse({'detail': 'Invalid email or password.'}, status=401)

    return JsonResponse(
        {
            'message': 'Sign in successful.',
            'user': {
                'id': authenticated_user.pk,
                'email': getattr(authenticated_user, 'email', email)
            }
        }
    )


def _build_unique_username(email, user_model, username_field):
    base = re.sub(r'[^a-zA-Z0-9._-]', '', email.split('@')[0]).strip('._-') or 'user'
    candidate = base[:150]
    index = 1
    while user_model.objects.filter(**{username_field: candidate}).exists():
        suffix = str(index)
        candidate = f'{base[: max(1, 150 - len(suffix))]}{suffix}'
        index += 1
    return candidate


@csrf_exempt
@require_POST
def signup_view(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    email = (payload.get('email') or '').strip()
    password = payload.get('password') or ''

    if not email or not password:
        return JsonResponse({'detail': 'Email and password are required.'}, status=400)

    user_model = get_user_model()
    if hasattr(user_model, 'email') and user_model.objects.filter(email__iexact=email).exists():
        return JsonResponse({'detail': 'An account with this email already exists.'}, status=409)

    try:
        validate_password(password)
    except ValidationError as exc:
        return JsonResponse({'detail': ' '.join(exc.messages)}, status=400)

    username_field = user_model.USERNAME_FIELD
    create_kwargs = {}
    if username_field == 'email':
        create_kwargs[username_field] = email
    else:
        create_kwargs[username_field] = _build_unique_username(email, user_model, username_field)
        if hasattr(user_model, 'email'):
            create_kwargs['email'] = email

    user = user_model.objects.create_user(password=password, **create_kwargs)
    return JsonResponse(
        {
            'message': 'Account created successfully.',
            'user': {
                'id': user.pk,
                'email': getattr(user, 'email', email)
            }
        },
        status=201
    )
