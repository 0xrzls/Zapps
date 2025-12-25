import { useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterChips from "@/components/FilterChips";
import CampaignsList from "@/components/CampaignsList";
import CampaignsCarousel from "@/components/CampaignsCarousel";
import { useTranslation } from "react-i18next";

const Campaigns = () => {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "Active", "Upcoming", "Ended"];

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-6 relative max-w-7xl">

      {}
      <CampaignsCarousel />

      {}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('campaigns.status')}</span>
        </div>
        <FilterChips
          categories={filters}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </div>

      {}
      <CampaignsList filter={selectedFilter} />
    </div>
  );
};

export default Campaigns;