import { Button } from "@/components/ui/button";

const PromoSection = ({data}) => {
    return (
        data && <div className="grid grid-cols-1 lg:grid-cols-2 w-full text-white items-center m-auto gap-[30px] max-w-1440 p-5 md:px-11 md:py-6 xl:px-22 xl:py-12-5">
            <div className="flex flex-col gap-[20px] sm:gap-[25px] lg:gap-[30px] text-center lg:text-left items-center lg:items-start">
                <h2 className="text-2xl md:text-3xl xl:text-4xl font-possins font-bold">
                   {data?.title}
                </h2>
                <p className="text-sm sm:text-base font-poppins font-normal max-w-[600px]">
                   {data?.description}
                </p>
                <div>
                    <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-base sm:text-lg font-poppins h-12 sm:h-14">
                        {data?.buttonText}
                    </Button>
                </div>
            </div>
            <img
                src={data?.imageSrc}
                className="w-full  mx-auto rounded-21"
                alt="images"
            />
        </div>
    );
};

export default PromoSection;
