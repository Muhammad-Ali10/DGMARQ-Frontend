import { DgmarqFeatures, Verified, WorkingSteps, Slider, Partner, CallToAction, FooterBlogs, CustomizedHero } from "@/components";
import { Button } from "@/components/ui/button";
import { AboutpageVarified, companyData, CompanyFeatures, CompanyHeroSection, CompanyDgmarqFeatures } from "@/lib/data";



const AboutCompany = () => {


    return (
        <div className="flex flex-col  bg-blue items-center justify-center m-auto">
            {/* Hero Section Start Here */}
            <CustomizedHero data={CompanyHeroSection} />
            {/* Hero Section End Here */}

            <DgmarqFeatures  data={CompanyDgmarqFeatures}/>
            <Verified verificationData={AboutpageVarified} />
            <div className="max-w-1440 flex items-center justify-center w-full py-12  bg-[#0E092C]">
                <div className="flex flex-col items-start justify-center gap-7 max-w-1260 w-full m-auto">
                    <h3 className="text-4xl font-bold font-poppins text-white">Discover our impact, commitments and how <span className="uppercase">dgmarq.COM</span> revolutionizing digital entertainment</h3>
                    <p className="text-[22px] font-normal font-poppins text-white">Since 2010, DGMARQ.COM has been setting the standard in for digital commerce. With over 35 million users, 94,000 digital items, and a global presence, we connect buyers and sellers worldwide in a secure and innovative ecosystem.</p>
                    <h3 className="text-4xl font-bold font-poppins text-white">Who we are</h3>
                    <p className="text-[22px] font-normal font-poppins text-white">DGMARQ.COM is not just a marketplace – it’s a hub of innovation, trust, and global collaboration. With millions of users as well as partnerships spanning the world’s leading companies, we set the standard for secure digital commerce. Our dedication to excellence is reflected in our commitment to cybersecurity, advanced payment solutions, and groundbreaking partnerships in gaming and beyond.</p>
                </div>
            </div>
            <div className="max-w-1440 flex items-center justify-center w-full py-12  bg-[#172AA4]">
                <div className="grid md:grid-cols-2 xl:grid-cols-4 max-w-1260 w-full gap-6">
                    {companyData.map((item, index) => (
                        <div className="flex flex-col items-center justify-center" key={index}>
                            <h3 className="text-6xl font-bold font-poppins text-white text-center">{item.count}</h3>
                            <p className="text-[22px] font-normal font-poppins text-white text-center">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="max-w-1440 w-full px-7 py-12 bg-[#172AA4]">
                <div className="max-w-1260 flex flex-col justify-center gap-8 m-auto text-center">
                    <h3 className="text-4xl font-bold text-white font-poppins">Many of our business Partners rank among the world’s largest corporations</h3>
                    <p className="text-base font-normal text-white font-poppins">Discover how we connect millions worldwide, partner with global leaders, and drive innovation. Learn more about our journey, values, and mission</p>
                    <div className="flex flex-col md:flex-row justify-center text-white gap-7">
                        <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-26 font-poppins h-14">Explore our journey</Button>
                        <Button className="py-2.5 px-6 rounded-md border-2 border-[#0E9FE2] bg-transparent font-bold text-26 font-poppins h-14">Explore our values and mission</Button>
                    </div>
                </div>
            </div>
            <div className="max-w-1440 w-full px-7 py-12 bg-[#0E092C]">
                <div className="max-w-1260 flex flex-col justify-center gap-8 m-auto text-start">
                    <h3 className="text-26 font-bold text-white font-poppins">Expertise and focus areas</h3>
                    <p className="text-base font-normal text-white font-poppins">At DGMARQ we bring unparalleled expertise in digital commerce and entertainment, combining years of industry experience with cutting-edge innovation. Our teams work collaboratively both across our global offices and with our partners to challenge the status quo, redefine the gaming marketplace, and drive impactful solutions. From secure online payments to pioneering partnerships, we’re committed to creating value and empowering our clients to thrive in the digital economy.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 py-12 gap-5">
                        {CompanyFeatures.map((feature, index) => (
                            <div className="flex flex-col items-center gap-1 bg-[#060318] p-5 rounded-21 text-center" key={index}>
                                <h4 className="text-[22px] font-bold text-white font-poppins">{feature.title}</h4>
                                <p className="text-base font-normal text-white font-poppins">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="relative w-full h-[479px] bg-cover bg-center bg-no-repeat bg-blend-hard-light bg-blue-3  bg-[url('https://res.cloudinary.com/dptwervy7/image/upload/v1754461128/Aboutbg2_gzysgp.png')]">

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center h-full">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-1260 w-full">
                        <span className="text-26 font-bold font-poppins text-white uppercase">OUR FRAMEWORK</span>
                        <h1 className="text-4xl font-bold font-poppins text-white max-w-[716px]">
                            Sustainable Development
                        </h1>
                        <p className="text-lg font-medium font-poppins text-white text-center max-w-[716px]">
                            Being the biggest all-digital marketplace in the world, we at dgmarq.COM feel the constant need to improve and grow our business. In order to do that in a responsible way, we decided to incorporate the ESG framework for our development
                        </p>
                        <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-26 font-poppins text-white h-14">Explore our journey</Button>
                    </div>
                </div>
            </div>
            <WorkingSteps />
            <div className="max-w-1440 w-full px-7 py-12 bg-blue-4">
                <div className="max-w-1260 flex flex-col justify-center gap-8 m-auto text-center">
                    <h3 className="text-4xl font-bold text-white font-poppins">Our values – <span className="uppercase">dgmarqq DNA</span></h3>
                    <p className="text-base font-normal text-white font-poppins">At dgmarq our core values guide everything we do. We prioritize Delivering Value, foster a strong sense of Team Spirit, and are committed to continuous Growth. Effective Communication, mutual Trust, and a culture of Accountability are the cornerstones of our work environment. Explore more about what drives us and how these values shape our actions.</p>
                    <div className="flex flex-col md:flex-row justify-center text-white gap-7">
                        <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-26 font-poppins h-14">Explore our journey</Button>
                        <Button className="py-2.5 px-6 rounded-md border-2 border-[#0E9FE2] bg-transparent font-bold text-26 font-poppins h-14">Explore our values and mission</Button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center max-w-1440 py-12 gap-7 bg-blue">
                <Slider />
                <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-26 text-white font-poppins h-14">Explore our journey</Button>
            </div>
            <Partner />
            {/* Call to Action section starts here */}
            <CallToAction />
            {/* Call to Action section ends here */}
            {/* Footer Blogs section starts here */}
             
            {/* Footer Blogs section ends here */}
        </div>
    );
}

export default AboutCompany;