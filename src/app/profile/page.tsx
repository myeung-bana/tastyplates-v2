import Footer from "@/components/Footer"
import Profile from "@/components/Profile/Profile"

const ProfilePage = () => {
  return (
    <>
      <div className="flex flex-col items-start justify-items-center min-h-screen gap-16 font-inter mt-20 text-[#31343F]">
        <Profile />
      </div>
    </>
  )
}

export default ProfilePage