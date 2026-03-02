import json
import re

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods

from .models import UserProfile


def _profile_for_user(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def _serialize_user(user):
    profile = _profile_for_user(user)
    return {
        'id': user.pk,
        'email': getattr(user, 'email', ''),
        'first_name': getattr(user, 'first_name', ''),
        'last_name': getattr(user, 'last_name', ''),
        'account_type': profile.account_type,
        'profile_photo': profile.profile_photo
    }


def _clean_account_type(value):
    if value in {'personal', 'company'}:
        return value
    return 'personal'


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
            'user': _serialize_user(authenticated_user)
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
    first_name = (payload.get('first_name') or '').strip()
    last_name = (payload.get('last_name') or '').strip()
    account_type = _clean_account_type(payload.get('account_type'))
    profile_photo = payload.get('profile_photo') or ''

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

    if hasattr(user_model, 'first_name'):
        create_kwargs['first_name'] = first_name
    if hasattr(user_model, 'last_name'):
        create_kwargs['last_name'] = last_name

    with transaction.atomic():
        user = user_model.objects.create_user(password=password, **create_kwargs)
        profile = _profile_for_user(user)
        profile.account_type = account_type
        profile.profile_photo = str(profile_photo)
        profile.save(update_fields=['account_type', 'profile_photo', 'updated_at'])

    return JsonResponse(
        {
            'message': 'Account created successfully.',
            'user': _serialize_user(user)
        },
        status=201
    )


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def profile_view(request):
    user_model = get_user_model()

    if request.method == 'GET':
        email = (request.GET.get('email') or '').strip()
        if not email:
            return JsonResponse({'detail': 'Email is required.'}, status=400)
        user = user_model.objects.filter(email__iexact=email).first()
        if user is None:
            return JsonResponse({'detail': 'User not found.'}, status=404)
        return JsonResponse({'user': _serialize_user(user)})

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    email = (payload.get('email') or '').strip()
    if not email:
        return JsonResponse({'detail': 'Email is required.'}, status=400)

    user = user_model.objects.filter(email__iexact=email).first()
    if user is None:
        return JsonResponse({'detail': 'User not found.'}, status=404)

    profile = _profile_for_user(user)
    user_fields_to_update = []
    profile_fields_to_update = []

    if 'first_name' in payload and hasattr(user, 'first_name'):
        user.first_name = (payload.get('first_name') or '').strip()
        user_fields_to_update.append('first_name')

    if 'last_name' in payload and hasattr(user, 'last_name'):
        user.last_name = (payload.get('last_name') or '').strip()
        user_fields_to_update.append('last_name')

    if 'account_type' in payload:
        profile.account_type = _clean_account_type(payload.get('account_type'))
        profile_fields_to_update.append('account_type')

    if 'profile_photo' in payload:
        profile.profile_photo = str(payload.get('profile_photo') or '')
        profile_fields_to_update.append('profile_photo')

    with transaction.atomic():
        if user_fields_to_update:
            user.save(update_fields=user_fields_to_update)
        if profile_fields_to_update:
            profile.save(update_fields=[*profile_fields_to_update, 'updated_at'])

    return JsonResponse({'message': 'Profile updated.', 'user': _serialize_user(user)})


@csrf_exempt
@require_POST
def change_password_view(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    email = (payload.get('email') or '').strip()
    current_password = payload.get('current_password') or ''
    new_password = payload.get('new_password') or ''
    confirm_password = payload.get('confirm_password') or ''

    if not email or not current_password or not new_password or not confirm_password:
        return JsonResponse({'detail': 'Email and all password fields are required.'}, status=400)

    if new_password != confirm_password:
        return JsonResponse({'detail': 'New password and confirmation do not match.'}, status=400)

    user_model = get_user_model()
    user = user_model.objects.filter(email__iexact=email).first()
    if user is None:
        return JsonResponse({'detail': 'User not found.'}, status=404)

    if not user.check_password(current_password):
        return JsonResponse({'detail': 'Current password is incorrect.'}, status=401)

    try:
        validate_password(new_password, user=user)
    except ValidationError as exc:
        return JsonResponse({'detail': ' '.join(exc.messages)}, status=400)

    user.set_password(new_password)
    user.save(update_fields=['password'])
    return JsonResponse({'message': 'Password changed successfully.'})
