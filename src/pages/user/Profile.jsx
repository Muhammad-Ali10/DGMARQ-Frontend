import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@services/api';
import { API_BASE_URL } from '@lib/config';
import { updateUser, logout } from '@store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { FormSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { User, Lock, Mail, Camera, Shield, Link2, Unlink, Trash2, LogOut, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import ConfirmationModal from '@components/common/ConfirmationModal';
import SafeImage from '@components/ui/safe-image';
import { showSuccess, showError, showApiError } from '@utils/toast';
import { toast } from 'sonner';

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profileImage || '');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const otpInputRef = useRef(null);
  const [showUnlinkGoogleModal, setShowUnlinkGoogleModal] = useState(false);
  const [showUnlinkFacebookModal, setShowUnlinkFacebookModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showRevokeAllSessionsModal, setShowRevokeAllSessionsModal] = useState(false);
  const [showRevokeSessionModal, setShowRevokeSessionModal] = useState(false);
  const [revokeSessionId, setRevokeSessionId] = useState(null);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => authAPI.getProfile().then(res => res.data.data),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (formData) => authAPI.updateProfile(null, formData),
    onSuccess: (data) => {
      dispatch(updateUser(data.data.data));
      showSuccess('Profile updated successfully');
      setProfileImage(null);
    },
    onError: (error) => {
      showApiError(error, 'Failed to update profile');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.updatePassword(data),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update password');
    },
  });

  const queryClient = useQueryClient();

  const sendOTPMutation = useMutation({
    mutationFn: () => authAPI.sendEmailVerification(),
    onSuccess: () => {
      toast.success('Verification OTP sent successfully! Check your email.');
      setOtpDialogOpen(true);
      setOtp('');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to send verification OTP');
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: (data) => authAPI.verifyEmail(data),
    onSuccess: (data) => {
      toast.success('Email verified successfully!');
      setOtpDialogOpen(false);
      setOtp('');
      if (data?.data?.data) {
        dispatch(updateUser({ ...currentUser, emailVerified: true }));
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Invalid or expired OTP');
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
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  if (isLoading) return <FormSkeleton fields={5} />;

  const currentUser = profileData || user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">Profile Settings</h1>
        <p className="text-fg-muted mt-1">Manage your account information and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
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
                    <p className="text-xs text-fg-subtle">Email cannot be changed</p>
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
              {/* Email Verification */}
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
                    
                    {/* OTP Verification Dialog */}
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
                                const value = e.target.value.replace(/\D/g, ''); // Only numbers
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

              {/* OAuth Accounts */}
              <div className="space-y-4 border-t border-brand-cyan/10 pt-4">
                <h3 className="text-fg font-medium">Connected Accounts</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Link2 className="w-4 h-4 text-fg-muted" />
                      <span className="text-fg-muted">Google</span>
                    </div>
                    {currentUser?.googleId ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="success" className="bg-success-solid">Connected</Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowUnlinkGoogleModal(true)}
                        >
                          <Unlink className="w-3 h-3 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `${API_BASE_URL}/user/auth/google`;
                        }}
                        className=""
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Link
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Link2 className="w-4 h-4 text-fg-muted" />
                      <span className="text-fg-muted">Facebook</span>
                    </div>
                    {currentUser?.facebookId ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="success" className="bg-success-solid">Connected</Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowUnlinkFacebookModal(true)}
                        >
                          <Unlink className="w-3 h-3 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `${API_BASE_URL}/user/auth/facebook`;
                        }}
                        className=""
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Link
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Change Email */}
              <div className="space-y-4 border-t border-brand-cyan/10 pt-4">
                <h3 className="text-fg font-medium">Change Email</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newEmail = formData.get('newEmail');
                    const password = formData.get('password');
                    if (newEmail && password) {
                      authAPI.changeEmail({ newEmail, password })
                        .then(() => {
                          showSuccess('Verification email sent to new address');
                          e.target.reset();
                        })
                        .catch((error) => {
                          showApiError(error, 'Failed to send verification email');
                        });
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
                      className="bg-secondary border-border text-fg"
                      placeholder="Enter password to confirm"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Request Email Change
                  </Button>
                </form>
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
                <div className="p-4 bg-danger-soft border border-danger/35 rounded-lg">
                  <h3 className="text-danger font-medium mb-2">Danger Zone</h3>
                  <p className="text-sm text-fg-muted mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Dialog>
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
                          This action cannot be undone. Please enter your password to confirm.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const password = formData.get('password');
                          if (password) {
                            setShowDeleteAccountModal(true);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="deletePassword" className="text-fg-muted">Password</Label>
                          <Input
                            id="deletePassword"
                            name="password"
                            type="password"
                            className="bg-secondary border-border text-fg"
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        <Button type="submit" variant="destructive" className="w-full">
                          Delete My Account
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

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={showUnlinkGoogleModal}
        onOpenChange={setShowUnlinkGoogleModal}
        title="Unlink Google Account"
        description="Are you sure you want to unlink your Google account?"
        confirmText="Unlink"
        cancelText="Cancel"
        variant="default"
        onConfirm={() => {
          authAPI.unlinkOAuth({ provider: 'google' })
            .then(() => {
              showSuccess('Google account unlinked');
              window.location.reload();
            })
            .catch((error) => {
              showApiError(error, 'Failed to unlink Google account');
            });
        }}
      />

      <ConfirmationModal
        open={showUnlinkFacebookModal}
        onOpenChange={setShowUnlinkFacebookModal}
        title="Unlink Facebook Account"
        description="Are you sure you want to unlink your Facebook account?"
        confirmText="Unlink"
        cancelText="Cancel"
        variant="default"
        onConfirm={() => {
          authAPI.unlinkOAuth({ provider: 'facebook' })
            .then(() => {
              showSuccess('Facebook account unlinked');
              window.location.reload();
            })
            .catch((error) => {
              showApiError(error, 'Failed to unlink Facebook account');
            });
        }}
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
          const passwordInput = document.getElementById('deletePassword');
          const password = passwordInput?.value;
          if (password) {
            authAPI.deleteAccount({ password })
              .then(() => {
                dispatch(logout());
                navigate('/login');
                showSuccess('Account deleted successfully');
              })
              .catch((error) => {
                showApiError(error, 'Failed to delete account');
              });
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
    onError: (error) => {
      showApiError(error, 'Failed to revoke session');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => authAPI.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      setShowRevokeAllSessionsModal(false);
      showSuccess('All other sessions revoked');
    },
    onError: (error) => {
      showApiError(error, 'Failed to revoke sessions');
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
                  {session.ipAddress} • {new Date(session.lastActivity).toLocaleString()}
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

      {/* Session Confirmation Modals */}
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

