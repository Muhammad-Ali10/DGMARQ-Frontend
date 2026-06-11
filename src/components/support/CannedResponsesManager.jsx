import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Trash2, Pencil, Plus, X } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const EMPTY = { title: '', message: '', category: 'general', shortcut: '', isGlobal: true };

/**
 * Admin CRUD manager for canned responses. Opened from the support page toolbar.
 */
const CannedResponsesManager = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['canned-responses'],
    queryFn: () => adminAPI.getCannedResponses().then((r) => r.data.data),
    enabled: open,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const createMut = useMutation({
    mutationFn: (data) => adminAPI.createCannedResponse(data),
    onSuccess: () => {
      invalidate();
      reset();
      showSuccess('Canned response created');
    },
    onError: (e) => showApiError(e, 'Failed to create'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCannedResponse(id, data),
    onSuccess: () => {
      invalidate();
      reset();
      showSuccess('Canned response updated');
    },
    onError: (e) => showApiError(e, 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminAPI.deleteCannedResponse(id),
    onSuccess: () => {
      invalidate();
      showSuccess('Deleted');
    },
    onError: (e) => showApiError(e, 'Failed to delete'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    if (editingId) updateMut.mutate({ id: editingId, data: form });
    else createMut.mutate(form);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      message: item.message || '',
      category: item.category || 'general',
      shortcut: item.shortcut || '',
      isGlobal: item.isGlobal !== false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="bg-primary border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Canned Responses</DialogTitle>
          <DialogDescription className="text-gray-400">
            Reusable reply templates. Type a shortcut like <span className="font-mono text-accent">/greeting</span> in the chat to insert one.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {isLoading ? (
              <p className="text-gray-400 text-sm">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-gray-400 text-sm">No canned responses yet.</p>
            ) : (
              items.map((item) => (
                <div key={item._id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {item.shortcut && <span className="text-accent text-xs font-mono">{item.shortcut}</span>}
                        <span className="text-white text-sm font-medium truncate">{item.title}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{item.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => startEdit(item)} className="text-gray-400 hover:text-white p-1" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteMut.mutate(item._id)} className="text-gray-400 hover:text-red-400 p-1" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-3 bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-sm font-semibold">{editingId ? 'Edit response' : 'New response'}</h4>
              {editingId && (
                <button type="button" onClick={reset} className="text-gray-400 hover:text-white text-xs flex items-center gap-1">
                  <X className="h-3 w-3" /> Cancel
                </button>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Greeting"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Shortcut</Label>
                <Input
                  value={form.shortcut}
                  onChange={(e) => setForm((f) => ({ ...f, shortcut: e.target.value }))}
                  placeholder="/greeting"
                  className="bg-gray-800 border-gray-700 text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="general"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                placeholder="Hi! Thank you for contacting DGMarq support…"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending || !form.title.trim() || !form.message.trim()} className="w-full">
              {editingId ? 'Save changes' : <><Plus className="h-4 w-4 mr-1" /> Add response</>}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CannedResponsesManager;
