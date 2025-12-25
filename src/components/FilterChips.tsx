interface FilterChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

const FilterChips = ({ categories, selected, onSelect }: FilterChipsProps) => {
  
  const filteredCategories = categories.filter(
    (cat) => !["Confidential", "Private Vote", "Encrypted Compute"].includes(cat)
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      {filteredCategories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 transform ${
            selected === category
              ? "gradient-primary text-primary-foreground shadow-md"
              : "bg-card/40 backdrop-blur-sm text-foreground hover:bg-card border border-border/30 hover:border-primary/20"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;