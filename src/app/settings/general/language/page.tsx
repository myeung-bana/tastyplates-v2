import SettingsLayout from "@/components/Settings/SettingsLayout";

const LanguageSettingsPage = () => {
  return (
    <SettingsLayout 
      title="Language Settings" 
      subtitle="Choose your preferred language"
      showBackButton={true}
    >
      <div className="settings-page">
        <div className="settings-page-content">
          <div className="settings-placeholder">
            <h2>Language Preferences</h2>
            <p>Language selection functionality will be implemented here.</p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default LanguageSettingsPage;
