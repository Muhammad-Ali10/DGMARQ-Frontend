const Partner = () => {
  const partnersData = [
    { title: "Industry", imgSrc: "https://res.cloudinary.com/dptwervy7/image/upload/v1754461182/partners1_f0nuzz.png" },
    { title: "Business", imgSrc: "https://res.cloudinary.com/dptwervy7/image/upload/v1754461185/partners2_wqht3c.png" },
    { title: "Developers and publishers", imgSrc: "https://res.cloudinary.com/dptwervy7/image/upload/v1754461189/partners3_kdy4vk.png" },
    { title: "Influencers", imgSrc: "https://res.cloudinary.com/dptwervy7/image/upload/v1754461188/partners4_dr7dvi.png" },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 bg-blue-3 text-white max-w-1440 mx-auto px-5 py-6 md:px-8 md:py-8 lg:px-11 lg:py-10 xl:px-22 xl:py-13">

      <h3 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-4xl font-bold text-center font-poppins">
        Trusted by 2000+ partners
      </h3>

      <p className="text-sm sm:text-base text-center font-normal font-poppins max-w-[720px]">
        Throughout the years we have partnered with thousands of partners from 100 countries
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2  gap-6 w-full">
        {partnersData.map((item, index) => (
          <div key={index} className="flex flex-col gap-4 w-full">
            <h4 className="text-[18px] sm:text-[20px] md:text-[22px] font-bold font-poppins">
              {item.title}
            </h4>
            <img
              src={item.imgSrc}
              alt={item.title}
              className="w-full h-auto rounded-[15px] object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Partner;
