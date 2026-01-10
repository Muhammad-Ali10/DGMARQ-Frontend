import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"


const DgmarqFeatures = ({ title, data }) => {

   


    return (
        <>
            {/* <div className="max-w-1440  w-full flex flex-col justify-center items-center gap-12 bg-[#0E51E2] py-4">
                <div className="max-w-1260 w-full grid grid-cols-1 md:grid-cols-2 ">
                    <h1 className="text-xl md:text-26 font-bold font-poppins text-white">Select Platform</h1>
                    <div className="flex items-center gap-12">
                        {platformData?.map((item, index) =>
                            <div className="flex items-center gap-3" key={index}>
                                <img src={item?.imageUrl} alt="pc" className="w-6 h-6" />
                                <span className="text-base font-normal font-poppins text-white">{item?.name}</span>
                            </div>
                        )}

                    </div> 
                </div>
            </div> */}
            <div className="flex w-full bg-blue-2">
                <div className="w-full mx-auto flex flex-col justify-center gap-4 max-w-1260 py-12">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-poppins">
                        What is <span className="uppercase">{title}</span>?
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 w-full place-items-center gap-5 sm:gap-[20px] lg:gap-5 xl:gap-[25px]">
                        {data?.map((item, index) => (
                            <Card
                                key={index}
                                className="px-4 py-4 lg:px-4 lg:py-3 xl:px-4 xl:py-4 rounded-3xl flex flex-row items-start bg-primary border-0 w-full gap-3 sm:gap-2 text-white  h-full "
                            >
                                <img
                                    src={item?.imageUrl}
                                    alt={item?.title}
                                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                                />
                                <CardHeader className="p-0 w-full">
                                    <CardTitle className="text-base sm:text-lg xl:text-xl font-bold font-poppins text-white">
                                        {item?.title}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

        </>
    )

}

export default DgmarqFeatures