import PriceChart from '@/shared-components/PriceChart'
import BotSummary from '@/shared-components/BotSummary';

const DashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      <h2>Dashboard Page</h2>
      <p>This is the Dashboard Page of the Bitcoin LLM Commentary application.</p>
      <div className="flex">
        <div className="flex-2">
          <PriceChart />
          <BotSummary />
        </div>
        <div className="flex-1 ml-4 text-center">
            <h3 className="text-lg font-semibold mb-4">Sidebar</h3>
            <ul>
              <li className="mb-2">Item 1</li>
              <li className="mb-2">Item 2</li>
              <li className="mb-2">Item 3</li>
            </ul>
        </div>
      </div>
    </div>
  )
};

export default DashboardPage;