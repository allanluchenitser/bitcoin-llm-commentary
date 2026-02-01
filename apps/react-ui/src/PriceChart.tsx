// import React, { useEffect, useRef } from 'react';
import styles from './PriceChart.module.scss';

const PriceChart: React.FC = () => {

  return (
    <div className={styles.priceChart}>
      <h2>Price Chart Component</h2>
      <div style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0' }}>
        {
          [2, 4, 6, 8].map(el => <p>Twice menas {el} times</p>)
        }
      </div>
    </div>
  );
};

export default PriceChart;