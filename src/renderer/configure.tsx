import * as React from 'react';
import { useState, useEffect } from 'react';


const ConfigureDisplay = () => {
  const initialCount = 0;
  const [count, setCount] = useState(initialCount);
  
  const handleIncrement = () =>
    setCount(currentCount => currentCount + 1);
  
    const handleDecrement = () =>
    setCount(currentCount => currentCount - 1);
  
  
  return (
    <div>
      <h1>{count}</h1>
      <button type="button" onClick={handleIncrement}>
        Increment
      </button>
      <button type="button" onClick={handleDecrement}>
        Decrement
      </button>
    </div>
  );
};
export default ConfigureDisplay;