import React, { useState, useEffect } from 'react';
import { Product } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { X, AlertCircle } from 'lucide-react';
import { sanitizeText, sanitizeURL } from '../../utils/sanitize';
import { SecureImageUploader } from '../common/SecureImageUploader';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, suppliers, addProduct, updateProduct, addCategory } = useStore();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Beverages');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [minStockLevel, setMinStockLevel] = useState<number | ''>(5);
  const [unit, setUnit] = useState('pcs');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode);
      setCategory(productToEdit.category);
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStock(productToEdit.stock);
      setMinStockLevel(productToEdit.minStockLevel);
      setUnit(productToEdit.unit);
      setSupplierId(productToEdit.supplierId || '');
      setDescription(productToEdit.description || '');
      setImage(productToEdit.image || '');
    } else {
      // Auto-generate a starter SKU
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      setName('');
      setSku(`SKU-${randomCode}`);
      setBarcode(`50100010${randomCode}`);
      setCategory(categories[1] || 'Roots, Tubers & Yams');
      setCostPrice('');
      setSellingPrice('');
      setStock(20);
      setMinStockLevel(5);
      setUnit('kg');
      setSupplierId(suppliers[0]?.id || '');
      setDescription('');
      setImage('');
    }
  }, [productToEdit, isOpen, categories, suppliers]);

  if (!isOpen) return null;

  // Margin calculation
  const costNum = Number(costPrice) || 0;
  const sellNum = Number(sellingPrice) || 0;
  const profitMargin = sellNum > 0 ? (((sellNum - costNum) / sellNum) * 100).toFixed(1) : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = sanitizeText(name, 100);
    const cleanSku = sanitizeText(sku, 50);
    const cleanBarcode = sanitizeText(barcode, 50);
    const cleanDescription = sanitizeText(description, 1000);
    const cleanImage = sanitizeURL(image);

    if (!cleanName || !cleanSku || sellNum <= 0) {
      alert('Please fill out Product Name, SKU, and a valid Selling Price.');
      return;
    }

    let finalCategory = sanitizeText(category, 50);
    if (isAddingNewCat && newCategoryName.trim()) {
      const cleanNewCat = sanitizeText(newCategoryName, 50);
      addCategory(cleanNewCat);
      finalCategory = cleanNewCat;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: cleanName,
        sku: cleanSku,
        barcode: cleanBarcode,
        category: finalCategory,
        costPrice: Number(costPrice) || 0,
        sellingPrice: sellNum,
        stock: Number(stock) || 0,
        minStockLevel: Number(minStockLevel) || 5,
        unit: sanitizeText(unit, 20) || 'pcs',
        supplierId: supplierId ? sanitizeText(supplierId, 50) : undefined,
        description: cleanDescription || undefined,
        image: cleanImage || undefined,
      });
    } else {
      addProduct({
        name: cleanName,
        sku: cleanSku,
        barcode: cleanBarcode || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        category: finalCategory,
        costPrice: Number(costPrice) || 0,
        sellingPrice: sellNum,
        stock: Number(stock) || 0,
        minStockLevel: Number(minStockLevel) || 5,
        unit: sanitizeText(unit, 20) || 'pcs',
        supplierId: supplierId ? sanitizeText(supplierId, 50) : undefined,
        description: cleanDescription || undefined,
        image: cleanImage || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">
              {productToEdit ? 'Edit Product Details' : 'Add New Inventory Product'}
            </h3>
            <p className="text-xs text-slate-400">
              {productToEdit ? `Updating ${productToEdit.sku}` : 'Add item to store catalog and POS'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Product Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Product Name / Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Almond Milk 1L"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
            />
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BEV-102"
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Barcode (UPC/EAN)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8901234001"
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                >
                  {isAddingNewCat ? 'Choose Existing' : '+ New Category'}
                </button>
              </div>

              {isAddingNewCat ? (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new category name..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.filter((c) => c !== 'All Items').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="bottle">bottle</option>
                <option value="can">can</option>
                <option value="pack">pack</option>
                <option value="box">box</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="loaf">loaf</option>
                <option value="carton">carton</option>
                <option value="jug">jug</option>
              </select>
            </div>
          </div>

          {/* Pricing & Profit Margin Calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Selling Retail Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500">Gross Margin Estimate:</span>
              <span className={`font-bold ${Number(profitMargin) >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {profitMargin}% profit margin ({costNum > 0 && sellNum > 0 ? `$${(sellNum - costNum).toFixed(2)}/unit` : '$0.00'})
              </span>
            </div>
          </div>

          {/* Stock Quantities & Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Current Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Low-Stock Alert Level</label>
              <input
                type="number"
                min="1"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">-- None / Direct Sourcing --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactPerson})
                </option>
              ))}
            </select>
          </div>

          {/* Secure Product Image Uploader */}
          <SecureImageUploader
            value={image}
            onChange={setImage}
            label="Product Produce Image"
            maxSizeMB={3}
          />

          {/* Notes / Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product notes, batch info, storage instructions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer CTA */}
          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {productToEdit ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
