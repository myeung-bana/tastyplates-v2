import SettingsLayout from "@/components/Settings/SettingsLayout";

const PasswordSettingsPage = () => {
  return (
    <SettingsLayout 
      title="Password Settings" 
      subtitle="Change your password"
      showBackButton={true}
    >
      <div className="settings-page">
        <div className="settings-page-content">
          <div className="settings-placeholder">
            <h2>Password Management</h2>
            <p>Password change functionality will be implemented here.</p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default PasswordSettingsPage;
