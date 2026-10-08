import { useEffect, useRef, useState, useId, cloneElement, isValidElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@store/slices/authSlice';
import { GetCountries, GetState, GetCity } from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import {
  User, UserCheck, MapPin, ShieldCheck, Building2, FileText, BookUser, Car,
  CheckCircle2, ChevronLeft, ChevronRight, Loader2, Pencil, AlertCircle,
  XCircle, CreditCard,
} from 'lucide-react';

import { sellerAPI } from '@services/api';
import { ME_QUERY_KEY, fetchMe } from '@hooks/useMe';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Checkbox } from '@components/ui/checkbox';
import { Textarea } from '@components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { FormSkeleton } from '@components/common/Skeletons';
import { ErrorState } from '@components/common/ErrorState';
import { cn } from '@/lib/utils';
import { showApiError } from '@utils/toast';

import {
  StepProgress, FileDropzone, LocationSelect,
  useTaxIdCatalog, normalizeTaxId, taxIdOptions, taxIdLabel, SELLER_TYPE_LABELS,
} from '@features/seller';

const STEPS = [
  { label: 'Seller Type' },
  { label: 'Personal Info' },
  { label: 'Identity' },
  { label: 'Store & Tax' },
  { label: 'Review' },
];
const LAST_FORM_STEP = STEPS.length - 2;

const SELLER_TYPE_OPTIONS = [
  { value: 'individual', description: 'You sell in your own name.', icon: User },
  { value: 'business', description: 'A registered company or other legal entity.', icon: Building2 },
];

const MAX_STATEMENT_AGE_DAYS = 90;

const maxDobString = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
};

const localDateString = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const daysAgoString = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateString(d);
};

const formatDateInput = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '');

