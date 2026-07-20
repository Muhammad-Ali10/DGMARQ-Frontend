import LegalPage from "@features/content/marketing/LegalPage";
import { VendorTermsPageData } from "@/lib/data";

const VendorTerms = () => (
  <LegalPage
    data={VendorTermsPageData}
    seo={{
      title: "Vendor Terms of Service | DGMARQ",
      description: "Commission, payouts and platform fees — the terms for selling on DGMARQ.",
      canonical: "/vendor-terms",
    }}
  />
);

export default VendorTerms;
