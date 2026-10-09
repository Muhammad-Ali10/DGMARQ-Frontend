import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { AlertCircle, Check, Plus, X } from 'lucide-react';
import { accountRowErrors, normalizeAccountCredentials } from '@lib/accountCredentials';
import { ACCOUNT_INPUT_FIELDS, EMPTY_ACCOUNT } from '../../utils/inventoryRows';

export const AccountEntryForm = ({ initialValue, editing = false, onAdd, onCancelEdit }) => {
  const [values, setValues] = useState(() => ({ ...EMPTY_ACCOUNT, ...(initialValue || {}) }));
  const [errors, setErrors] = useState([]);

  const setField = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = normalizeAccountCredentials(values);
    const problems = accountRowErrors(credentials);
    if (problems.length) {
      setErrors(problems);
      return;
    }
    setErrors([]);
    onAdd(credentials);
    if (!editing) setValues({ ...EMPTY_ACCOUNT });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACCOUNT_INPUT_FIELDS.map(({ key, label, required, placeholder, multiline }) => (
          <div key={key} className={`space-y-1.5 ${multiline ? 'sm:col-span-2' : ''}`}>
            <Label htmlFor={`account-${key}`} className="text-fg text-sm">
              {label} {required ? <span className="text-danger">*</span> : <span className="text-fg-subtle">(optional)</span>}
            </Label>
            {multiline ? (
              <Textarea
                id={`account-${key}`}
                value={values[key]}
                onChange={setField(key)}
                placeholder={placeholder}
                rows={2}
                className="bg-white/[0.03] border-white/[0.08] text-fg placeholder:text-gray-500"
              />
            ) : (
              <Input
                id={`account-${key}`}
                value={values[key]}
                onChange={setField(key)}
                placeholder={placeholder}
                autoComplete="off"
                className="bg-white/[0.03] border-white/[0.08] text-fg placeholder:text-gray-500"
              />
            )}
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/[0.04]">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <ul className="space-y-0.5">
              {errors.map((error) => (
                <li key={error} className="text-xs text-danger">• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {editing && (
          <Button type="button" variant="outline" className="border-white/[0.08]" onClick={onCancelEdit}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        )}
        <Button type="submit" className="bg-accent hover:bg-accent/90 font-semibold">
          {editing ? <><Check className="w-4 h-4 mr-1" /> Update account</> : <><Plus className="w-4 h-4 mr-1" /> Add account</>}
        </Button>
      </div>
    </form>
  );
};

export default AccountEntryForm;
