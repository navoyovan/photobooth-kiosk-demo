import React, { useState, useEffect } from 'react';

const RunningTimestamp = () => {
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 47); // weird interval for flickering ms
    return () => clearInterval(interval);
  }, []);

  const d = new Date(time);
  const formatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}:${d.getMilliseconds().toString().padStart(3, '0')}`;
  return <span>SYS.T: {formatted}</span>;
}

export default RunningTimestamp;
