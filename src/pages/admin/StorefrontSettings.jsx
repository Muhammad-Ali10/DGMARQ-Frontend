import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { IconPicker } from '@components/common/IconPicker';
import { showSuccess, showApiError } from '@utils/toast';
import { LayoutGrid, Search, Upload } from 'lucide-react';

const StorefrontSettings = () => {
  const queryClient = useQueryClient();
  const [tiles, setTiles] = useState([]);
  const [wordsText, setWordsText] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['storefront-config', 'admin'],
    queryFn: () => storefrontAPI.getConfig().then((r) => r.data.data),
  });

  useEffect(() => {
    if (!data) return;
    setTiles(data.trustTiles || []);
    setWordsText((data.searchWords || []).join('\n'));
  }, [data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['storefront-config'] });
  };

  const tilesMutation = useMutation({
    mutationFn: (next) => storefrontAPI.updateTrustTiles(next),
    onSuccess: () => {
      invalidate();
      showSuccess('Homepage tiles updated');
    },
    onError: (err) => showApiError(err, 'Could not save the tiles'),
  });

  const wordsMutation = useMutation({
    mutationFn: (next) => storefrontAPI.updateSearchWords(next),
    onSuccess: () => {
      invalidate();
      showSuccess('Search hints updated');
    },
    onError: (err) => showApiError(err, 'Could not save the search hints'),
  });

  const setTile = (index, patch) =>
    setTiles((current) => current.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)));

  const uploadImage = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await storefrontAPI.uploadTrustTileImage(body);
      setTile(index, { image: res.data.data.url });
      showSuccess('Image uploaded — remember to save');
    } catch (err) {
      showApiError(err, 'Upload failed');
    } finally {
      setUploadingIndex(null);
    }
  };

  if (isLoading) return <Loading message="Loading storefront settings…" />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Could not load the storefront settings'} />;

  return (
    <>
      <Card variant="hud">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Homepage trust tiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-fg-muted">
            The four tiles under the hero. Upload an image for a tile (your logo, for
            example) or pick one of the built-in icons — the image wins when both are set.
          </p>

          {tiles.map((tile, index) => (
            <div key={index} className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                Tile {index + 1}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`tile-title-${index}`}>Title</Label>
                  <Input
                    id={`tile-title-${index}`}
                    value={tile.title || ''}
                    onChange={(e) => setTile(index, { title: e.target.value })}
                    className="bg-secondary border-border text-fg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tile-text-${index}`}>Description</Label>
                  <Input
                    id={`tile-text-${index}`}
                    value={tile.text || ''}
                    onChange={(e) => setTile(index, { text: e.target.value })}
                    className="bg-secondary border-border text-fg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tile-image-${index}`}>Image (optional)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {tile.image && (
                    <>
                      <img
                        src={tile.image}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-border object-contain bg-black/30 p-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTile(index, { image: '' })}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                  <Input
                    id={`tile-image-${index}`}
                    type="file"
                    accept="image/*"
                    disabled={uploadingIndex === index}
                    onChange={(e) => uploadImage(index, e.target.files?.[0])}
                    className="bg-secondary border-border text-fg max-w-xs"
                  />
                  {uploadingIndex === index && (
                    <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                      <Upload className="h-3.5 w-3.5 animate-pulse" /> Uploading…
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon {tile.image && <span className="text-fg-subtle">(hidden while an image is set)</span>}</Label>
                <IconPicker value={tile.icon || ''} onChange={(icon) => setTile(index, { icon })} />
              </div>
            </div>
          ))}

          <Button onClick={() => tilesMutation.mutate(tiles)} disabled={tilesMutation.isPending}>
            {tilesMutation.isPending ? 'Saving…' : 'Save tiles'}
          </Button>
        </CardContent>
      </Card>

      <Card variant="hud">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search bar hints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-fg-muted">
            One term per line. The header search box cycles through them as placeholder
            text. Leave this empty to keep the default wording. Max 12.
          </p>
          <textarea
            aria-label="Search bar hint terms, one per line"
            value={wordsText}
            onChange={(e) => setWordsText(e.target.value)}
            rows={6}
            placeholder={'xbox game pass\nsteam wallet\nnetflix'}
            className="w-full rounded-lg border border-border bg-secondary p-3 text-sm text-fg outline-none"
          />
          <Button
            onClick={() =>
              wordsMutation.mutate(wordsText.split('\n').map((w) => w.trim()).filter(Boolean))
            }
            disabled={wordsMutation.isPending}
          >
            {wordsMutation.isPending ? 'Saving…' : 'Save hints'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default StorefrontSettings;
