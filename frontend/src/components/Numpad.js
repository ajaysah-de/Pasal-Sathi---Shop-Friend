import { Delete } from 'lucide-react';

export default function Numpad({ value, onChange, onConfirm, maxLength = 10 }) {
  const handlePress = (num) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="p-4 bg-[#F0F0E8] rounded-2xl">
      {/* Display */}
      <div className="mb-4 p-4 bg-white rounded-xl text-center">
        <span className="text-4xl font-bold text-[#2D2D2D] tracking-wider">
          {value || '0'}
        </span>
      </div>

      {/* Numpad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(String(num))}
            className="numpad-btn"
            data-testid={`numpad-${num}`}
          >
            {num}
          </button>
        ))}
        
        <button
          onClick={handleClear}
          className="numpad-btn text-gray-500 text-base"
          data-testid="numpad-clear"
        >
          Clear
        </button>
        
        <button
          onClick={() => handlePress('0')}
          className="numpad-btn"
          data-testid="numpad-0"
        >
          0
        </button>
        
        <button
          onClick={handleBackspace}
          className="numpad-btn text-gray-500"
          data-testid="numpad-backspace"
        >
          <Delete className="w-6 h-6 mx-auto" />
        </button>
      </div>

      {/* Confirm Button */}
      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full mt-3 h-14 bg-[#8B0000] text-white text-xl font-semibold rounded-xl 
                     active:scale-95 transition-transform"
          data-testid="numpad-confirm"
        >
          Confirm / पुष्टि गर्नुहोस्
        </button>
      )}
    </div>
  );
}
