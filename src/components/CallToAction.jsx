import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
    return (
        <div className="flex w-full items-center justify-center gap-2.5 bg-[#172AA4] max-w-1440 p-5 md:px-11 md:py-6 xl:px-22 xl:py-13">
            <div className="flex flex-col md:flex-row items-center justify-between text-white font-poppins w-full gap-5 md:gap-3">
                <div className="flex flex-col max-w-[709px] text-center md:text-left">
                    <h3 className="text-lg sm:text-xl md:text-[26px] font-medium">
                        Grab a 10% discount on your next purchase!
                    </h3>
                    <p className="text-sm sm:text-base font-normal max-w-[485px] mx-auto md:mx-0">
                        Subscribe to our newsletter and confirm your subscription. Then, buy something for 10 EUR or more to receive your discount code. <a className="underline">Show more</a>
                    </p>
                </div>
                <div className="w-full sm:max-w-[417px] flex flex-col sm:flex-row gap-3 sm:gap-0 rounded-[9px] border p-2.5">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        className="border-0 outline-0 focus:outline-0 focus-visible:ring-0 flex-1"
                    />
                    <Button className="p-2.5 !bg-gradient-to-r from-[#F05F00] to-[#FF7216] text-white text-sm font-normal font-poppins rounded-[9px] w-full sm:w-auto">
                        Subscribe
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CallToAction;
