import { Button } from "@/components/ui/button";

const FarmeWork = ({ data }) => {
    return (
        <div
            className={`relative w-full h-[400px] lg:h-[479px] bg-cover bg-center bg-no-repeat ${data?.bgurl} max-w-1440 p-4 sm:p-5 md:px-6 md:py-6 lg:px-11 lg:py-6 xl:px-22 xl:py-13`}
        >
            {/* Content */}
            <div className="relative z-10 flex items-center justify-center h-full">
                <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 w-full text-center px-2">
                    <span className="text-base md:text-lg lg:text-2xl xl:text-[26px] font-bold font-poppins text-white uppercase">
                        {data?.title}
                    </span>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-poppins text-white max-w-[716px]">
                        {data?.subTitle}
                    </h1>
                    <p className="text-sm md:text-base lg:text-lg font-medium font-poppins text-white max-w-[716px]">
                        {data?.description}
                    </p>
                    <Button className="py-2 px-5 rounded-md bg-primary font-bold text-sm md:text-base lg:text-[26px] font-poppins text-white h-10 md:h-12 lg:h-14">
                        {data?.buttonName}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FarmeWork;
