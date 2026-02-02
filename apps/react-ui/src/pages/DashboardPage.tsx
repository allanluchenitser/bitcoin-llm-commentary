import PriceChart from '@/shared-components/PriceChart'
import BotSummary from '@/shared-components/BotSummary';

import s from './DashboardPage.module.scss';

const DashboardPage: React.FC = () => {
  return (
    <div className={`container ${s.dashboardPage}`}>
      <h2>Dashboard Page</h2>
      <p>This is the Dashboard Page of the Bitcoin LLM Commentary application.</p>
      <PriceChart />
      <BotSummary />
    </div>
  )
};

export default DashboardPage;