import { Link } from "react-router-dom"
import SafeImage from "../ui/safe-image"


const Footer = () => { 
    return (
        <div className="flex flex-col w-full  text-white">
            <div className=" w-full py-10 bg-[#07173D] ">
            <div className="container flex flex-col md:flex-row justify-between items-center gap-4 w-full m-auto px-4">
                <h3 className="text-sm sm:text-base">Payment methods:</h3>
                <SafeImage src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393674/payments_qpgfwb.png" alt="payments" className="w-full max-w-[300px] sm:max-w-[460px]" />
            </div>
            </div>
            <div className="max-w-1260 p-4 sm:p-5 md:py-6 xl:py-13 m-auto">
                {/* Mobile: two distinct sections */}
                <div className="md:hidden flex flex-col gap-0">
                    <section className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-700/60">
                        <div className="flex flex-col">
                            <h3 className="text-base font-poppins font-semibold uppercase pb-4">About</h3>
                            <Link to="/about" className="font-poppins font-normal text-sm leading-7 underline ">Company</Link>
                            <Link to="/marketplace" className="font-poppins font-normal text-sm leading-7 underline ">Marketplace</Link>
                            <Link to="/security" className="font-poppins font-normal text-sm leading-7 underline ">Security</Link>
                            <Link to="/contactus" className="font-poppins font-normal text-sm leading-7 underline ">Contact</Link>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-base font-poppins font-semibold uppercase pb-4">For buyers</h3>
                            <Link to="/buyer-support" className="font-poppins font-normal text-sm leading-7 underline ">Buyer support</Link>
                            <Link to="/how-to-buy" className="font-poppins font-normal text-sm leading-7 underline ">How to buy</Link>
                            <Link to="/dgmarq-plus" className="font-poppins font-normal text-sm leading-7 underline ">Buy with DGMARQ Plus</Link>
                        </div>
                    </section>
                    <section className="grid grid-cols-2 gap-6 pt-6">
                        <div className="flex flex-col">
                            <h3 className="text-base font-poppins font-semibold uppercase pb-4">For Seller</h3>
                            <Link to="/seller-support" className="font-poppins font-normal text-sm leading-7 underline ">Seller support</Link>
                            <Link to="/how-to-sell" className="font-poppins font-normal text-sm leading-7 underline ">How to Sell</Link>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-base font-poppins font-semibold uppercase pb-4">Support</h3>
                            <Link to="/terms-conditions" className="font-poppins font-normal text-sm leading-7 underline ">Terms and conditions</Link>
                            <Link to="/privacy-policy" className="font-poppins font-normal text-sm leading-7 underline ">Privacy and cookie Policy</Link>
                            <Link to="/security" className="font-poppins font-normal text-sm leading-7 underline ">Stay Safe</Link>
                        </div>
                    </section>
                </div>

                {/* Tablet+ */}
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-base font-poppins font-semibold uppercase pb-4">About</h3>
                        <Link to="/about" className="font-poppins font-normal text-sm leading-7 underline ">Company</Link>
                        <Link to="/marketplace" className="font-poppins font-normal text-sm leading-7 underline ">Marketplace</Link>
                        <Link to="/security" className="font-poppins font-normal text-sm leading-7 underline ">Security</Link>
                        <Link to="/contactus" className="font-poppins font-normal text-sm leading-7 underline ">Contact</Link>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-base font-poppins font-semibold uppercase pb-4">For buyers</h3>
                        <Link to="/buyer-support" className="font-poppins font-normal text-sm leading-7 underline ">Buyer support</Link>
                        <Link to="/how-to-buy" className="font-poppins font-normal text-sm leading-7 underline ">How to buy</Link>
                        <Link to="/dgmarq-plus" className="font-poppins font-normal text-sm leading-7 underline ">Buy with DGMARQ Plus</Link>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-base font-poppins font-semibold uppercase pb-4">For Seller</h3>
                        <Link to="/seller-support" className="font-poppins font-normal text-sm leading-7 underline ">Seller support</Link>
                        <Link to="/how-to-sell" className="font-poppins font-normal text-sm leading-7 underline ">How to Sell</Link>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-base font-poppins font-semibold uppercase pb-4">Support</h3>
                        <Link to="/terms-conditions" className="font-poppins font-normal text-sm leading-7 underline ">Terms and conditions</Link>
                        <Link to="/privacy-policy" className="font-poppins font-normal text-sm leading-7 underline ">Privacy and cookie Policy</Link>
                        <Link to="/security" className="font-poppins font-normal text-sm leading-7 underline ">Stay Safe</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer