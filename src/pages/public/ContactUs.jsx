import {
    CustomizedHero,
    ContactFrom2,
    CallToAction,
    FooterBlogs,
    Help
} from "@/components";
import {
    ContactUsHeroSection,
} from "@/lib/data";
const ContactUs = () => {
    return (
        <div className="flex flex-col max-w-1440 bg-blue items-center justify-center m-auto">
            {/*Hero Section Start Here*/}
            <CustomizedHero data={ContactUsHeroSection} />
            {/*Hero Section End Here*/}

            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 px-5 py-6 md:px-8 md:py-8 lg:px-11 lg:py-10 xl:px-22 xl:py-13 max-w-1440 w-full mx-auto place-items-center">

                <div className="flex flex-col gap-36">
                    <div className="flex flex-col">
                        <h1 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-4xl font-poppins font-bold text-white leading-snug">Let’s Connect!</h1>
                        <p className="font-poppins font-normal text-white md:text-lg ">Choose the right department for your inquiry: Sales, Developers, Educators, Media, or Marketing Partnerships</p>
                    </div>
                    <div className="flex flex-col gap-5">
                        <h3 className="text-26 font-poppins font-bold text-white">Find us on social media</h3>
                        <img src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393674/payments_qpgfwb.png" className="w-full max-w-[409px]"/>
                    </div>
                </div>

                <ContactFrom2 />
            </div>

            <Help />
            {/* Call to Action section starts here */}
            <CallToAction />
            {/* Call to Action section ends here */}
            {/* Footer Blogs section starts here */}
            <FooterBlogs />
            {/* Footer Blogs section ends here */}

        </div>
    )
}

export default ContactUs