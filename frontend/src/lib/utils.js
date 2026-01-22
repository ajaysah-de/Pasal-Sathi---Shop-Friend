import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format Nepali Rupees
export function formatNPR(amount) {
  return `रु ${amount.toLocaleString('en-IN')}`;
}

// Format date for display
export function formatDate(date, includeTime = false) {
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  return d.toLocaleDateString('en-US', options);
}

// Format time only
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Get category info
export const CATEGORIES = {
  steel: { name_en: "Steel Utensils", name_np: "स्टिल भाँडा", icon: "pot-steaming", color: "#6B7280" },
  brass: { name_en: "Brass & Religious", name_np: "पीतल/पूजा", icon: "lamp", color: "#D4AF37" },
  plastic: { name_en: "Plastic Items", name_np: "प्लास्टिक", icon: "cup-soda", color: "#3B82F6" },
  electric: { name_en: "Electric Items", name_np: "बिजुली", icon: "zap", color: "#F59E0B" },
  cleaning: { name_en: "Cleaning Tools", name_np: "सफाई", icon: "brush", color: "#10B981" },
  boxed: { name_en: "Boxed Items", name_np: "बक्स", icon: "package", color: "#8B5CF6" },
  other: { name_en: "Other Items", name_np: "अन्य", icon: "grid-3x3", color: "#6B7280" }
};

export const LOCATIONS = {
  hanging: { name_en: "Hanging", name_np: "झुण्डिएको" },
  shelf_top: { name_en: "Top Shelf", name_np: "माथि शेल्फ" },
  shelf_bottom: { name_en: "Bottom Shelf", name_np: "तल शेल्फ" },
  front_display: { name_en: "Front Display", name_np: "अगाडि" },
  storage: { name_en: "Storage Room", name_np: "गोदाम" },
  counter: { name_en: "Counter", name_np: "काउन्टर" }
};
