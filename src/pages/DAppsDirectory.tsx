import { useState, useEffect } from "react";
import { Filter, VenetianMask, Grid3X3, BarChart3, Compass, Gamepad2, Users, Settings, List, X, Search } from "lucide-react";
import FilterChips from "@/components/FilterChips";
import DAppsList from "@/components/DAppsList";
import DAppsBanner from "@/components/DAppsBanner";
import FeaturedDAppsCarousel from "@/components/FeaturedDAppsCarousel";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";

const DAppsDirectory = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewType, setViewType] = useState<"list" | "grid">("list");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState("All");
  const [sortBy, setSortBy] = useState("all");
  const [tempSortBy, setTempSortBy] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Protocol Operator", "DeFi", "NFT", "Gaming", "Social", "Infrastructure"];
  const sortOptions = [
    { value: "all", label: "All" },
    { value: "latest", label: "Latest" },
    { value: "featured", label: "Featured" },
    { value: "voted", label: "Most Voted" },
    { value: "hot", label: "Hot" },
    { value: "alphabetical", label: "A-Z" },
  ];

  useEffect(() => {
    const sortParam = searchParams.get("sortBy");
    const categoryParam = searchParams.get("category");
    
    if (sortParam && sortOptions.some(opt => opt.value === sortParam)) {
      setSortBy(sortParam);
      setTempSortBy(sortParam);
    }
    
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
      setTempCategory(categoryParam);
    }
  }, []);

  useEffect(() => {
    document.title = selectedCategory === "All"
      ? "DApps Directory | Zapps Web3"
      : `${selectedCategory} dApps | Zapps Web3`;
  }, [selectedCategory]);

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setSortBy(tempSortBy);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setTempCategory("All");
    setTempSortBy("all");
  };

  const handleOpenFilter = () => {
    setTempCategory(selectedCategory);
    setTempSortBy(sortBy);
    setIsFilterOpen(true);
  };

  return (
    <div className="space-y-0">
      {}
      <DAppsBanner />
      
      {}
      <div className="bg-background rounded-t-3xl shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_-5px_rgba(255,255,255,0.1)] relative z-20 pt-6">
        <div className="container mx-auto px-4 md:px-6 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
        {}
        <FeaturedDAppsCarousel />

        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedCategory === "All" ? (
                <VenetianMask className="w-4 h-4 text-primary" />
              ) : selectedCategory === "DeFi" ? (
                <BarChart3 className="w-4 h-4 text-primary" />
              ) : selectedCategory === "NFT" ? (
                <Compass className="w-4 h-4 text-primary" />
              ) : selectedCategory === "Gaming" ? (
                <Gamepad2 className="w-4 h-4 text-primary" />
              ) : selectedCategory === "Social" ? (
                <Users className="w-4 h-4 text-primary" />
              ) : (
                <Settings className="w-4 h-4 text-primary" />
              )}
              <h2 className="text-base font-semibold">
                {selectedCategory === "All" ? t('dapps.allApplications') : `${selectedCategory} ${t('dapps.title')}`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenFilter}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {}
              <div className="hidden md:flex items-center gap-0">
                <button 
                  onClick={() => setViewType("grid")}
                  className={`p-2 transition-colors ${
                    viewType === "grid" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewType("list")}
                  className={`p-2 transition-colors ${
                    viewType === "list" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {}
              <div className="hidden md:flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search dApps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 h-9"
                  />
                </div>
              </div>
              
              {}
              <div className="md:hidden flex items-center gap-0">
                <div className="hidden sm:block text-sm text-muted-foreground mr-3">
                  {t('common.showing')}
                </div>
                <button 
                  onClick={() => setViewType("grid")}
                  className={`p-2 transition-colors ${
                    viewType === "grid" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewType("list")}
                  className={`p-2 transition-colors ${
                    viewType === "list" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {}
          <div className="md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search dApps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          
          <DAppsList category={selectedCategory} viewType={viewType} searchQuery={searchQuery} sortBy={sortBy} />
        </div>
      </div>
      </div>

      {}
      {isMobile ? (
        <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DrawerContent className="h-[80vh] flex flex-col">
            <DrawerHeader>
              <DrawerTitle>Filter & Sort</DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
              {}
              <div>
                <h3 className="text-sm font-semibold mb-3">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={tempCategory === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setTempCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {}
              <div>
                <h3 className="text-sm font-semibold mb-3">Sort By</h3>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={tempSortBy === option.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setTempSortBy(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DrawerFooter className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyFilters}
              >
                Apply
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter & Sort</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {}
              <div>
                <h3 className="text-sm font-semibold mb-3">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={tempCategory === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setTempCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {}
              <div>
                <h3 className="text-sm font-semibold mb-3">Sort By</h3>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={tempSortBy === option.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setTempSortBy(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyFilters}
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DAppsDirectory;