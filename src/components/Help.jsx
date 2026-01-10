
import { Button } from "@/components/ui/button";

const Help = () => {
    return (
        <div className="flex flex-col w-full max-w-1440 p-6 md:px-11 md:py-6 xl:px-22 xl:py-13 justify-between items-center gap-4 md:gap-[30px] bg-[#008AC9]/20">
            <h3 className="text-2xl md:text-4xl font-bold font-poppins text-center text-white">Need more help?</h3>
            <p className="text-base font-normal font-poppins text-center text-white">Go to Support Hub to learn more about selling on DGMARQ.COM or request a call with our expert</p>
            <div className="flex flex-col md:flex-row justify-center text-white  gap-4 md:gap-7">
                <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-xl md:text-[26px] font-poppins h-14">Go to Support Hub</Button>
                <Button className="py-2.5 px-6 rounded-md border-2 border-[#0E9FE2] bg-transparent font-bold text-xl md:text-[26px] font-poppins h-14">Contact us</Button>
            </div>
        </div>
    )
}

export default Help