import LegalPage from "@features/content/marketing/LegalPage";
import { RefundPolicyPageData } from "@/lib/data";

const RefundPolicy = () => (
  <LegalPage
    data={RefundPolicyPageData}
    seo={{
      title: "Refund Policy | DGMARQ",
      description: "How refunds, returns and disputes work on the DGMARQ marketplace.",
      canonical: "/refund-policy",
    }}
  />
);

export default RefundPolicy;
