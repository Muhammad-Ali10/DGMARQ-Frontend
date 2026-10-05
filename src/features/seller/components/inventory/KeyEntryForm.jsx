import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { AlertCircle, Check, Plus, X } from 'lucide-react';
import { deliveryWords } from '@lib/deliveryType';
import { keyRowErrors } from '../../utils/inventoryRows';

/**
 * One unit of key-shaped inventory — a license key, a gift code or an
 * activation link — typed and added to the staging list. The Import tab is the
 * fast path for a long list; this is for adding or fixing one.
 *
 * Remounted by the parent (via `key`) when it switches between add and edit.
 */
export const KeyEntryForm = ({ productType, initialValue = '', editing = false, onAdd, onCancelEdit }) => {
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState([]);
  const words = deliveryWords(productType);
  const isLink = productType === 'ACTIVATION_LINK';

  const handleSubmit = (event) => {
    event.preventDefault();
    const key = value.trim();
    const problems = keyRowErrors(key, productType);
    if (problems.length) {
      setErrors(problems);
      return;
    }
    setErrors([]);
    onAdd(key);
    if (!editing) setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="license-key-input" className="text-fg text-sm">
          {words.title} <span className="text-danger">*</span>
        </Label>
        <Input
          id="license-key-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={isLink ? 'https://example.com/activate/abc123' : 'KEY1-ABCD-EFGH-IJKL'}
          autoComplete="off"
          className="bg-white/[0.03] border-white/[0.08] text-fg font-mono placeholder:text-gray-500"
        />
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
          {editing
            ? <><Check className="w-4 h-4 mr-1" /> Update {words.one}</>
            : <><Plus className="w-4 h-4 mr-1" /> Add {words.one}</>}
        </Button>
      </div>
    </form>
  );
};

export default KeyEntryForm;
