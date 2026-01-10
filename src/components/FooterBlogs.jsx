import  BlogCard  from "./BlogCard";

const FooterBlogs = () => {
  
    const blogs = [
        { Image: "https://res.cloudinary.com/dptwervy7/image/upload/v1754393640/Blog1_vz4f7o.png" },
        { Image: "https://res.cloudinary.com/dptwervy7/image/upload/v1754393640/Blog2_dobiva.png" },
        { Image: "https://res.cloudinary.com/dptwervy7/image/upload/v1754393641/Blog3_bnk0nt.png" },
        { Image: "https://res.cloudinary.com/dptwervy7/image/upload/v1754393641/Blog4_nozx5u.png" },
    ]

    return (
        <section className="container mx-auto px-4 md:px-6 xl:px-0 py-8">
            <div className="mb-5 px-4">
                <h2 className="text-3xl sm:text-4xl font-bold font-poppins text-white">Our Latest Blogs</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {blogs.map((item, index) => (
                    <BlogCard key={index} image={item.Image} />
                ))}
            </div>
        </section>
    );
};

export default FooterBlogs;
