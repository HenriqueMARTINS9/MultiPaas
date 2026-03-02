import { FormEvent, useMemo, useState } from 'react';
import ConsoleLayout from './ConsoleLayout';
import { IconHeadingUser } from './icons';

type AccountType = 'personal' | 'company';

type AccountForm = {
  accountType: AccountType;
  currentPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  newPassword: string;
  confirmPassword: string;
};

const INITIAL_FORM: AccountForm = {
  accountType: 'personal',
  confirmPassword: '',
  currentPassword: '',
  email: 'admin@example.com',
  firstName: '',
  lastName: '',
  newPassword: ''
};

export default function AccountScreen() {
  const [form, setForm] = useState<AccountForm>(INITIAL_FORM);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success'>('success');

  const canChangePassword = useMemo(
    () => Boolean(form.currentPassword && form.newPassword && form.confirmPassword),
    [form.confirmPassword, form.currentPassword, form.newPassword]
  );

  function updateField<Key extends keyof AccountForm>(key: Key, value: AccountForm[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFeedback('');
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackType('success');
    setFeedback('Profile settings saved.');
  }

  function handleCancel() {
    setForm(INITIAL_FORM);
    setFeedbackType('success');
    setFeedback('Changes reverted.');
  }

  function handleChangePassword() {
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

    setForm((prev) => ({
      ...prev,
      confirmPassword: '',
      currentPassword: '',
      newPassword: ''
    }));
    setFeedbackType('success');
    setFeedback('Password changed successfully.');
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

          <div className="avatar-preview" aria-hidden="true" />

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
              type="email"
              value={form.email}
            />
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

          <button className="secondary-button" onClick={handleChangePassword} type="button">
            Change Password
          </button>

          <div className="account-actions">
            <button className="primary-button narrow" type="submit">
              Save Changes
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
