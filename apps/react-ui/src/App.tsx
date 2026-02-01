// import { useState } from 'react'
import './App.scss'
import PriceChart from './PriceChart'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <div className="header">Price ingestor and LLM summaries</div>
      <div className="container">
        <div className="left-column">
          <div className="chart">
            <PriceChart />
          </div>
          <div className="llm-summaries"></div>
        </div>
        <div className="right-column">
          <div className="configuration">

          </div>
        </div>
      </div>

      {/* <h1>Vite + React</h1>
      <div className="card">
        <button onMouseDown={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  )
}

export default App
