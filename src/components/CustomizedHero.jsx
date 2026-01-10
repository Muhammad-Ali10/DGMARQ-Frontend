


const CustomizedHero = ({ data }) => {
    return (
        <div className={`relative w-full h-[350px] md:h-[479px] bg-cover bg-center bg-no-repeat ${data?.bgurl} `}>

            {/* Content */}
            <div className="max-w-1260 relative z-10 flex items-center justify-center h-full text-center md:text-start m-auto">
                <div className="flex flex-col items-start justify-center gap-2.5 w-full">
                    <h1 className="text-2xl md:text-5xl xl:text-[56px] xl:leading-16 font-extrabold font-inter text-white max-w-[814px]">
                        {data?.title}
                    </h1>
                    {data.description && <p className=" text-base md:text-lg font-medium font-inter text-white max-w-[700px]">
                        {data?.description}
                    </p>}

                    <ul className="space-y-3  text-base md:text-lg font-medium font-inter text-white max-w-[814px]">
                        {data.departments &&
                            data.departments.map((item, index) => (
                                <li key={index}>
                                    <strong >{item.heading}</strong>
                                    <span >{item.description}</span>
                                </li>
                            ))}
                    </ul>

                </div>
            </div>

        </div>
    )
}

export default CustomizedHero