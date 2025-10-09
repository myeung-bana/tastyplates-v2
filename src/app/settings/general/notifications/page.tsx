import SettingsLayout from "@/components/Settings/SettingsLayout";

const NotificationsSettingsPage = () => {
  return (
    <SettingsLayout 
      title="Notifications" 
      subtitle="Manage your notification preferences"
      showBackButton={true}
    >
      <div className="settings-page">
        <div className="settings-page-content">
          <div className="settings-placeholder">
            <h2>Notification Settings</h2>
            <p>Notification preferences will be implemented here.</p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default NotificationsSettingsPage;
