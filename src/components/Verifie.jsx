

const Verified = ({verificationData}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full bg-blue-5 py-8">
        <img src={verificationData.imgSrc} alt="Verified" className="size-28" />
        <div className="flex flex-col items-start text-white">
            <h3 className="text-26 font-bold font-poppins">{verificationData.title}</h3>
            <p className="text-base font-normal font-poppins">{verificationData.description}</p>
        </div>
    </div>
  );
};

export default Verified;