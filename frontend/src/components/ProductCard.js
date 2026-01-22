import { CATEGORIES, LOCATIONS, formatNPR } from '../lib/utils';

export default function ProductCard({ product, onClick, showStock = true }) {
  const category = CATEGORIES[product.category] || CATEGORIES.other;
  const location = LOCATIONS[product.location] || LOCATIONS.shelf_top;
  const isLowStock = product.quantity <= product.low_stock_threshold;

  return (
    <div 
      onClick={() => onClick?.(product)}
      className="product-card"
      data-testid={`product-card-${product.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#2D2D2D] truncate">{product.name_en}</h3>
          {product.name_np && (
            <p className="text-sm text-gray-500 font-nepali truncate">{product.name_np}</p>
          )}
        </div>
        
        {showStock && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
            isLowStock 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {product.quantity_type === 'approximate' ? '~' : ''}{product.quantity}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            {category.name_np}
          </span>
          <span className="text-xs text-gray-400">{location.name_np}</span>
        </div>
        
        <span className="font-bold text-[#8B0000]">
          {formatNPR(product.selling_price)}
        </span>
      </div>
    </div>
  );
}
