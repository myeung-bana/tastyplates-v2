import SettingsLayout from "@/components/Settings/SettingsLayout";
import Settings from "@/components/Settings/Settings";

const ProfileSettingsPage = () => {
  return (
    <SettingsLayout 
      title="Profile Settings" 
      subtitle="Manage your personal information"
      showBackButton={true}
    >
      <div className="settings-page">
        <Settings />
      </div>
    </SettingsLayout>
  );
};

export default ProfileSettingsPage;
