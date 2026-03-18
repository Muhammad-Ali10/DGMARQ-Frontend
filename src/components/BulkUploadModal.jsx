import { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productAPI } from '../services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SearchableSelect } from './ui/searchable-select';
import { Upload, FileText, CheckCircle2, Key, User, X, AlertCircle, Info, Loader2, FileCheck, Check } from 'lucide-react';

const BulkUploadModal = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [uploadMethod, setUploadMethod] = useState('textarea');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products-for-upload'],
    queryFn: () => productAPI.getProducts({ page: 1, limit: 1000 }).then(res => res.data.data),
    enabled: open,
  });

  const products = useMemo(() => {
    return productsData?.docs || productsData?.products || [];
  }, [productsData]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p._id === selectedProductId);
  }, [products, selectedProductId]);
  
  const detectedUploadType = selectedProduct?.productType || null;

  useEffect(() => {
    if (!open) {
      setSelectedProductId('');
      setBulkData('');
      setUploadMethod('textarea');
      setFileName('');
      setValidationErrors([]);
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  useEffect(() => {
    if (bulkData && detectedUploadType) {
      validateData();
    } else {
      setValidationErrors([]);
    }
  }, [bulkData, detectedUploadType]);

  const uploadMutation = useMutation({
    mutationFn: ({ productId, keys }) => productAPI.uploadKeys(productId, keys),
    onSuccess: (data) => {
      const result = data.data.data;
      const uploadTypeLabel = detectedUploadType === 'LICENSE_KEY' ? 'keys' : 'accounts';
      toast.success(
        `${result.uploaded} ${uploadTypeLabel} uploaded successfully`
      );
      // Invalidate product queries to refresh data
      queryClient.invalidateQueries(['seller-products']);
      queryClient.invalidateQueries(['seller-products-for-upload']);
      queryClient.invalidateQueries(['product-keys']); // Refresh keys list if viewing a product
      onOpenChange(false);
    },
    onError: (error) => {
      const uploadTypeLabel = detectedUploadType === 'LICENSE_KEY' ? 'keys' : 'accounts';
      toast.error(error.response?.data?.message || `Failed to upload ${uploadTypeLabel}`);
    },
  });

  const validateData = () => {
    const errors = [];
    if (!bulkData.trim()) {
      return;
    }

    const lines = bulkData.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      errors.push('No valid data found. Please check your input.');
      setValidationErrors(errors);
      return;
    }

    if (detectedUploadType === 'LICENSE_KEY') {
      lines.forEach((line, index) => {
        if (line.length < 5) {
          errors.push(`Line ${index + 1}: Key is too short (minimum 5 characters)`);
        }
        if (line.length > 500) {
          errors.push(`Line ${index + 1}: Key is too long (maximum 500 characters)`);
        }
      });
    } else if (detectedUploadType === 'ACCOUNT_BASED') {
      lines.forEach((line, index) => {
        if (line.startsWith('{')) {
          try {
            const account = JSON.parse(line);
            const hasEmail = !!account.email;
            const hasAnyPassword =
              !!account.password ||
              !!account.emailPassword ||
              !!account.usernamePassword;
            if (!hasEmail || !hasAnyPassword) {
              errors.push(`Line ${index + 1}: JSON must include email and at least one password (emailPassword or usernamePassword or password)`);
            }
          } catch (e) {
            errors.push(`Line ${index + 1}: Invalid JSON format`);
          }
        } else {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 2 || !parts[0] || !parts[1]) {
            errors.push(`Line ${index + 1}: CSV requires at least email,password. Optional columns: emailPassword,usernameId,usernamePassword`);
          }
        }
      });
    }

    setValidationErrors(errors);
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    if (!file.name.match(/\.(txt|csv|json)$/i)) {
      toast.error('Please upload a .txt, .csv, or .json file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkData(event.target.result);
      toast.success(`File "${file.name}" loaded successfully`);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setFileName('');
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };


  const parseBulkData = () => {
    if (!bulkData.trim()) {
      toast.warning('Please enter data to upload');
      return null;
    }

    if (!detectedUploadType) {
      toast.warning('Please select a product first');
      return null;
    }

    const lines = bulkData.split('\n').map(line => line.trim()).filter(line => line);

    if (detectedUploadType === 'LICENSE_KEY') {
      // For keys: each line is a key (string)
      return lines;
    } else if (detectedUploadType === 'ACCOUNT_BASED') {
      // For accounts: parse CSV or JSON format
      // CSV supported:
      // - email,password
      // - email,emailPassword,usernameId,usernamePassword
      // JSON supported:
      // - {"email":"...","password":"..."}
      // - {"email":"...","emailPassword":"...","usernameId":"...","usernamePassword":"..."}
      const accounts = [];
      for (const line of lines) {
        if (line.startsWith('{')) {
          try {
            const account = JSON.parse(line);
            const email = account.email?.trim();
            const emailPassword = account.emailPassword?.trim();
            const usernameId = (account.usernameId || account.username)?.trim();
            const usernamePassword = account.usernamePassword?.trim();
            const legacyPassword = account.password?.trim();

            if (!email) {
              continue;
            }

            const finalEmailPassword =
              emailPassword || (!usernameId && legacyPassword) || '';
            const finalUsernamePassword =
              usernamePassword || (usernameId && legacyPassword) || '';

            accounts.push({
              email,
              emailPassword: finalEmailPassword,
              usernameId: usernameId || '',
              usernamePassword: finalUsernamePassword,
              notes: account.notes?.trim() || '',
            });
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        } else {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            const email = parts[0];
            const p1 = parts[1] || '';
            const p2 = parts[2] || '';
            const p3 = parts[3] || '';

            // Map to email/emailPassword/usernameId/usernamePassword with backward compatibility
            let emailPassword = '';
            let usernameId = '';
            let usernamePassword = '';

            if (parts.length >= 4) {
              // email, emailPassword, usernameId, usernamePassword
              emailPassword = p1;
              usernameId = p2;
              usernamePassword = p3;
            } else if (parts.length === 3) {
              // email, emailPassword, usernameId  (assume same password for username)
              emailPassword = p1;
              usernameId = p2;
              usernamePassword = p1;
            } else {
              // Legacy: email,password
              emailPassword = p1;
              usernameId = '';
              usernamePassword = '';
            }

            accounts.push({
              email,
              emailPassword,
              usernameId,
              usernamePassword,
              notes: '',
            });
          }
        }
      }
      return accounts;
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.warning('Please select a product');
      return;
    }

    if (!detectedUploadType) {
      toast.warning('Please select a product first');
      return;
    }

    const parsedData = parseBulkData();
    if (!parsedData || parsedData.length === 0) {
      const uploadTypeLabel = detectedUploadType === 'LICENSE_KEY' ? 'keys' : 'accounts';
      toast.warning(`No valid ${uploadTypeLabel} found in the data`);
      return;
    }

    uploadMutation.mutate({
      productId: selectedProductId,
      keys: parsedData
    });
  };

  const parsedData = bulkData && detectedUploadType ? parseBulkData() : null;
  const itemCount = parsedData ? parsedData.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <Upload className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Upload Inventory</DialogTitle>
              <DialogDescription>
                Select a product and upload license keys or account credentials.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Key className="w-5 h-5 text-accent" />
              </div>
              <div>
                <Label htmlFor="product" className="text-white text-base font-semibold">
                  Select Product
                </Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose the product you want to upload inventory for
                </p>
              </div>
            </div>
            <div className="w-full">
              <SearchableSelect
                options={products}
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                placeholder="Search and select a product..."
                searchPlaceholder="Type to search products..."
                emptyMessage={productsLoading ? "Loading products..." : "No products found"}
                loading={productsLoading}
                label="Product"
                description="Search and select the product you want to upload inventory for"
                maxHeight="620px"
                className="w-full"
                getOptionLabel={(product) => `${product.name} (${product.productType === 'LICENSE_KEY' ? 'License Key' : 'Account'})`}
                getOptionValue={(product) => product._id}
                filterFunction={(product, searchQuery) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    product.name?.toLowerCase().includes(query) ||
                    product.slug?.toLowerCase().includes(query) ||
                    product.productType?.toLowerCase().includes(query)
                  );
                }}
                renderOption={(product, isSelected) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{product.productType === 'LICENSE_KEY' ? 'License Key' : 'Account'}</span>
                          <span>•</span>
                          <span>Stock: {product.availableKeysCount || 0}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-accent ml-2 shrink-0" />
                    )}
                  </div>
                )}
              />
            </div>
            {selectedProduct && (
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/[0.04]">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${detectedUploadType === 'LICENSE_KEY' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                    {detectedUploadType === 'LICENSE_KEY' ? (
                      <Key className="w-5 h-5 text-blue-400" />
                    ) : (
                      <User className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-white mb-2">
                      {selectedProduct.name}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white font-medium">
                          {detectedUploadType === 'LICENSE_KEY' ? 'License Key' : 'Account-Based'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Current Stock:</span>
                        <span className="text-white font-bold text-lg">{selectedProduct.availableKeysCount || 0}</span>
                      </div>
                      {selectedProduct.totalKeysCount !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Total:</span>
                          <span className="text-white font-medium">{selectedProduct.totalKeysCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Show upload UI only when product is selected */}
          {detectedUploadType && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Upload className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <Label className="text-white text-base font-semibold">
                      Upload Method
                    </Label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Choose how you want to provide the data
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={uploadMethod === 'textarea' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('textarea')}
                    className={`h-11 ${uploadMethod === 'textarea' ? 'bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20' : 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Paste Data
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('file')}
                    className={`h-11 ${uploadMethod === 'file' ? 'bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20' : 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>

              {/* Bulk Data Input - Dynamic based on product type */}
              <div className="space-y-3">
                <div>
                  <Label className="text-white text-sm font-medium">
                    {detectedUploadType === 'LICENSE_KEY' ? 'License Keys' : 'Account Credentials'}
                  </Label>
                  <p className="text-xs text-gray-400 mt-1">
                    {detectedUploadType === 'LICENSE_KEY' 
                      ? 'Enter your license keys below, one per line'
                      : 'Enter account credentials in CSV or JSON format (email/email password/username ID/username password)'}
                  </p>
                </div>
                {uploadMethod === 'textarea' ? (
                  <Textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder={
                      detectedUploadType === 'LICENSE_KEY'
                        ? 'Enter license keys, one per line:\nKEY1-ABCD-EFGH-IJKL\nKEY2-MNOP-QRST-UVWX\nKEY3-YZAB-CDEF-GHIJ'
                        : 'Enter accounts, one per line:\nemail@example.com,emailPassword,usernameId,usernamePassword\n\nLegacy:\nemail@example.com,password\n\nOr JSON format:\n{"email":"email@example.com","emailPassword":"emailPass","usernameId":"gameUser","usernamePassword":"gamePass"}'
                    }
                    rows={14}
                    className="bg-white/[0.03] border-white/[0.08] text-white font-mono text-sm placeholder:text-gray-500 resize-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 rounded-xl"
                  />
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      isDragging
                        ? 'border-accent bg-accent/[0.06] scale-[1.01]'
                        : 'border-white/[0.08] bg-white/[0.01]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.csv,.json"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-accent/20' : 'bg-gray-700/50'}`}>
                          <Upload className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">
                            {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                          </p>
                          <p className="text-sm text-gray-400">
                            or{' '}
                            <label
                              htmlFor="file-upload"
                              className="text-accent hover:underline cursor-pointer"
                            >
                              browse files
                            </label>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Supports .txt, .csv, .json files
                          </p>
                        </div>
                      </div>
                      {fileName && (
                        <div className="p-3 bg-green-900/20 rounded-lg border border-green-700/50">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-5 h-5 text-green-500" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-white">{fileName}</p>
                                <p className="text-xs text-gray-400">
                                  <span className="font-semibold text-white">{itemCount}</span> items detected
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFileName('');
                                setBulkData('');
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {itemCount > 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        <span className="text-lg font-bold text-green-400">{itemCount}</span>{' '}
                        {detectedUploadType === 'LICENSE_KEY' ? 'keys' : 'accounts'} ready to upload
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        All items validated and ready for processing
                      </p>
                    </div>
                  </div>
                )}
                {validationErrors.length > 0 && (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.04]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-400 mb-2">
                          Validation Errors ({validationErrors.length})
                        </p>
                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                          {validationErrors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-xs text-red-300">
                              • {error}
                            </li>
                          ))}
                          {validationErrors.length > 5 && (
                            <li className="text-xs text-red-400 italic">
                              ... and {validationErrors.length - 5} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-blue-500/15 bg-blue-500/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Info className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-2">
                      {detectedUploadType === 'LICENSE_KEY' ? 'License Key Format Guide' : 'Account Credentials Format Guide'}
                    </p>
                    <div className="space-y-2 text-xs text-gray-300">
                      {detectedUploadType === 'LICENSE_KEY' ? (
                        <>
                          <p>• Enter one license key per line</p>
                          <p>• Empty lines and whitespace are automatically ignored</p>
                          <p>• Each key must be between 5-500 characters</p>
                          <p>• Duplicate keys in the same batch will be skipped</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-white mb-1">Preferred CSV Format:</p>
                          <code className="block p-2 bg-gray-800 rounded text-green-400 mb-2">
                            email@example.com,emailPassword123,usernameId,usernamePassword123
                          </code>
                          <p className="font-medium text-white mb-1">Legacy CSV (email-only login):</p>
                          <code className="block p-2 bg-gray-800 rounded text-green-400 mb-2">
                            email@example.com,password123
                          </code>
                          <p className="font-medium text-white mb-1">JSON Format:</p>
                          <code className="block p-2 bg-gray-800 rounded text-green-400">
                            {'{"email":"email@example.com","emailPassword":"emailPass","usernameId":"gameUser","usernamePassword":"gamePass"}'}
                          </code>
                          <p className="mt-2">• One account per line</p>
                          <p>• Duplicate accounts will be skipped</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!detectedUploadType && selectedProductId && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
              <p className="text-xs text-yellow-400">
                Unable to detect product type. Please ensure the product has a valid type set.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {itemCount > 0 && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">
                    <span className="font-semibold text-white">{itemCount}</span> items ready
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white px-5"
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending || !selectedProductId || !detectedUploadType || itemCount === 0 || validationErrors.length > 0}
                className="bg-accent hover:bg-accent/90 min-w-[160px] px-6 font-semibold shadow-lg shadow-accent/25 disabled:opacity-40 transition-all"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : detectedUploadType && itemCount > 0 ? (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {itemCount} {detectedUploadType === 'LICENSE_KEY' ? 'Key' : 'Account'}{itemCount > 1 ? 's' : ''}
                  </>
                ) : !selectedProductId ? (
                  'Select Product First'
                ) : itemCount === 0 ? (
                  'Enter Data First'
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;

