const WorkingSteps = () => {
    const steps = [
        {
            count: '1',
            title: 'We believe in Diversity',
            description: 'Celebrating unique perspectives and backgrounds to build a stronger community'
        },          
        {  
            count: '2',
            title: 'We stand for Equity',
            description: 'Creating equal opportunities for everyone to thrive and succeed'
        },     
        {       
            count: '3',      
            title: 'We embrace Inclusion',
            description: 'Fostering collaboration where every voice is valued and heard'
        },
    ]

  return (
    <div className="flex flex-col items-center justify-center max-w-1440 w-full 
      px-5 py-6 
      md:px-8 md:py-8 
      lg:px-11 lg:py-10 
      xl:px-22 xl:py-13 
      bg-[#0E092C] gap-7 text-white">
      
      {/* Heading */}
      <h3 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold font-poppins text-center md:text-left">
        How to sell on DGMARQ.COM
      </h3>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-center w-full">

        {/* Image */}
        <img 
          src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393705/stepimage_t4qqjw.png" 
          alt="Working Steps" 
          className="rounded-xl w-full max-w-full h-auto object-contain" 
        />

        {/* Step Items */}
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-start justify-start gap-3">
            <span className="text-[26px] font-bold font-poppins text-white bg-blue-600 w-[60px] h-[60px] rounded-full flex items-center justify-center">
              {step.count}
            </span>
            <h3 className="text-[20px] md:text-[22px] font-bold font-poppins">{step.title}</h3>
            <p className="text-base font-normal font-poppins leading-snug">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkingSteps;