const ageFrom = (dobStr) => {
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

const Field = ({ label, error, required, children, hint }) => {
  const generatedId = useId();
  const id = (isValidElement(children) && children.props?.id) || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-fg">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={hintId} className="text-xs text-fg-subtle">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

const TextInput = ({ error, ...props }) => (
  <input
    {...props}
    className={cn(
      'h-11 w-full rounded-lg border bg-surface-sunken px-3.5 text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors',
      'focus:border-accent focus:ring-2 focus:ring-accent/40',
      error ? 'border-destructive seller-shake' : 'border-border-interactive hover:border-ring',
    )}
  />
);

const Collapse = ({ open, children }) => (
  <div className={cn('seller-collapse', open && 'open')}>
    <div>{children}</div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-5 border-b border-brand-cyan/10 pb-3">
    <h3 className="flex items-center gap-2 text-lg font-semibold text-fg">
      {Icon && <Icon className="h-5 w-5 text-accent-on-dark" />}
      {title}
    </h3>
    {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
  </div>
);

const FileThumb = ({ file, previewUrl, label }) => {
  if (!file) return null;
  const isPdf = file.type === 'application/pdf';
  return (
    <div className="flex flex-col items-center gap-1">
      {previewUrl && !isPdf ? (
        <img
          src={previewUrl}
          alt={label}
          className="h-24 w-24 rounded-lg border border-border-interactive object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-border-interactive bg-accent/10">
          <FileText className="h-9 w-9 text-accent-on-dark" />
        </div>
      )}
      <span className="max-w-[96px] truncate text-[11px] text-fg-muted">{file.name}</span>
    </div>
  );
};

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <span className="text-fg-muted">{label}</span>
    <span className="text-right font-medium text-fg">{value || '—'}</span>
  </div>
);

const BecomeSeller = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reapplying, setReapplying] = useState(false);

  const [form, setForm] = useState({
    sellerType: '',
    fullLegalName: '',
    dateOfBirth: '',
    idType: '',
    proofOfAddressDate: '',
    shopName: '',
    description: '',
    businessName: '',
    taxIdType: '',
    taxId: '',
    additionalNotes: '',
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loc, setLoc] = useState({
    countryId: null, countryName: '', countryCode: '',
    stateId: null, stateName: '',
    cityId: null, cityName: '',
  });
  const [locLoading, setLocLoading] = useState({ states: false, cities: false });

  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [certificate, setCertificate] = useState(null);

  const [previews, setPreviews] = useState({
    idFront: null, idBack: null, proofOfAddress: null, certificate: null,
  });
  const previewsRef = useRef(previews);
  useEffect(() => { previewsRef.current = previews; }, [previews]);

  useEffect(() => () => {
    Object.values(previewsRef.current).forEach((u) => u && URL.revokeObjectURL(u));
  }, []);

  const setFile = (key, setter) => (file) => {
    setter(file);
    const url = file && file.type?.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: url };
    });
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const {
    data: sellerStatus,
    isLoading: isLoadingStatus,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
    isFetching: isFetchingStatus,
  } = useQuery({
    queryKey: ['seller-application-status'],
    queryFn: () => sellerAPI.checkSellerApplicationStatus().then((res) => res.data.data),
    retry: false,
  });

  const {
    data: taxCatalog,
    isLoading: isLoadingTaxCatalog,
    isError: isTaxCatalogError,
    refetch: refetchTaxCatalog,
  } = useTaxIdCatalog({ enabled: sellerStatus?.hasApplication === false || reapplying });

  useEffect(() => {
    GetCountries().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    if (!loc.countryId) return;
    let active = true;
    GetState(loc.countryId)
      .then((s) => { if (active) setStates(s || []); })
      .catch(() => { if (active) setStates([]); })
      .finally(() => { if (active) setLocLoading((p) => ({ ...p, states: false })); });
    return () => { active = false; };
  }, [loc.countryId]);

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

  const isBusiness = form.sellerType === 'business';

  const taxOptions = taxIdOptions(taxCatalog, loc.countryCode, form.sellerType);
  const taxIdType = taxOptions.includes(form.taxIdType) ? form.taxIdType : (taxOptions[0] || '');
  const taxType = taxCatalog?.types[taxIdType];

  const applyMutation = useMutation({
    mutationFn: (fd) => sellerAPI.applySeller(fd),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['seller-application-status'] });
    },
    onError: (err) => showApiError(err, 'Failed to submit seller application'),
  });

  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.sellerType) e.sellerType = 'Please choose how you will sell';
    }
    if (s === 1) {
      if (!form.fullLegalName.trim()) e.fullLegalName = 'Full legal name is required';
      if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
      else if (Number.isNaN(ageFrom(form.dateOfBirth))) e.dateOfBirth = 'Enter a valid date';
      else if (ageFrom(form.dateOfBirth) < 18) e.dateOfBirth = 'Must be at least 18 years old';
      if (!loc.countryId) e.country = 'Country is required';
      if (locLoading.states) e.state = 'Please wait for the list to load';
      else if (states.length > 0 && !loc.stateId) e.state = 'State / province is required';
      if (locLoading.cities) e.city = 'Please wait for the list to load';
      else if (cities.length > 0 && !loc.cityId) e.city = 'City is required';
    }
    if (s === 2) {
      if (!form.idType) e.idType = 'Please select an ID type';
      if (!idFront) e.idFront = 'Front image is required';
      if (form.idType === 'drivers_license' && !idBack) e.idBack = 'Back image is required';
      if (!proofOfAddress) e.proofOfAddress = 'Bank statement is required';
      if (!form.proofOfAddressDate) e.proofOfAddressDate = 'Statement date is required';
      else if (form.proofOfAddressDate > localDateString(new Date())) e.proofOfAddressDate = 'Statement date cannot be in the future';
      else if (form.proofOfAddressDate < daysAgoString(MAX_STATEMENT_AGE_DAYS)) e.proofOfAddressDate = 'Statement must be less than 3 months old';
    }
    if (s === 3) {
      if (!form.shopName.trim()) e.shopName = 'Store name is required';
      if (isBusiness && !form.businessName.trim()) e.businessName = 'Legal business name is required';
      if (isBusiness && !certificate) e.certificate = 'Certificate of incorporation / business registration is required';
      const taxValue = normalizeTaxId(form.taxId);
      if (isBusiness && !taxValue) e.taxId = 'Tax ID number is required for businesses';
      else if (taxValue && !taxType) e.taxId = "Tax ID types couldn't be loaded — please retry";
      else if (taxValue && !taxType.regex.test(taxValue)) e.taxId = `Please check the format (${taxType.hint})`;
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
    for (let i = 0; i <= LAST_FORM_STEP; i++) {
      if (!validateStep(i)) { goToStep(i); return; }
    }
    const fd = new FormData();
    fd.append('sellerType', form.sellerType);
    fd.append('shopName', form.shopName.trim());
    if (form.description.trim()) fd.append('description', form.description.trim());
    fd.append('country', loc.countryName);
    fd.append('countryCode', loc.countryCode);
    fd.append('state', loc.stateName);
    fd.append('city', loc.cityName);
    fd.append('fullLegalName', form.fullLegalName.trim());
    fd.append('dateOfBirth', form.dateOfBirth);
    fd.append('idType', form.idType);
    fd.append('proofOfAddressDate', form.proofOfAddressDate);
    if (isBusiness) fd.append('businessName', form.businessName.trim());
    if (form.additionalNotes.trim()) fd.append('additionalNotes', form.additionalNotes.trim());
    if (form.taxId.trim()) {
      fd.append('taxIdType', taxIdType);
      fd.append('taxId', form.taxId.trim());
    }
    fd.append('idFront', idFront);
    if (idBack) fd.append('idBack', idBack);
    fd.append('proofOfAddress', proofOfAddress);
    if (isBusiness) fd.append('certificate', certificate);
    applyMutation.mutate(fd);
  };

  if (isLoadingStatus) return <FormSkeleton fields={4} />;

  if (isStatusError) {
    return (
      <ErrorState
        error={statusError}
        title="We couldn't load your seller application"
        onRetry={isFetchingStatus ? undefined : () => refetchStatus()}
      />
    );
  }

  if (submitted) return <SuccessScreen onDashboard={() => navigate('/user/dashboard')} />;

  if (sellerStatus?.hasApplication && sellerStatus?.seller && !reapplying) {
    return <AlreadyApplied seller={sellerStatus.seller} onApplyAgain={() => setReapplying(true)} />;
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-1 py-2 sm:py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Become a Seller</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Complete the steps below to apply. It only takes a few minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-cyan/25 bg-surface-1 p-5 shadow-hud sm:p-8">
        <div className="mb-8 px-1 sm:px-2">
          <StepProgress steps={STEPS} current={step} onStepClick={goToStep} />
        </div>

        <div
          key={step}
          className={direction === 'forward' ? 'seller-step-forward' : 'seller-step-back'}
        >
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle
                icon={UserCheck}
                title="How will you sell?"
                subtitle="This decides which details and documents we need."
              />
              <fieldset>
                <legend className="sr-only">Seller type</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SELLER_TYPE_OPTIONS.map((opt) => {
                    const active = form.sellerType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all duration-200',
                          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40',
                          active
                            ? 'border-accent bg-accent/10 shadow-[0_0_0_3px_rgba(14,81,226,0.18)]'
                            : 'border-border-interactive bg-surface-sunken hover:border-accent/60 hover:bg-accent/[0.04]',
                          errors.sellerType && 'border-destructive',
                        )}
                      >
                        <input
                          type="radio"
                          name="sellerType"
                          value={opt.value}
                          checked={active}
                          onChange={setField('sellerType')}
                          aria-label={SELLER_TYPE_LABELS[opt.value]}
                          aria-describedby={`seller-type-${opt.value}-desc`}
                          className="sr-only"
                        />
                        <opt.icon className={cn('h-8 w-8', active ? 'text-accent-on-dark' : 'text-fg-muted')} />
                        <span className={cn('text-sm font-semibold', active ? 'text-fg' : 'text-fg-muted')}>
                          {SELLER_TYPE_LABELS[opt.value]}
                        </span>
                        <span id={`seller-type-${opt.value}-desc`} className="text-xs text-fg-subtle">
                          {opt.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.sellerType && <p className="mt-2 text-xs text-destructive">{errors.sellerType}</p>}
              </fieldset>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <SectionTitle
                icon={User}
                title={isBusiness ? 'Director / Beneficial Owner' : 'Personal Details'}
                subtitle={isBusiness
                  ? 'Details of the director or beneficial owner applying for the business.'
                  : 'Tell us who you are.'}
              />
              <Field label="Full Legal Name" required error={errors.fullLegalName}>
                <TextInput
                  value={form.fullLegalName}
                  onChange={setField('fullLegalName')}
                  placeholder={isBusiness ? "As shown on the director's ID" : 'As shown on your ID'}
                  error={errors.fullLegalName}
                />
              </Field>

              <Field
                label="Date of Birth"
                required
                error={errors.dateOfBirth}
                hint="Must be at least 18 years old."
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
                  label={isBusiness ? 'Country of Registration *' : 'Country *'}
                  placeholder="Select country"
                  options={countries}
                  value={loc.countryId}
                  error={errors.country}
                  onChange={(o) => {
                    setLoc({
                      countryId: o.id, countryName: o.name, countryCode: o.iso2,
                      stateId: null, stateName: '',
                      cityId: null, cityName: '',
                    });
                    setForm((p) => ({ ...p, taxIdType: '', taxId: '' }));
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
              <p className="text-xs text-fg-subtle">
                {isBusiness ? 'Where the business is registered.' : 'Where you live.'} This decides which tax IDs you can use.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle
                icon={ShieldCheck}
                title="Identity & Address"
                subtitle={isBusiness
                  ? 'Photo ID of the director or beneficial owner, and a recent bank statement.'
                  : 'Choose an ID, upload clear photos and a recent bank statement.'}
              />

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
                            : 'border-border-interactive bg-surface-sunken hover:border-accent/60 hover:bg-accent/[0.04]',
                        )}
                      >
                        <opt.icon className={cn('h-8 w-8', active ? 'text-accent-on-dark' : 'text-fg-muted')} />
                        <span className={cn('text-sm font-medium', active ? 'text-fg' : 'text-fg-muted')}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>

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
                      note="Upload the photo page of the passport. Max file size 10MB."
                      error={errors.idFront}
                    />
                  )}
                </div>
              </Collapse>

              <div className="grid grid-cols-1 gap-4 border-t border-brand-cyan/10 pt-5 sm:grid-cols-2">
                <FileDropzone
                  label="Proof of Address — Bank Statement *"
                  file={proofOfAddress}
                  previewUrl={previews.proofOfAddress}
                  onChange={setFile('proofOfAddress', setProofOfAddress)}
                  note={isBusiness
                    ? "In the business's or director's name, issued within the last 3 months."
                    : 'In your name, issued within the last 3 months.'}
                  error={errors.proofOfAddress}
                  compact
                />
                <Field
                  label="Statement Date"
                  required
                  error={errors.proofOfAddressDate}
                  hint="The issue date printed on the statement."
                >
                  <TextInput
                    type="date"
                    value={form.proofOfAddressDate}
                    onChange={setField('proofOfAddressDate')}
                    min={daysAgoString(MAX_STATEMENT_AGE_DAYS)}
                    max={localDateString(new Date())}
                    error={errors.proofOfAddressDate}
                    style={{ colorScheme: 'dark' }}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle
                icon={Building2}
                title={isBusiness ? 'Business & Tax Details' : 'Store & Tax Details'}
                subtitle={isBusiness
                  ? 'Your storefront, registered business and tax details.'
                  : 'Your storefront and (optional) tax details.'}
              />

              <Field label="Store Name" required error={errors.shopName} hint="The public name buyers will see.">
                <TextInput
                  value={form.shopName}
                  onChange={setField('shopName')}
                  placeholder="e.g. PixelKeys Store"
                  maxLength={60}
                  error={errors.shopName}
                />
              </Field>

              <Field label="Store Description" hint="Briefly describe what you sell (optional).">
                <Textarea
                  value={form.description}
                  onChange={setField('description')}
                  rows={3}
                  placeholder="What does your store offer?"
                />
              </Field>

              {isBusiness && (
                <>
                  <Field label="Legal Business Name" required error={errors.businessName} hint="Exactly as registered.">
                    <TextInput
                      value={form.businessName}
                      onChange={setField('businessName')}
                      placeholder="Registered business name"
                      error={errors.businessName}
                    />
                  </Field>

                  <FileDropzone
                    label="Certificate of Incorporation / Business Registration *"
                    file={certificate}
                    previewUrl={previews.certificate}
                    onChange={setFile('certificate', setCertificate)}
                    note="The official registration document for the business."
                    error={errors.certificate}
                  />
                </>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="taxIdType" className="block text-sm font-medium text-fg">
                    Tax ID Type {isBusiness && <span className="text-destructive">*</span>}
                  </label>
                  <Select value={taxIdType} onValueChange={setField('taxIdType')} disabled={!taxCatalog}>
                    <SelectTrigger
                      id="taxIdType"
                      className="w-full rounded-lg border-border-interactive data-[size=default]:h-11"
                    >
                      <SelectValue placeholder={isLoadingTaxCatalog ? 'Loading…' : 'Select type'} />
                    </SelectTrigger>
                    <SelectContent>
                      {taxOptions.map((code) => (
                        <SelectItem key={code} value={code}>{taxIdLabel(taxCatalog, code)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isTaxCatalogError ? (
                    <p className="text-xs text-destructive">
                      Couldn&apos;t load tax ID types.{' '}
                      <button type="button" onClick={() => refetchTaxCatalog()} className="underline">
                        Retry
                      </button>
                    </p>
                  ) : (
                    taxType && <p className="text-xs text-fg-subtle">{taxType.name}</p>
                  )}
                </div>

                <Field
                  label={isBusiness ? 'Tax ID Number' : 'Tax ID Number (optional)'}
                  required={isBusiness}
                  error={errors.taxId}
                  hint={taxType ? `Format: ${taxType.hint}` : undefined}
                >
                  <TextInput
                    value={form.taxId}
                    onChange={setField('taxId')}
                    placeholder={taxType ? `Your ${taxType.label}` : 'Tax number'}
                    error={errors.taxId}
                  />
                </Field>
              </div>

              <Field label="Additional Notes" hint="Anything else you'd like the review team to know (optional).">
                <Textarea
                  value={form.additionalNotes}
                  onChange={setField('additionalNotes')}
                  rows={3}
                  placeholder="e.g. where your stock comes from, or anything else the review team should know"
                  className="w-full rounded-lg border border-border-interactive bg-surface-sunken px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors hover:border-ring focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <SectionTitle icon={CheckCircle2} title="Review & Submit" subtitle="Check everything is correct before submitting." />

              <ReviewCard title="Seller Type" icon={UserCheck} onEdit={() => goToStep(0)}>
                <SummaryRow label="Selling as" value={SELLER_TYPE_LABELS[form.sellerType]} />
              </ReviewCard>

              <ReviewCard
                title={isBusiness ? 'Director / Beneficial Owner' : 'Personal Information'}
                icon={User}
                onEdit={() => goToStep(1)}
              >
                <SummaryRow label="Full Legal Name" value={form.fullLegalName} />
                <SummaryRow label="Date of Birth" value={formatDateInput(form.dateOfBirth)} />
                <SummaryRow label={isBusiness ? 'Country of Registration' : 'Country'} value={loc.countryName} />
                <SummaryRow label="State / Province" value={loc.stateName} />
                <SummaryRow label="City" value={loc.cityName} />
              </ReviewCard>

              <ReviewCard title="Identity & Address" icon={ShieldCheck} onEdit={() => goToStep(2)}>
                <SummaryRow
                  label="ID Type"
                  value={form.idType === 'drivers_license' ? "Driver's License" : form.idType === 'passport' ? 'Passport' : ''}
                />
                <SummaryRow label="Bank Statement Date" value={formatDateInput(form.proofOfAddressDate)} />
                <div className="mt-3 flex flex-wrap gap-4">
                  <FileThumb file={idFront} previewUrl={previews.idFront} label={form.idType === 'passport' ? 'Passport' : 'Front'} />
                  <FileThumb file={idBack} previewUrl={previews.idBack} label="Back" />
                  <FileThumb file={proofOfAddress} previewUrl={previews.proofOfAddress} label="Bank Statement" />
                </div>
              </ReviewCard>

              <ReviewCard
                title={isBusiness ? 'Business & Tax' : 'Store & Tax'}
                icon={Building2}
                onEdit={() => goToStep(3)}
              >
                <SummaryRow label="Store Name" value={form.shopName} />
                {form.description && <SummaryRow label="Description" value={form.description} />}
                {isBusiness && <SummaryRow label="Legal Business Name" value={form.businessName} />}
                <SummaryRow
                  label="Tax ID"
                  value={form.taxId.trim() ? `${form.taxId.trim()} (${taxIdLabel(taxCatalog, taxIdType)})` : 'Not provided'}
                />
                {form.additionalNotes && <SummaryRow label="Additional Notes" value={form.additionalNotes} />}
                {isBusiness && certificate && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    <FileThumb file={certificate} previewUrl={previews.certificate} label="Certificate" />
                  </div>
                )}
              </ReviewCard>

              <label
                htmlFor="become-seller-confirm"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
              >
                <span className="mt-0.5">
                  <Checkbox
                    id="become-seller-confirm"
                    checked={confirmed}
                    onCheckedChange={setConfirmed}
                  />
                </span>
                <span className="text-sm text-fg-muted">
                  I confirm all information provided is accurate and complete.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-brand-cyan/10 pt-5">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={applyMutation.isPending}
              className="border-border-interactive bg-transparent text-fg hover:bg-surface-2"
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
              className="bg-accent text-fg hover:bg-accent/90"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!confirmed || applyMutation.isPending}
              className="min-w-[170px] bg-accent text-fg hover:bg-accent/90"
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

const ReviewCard = ({ title, icon: Icon, onEdit, children }) => (
  <div className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4">
    <div className="mb-2 flex items-center justify-between border-b border-brand-cyan/10 pb-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
        {Icon && <Icon className="h-4 w-4 text-accent-on-dark" />} {title}
      </h4>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-xs text-accent-on-dark hover:underline"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>
    </div>
    <div className="divide-y divide-border">{children}</div>
  </div>
);

const SuccessScreen = ({ onDashboard }) => (
  <div className="mx-auto flex max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">
    <div className="seller-pop-check mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success-soft">
      <CheckCircle2 className="h-14 w-14 text-success" strokeWidth={2.2} />
    </div>
    <h1 className="text-2xl font-bold text-fg sm:text-3xl">Application Submitted!</h1>
    <p className="mt-3 text-fg-muted">
      We&apos;ll review your application within 2-3 business days and notify you once a decision has been made.
    </p>
    <Button onClick={onDashboard} className="mt-8 bg-accent text-fg hover:bg-accent/90">
      Go to Dashboard
    </Button>
  </div>
);

const STATUS_BADGE = {
  active: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  banned: { variant: 'destructive', label: 'Suspended' },
};

const AlreadyApplied = ({ seller, onApplyAgain }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const status = seller.status;

  const refreshThenGoToSeller = async () => {
    try {
      const user = await queryClient.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: fetchMe, staleTime: 0 });
      if (!user) throw new Error('Invalid profile response');
      dispatch(setCredentials({ user }));
      sessionStorage.removeItem('allowCustomerAccess');
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
    rejected: {
      icon: XCircle, color: 'red', title: 'Application Rejected',
      text: seller.rejectionReason
        ? `Reason: ${seller.rejectionReason}. You can fix this and apply again.`
        : 'Your seller application was not approved. You can update your details and apply again.',
    },
    banned: {
      icon: XCircle, color: 'red', title: 'Seller account suspended',
      text: 'Your seller account has been suspended. Please contact support if you believe this is a mistake.',
    },
  }[status] || {
    icon: AlertCircle, color: 'yellow', title: 'Application Submitted',
    text: 'Your seller application has been submitted.',
  };

  const colorMap = {
    yellow: 'bg-warning-soft border-warning/35 text-warning',
    green: 'bg-success-soft border-success/35 text-success',
    red: 'bg-danger-soft border-danger/35 text-danger',
  };
  const Icon = banner.icon;

  return (
    <div className="mx-auto w-full max-w-[720px] px-1 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Become a Seller</h1>
        <p className="mt-1 text-fg-muted">Your seller application status</p>
      </div>

      <div className="rounded-2xl border border-brand-cyan/25 bg-surface-1 p-6 shadow-hud">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-surface-sunken p-4">
          <div>
            <p className="text-sm text-fg-muted">Store Name</p>
            <p className="text-lg font-semibold text-fg">{seller.shopName}</p>
          </div>
          <Badge variant={STATUS_BADGE[status]?.variant || 'warning'}>
            {STATUS_BADGE[status]?.label || 'Pending Review'}
          </Badge>
        </div>

        <div className={cn('rounded-xl border p-4', colorMap[banner.color])}>
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{banner.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{banner.text}</p>
              {status === 'active' && (
                <Button className="mt-3 bg-accent hover:bg-accent/90" onClick={refreshThenGoToSeller}>
                  Go to Seller Dashboard
                </Button>
              )}
              {status === 'rejected' && (
                <Button className="mt-3 bg-accent hover:bg-accent/90" onClick={onApplyAgain}>
                  Apply again
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: 'Seller Type', value: SELLER_TYPE_LABELS[seller.sellerType], icon: UserCheck },
            { label: 'Full Legal Name', value: seller.fullLegalName, icon: User },
            { label: 'Business Name', value: seller.businessName, icon: Building2 },
            { label: 'Country', value: seller.country, icon: MapPin },
            { label: 'State', value: seller.state, icon: MapPin },
            { label: 'City', value: seller.city, icon: MapPin },
            { label: 'ID Type', value: seller.idType === 'drivers_license' ? "Driver's License" : seller.idType === 'passport' ? 'Passport' : null, icon: CreditCard },
          ].filter((f) => f.value).map((f) => (
            <div key={f.label}>
              <p className="text-xs text-fg-muted">{f.label}</p>
              <p className="mt-0.5 text-sm text-fg">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
