import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI, subscriptionAPI } from '@services/api';
import { endSession } from '@lib/session';
import { useMe, ME_QUERY_KEY } from '@hooks/useMe';
import { useSocialProviders } from '@hooks/useSocialProviders';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { FormSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { User, Lock, Mail, Camera, Shield, Link2, Unlink, Trash2, LogOut, CheckCircle, XCircle, Smartphone, Download } from 'lucide-react';
import ConfirmationModal from '@components/common/ConfirmationModal';
import SafeImage from '@components/ui/safe-image';
import { showSuccess, showError } from '@utils/toast';
import { toast } from 'sonner';
import { PROVIDER_LABELS, SOCIAL_PROVIDER_IDS, describeLinkResult, startSocialAuth } from '@lib/socialAuth';

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialTab] = useState(() => (describeLinkResult(searchParams) ? 'security' : 'profile'));
  const [name, setName] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profileImage || '');
  const previewUrlRef = useRef(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [deleteValue, setDeleteValue] = useState('');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const otpInputRef = useRef(null);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showRevokeAllSessionsModal, setShowRevokeAllSessionsModal] = useState(false);
  const [showRevokeSessionModal, setShowRevokeSessionModal] = useState(false);
  const [revokeSessionId, setRevokeSessionId] = useState(null);
  const enabledProviders = useSocialProviders();

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const mergeMe = (patch) =>
    queryClient.setQueryData(ME_QUERY_KEY, (prev) => (prev ? { ...prev, ...patch } : prev));

  useEffect(() => {
    const result = describeLinkResult(searchParams);
    if (!result) return;
    if (result.ok) {
      toast.success(result.message, { id: 'oauth-link' });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    } else {
      toast.error(result.message, { id: 'oauth-link' });
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  const linkProviderMutation = useMutation({
    mutationFn: (providerId) => authAPI.startOAuthLink(providerId),
    onSuccess: (_, providerId) => startSocialAuth(providerId),
  });

  const { data: profileData, isLoading } = useMe({ enabled: !!user });

  const { data: plusPoints } = useQuery({
    queryKey: ['plus-points'],
    queryFn: () => subscriptionAPI.getMyPoints().then((r) => r.data?.data ?? null),
    enabled: !!user,
    staleTime: 60_000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (formData) => authAPI.updateProfile(null, formData),
    onSuccess: (data) => {
      mergeMe(data.data.data);
      showSuccess('Profile updated successfully');
      setProfileImage(null);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.updatePassword(data),
    onSuccess: () => {
      showSuccess('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const setPasswordLinkMutation = useMutation({
    mutationFn: (email) => authAPI.forgotPassword({ email }),
    onSuccess: () => showSuccess('Check your inbox for a link to set your password.'),
  });

  const sendOTPMutation = useMutation({
    mutationFn: () => authAPI.sendEmailVerification(),
    onSuccess: () => {
      showSuccess('Verification OTP sent successfully! Check your email.');
      setOtpDialogOpen(true);
      setOtp('');
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: (data) => authAPI.verifyEmail(data),
    onSuccess: () => {
      showSuccess('Email verified successfully!');
      setOtpDialogOpen(false);
      setOtp('');
      mergeMe({ emailVerified: true });
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: (data) => authAPI.changeEmail(data),
    onSuccess: () => {
      showSuccess('Verification email sent to new address');
      setNewEmail('');
      setEmailPassword('');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (provider) => authAPI.unlinkOAuth({ provider }),
    onSuccess: (data, provider) => {
      mergeMe(data.data.data);
      showSuccess(`${PROVIDER_LABELS[provider] || provider} account unlinked`);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (data) => authAPI.deleteAccount(data),
    onSuccess: () => {
      endSession();
      navigate('/login');
      showSuccess('Account deleted successfully');
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: () => authAPI.exportMyData(),
    onSuccess: (res) => {
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dgmarq-my-data.json';
      link.click();
      URL.revokeObjectURL(url);
    },
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (profileImage) formData.append('profileImage', profileImage);
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({ oldPassword, newPassword });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(file);
      setProfileImage(file);
      setPreviewImage(previewUrlRef.current);
    }
  };

  if (isLoading) return <FormSkeleton fields={5} />;

  const currentUser = profileData || user;
  const hasPassword = currentUser?.hasPassword ?? (!currentUser?.oauthProvider || currentUser.oauthProvider === 'local');
  const linkedProvider =
    currentUser?.oauthProvider && currentUser.oauthProvider !== 'local'
      ? currentUser.oauthProvider
      : null;
  const providerRows = SOCIAL_PROVIDER_IDS.filter((id) => enabledProviders.includes(id) || id === linkedProvider);
  const hasRealEmail = Boolean(currentUser?.email) && !/\.temp$/i.test(currentUser.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">Profile Settings</h1>
        <p className="text-fg-muted mt-1">Manage your account information and preferences</p>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-surface-sunken border-border">
          <TabsTrigger value="profile" className="">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="">
            <Lock className="w-4 h-4 mr-2" />
            Password
          </TabsTrigger>
          <TabsTrigger value="security" className="">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions" className="">
            <Smartphone className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="account" className="">
            <Trash2 className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {plusPoints && (
            <Card variant="hud" className="mb-6">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="min-w-0">
                  <p className="text-sm text-fg-muted">DGMARQ Points</p>
                  <p className={`mt-1 text-3xl font-bold tabular-nums ${plusPoints.inDebt ? 'text-warning' : 'text-fg'}`}>
                    {plusPoints.balance}
                    <span className="ml-2 text-base font-medium text-fg-muted">pts</span>
                  </p>
                  <p className={`mt-1 text-sm ${plusPoints.inDebt ? 'text-warning' : 'text-fg-subtle'}`}>
                    {plusPoints.inDebt
                      ? `Adjusted after a refund — earn ${plusPoints.pointsUntilRedeemable} more to redeem again.`
                      : `Worth $${plusPoints.walletValue.toFixed(2)} in wallet credit · ${plusPoints.pointsPerDollar} points per $1 spent`}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/dgmarq-plus">
                    {plusPoints.canRedeem ? 'Redeem points' : 'View Plus'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card variant="hud">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription className="text-fg-muted">
                Update your profile information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <SafeImage
                      src={previewImage || '/placeholder-avatar.png'}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-accent"
                    />
                    <label
                      htmlFor="profileImage"
                      className="absolute bottom-0 right-0 bg-accent text-fg p-2 rounded-full cursor-pointer hover:bg-accent/90 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
            </label>
            <input
                      id="profileImage"
                      aria-label="Upload a profile photo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-fg-muted">Name</Label>
                    <Input
                      id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
                      className="bg-secondary border-border text-fg"
                      placeholder="Enter your name"
            />
          </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-fg-muted">
                      <Mail className="w-4 h-4 inline mr-2" />
              Email
                    </Label>
                    <Input
                      id="email"
              type="email"
                      value={currentUser?.email || ''}
              disabled
                      className="bg-secondary border-border text-fg-muted"
            />
                    <p className="text-xs text-fg-subtle">To change your email, use the Security tab</p>
                  </div>
          </div>

                <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
                  className="w-full"
          >
            {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                </Button>
        </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          {hasPassword ? (
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription className="text-fg-muted">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-fg-muted">Current Password</Label>
                  <Input
                    id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                    className="bg-secondary border-border text-fg"
                    placeholder="Enter current password"
                required
              />
            </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-fg-muted">New Password</Label>
                  <Input
                    id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-secondary border-border text-fg"
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-fg-muted">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary border-border text-fg"
                    placeholder="Confirm new password"
                required
              />
            </div>

                <Button
              type="submit"
              disabled={updatePasswordMutation.isPending}
                  className="w-full"
            >
              {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
          </form>
            </CardContent>
          </Card>
          ) : (
            <Card variant="hud">
              <CardHeader>
                <CardTitle>Set a Password</CardTitle>
                <CardDescription className="text-fg-muted">
                  You sign in with {PROVIDER_LABELS[linkedProvider] || 'a social provider'}. Set a password to also sign in
                  with your email, change your email, or unlink the provider.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasRealEmail ? (
                  <Button
                    onClick={() => setPasswordLinkMutation.mutate(currentUser.email)}
                    disabled={setPasswordLinkMutation.isPending}
                    className="w-full"
                  >
                    {setPasswordLinkMutation.isPending ? 'Sending...' : 'Email me a link to set a password'}
                  </Button>
                ) : (
                  <p className="text-sm text-fg-muted">
                    Your sign-in provider did not share an email address, so a password can&apos;t be set yet.
                    Please contact support.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription className="text-fg-muted">
                Manage email verification, OAuth accounts, and email change
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-fg font-medium">Email Verification</h3>
                    <p className="text-sm text-fg-muted">
                      {currentUser?.emailVerified ? 'Your email is verified' : 'Verify your email address'}
                    </p>
                  </div>
                  {currentUser?.emailVerified ? (
                    <Badge variant="success" className="bg-success-solid">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="bg-warning-solid">
                      <XCircle className="w-3 h-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
                {!currentUser?.emailVerified && (
                  <div className="space-y-3">
                    <Button
                      onClick={() => sendOTPMutation.mutate()}
                      disabled={sendOTPMutation.isPending}
                      className=""
                    >
                      {sendOTPMutation.isPending ? 'Sending...' : 'Send Email Verification OTP'}
                    </Button>
                    
                    <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
                      <DialogContent
                        size="sm"
                        onOpenAutoFocus={(e) => {
                          e.preventDefault();
                          otpInputRef.current?.focus();
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle className="text-fg">Enter Verification OTP</DialogTitle>
                          <DialogDescription className="text-fg-muted">
                            Please enter the 6-digit OTP sent to your email address ({currentUser?.email})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="otp" className="text-fg-muted">OTP Code</Label>
                            <Input
                              id="otp"
                              ref={otpInputRef}
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 6) {
                                  setOtp(value);
                                }
                              }}
                              className="text-center font-mono text-xl tracking-widest"
                              placeholder="000000"
                            />
                            <p className="text-xs text-fg-subtle">
                              Enter the 6-digit code from your email. OTP expires in 10 minutes.
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => {
                                if (otp.length !== 6) {
                                  toast.error('Please enter a valid 6-digit OTP');
                                  return;
                                }
                                verifyOTPMutation.mutate({ otp });
                              }}
                              disabled={verifyOTPMutation.isPending || otp.length !== 6}
                              className="flex-1"
                            >
                              {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setOtpDialogOpen(false);
                                setOtp('');
                              }}
                              className="border-border text-fg-muted hover:bg-secondary"
                            >
                              Cancel
                            </Button>
                          </div>
                          <div className="text-center">
                            <Button
                              variant="link"
                              onClick={() => {
                                setOtpDialogOpen(false);
                                sendOTPMutation.mutate();
                              }}
                              disabled={sendOTPMutation.isPending}
                              className="text-sm text-fg-muted hover:text-fg"
                            >
                              Resend OTP
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-brand-cyan/10 pt-4">
                <h3 className="text-fg font-medium">Connected Accounts</h3>
                <p className="text-sm text-fg-subtle">
                  Your account can be linked to one provider at a time. Linking a new one
                  replaces the current link.
                </p>
                <div className="space-y-2">
                  {providerRows.map((providerId) => {
                    const isLinked = linkedProvider === providerId;
                    return (
                      <div
                        key={providerId}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Link2 className="w-4 h-4 text-fg-muted" />
                          <span className="text-fg-muted">{PROVIDER_LABELS[providerId]}</span>
                        </div>
                        {isLinked ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant="success" className="bg-success-solid">Connected</Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={unlinkMutation.isPending}
                              onClick={() => setUnlinkTarget(providerId)}
                            >
                              <Unlink className="w-3 h-3 mr-1" />
                              Unlink
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={linkProviderMutation.isPending}
                            onClick={() => linkProviderMutation.mutate(providerId)}
                          >
                            <Link2 className="w-3 h-3 mr-1" />
                            Link
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 border-t border-brand-cyan/10 pt-4">
                <h3 className="text-fg font-medium">Change Email</h3>
                {hasPassword ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newEmail && emailPassword) {
                      changeEmailMutation.mutate({ newEmail: newEmail.trim(), password: emailPassword });
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="newEmail" className="text-fg-muted">New Email</Label>
                    <Input
                      id="newEmail"
                      name="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-secondary border-border text-fg"
                      placeholder="Enter new email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-fg-muted">Current Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className="bg-secondary border-border text-fg"
                      placeholder="Enter password to confirm"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={changeEmailMutation.isPending}>
                    {changeEmailMutation.isPending ? 'Sending...' : 'Request Email Change'}
                  </Button>
                </form>
                ) : (
                  <p className="text-sm text-fg-muted">
                    Set a password on the Password tab first, then you can change your email here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription className="text-fg-muted">
                Manage your active login sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionsTab 
                showRevokeAllSessionsModal={showRevokeAllSessionsModal}
                setShowRevokeAllSessionsModal={setShowRevokeAllSessionsModal}
                showRevokeSessionModal={showRevokeSessionModal}
                setShowRevokeSessionModal={setShowRevokeSessionModal}
                revokeSessionId={revokeSessionId}
                setRevokeSessionId={setRevokeSessionId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription className="text-fg-muted">
                Delete your account permanently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary p-4">
                  <div>
                    <h3 className="text-fg font-medium">Download my data</h3>
                    <p className="text-sm text-fg-muted">
                      A copy of your profile, orders, reviews, support tickets and wallet balance as a JSON file.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => exportDataMutation.mutate()}
                    disabled={exportDataMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportDataMutation.isPending ? 'Preparing...' : 'Download'}
                  </Button>
                </div>
                <div className="p-4 bg-danger-soft border border-danger/35 rounded-lg">
                  <h3 className="text-danger font-medium mb-2">Danger Zone</h3>
                  <p className="text-sm text-fg-muted mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Dialog onOpenChange={(open) => { if (!open) setDeleteValue(''); }}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent size="sm" className="">
                      <DialogHeader>
                        <DialogTitle className="text-fg">Delete Account</DialogTitle>
                        <DialogDescription className="text-fg-muted">
                          {hasPassword
                            ? 'This action cannot be undone. Please enter your password to confirm.'
                            : 'This action cannot be undone. Your account signs in with a social provider, so type DELETE to confirm.'}
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (deleteValue) {
                            setShowDeleteAccountModal(true);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="deletePassword" className="text-fg-muted">
                            {hasPassword ? 'Password' : 'Type DELETE to confirm'}
                          </Label>
                          <Input
                            id="deletePassword"
                            name={hasPassword ? 'password' : 'confirm'}
                            type={hasPassword ? 'password' : 'text'}
                            value={deleteValue}
                            onChange={(e) => setDeleteValue(e.target.value)}
                            className="bg-secondary border-border text-fg"
                            placeholder={hasPassword ? 'Enter your password' : 'DELETE'}
                            required
                          />
                        </div>
                        <Button type="submit" variant="destructive" className="w-full" disabled={deleteAccountMutation.isPending}>
                          {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationModal
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
        title={`Unlink ${PROVIDER_LABELS[unlinkTarget] || ''} Account`}
        description={`Are you sure you want to unlink your ${PROVIDER_LABELS[unlinkTarget] || ''} account?`}
        confirmText="Unlink"
        cancelText="Cancel"
        variant="default"
        onConfirm={() => unlinkMutation.mutate(unlinkTarget)}
      />

      <ConfirmationModal
        open={showDeleteAccountModal}
        onOpenChange={setShowDeleteAccountModal}
        title="Delete Account"
        description="Are you absolutely sure? This will permanently delete your account and all associated data. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteValue) {
            deleteAccountMutation.mutate(hasPassword ? { password: deleteValue } : { confirm: deleteValue });
          }
        }}
      />
    </div>
  );
};

const SessionsTab = ({ showRevokeAllSessionsModal, setShowRevokeAllSessionsModal, showRevokeSessionModal, setShowRevokeSessionModal, revokeSessionId, setRevokeSessionId }) => {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => authAPI.getActiveSessions().then(res => res.data.data),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId) => authAPI.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      setShowRevokeSessionModal(false);
      setRevokeSessionId(null);
      showSuccess('Session revoked successfully');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => authAPI.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      setShowRevokeAllSessionsModal(false);
      showSuccess('All other sessions revoked');
    },
  });

  if (isLoading) return <CardListSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">
          {sessions?.length || 0} active session(s)
        </p>
        {sessions && sessions.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRevokeAllSessionsModal(true)}
            disabled={revokeAllMutation.isPending}
            className="border-border text-fg-muted hover:bg-secondary"
          >
            <LogOut className="w-3 h-3 mr-1" />
            Revoke All Others
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {sessions?.map((session) => (
          <div
            key={session.sessionId}
            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4 text-fg-muted" />
              <div>
                <p className="text-fg text-sm font-medium">{session.device || 'Unknown Device'}</p>
                <p className="text-xs text-fg-muted">
                  {[session.ipAddress, session.lastActivity && new Date(session.lastActivity).toLocaleString()].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
            {session.isCurrent ? (
              <Badge variant="success" className="bg-success-solid">Current</Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRevokeSessionId(session.sessionId);
                  setShowRevokeSessionModal(true);
                }}
                disabled={revokeSessionMutation.isPending}
                className="text-danger hover:bg-danger-soft"
              >
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>

      <ConfirmationModal
        open={showRevokeAllSessionsModal}
        onOpenChange={setShowRevokeAllSessionsModal}
        title="Revoke All Other Sessions"
        description="Are you sure you want to revoke all other active sessions? You will remain logged in on this device."
        confirmText="Revoke All"
        cancelText="Cancel"
        variant="default"
        onConfirm={() => revokeAllMutation.mutate()}
      />

      <ConfirmationModal
        open={showRevokeSessionModal}
        onOpenChange={setShowRevokeSessionModal}
        title="Revoke Session"
        description="Are you sure you want to revoke this session?"
        confirmText="Revoke"
        cancelText="Cancel"
        variant="default"
        onConfirm={() => {
          if (revokeSessionId) {
            revokeSessionMutation.mutate(revokeSessionId);
          }
        }}
      />
    </div>
  );
};

export default UserProfile;

