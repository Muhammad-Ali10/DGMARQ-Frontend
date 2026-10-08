import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { AlertCircle, Download, FileCheck, FileSpreadsheet, Info, Loader2, Plus, X } from 'lucide-react';
import { ACCOUNT_CSV_ORDER } from '@lib/accountCredentials';
import { deliveryWords } from '@lib/deliveryType';
import { parseImportedRows, parseJsonRows, rowsFromMatrix, sampleFileContent } from '../../utils/inventoryRows';

const ACCEPT = '.xlsx,.xls,.csv,.txt,.json';
const TEXT_EXTENSIONS = /\.(csv|txt|json)$/i;
const SHEET_EXTENSIONS = /\.(xlsx|xls)$/i;
const JSON_EXTENSION = /\.json$/i;

const readAs = (file, how) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    if (how === 'buffer') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  });

export const ImportPanel = ({ productType, onAppend }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState({ rows: [], errors: [] });
  const [isDragging, setIsDragging] = useState(false);

  const isAccount = productType === 'ACCOUNT_BASED';
  const isLink = productType === 'ACTIVATION_LINK';
  const words = deliveryWords(productType);
  const { rows, errors } = result;

  const reset = () => {
    setFileName('');
    setResult({ rows: [], errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFile = async (file) => {
    if (!file) return;
    if (!SHEET_EXTENSIONS.test(file.name) && !TEXT_EXTENSIONS.test(file.name)) {
      toast.error('Please upload an Excel (.xlsx), .csv, .txt or .json file');
      return;
    }

    setFileName(file.name);
    setReading(true);
    try {
      if (SHEET_EXTENSIONS.test(file.name)) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await readAs(file, 'buffer'), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false, defval: '' });
        setResult(rowsFromMatrix(matrix, productType));
      } else {
        const text = String(await readAs(file, 'text') ?? '');
        setResult(
          JSON_EXTENSION.test(file.name)
            ? parseJsonRows(text, productType)
            : parseImportedRows(text, productType)
        );
      }
    } catch {
      toast.error(`Could not read "${file.name}"`);
      reset();
    } finally {
      setReading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([sampleFileContent(productType)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dgmarq-${(isAccount ? 'accounts' : words.many).replace(/\s+/g, '-')}-sample.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAppend = () => {
    if (!rows.length) return;
    onAppend(rows);
    reset();
  };

  return (
    <div className="space-y-4">
      <div
        role="presentation"
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); readFile(event.dataTransfer.files[0]); }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${isDragging ? 'border-accent bg-accent/[0.06]' : 'border-white/[0.12] bg-white/[0.02]'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Choose an inventory file to upload"
          accept={ACCEPT}
          onChange={(event) => readFile(event.target.files[0])}
          className="hidden"
          id="inventory-file"
        />
        {reading ? (
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-accent-on-dark" />
        ) : (
          <FileSpreadsheet className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-accent-on-dark' : 'text-fg-muted'}`} />
        )}
        <p className="text-sm font-medium text-fg">
          {reading ? `Reading ${fileName}…` : 'Drag and drop your file here'}
        </p>
        <p className="text-xs text-fg-muted mt-1">
          or{' '}
          <label htmlFor="inventory-file" className="text-accent-on-dark hover:underline cursor-pointer">
            browse files
          </label>
        </p>
        <p className="text-[11px] text-fg-subtle mt-2">Excel (.xlsx, .xls), .csv, .txt or .json</p>

        {fileName && !reading && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-green-700/50 bg-green-900/20 px-3 py-2">
            <FileCheck className="w-4 h-4 text-success" />
            <span className="text-xs text-fg">{fileName}</span>
            <button type="button" aria-label="Remove file" onClick={reset} className="text-fg-muted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.04]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-danger mb-1">
                {errors.length} row{errors.length === 1 ? '' : 's'} need fixing — the rest can still be added
              </p>
              <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                {errors.slice(0, 8).map((error) => (
                  <li key={error} className="text-xs text-danger">• {error}</li>
                ))}
                {errors.length > 8 && (
                  <li className="text-xs text-danger italic">… and {errors.length - 8} more</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          {rows.length > 0 ? `${rows.length} ready to add` : 'No file read yet'}
        </p>
        <Button
          type="button"
          disabled={!rows.length || reading}
          onClick={handleAppend}
          className="bg-accent hover:bg-accent/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" /> Add {rows.length || ''} to list
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-blue-500/15 bg-blue-500/[0.04]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg"><Info className="w-5 h-5 text-info" /></div>
          <div className="flex-1 space-y-2 text-xs text-fg-muted">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-fg">File format</p>
              <Button type="button" size="sm" variant="outline" className="border-white/[0.12] h-8" onClick={downloadSample}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download sample
              </Button>
            </div>
            {isAccount ? (
              <>
                <p>• One account per row, columns in this order: <span className="text-fg">{ACCOUNT_CSV_ORDER}</span></p>
                <p>• <span className="text-fg">Host email</span> is the address the account is registered to, so the buyer knows where its verification and recovery mail goes</p>
                <p>• Everything except the notes is required</p>
              </>
            ) : (
              <>
                <p>• One {words.one} per row, 5–500 characters</p>
                {isLink && <p>• Must start with http:// or https:// — the buyer opens it directly</p>}
              </>
            )}
            <p>• A header row is ignored, and so are empty rows</p>
            <p>• Rows already in the list are skipped</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPanel;
