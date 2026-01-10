import {
  CustomizedHero,
  DgmarqFeatures,
  Verified,
  Partner,
  CallToAction,
  FooterBlogs,
  PromoSection,
  FarmeWork,
  ContactFrom,
  Help,
  Slider2,
  Faqs,
  WorkingSteps,
} from "@/components";
import { Button } from "@/components/ui/button";
import {
  MarketplaceHeroSection,
  MarketplacepageVarified,
  MarketplaceFeature,
  SellerDetails,
  FarmeWorkData,
  CompanyDgmarqFeatures,
  FaqsData,
  PromoSectionData,
} from "@/lib/data";

const Marketplace = () => {
  return (
    <div className="flex flex-col bg-blue items-center justify-center m-auto">
      {/*Hero Section Start Here*/}
      <CustomizedHero data={MarketplaceHeroSection} />
      {/*Hero Section End Here*/}

      {/*Platform Section Start Here*/}
      <DgmarqFeatures data={CompanyDgmarqFeatures} title="dgmarq.COM" />
      {/*Platform Section End Here*/}

      {/*Verified Section Start Here*/}
      <Verified verificationData={MarketplacepageVarified} />
      {/*Verified Section End Here*/}

      {/*Text Section Start Here*/}
      <div className="max-w-1440 flex items-center justify-center w-full p-4 sm:p-5 md:px-8 md:py-6 lg:px-11 lg:py-6 xl:px-22 xl:py-13 bg-[#0E092C]">
        <div className="flex flex-col items-start justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-7 max-w-[1260px] w-full m-auto">
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-poppins text-white leading-snug">
            We open the Gate 2 Adventure, bridging global digital entertainment
            with people everywhere – we connect, empower, and deliver
          </h3>
          <p className="text-sm sm:text-base md:text-lg lg:text-[22px] font-normal font-poppins text-white leading-relaxed">
            DGMARQ.COM is the world’s largest marketplace and most secure
            marketplace for digital entertainment, where millions of users
            explore a vast selection of digital items offered by countless
            sellers. Known for competitive prices, a price match guarantee, and
            an extensive variety of choices, DGMARQ.COM provides a secure and
            seamless shopping experience.
          </p>
        </div>
      </div>
      {/*Text Section End Here*/}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 bg-[#0E092C] gap-5 max-w-1440 p-5 md:px-11 md:py-6 xl:px-22 xl:py-13">
        {MarketplaceFeature.map((feature, index) => (
          <div
            className="flex flex-col items-start gap-1 bg-[#060318] p-5 rounded-21 text-"
            key={index}
          >
            <img src={feature.imgSrc} alt="image" />
            <p className="text-base font-normal text-white font-poppins">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-8 max-w-1440 w-full px-5 py-6 md:px-10 md:py-8 lg:px-12 lg:py-10 xl:px-22 xl:py-13 text-white bg-[#0E092C]">
        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold font-poppins text-center leading-snug">
          DGMARQ.COM empowers sellers with its Win-Win CPS Model and strengths,
          providing unparalleled opportunities for success
        </h3>

        {/* Image + Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-center w-full">
          {/* Image */}
          <img
            src="https://res.cloudinary.com/dhuhvbzpj/image/upload/v1767772094/399829c1bf5520998f0be981a4473efd4be667af_aesyoh.png"
            alt="seller-laptop"
            className="rounded-xl w-full max-w-full h-auto object-contain"
          />

          {/* Detail Cards */}
          {SellerDetails.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-start justify-start gap-4"
            >
              <h3 className="text-[22px] font-bold font-poppins">
                {step.title}
              </h3>
              <p className="text-base font-normal font-poppins">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-5 mt-6 w-full">
          <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-[22px] font-poppins h-14">
            Explore our journey
          </Button>
          <Button className="py-2.5 px-6 rounded-md border-2 border-[#0E9FE2] bg-transparent font-bold text-[22px] font-poppins h-14">
            Explore our values and mission
          </Button>
        </div>
      </div>

      <PromoSection data={PromoSectionData} />
      <FarmeWork data={FarmeWorkData} />
      <WorkingSteps />
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 px-5 py-6 md:px-8 md:py-8 lg:px-11 lg:py-10 xl:px-22 xl:py-13 max-w-1440 w-full mx-auto place-items-center">
        <h1 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-4xl font-poppins font-bold text-white leading-snug">
          For business sellers, gaming publishers, and developers seeking a
          partner in growth, not just a platform
        </h1>

        <ContactFrom />
      </div>

      <Partner />
      <Help />
      <Slider2 />
      <Faqs data={FaqsData} />
      <CallToAction />
      <FooterBlogs />
    </div>
  );
};

export default Marketplace;
