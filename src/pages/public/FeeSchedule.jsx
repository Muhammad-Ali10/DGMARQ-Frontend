import LegalPage from "@features/content/marketing/LegalPage";
import { FeeSchedulePageData } from "@/lib/data";

const FeeSchedule = () => (
  <LegalPage
    data={FeeSchedulePageData}
    seo={{
      title: "Fee Schedule | DGMARQ",
      description: "A transparent overview of buyer and seller fees on DGMARQ.",
      canonical: "/fee-schedule",
    }}
  />
);

export default FeeSchedule;
