import useCurrency from "@hooks/useCurrency";

// Renders a USD amount in the buyer's selected DISPLAY currency (M10).
// All charges still happen in USD — this is presentation only.
const Price = ({ amount, className, ...rest }) => {
  const { format } = useCurrency();
  return (
    <span className={className} {...rest}>
      {format(amount)}
    </span>
  );
};

export default Price;
