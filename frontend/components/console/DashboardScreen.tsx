import ConsoleLayout from './ConsoleLayout';
import { IconCardContainers, IconCardCost, IconCardCpu, IconCardStorage } from './icons';

const dashboardCards = [
  { title: 'Total Storage', value: '—', detail: '—', icon: <IconCardStorage /> },
  { title: 'Active Containers', value: '—', detail: '—', icon: <IconCardContainers /> },
  { title: 'Monthly Cost', value: '—', detail: '—', icon: <IconCardCost /> },
  { title: 'CPU Usage', value: '—', detail: '—', icon: <IconCardCpu /> }
];

export default function DashboardScreen() {
  return (
    <ConsoleLayout activeRoute="dashboard">
      <section className="dashboard-screen" data-node-id="206:9948">
        <h1 className="console-h1">Welcome to MPConsole</h1>
        <p className="console-subtext">
          Manage your cloud infrastructure with ease. Monitor your S3 storage and Docker containers from one place.
        </p>

        <div className="dashboard-grid">
          {dashboardCards.map((card) => (
            <article className="dashboard-card" key={card.title}>
              <div className="dashboard-card-head">
                <h3 className="dashboard-card-title">{card.title}</h3>
                <span className="dashboard-card-icon">{card.icon}</span>
              </div>
              <p className="dashboard-card-value">{card.value}</p>
              <p className="dashboard-card-detail">{card.detail}</p>
            </article>
          ))}
        </div>

        <h2 className="console-h2">Your Services</h2>
      </section>
    </ConsoleLayout>
  );
}
