
const Faqs = ({ data }) => {
    return (
        <div className="flex flex-col  w-full  p-5 md:px-11 md:py-6 xl:px-22 xl:py-13 gap-5 items-center justify-center font-poppins text-white">
            <h2 className="text-26 font-bold">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.map((item, index) => (
                    <div className="flex flex-col items-center text-center p-5 rounded-21 gap-2.5 max-w-[399px] bg-[#060318]">
                        <h3 className="text-[22px] font-blod">{item.title}</h3>
                        <p className="text-base font-normal text-center">{item.description}</p>
                        <span className="text-base font-bold">{item.linkText}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default Faqs