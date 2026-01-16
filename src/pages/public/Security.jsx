import {
    CallToAction,
    FooterBlogs,
    PromoSection,
    FarmeWork,
    Help,
    CustomizedHero
} from "@/components";
import {
    SecurityHeroSection,
    SecurityFeatures,
    SecurityPromoSection1,
    SecurityPromoSection2
} from "@/lib/data";


const Security = () => {
    return (

        <div className="flex flex-col max-w-1440 bg-blue items-center justify-center m-auto">
             {/*Hero Section Start Here*/}
                <CustomizedHero data={SecurityHeroSection}/>
             {/*Hero Section End Here*/}
             
            <PromoSection data={SecurityPromoSection1}/>

            <FarmeWork data={SecurityFeatures} />

            <PromoSection data={SecurityPromoSection2}/>

            <Help />

            <CallToAction />
             
        </div>



    )
}

export default Security