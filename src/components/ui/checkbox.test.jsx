import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('stays unticked when the parent rejects the change', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="agree" checked={false} onCheckedChange={onCheckedChange} />);
    const box = screen.getByLabelText('agree');
    fireEvent.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(box.checked).toBe(false);
  });

  it('fires onCheckedChange even when a consumer passes onChange', () => {
    const onChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="agree" checked={false} onChange={onChange} onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByLabelText('agree'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
