import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import ConsoleLayout from './ConsoleLayout';
import { IconHeadingUser } from './icons';

type AccountType = 'personal' | 'company';

type SessionUser = {
  account_type?: AccountType;
  email?: string;
  first_name?: string;
  id?: number;
  last_name?: string;
  profile_photo?: string;
};

type AccountForm = {
  accountType: AccountType;
  confirmPassword: string;
  currentPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  newPassword: string;
  profilePhoto: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

const INITIAL_FORM: AccountForm = {
  accountType: 'personal',
  confirmPassword: '',
  currentPassword: '',
  email: 'admin@example.com',
  firstName: '',
  lastName: '',
  newPassword: '',
  profilePhoto: ''
};

function initialsFromForm(form: AccountForm) {
  const first = form.firstName.trim();
  const last = form.lastName.trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  }
  return form.email.charAt(0).toUpperCase() || 'U';
}

export default function AccountScreen() {
  const [form, setForm] = useState<AccountForm>(INITIAL_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState<AccountForm>(INITIAL_FORM);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success'>('success');
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  const canChangePassword = useMemo(
    () => Boolean(form.currentPassword && form.newPassword && form.confirmPassword),
    [form.confirmPassword, form.currentPassword, form.newPassword]
  );
  const initials = useMemo(() => initialsFromForm(form), [form]);

  function updateField<Key extends keyof AccountForm>(key: Key, value: AccountForm[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFeedback('');
  }

  function mergeUserIntoForm(user: SessionUser): AccountForm {
    return {
      accountType: user.account_type || 'personal',
      confirmPassword: '',
      currentPassword: '',
      email: user.email || form.email || INITIAL_FORM.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      newPassword: '',
      profilePhoto: user.profile_photo || ''
    };
  }

  function persistSessionUser(user: SessionUser) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('mpconsole_user', JSON.stringify(user));
  }

  async function loadProfile(email: string) {
    if (!email) {
      return;
    }
    try {
      setLoadingProfile(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { user?: SessionUser };
      if (!payload.user) {
        throw new Error('Missing user payload.');
      }

      const mapped = mergeUserIntoForm(payload.user);
      setForm(mapped);
      setInitialSnapshot(mapped);
      persistSessionUser(payload.user);
    } catch (_error) {
      setFeedbackType('error');
      setFeedback('Unable to load profile from backend.');
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const rawUser = window.localStorage.getItem('mpconsole_user');
    if (!rawUser) {
      return;
    }
    try {
      const user = JSON.parse(rawUser) as SessionUser;
      const nextEmail = user.email || INITIAL_FORM.email;
      setForm((prev) => ({ ...prev, email: nextEmail }));
      loadProfile(nextEmail);
    } catch (_error) {
      loadProfile(INITIAL_FORM.email);
    }
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSavingProfile(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_type: form.accountType,
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          profile_photo: form.profilePhoto
        })
      });

      const payload = (await response.json()) as { detail?: string; message?: string; user?: SessionUser };
      if (!response.ok || !payload.user) {
        throw new Error(payload.detail || `HTTP ${response.status}`);
      }

      const mapped = mergeUserIntoForm(payload.user);
      setForm(mapped);
      setInitialSnapshot(mapped);
      persistSessionUser(payload.user);
      setFeedbackType('success');
      setFeedback(payload.message || 'Profile settings saved.');
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancel() {
    setForm({
      ...initialSnapshot,
      confirmPassword: '',
      currentPassword: '',
      newPassword: ''
    });
    setFeedbackType('success');
    setFeedback('Changes reverted.');
  }

  async function handleChangePassword() {
    if (!canChangePassword) {
      setFeedbackType('error');
      setFeedback('Fill all password fields first.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setFeedbackType('error');
      setFeedback('New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm_password: form.confirmPassword,
          current_password: form.currentPassword,
          email: form.email,
          new_password: form.newPassword
        })
      });
      const payload = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.detail || `HTTP ${response.status}`);
      }
      setForm((prev) => ({
        ...prev,
        confirmPassword: '',
        currentPassword: '',
        newPassword: ''
      }));
      setFeedbackType('success');
      setFeedback(payload.message || 'Password changed successfully.');
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      updateField('profilePhoto', result);
      setFeedbackType('success');
      setFeedback('Profile photo ready. Save changes to persist.');
    };
    reader.readAsDataURL(file);
  }

  return (
    <ConsoleLayout activeRoute="account">
      <section className="account-screen" data-node-id="206:18049">
        <h1 className="console-h1 with-icon">
          <IconHeadingUser />
          <span>Account Settings</span>
        </h1>
        <p className="console-subtext">Manage your account and preferences</p>

        <div className="account-tablist">
          <button type="button" className="account-tab account-tab-active">
            Profile
          </button>
        </div>

        <form className="account-panel" onSubmit={handleSave}>
          <div>
            <h2 className="console-h3">Profile Information</h2>
            <p className="console-caption">Update your personal or company information</p>
          </div>

          <div className="account-avatar-row">
            <div className="avatar-preview" aria-hidden="true">
              {form.profilePhoto ? (
                <img alt="" className="avatar-preview-image" src={form.profilePhoto} />
              ) : (
                <span className="avatar-preview-fallback">{initials}</span>
              )}
            </div>
            <div className="account-avatar-actions">
              <label className="secondary-button narrow account-photo-trigger" htmlFor="profile-photo">
                Upload Photo
              </label>
              <input
                accept="image/*"
                id="profile-photo"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                type="file"
              />
              {form.profilePhoto && (
                <button className="secondary-button narrow" onClick={() => updateField('profilePhoto', '')} type="button">
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Account Type</label>
            <div className="radio-row">
              <label className="radio-item">
                <input
                  checked={form.accountType === 'personal'}
                  name="accountType"
                  onChange={() => updateField('accountType', 'personal')}
                  type="radio"
                />
                <span>Personal</span>
              </label>
              <label className="radio-item">
                <input
                  checked={form.accountType === 'company'}
                  name="accountType"
                  onChange={() => updateField('accountType', 'company')}
                  type="radio"
                />
                <span>Company</span>
              </label>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="account-email">
              Email
            </label>
            <input
              id="account-email"
              className="field-input"
              onChange={(event) => updateField('email', event.target.value)}
              readOnly
              type="email"
              value={form.email}
            />
            <p className="console-caption">Email is managed at authentication level.</p>
          </div>

          <div className="account-two-cols">
            <div className="field-group">
              <label className="field-label" htmlFor="first-name">
                First Name
              </label>
              <input
                id="first-name"
                className="field-input"
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="First name"
                type="text"
                value={form.firstName}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="last-name">
                Last Name
              </label>
              <input
                id="last-name"
                className="field-input"
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Last name"
                type="text"
                value={form.lastName}
              />
            </div>
          </div>

          <hr className="account-divider" />

          <h3 className="console-h4">Security</h3>
          <div className="account-three-cols">
            <div className="field-group">
              <label className="field-label" htmlFor="current-password">
                Current Password
              </label>
              <input
                id="current-password"
                className="field-input"
                onChange={(event) => updateField('currentPassword', event.target.value)}
                type="password"
                value={form.currentPassword}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                className="field-input"
                onChange={(event) => updateField('newPassword', event.target.value)}
                type="password"
                value={form.newPassword}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                className="field-input"
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                type="password"
                value={form.confirmPassword}
              />
            </div>
          </div>

          <button className="secondary-button" disabled={changingPassword} onClick={handleChangePassword} type="button">
            {changingPassword ? 'Updating password...' : 'Change Password'}
          </button>

          <div className="account-actions">
            <button className="primary-button narrow" disabled={savingProfile || loadingProfile} type="submit">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="secondary-button narrow" onClick={handleCancel} type="button">
              Cancel
            </button>
          </div>

          {feedback && (
            <p className={`console-inline-feedback ${feedbackType === 'error' ? 'is-error' : 'is-success'}`}>
              {feedback}
            </p>
          )}
        </form>
      </section>
    </ConsoleLayout>
  );
}
