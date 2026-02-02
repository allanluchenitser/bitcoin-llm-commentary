import PriceChart from '@/shared-components/PriceChart'
import BotSummary from '@/shared-components/BotSummary';

import s from './DashboardPage.module.scss';

const DashboardPage: React.FC = () => {
  return (
    <div className={s.dashboardPage}>
      <h1>Dashboard Page</h1>
      <PriceChart />
      <BotSummary />
    </div>
  )
};

export default DashboardPage;