import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '@lib/axios';
import { setCredentials } from '@store/slices/authSlice';
import { GetCountries, GetState, GetCity } from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import {
  User, MapPin, ShieldCheck, Building2, FileText, BookUser, Car,
  CheckCircle2, ChevronLeft, ChevronRight, Loader2, Pencil, AlertCircle,
  XCircle, CreditCard,
} from 'lucide-react';

import { sellerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Checkbox } from '@components/ui/checkbox';
import { Loading } from '@components/ui/loading';
import { cn } from '@/lib/utils';
import { showApiError } from '@utils/toast';

import { StepProgress, FileDropzone, LocationSelect } from '@features/seller';

const TAX_ID_TYPES = ['ABN', 'VAT', 'EIN', 'GST', 'TIN', 'OTHER'];

const STEPS = [
  { label: 'Personal Info' },
  { label: 'Identity' },
  { label: 'Business' },
  { label: 'Review' },
];

// 18 years ago as yyyy-mm-dd, for the date input's max attribute.
const maxDobString = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
};

const ageFrom = (dobStr) => {
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

/* ── Small inline helpers ───────────────────────────────────────────── */

const Field = ({ label, error, required, children, hint }) => (
  <div className="space-y-1.5">
    {label && (
      <span className="block text-sm font-medium text-gray-200">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
    )}
    {children}
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const TextInput = ({ error, ...props }) => (
  <input
    {...props}
    className={cn(
      'h-11 w-full rounded-lg border bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-gray-500 outline-none transition-colors',
      'focus:border-accent focus:ring-2 focus:ring-accent/40',
      error ? 'border-destructive seller-shake' : 'border-gray-600 hover:border-gray-500',
    )}
  />
);

const Collapse = ({ open, children }) => (
  <div className={cn('seller-collapse', open && 'open')}>
    <div>{children}</div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-5 border-b border-gray-700 pb-3">
    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
      {Icon && <Icon className="h-5 w-5 text-accent" />}
      {title}
    </h3>
    {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
  </div>
);

// Thumbnail for a selected File (image preview or PDF icon) used in review step.
// The preview URL is owned by the parent (generated on upload) so it is always
// valid here — we never create object URLs during render.
const FileThumb = ({ file, previewUrl, label }) => {
  if (!file) return null;
  const isPdf = file.type === 'application/pdf';
  return (
    <div className="flex flex-col items-center gap-1">
      {previewUrl && !isPdf ? (
        <img
          src={previewUrl}
          alt={label}
          className="h-24 w-24 rounded-lg border border-gray-600 object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-600 bg-accent/10">
          <FileText className="h-9 w-9 text-accent" />
        </div>
      )}
      <span className="max-w-[96px] truncate text-[11px] text-gray-400">{file.name}</span>
    </div>
  );
};

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <span className="text-gray-400">{label}</span>
    <span className="text-right font-medium text-white">{value || '—'}</span>
  </div>
);

/* ── Main component ─────────────────────────────────────────────────── */

const BecomeSeller = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullLegalName: '',
    dateOfBirth: '',
    idType: '',
    shopName: '',
    description: '',
    businessName: '',
    taxIdType: '',
    taxId: '',
  });

  // Location: keep ids (for fetching children) + names (for submit).
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loc, setLoc] = useState({
    countryId: null, countryName: '',
    stateId: null, stateName: '',
    cityId: null, cityName: '',
  });
  const [locLoading, setLocLoading] = useState({ states: false, cities: false });

  // Files
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [certificate, setCertificate] = useState(null);

  // Object-URL previews for the uploaded files, generated on upload (NOT during
  // render) so they survive StrictMode and never point at a revoked URL.
  const [previews, setPreviews] = useState({
    idFront: null, idBack: null, proofOfAddress: null, certificate: null,
  });
  const previewsRef = useRef(previews);
  useEffect(() => { previewsRef.current = previews; }, [previews]);

  // Revoke every outstanding object URL when the form unmounts.
  useEffect(() => () => {
    Object.values(previewsRef.current).forEach((u) => u && URL.revokeObjectURL(u));
  }, []);

  // Store a file + its image preview URL together. Revokes any prior URL for
  // that slot and clears the field error. PDFs get no preview (we show an icon).
  const setFile = (key, setter) => (file) => {
    setter(file);
    const url = file && file.type?.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: url };
    });
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  /* ── Existing-application check ── */
  const { data: sellerStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['seller-application-status'],
    queryFn: async () => {
      try {
        const res = await sellerAPI.checkSellerApplicationStatus();
        return res.data.data;
      } catch {
        return { hasApplication: false };
      }
    },
    retry: false,
  });

  /* ── Load countries once ── */
  useEffect(() => {
    GetCountries().then(setCountries).catch(() => setCountries([]));
  }, []);

  /* ── Load states when country changes ── */
  useEffect(() => {
    if (!loc.countryId) return;
    let active = true;
    GetState(loc.countryId)
      .then((s) => { if (active) setStates(s || []); })
      .catch(() => { if (active) setStates([]); })
      .finally(() => { if (active) setLocLoading((p) => ({ ...p, states: false })); });
    return () => { active = false; };
  }, [loc.countryId]);

  /* ── Load cities when state changes ── */
  useEffect(() => {
    if (!loc.countryId || !loc.stateId) return;
    let active = true;
    GetCity(loc.countryId, loc.stateId)
      .then((c) => { if (active) setCities(c || []); })
      .catch(() => { if (active) setCities([]); })
      .finally(() => { if (active) setLocLoading((p) => ({ ...p, cities: false })); });
    return () => { active = false; };
  }, [loc.countryId, loc.stateId]);

  const setField = (name) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  /* ── Mutation ── */
  const applyMutation = useMutation({
    mutationFn: (fd) => sellerAPI.applySeller(fd),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['seller-application-status'] });
    },
    onError: (err) => showApiError(err, 'Failed to submit seller application'),
  });

  /* ── Per-step validation ── */
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.fullLegalName.trim()) e.fullLegalName = 'Full legal name is required';
      if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
      else if (Number.isNaN(ageFrom(form.dateOfBirth))) e.dateOfBirth = 'Enter a valid date';
      else if (ageFrom(form.dateOfBirth) < 18) e.dateOfBirth = 'You must be at least 18 years old';
      if (!loc.countryId) e.country = 'Country is required';
      if (states.length > 0 && !loc.stateId) e.state = 'State / province is required';
      if (cities.length > 0 && !loc.cityId) e.city = 'City is required';
    }
    if (s === 1) {
      if (!form.idType) e.idType = 'Please select an ID type';
      if (!idFront) e.idFront = 'Front image is required';
      if (form.idType === 'drivers_license' && !idBack) e.idBack = 'Back image is required';
    }
    if (s === 2) {
      if (!form.shopName.trim()) e.shopName = 'Store name is required';
      if (form.taxIdType && !form.taxId.trim()) e.taxId = 'Tax ID number is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setDirection('forward');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => {
    setDirection('back');
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };
  const goToStep = (i) => {
    setDirection(i > step ? 'forward' : 'back');
    setStep(i);
  };

  const handleSubmit = () => {
    // Re-validate all steps defensively.
    for (let i = 0; i <= 2; i++) {
      if (!validateStep(i)) { goToStep(i); return; }
    }
    const fd = new FormData();
    fd.append('shopName', form.shopName.trim());
    if (form.description.trim()) fd.append('description', form.description.trim());
    fd.append('country', loc.countryName);
    fd.append('state', loc.stateName);
    fd.append('city', loc.cityName);
    fd.append('fullLegalName', form.fullLegalName.trim());
    fd.append('dateOfBirth', form.dateOfBirth);
    fd.append('idType', form.idType);
    if (form.businessName.trim()) fd.append('businessName', form.businessName.trim());
    if (form.taxId.trim()) fd.append('taxId', form.taxId.trim());
    if (form.taxIdType) fd.append('taxIdType', form.taxIdType);
    fd.append('idFront', idFront);
    if (idBack) fd.append('idBack', idBack);
    if (proofOfAddress) fd.append('proofOfAddress', proofOfAddress);
    if (certificate) fd.append('certificate', certificate);
    applyMutation.mutate(fd);
  };

  const dobLabel = useMemo(
    () => (form.dateOfBirth ? new Date(form.dateOfBirth).toLocaleDateString() : ''),
    [form.dateOfBirth],
  );

  /* ── Loading / already-applied / success short-circuits ── */
  if (isLoadingStatus) return <Loading message="Checking seller status..." />;

  if (submitted) return <SuccessScreen onDashboard={() => navigate('/user/dashboard')} />;

  if (sellerStatus?.hasApplication && sellerStatus?.seller) {
    return <AlreadyApplied seller={sellerStatus.seller} />;
  }

  /* ── Wizard ── */
  return (
    <div className="mx-auto w-full max-w-[720px] px-1 py-2 sm:py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Become a Seller</h1>
        <p className="mt-1 text-sm text-gray-400">
          Complete the steps below to apply. It only takes a few minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-700 bg-[#0a1f47] p-5 shadow-2xl sm:p-8">
        <div className="mb-8 px-1 sm:px-2">
          <StepProgress steps={STEPS} current={step} onStepClick={goToStep} />
        </div>

        {/* Animated step content */}
        <div
          key={step}
          className={direction === 'forward' ? 'seller-step-forward' : 'seller-step-back'}
        >
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle icon={User} title="Personal Details" subtitle="Tell us who you are." />
              <Field label="Full Legal Name" required error={errors.fullLegalName}>
                <TextInput
                  value={form.fullLegalName}
                  onChange={setField('fullLegalName')}
                  placeholder="As shown on your ID"
                  error={errors.fullLegalName}
                />
              </Field>

              <Field
                label="Date of Birth"
                required
                error={errors.dateOfBirth}
                hint="You must be at least 18 years old."
              >
                <TextInput
                  type="date"
                  value={form.dateOfBirth}
                  onChange={setField('dateOfBirth')}
                  max={maxDobString()}
                  error={errors.dateOfBirth}
                  style={{ colorScheme: 'dark' }}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <LocationSelect
                  id="country"
                  label="Country *"
                  placeholder="Select country"
                  options={countries}
                  value={loc.countryId}
                  error={errors.country}
                  onChange={(o) => {
                    setLoc({
                      countryId: o.id, countryName: o.name,
                      stateId: null, stateName: '',
                      cityId: null, cityName: '',
                    });
                    setStates([]); setCities([]);
                    setLocLoading({ states: true, cities: false });
                    setErrors((p) => ({ ...p, country: undefined }));
                  }}
                />
                <LocationSelect
                  id="state"
                  label="State / Province *"
                  placeholder={loc.countryId ? 'Select state' : 'Select country first'}
                  options={states}
                  value={loc.stateId}
                  disabled={!loc.countryId}
                  loading={locLoading.states}
                  error={errors.state}
                  onChange={(o) => {
                    setLoc((p) => ({ ...p, stateId: o.id, stateName: o.name, cityId: null, cityName: '' }));
                    setCities([]);
                    setLocLoading((p) => ({ ...p, cities: true }));
                    setErrors((p) => ({ ...p, state: undefined }));
                  }}
                />
                <LocationSelect
                  id="city"
                  label="City *"
                  placeholder={loc.stateId ? 'Select city' : 'Select state first'}
                  options={cities}
                  value={loc.cityId}
                  disabled={!loc.stateId}
                  loading={locLoading.cities}
                  error={errors.city}
                  onChange={(o) => {
                    setLoc((p) => ({ ...p, cityId: o.id, cityName: o.name }));
                    setErrors((p) => ({ ...p, city: undefined }));
                  }}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <SectionTitle icon={ShieldCheck} title="Identity Verification" subtitle="Choose an ID and upload clear photos." />

              <Field label="ID Type" required error={errors.idType}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'passport', label: 'Passport', icon: BookUser },
                    { value: 'drivers_license', label: "Driver's License", icon: Car },
                  ].map((opt) => {
                    const active = form.idType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, idType: opt.value }));
                          if (opt.value === 'passport') setFile('idBack', setIdBack)(null);
                          setErrors((p) => ({ ...p, idType: undefined }));
                        }}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200',
                          active
                            ? 'border-accent bg-accent/10 shadow-[0_0_0_3px_rgba(14,81,226,0.18)]'
                            : 'border-gray-600 bg-white/[0.02] hover:border-accent/60 hover:bg-accent/[0.04]',
                        )}
                      >
                        <opt.icon className={cn('h-8 w-8', active ? 'text-accent' : 'text-gray-400')} />
                        <span className={cn('text-sm font-medium', active ? 'text-white' : 'text-gray-300')}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Upload zones with smooth show/hide between passport / license */}
              <Collapse open={!!form.idType}>
                <div className="pt-2">
                  {form.idType === 'drivers_license' ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FileDropzone
                        label="License — Front *"
                        file={idFront}
                        previewUrl={previews.idFront}
                        onChange={setFile('idFront', setIdFront)}
                        note="Max file size 10MB."
                        error={errors.idFront}
                        compact
                      />
                      <FileDropzone
                        label="License — Back *"
                        file={idBack}
                        previewUrl={previews.idBack}
                        onChange={setFile('idBack', setIdBack)}
                        note="Max file size 10MB."
                        error={errors.idBack}
                        compact
                      />
                    </div>
                  ) : (
                    <FileDropzone
                      label="Passport Photo Page *"
                      file={idFront}
                      previewUrl={previews.idFront}
                      onChange={setFile('idFront', setIdFront)}
                      note="Upload the photo page of your passport. Max file size 10MB."
                      error={errors.idFront}
                    />
                  )}
                </div>
              </Collapse>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle icon={Building2} title="Business Information" subtitle="Your storefront and tax details." />

              <Field label="Store Name" required error={errors.shopName} hint="The public name buyers will see.">
                <TextInput
                  value={form.shopName}
                  onChange={setField('shopName')}
                  placeholder="e.g. PixelKeys Store"
                  error={errors.shopName}
                />
              </Field>

              <Field label="Store Description" hint="Briefly describe what you sell (optional).">
                <textarea
                  value={form.description}
                  onChange={setField('description')}
                  rows={3}
                  placeholder="What does your store offer?"
                  className="w-full rounded-lg border border-gray-600 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition-colors hover:border-gray-500 focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </Field>

              <Field label="Legal Business Name" hint="Registered business name, if applicable (optional).">
                <TextInput
                  value={form.businessName}
                  onChange={setField('businessName')}
                  placeholder="Registered business name"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tax ID Type">
                  <div className="relative">
                    <select
                      value={form.taxIdType}
                      onChange={setField('taxIdType')}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-600 bg-white/[0.03] px-3.5 pr-9 text-sm text-white outline-none transition-colors hover:border-gray-500 focus:border-accent focus:ring-2 focus:ring-accent/40"
                    >
                      <option value="" className="bg-[#0a1f47]">Select type</option>
                      {TAX_ID_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#0a1f47]">{t}</option>
                      ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-400" />
                  </div>
                </Field>

                <div className={cn('transition-opacity', !form.taxIdType && 'pointer-events-none opacity-0')}>
                  <Collapse open={!!form.taxIdType}>
                    <Field label="Tax ID Number" required={!!form.taxIdType} error={errors.taxId}>
                      <TextInput
                        value={form.taxId}
                        onChange={setField('taxId')}
                        placeholder={`Enter your ${form.taxIdType || 'tax'} number`}
                        error={errors.taxId}
                      />
                    </Field>
                  </Collapse>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FileDropzone
                  label="Proof of Address"
                  file={proofOfAddress}
                  previewUrl={previews.proofOfAddress}
                  onChange={setFile('proofOfAddress', setProofOfAddress)}
                  note="Bank statement less than 3 months old."
                />
                <FileDropzone
                  label="Certificate of Incorporation"
                  file={certificate}
                  previewUrl={previews.certificate}
                  onChange={setFile('certificate', setCertificate)}
                  note="Business registration document."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle icon={CheckCircle2} title="Review & Submit" subtitle="Check everything is correct before submitting." />

              {/* Section 1 */}
              <ReviewCard title="Personal Information" icon={User} onEdit={() => goToStep(0)}>
                <SummaryRow label="Full Legal Name" value={form.fullLegalName} />
                <SummaryRow label="Date of Birth" value={dobLabel} />
                <SummaryRow label="Country" value={loc.countryName} />
                <SummaryRow label="State / Province" value={loc.stateName} />
                <SummaryRow label="City" value={loc.cityName} />
              </ReviewCard>

              {/* Section 2 */}
              <ReviewCard title="Identity Verification" icon={ShieldCheck} onEdit={() => goToStep(1)}>
                <SummaryRow
                  label="ID Type"
                  value={form.idType === 'drivers_license' ? "Driver's License" : form.idType === 'passport' ? 'Passport' : ''}
                />
                <div className="mt-3 flex flex-wrap gap-4">
                  <FileThumb file={idFront} previewUrl={previews.idFront} label={form.idType === 'passport' ? 'Passport' : 'Front'} />
                  <FileThumb file={idBack} previewUrl={previews.idBack} label="Back" />
                </div>
              </ReviewCard>

              {/* Section 3 */}
              <ReviewCard title="Business Information" icon={Building2} onEdit={() => goToStep(2)}>
                <SummaryRow label="Store Name" value={form.shopName} />
                {form.description && <SummaryRow label="Description" value={form.description} />}
                {form.businessName && <SummaryRow label="Business Name" value={form.businessName} />}
                {form.taxIdType && <SummaryRow label="Tax ID" value={`${form.taxId} (${form.taxIdType})`} />}
                {(proofOfAddress || certificate) && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    <FileThumb file={proofOfAddress} previewUrl={previews.proofOfAddress} label="Proof of Address" />
                    <FileThumb file={certificate} previewUrl={previews.certificate} label="Certificate" />
                  </div>
                )}
              </ReviewCard>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-700 bg-white/[0.02] p-4">
                <span className="mt-0.5">
                  <Checkbox checked={confirmed} onCheckedChange={setConfirmed} />
                </span>
                <span className="text-sm text-gray-300">
                  I confirm all information provided is accurate and complete.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-700 pt-5">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={applyMutation.isPending}
              className="border-gray-600 bg-transparent text-gray-200 hover:bg-white/5"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              className="bg-accent text-white hover:bg-accent/90"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!confirmed || applyMutation.isPending}
              className="min-w-[170px] bg-accent text-white hover:bg-accent/90"
            >
              {applyMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <>Submit Application <CheckCircle2 className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Review card ── */
const ReviewCard = ({ title, icon: Icon, onEdit, children }) => (
  <div className="rounded-xl border border-gray-700 bg-white/[0.02] p-4">
    <div className="mb-2 flex items-center justify-between border-b border-gray-700/70 pb-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
        {Icon && <Icon className="h-4 w-4 text-accent" />} {title}
      </h4>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-xs text-accent hover:underline"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>
    </div>
    <div className="divide-y divide-gray-800">{children}</div>
  </div>
);

/* ── Success screen ── */
const SuccessScreen = ({ onDashboard }) => (
  <div className="mx-auto flex max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">
    <div className="seller-pop-check mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15">
      <CheckCircle2 className="h-14 w-14 text-green-500" strokeWidth={2.2} />
    </div>
    <h1 className="text-2xl font-bold text-white sm:text-3xl">Application Submitted!</h1>
    <p className="mt-3 text-gray-400">
      We&apos;ll review your application within 2-3 business days and notify you once a decision has been made.
    </p>
    <Button onClick={onDashboard} className="mt-8 bg-accent text-white hover:bg-accent/90">
      Go to Dashboard
    </Button>
  </div>
);

/* ── Already-applied status view ── */
const AlreadyApplied = ({ seller }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const status = seller.status;

  // Approval grants the 'seller' role server-side; re-fetch the profile so the
  // client picks up the new role before the seller route guard runs.
  const refreshThenGoToSeller = async () => {
    try {
      const { data: body } = await api.get('/user/profile');
      const user = body?.data;
      if (!user) throw new Error('Invalid profile response');
      dispatch(setCredentials({ user }));
      sessionStorage.removeItem('allowCustomerAccess');
      queryClient.invalidateQueries({ queryKey: ['verify-token'] });
      navigate('/seller/dashboard', { replace: true });
    } catch (err) {
      showApiError(err, 'Could not update your session. Please try again or sign in again.');
    }
  };

  const banner = {
    pending: {
      icon: AlertCircle, color: 'yellow', title: 'Application Under Review',
      text: 'Your seller application is currently being reviewed by our team. You will be notified once a decision has been made.',
    },
    active: {
      icon: CheckCircle2, color: 'green', title: 'Application Approved!',
      text: 'Congratulations! Your seller application has been approved. You can now access the seller dashboard and start selling.',
    },
    banned: {
      icon: XCircle, color: 'red', title: 'Application Rejected',
      text: 'Unfortunately, your seller application has been rejected. If you believe this is an error, please contact support.',
    },
  }[status] || {
    icon: AlertCircle, color: 'yellow', title: 'Application Submitted',
    text: 'Your seller application has been submitted.',
  };

  const colorMap = {
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
    green: 'bg-green-500/10 border-green-500/30 text-green-500',
    red: 'bg-red-500/10 border-red-500/30 text-red-500',
  };
  const Icon = banner.icon;

  return (
    <div className="mx-auto w-full max-w-[720px] px-1 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Become a Seller</h1>
        <p className="mt-1 text-gray-400">Your seller application status</p>
      </div>

      <div className="rounded-2xl border border-gray-700 bg-[#0a1f47] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
          <div>
            <p className="text-sm text-gray-400">Store Name</p>
            <p className="text-lg font-semibold text-white">{seller.shopName}</p>
          </div>
          <Badge variant={status === 'active' ? 'success' : status === 'banned' ? 'destructive' : 'warning'}>
            {status === 'active' ? 'Approved' : status === 'banned' ? 'Rejected' : 'Pending Review'}
          </Badge>
        </div>

        <div className={cn('rounded-xl border p-4', colorMap[banner.color])}>
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{banner.title}</p>
              <p className="mt-1 text-sm text-gray-300">{banner.text}</p>
              {status === 'active' && (
                <Button className="mt-3 bg-accent hover:bg-accent/90" onClick={refreshThenGoToSeller}>
                  Go to Seller Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: 'Full Legal Name', value: seller.fullLegalName, icon: User },
            { label: 'Business Name', value: seller.businessName, icon: Building2 },
            { label: 'Country', value: seller.country, icon: MapPin },
            { label: 'State', value: seller.state, icon: MapPin },
            { label: 'City', value: seller.city, icon: MapPin },
            { label: 'ID Type', value: seller.idType === 'drivers_license' ? "Driver's License" : seller.idType === 'passport' ? 'Passport' : null, icon: CreditCard },
          ].filter((f) => f.value).map((f) => (
            <div key={f.label}>
              <p className="text-xs text-gray-400">{f.label}</p>
              <p className="mt-0.5 text-sm text-white">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
