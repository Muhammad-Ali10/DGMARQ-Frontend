import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReasonDialog } from './ReasonDialog';

const Harness = ({ onConfirm, pending = false }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>open</button>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title="Remove offer"
        label="Reason for removal"
        confirmText="Remove offer"
        pending={pending}
        onConfirm={(reason) => { onConfirm(reason); setOpen(false); }}
      />
    </>
  );
};

const typeReason = (value) =>
  fireEvent.change(screen.getByLabelText(/reason for removal/i), { target: { value } });

describe('ReasonDialog', () => {
  it('cannot be confirmed until a real reason is typed', () => {
    render(<Harness onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByText('open'));

    const confirm = screen.getByRole('button', { name: /remove offer/i });
    expect(confirm).toBeDisabled();

    typeReason('   ');
    expect(confirm).toBeDisabled();
  });

  it('hands over the trimmed reason', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('open'));

    typeReason('  counterfeit keys  ');
    fireEvent.click(screen.getByRole('button', { name: /remove offer/i }));
    expect(onConfirm).toHaveBeenCalledWith('counterfeit keys');
  });

  it('starts empty the next time it opens', () => {
    render(<Harness onConfirm={() => {}} />);
    fireEvent.click(screen.getByText('open'));
    typeReason('first offer');
    fireEvent.click(screen.getByRole('button', { name: /remove offer/i }));

    fireEvent.click(screen.getByText('open'));
    expect(screen.getByLabelText(/reason for removal/i)).toHaveValue('');
  });

  it('will not cancel while a request is in flight', () => {
    render(<Harness onConfirm={() => {}} pending />);
    fireEvent.click(screen.getByText('open'));
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
