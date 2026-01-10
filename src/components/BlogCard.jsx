import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const BlogCard = ({ image }) => {
    return (
        <Card className="bg-blue-4 border-0 rounded-2xl p-4 flex flex-col items-start gap-2.5 w-full h-[430px] max-w-[292px] mx-auto">
            <img src={image} alt="Blog" className="w-full h-[200px] object-cover rounded-2xl" />
            <CardHeader className="p-0">
                <CardTitle className="text-base font-semibold text-white truncate w-full">
                    Selected Best Deals on DGMARQ.COM
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-normal font-poppins text-white p-0">
                Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
            </CardContent>
        </Card>
    );
};

export default BlogCard;
