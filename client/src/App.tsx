import React, { useState, useEffect } from 'react';
import padImage from "./img/dance.png";
import './App.css';

enum Arrows {
  NONE = -1,
  LEFT = 0,
  DOWN = 1,
  UP = 2,
  RIGHT = 3
}

function SensitivityForm() {
  const [thresholds, setThreshholds] = useState([]);
 
  useEffect(() => {
    fetch("http://192.168.1.128:5555/thresholds")
      .then(resp => resp.json())
      .then(data => setThreshholds(data.values))
  }, []);

  if (thresholds.length === 0) {
    return <p>Loading thresholds...</p>
  }

  return (
    <form className="grid" onSubmit={(e) => { }}>
      <div className="grid__item" />
        <div className="grid__verticalArrow">
          <input 
            type="number"
            name="thresholdUp" 
            value={thresholds[Arrows.UP]}
          />
        </div>
        <div className="grid__item" />
        <div className="grid__leftArrow">
          <input 
            type="number"
            name="thresholdLeft" 
            value={thresholds[Arrows.LEFT]}
          />
        </div>
        <div className="grid__item">
          <img src={padImage} className="App-image" alt="pad" />
        </div>
        <div className="grid__rightArrow">
          <input 
            type="number"
            name="thresholdRight" 
            value={thresholds[Arrows.RIGHT]}
          />
        </div>
        <div className="grid__item" />
        <div className="grid__verticalArrow">
          <input 
            type="number"
            name="thresholdDown" 
            value={thresholds[Arrows.DOWN]}
          />
        </div>
      <div className="grid__item" />
    </form>
  );
}

function App() {
  return (
    <div className="App">
      <SensitivityForm />
        hey man
    </div>
  );
}

export default App;
