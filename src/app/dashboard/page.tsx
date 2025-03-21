import { FiStar, FiClock, FiHeart, FiMessageCircle } from "react-icons/fi";

const DashboardPage = () => {
  return (
    <div className="dashboard-overview">
      <h1 className="dashboard-overview__title">Dashboard</h1>

      <div className="dashboard-overview__stats">
        <div className="dashboard-overview__stat-card">
          <div className="dashboard-overview__stat-icon">
            <FiHeart />
          </div>
          <div className="dashboard-overview__stat-info">
            <h3>Favorites</h3>
            <p>8</p>
          </div>
        </div>

        <div className="dashboard-overview__stat-card">
          <div className="dashboard-overview__stat-icon">
            <FiStar />
          </div>
          <div className="dashboard-overview__stat-info">
            <h3>Reviews</h3>
            <p>5</p>
          </div>
        </div>

        <div className="dashboard-overview__stat-card">
          <div className="dashboard-overview__stat-icon">
            <FiMessageCircle />
          </div>
          <div className="dashboard-overview__stat-info">
            <h3>Messages</h3>
            <p>3</p>
          </div>
        </div>
      </div>

      <div className="dashboard-overview__recent">
        <h2>Recent Orders</h2>
        {/* Add recent orders table/list here */}
      </div>
    </div>
  );
};

export default DashboardPage;
