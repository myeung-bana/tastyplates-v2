import Image from "next/image"
import Link from "next/link"

const ListingExplanation = () => 
<div className="font-inter mt-16">
          <div className="flex flex-col justify-center items-center bg-[url('/images/listing-backdrop-sp.png')] md:bg-[url('/images/listing-backdrop.png')] bg-cover bg-center bg-no-repeat">
              <div className="flex flex-col gap-6 md:gap-8 justify-center items-center h-fit md:h-[663px] w-full max-w-[82rem] py-8 px-3 md:p-0 md:pl-16">
                <h1 className="text-xl md:text-[32px] text-center md:leading-9 text-[#31343F] md:text-left font-medium">
                  Add Listing
                </h1>
                <p className="text-sm md:text-xl text-center md:text-left font-medium text-wrap max-w-[624px]">
                  Anyone can add records for a listing to contribute useful
                  information. However, if you are the rightful owner of a
                  listing, you can claim ownership to gain full control and
                  manage its details.
                </p>
                <Link
                  href="/listing/step-1"
                  className="rounded-xl text-sm md:text-base text-[#FCFCFC] font-semibold w-fit py-2 px-4 md:px-6 md:py-3 text-center bg-[#E36B00]"
                >
                  Acknowledge and Continue
                </Link>
              </div>
              <Image src="/images/Iisting-backdrop-sp.png" width={757} height={546} className="w-full h-[546px]" alt="backdrop image" />
        </div>
</div>

export default ListingExplanation