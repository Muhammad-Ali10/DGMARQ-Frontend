import { ContactFormSchema } from "@/lib/validation"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea"

const ContactFrom = () => {

    const form = useForm({
        resolver: zodResolver(ContactFormSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            email: "",
            message: ""
        }
    })

    const onSubmit = (data) => {}

    return (
        <div className="max-w-[615px] w-full flex flex-col p-8  rounded-21 bg-[#060721]">

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[15px] text-base font-normal text-white font-poppins">
                    <span className="text-[22px] font-bold font-poppins">Let’s connect and grow together</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-[30px]">
                        <FormField
                            control={form.control}
                            name="firstname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="eg.Lucas" {...field} className="py-3 px-4 rounded-md text-white h-12 placeholder:text-white" />
                                    </FormControl>
                                    <FormMessage></FormMessage>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="eg. Jones" {...field} className="py-3 px-4 rounded-md text-white h-12 placeholder:text-white" />
                                    </FormControl>
                                    <FormMessage></FormMessage>
                                </FormItem>
                            )} />
                    </div>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem >
                                <FormLabel>Business email *</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="eg. lucas@mail.com" {...field} className="py-3 px-4 rounded-md text-white h-12 placeholder:text-white"/>
                                </FormControl>
                                <FormMessage></FormMessage>
                            </FormItem>
                        )} />
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your message *</FormLabel>
                                <FormControl>
                                    <Textarea type="text" placeholder="Enter your message..." {...field} className="py-3 px-4 rounded-md placeholder:text-white" />
                                </FormControl>
                                <FormMessage></FormMessage>
                            </FormItem>
                        )}
                    />
                  <div>  <Button className="py-2.5 px-6 rounded-md bg-primary font-bold text-[26px] font-poppins text-white h-14" type="submit" >Send Message</Button></div>
                  <p>By selecting Send you give DGMARQ.COM Limited consent to sending to your email commercial communication, including the one suited to you,... read more</p>
                </form>
            </Form>
        </div>
    )
}

export default ContactFrom