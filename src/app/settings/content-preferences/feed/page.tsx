import SettingsLayout from "@/components/Settings/SettingsLayout";

const FeedPreferencesPage = () => {
  return (
    <SettingsLayout 
      title="Feed Preferences" 
      subtitle="Customize your content feed"
      showBackButton={true}
    >
      <div className="settings-page">
        <div className="settings-page-content">
          <div className="settings-placeholder">
            <h2>Feed Customization</h2>
            <p>Feed preferences and customization options will be implemented here.</p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default FeedPreferencesPage;
