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

function PerArrowSensitivityInput (arrow: Arrows, thresholds: number[], setThresholds: React.Dispatch<React.SetStateAction<number[]>>) {
  const { inputName, divClassName } = getPerArrowProperties(arrow);
  return (
    <div className={divClassName}>
      <input 
        type="number"
        name={inputName}
        value={thresholds[arrow]}
        onChange={e => {
          const newThresholds = [...thresholds];
          newThresholds[arrow] = parseInt(e.target.value);
          setThresholds(newThresholds);
        }}
      />
      {PlusMinusButtons(arrow, thresholds, setThresholds)}
    </div>
  );
}

const PlusMinusButtons = (
  arrow: Arrows, 
  thresholds: number[],
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>) => {
    return (
      <span>
        <button onClick={e => handleLowerThreshold(e, arrow, thresholds, setThresholds)}>-</button>
        <button onClick={e => handleRaiseThreshold(e, arrow, thresholds, setThresholds)}>+</button>
      </span>
    );
};

const handleLowerThreshold = (
  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  arrow: Arrows,
  thresholds: number[],
  setThresholds:React.Dispatch<React.SetStateAction<number[]>>) => {
    handleChangeThreshold(e, arrow, thresholds[arrow] - 10, thresholds, setThresholds);
};

const handleRaiseThreshold = (
  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  arrow: Arrows,
  thresholds: number[],
  setThresholds:React.Dispatch<React.SetStateAction<number[]>>) => {
    handleChangeThreshold(e, arrow, thresholds[arrow] + 10, thresholds, setThresholds);
};

const handleChangeThreshold = (
  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  arrow: Arrows,
  newValue: number,
  thresholds: number[],
  setThresholds:React.Dispatch<React.SetStateAction<number[]>>) => {
    e.preventDefault();
    const newThresholds = [...thresholds];
    newThresholds[arrow] = newValue;
    setThresholds(newThresholds);
}

const getPerArrowProperties = (arrow: Arrows) => {
  let inputName:string, divClassName: string;
  switch(arrow) {
    case Arrows.LEFT:
      inputName = "thresholdLeft";
      divClassName = "grid__leftArrow";  
      break;
    case Arrows.DOWN:
      inputName = "thresholdDown";
      divClassName = "grid__verticalArrow";  
      break;
    case Arrows.UP:
      inputName = "thresholdUp";
      divClassName = "grid__verticalArrow";  
      break;
    case Arrows.RIGHT:
      inputName = "thresholdRight";
      divClassName = "grid__Arrow";  
      break;
    case Arrows.NONE:
      inputName = "";
      divClassName = "";  
      break;
  }

  return { inputName: inputName, divClassName: divClassName };
};

const handleSubmit = (thresholds:number[]) => {
  console.log(thresholds);
}

function App() {
  const [thresholds, setThresholds] = useState<number[]>([]);
 
  useEffect(() => {
    fetch("http://192.168.1.128:5555/thresholds")
      .then(resp => resp.json())
      .then(data => setThresholds(data.values))
  }, []);

  if (thresholds.length === 0) {
    return (
      <div className="App">
        <p>Loading thresholds...</p>
      </div>
    );
  }

  return (    
    <div className="App">
      <div className="grid">
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.UP, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.LEFT, thresholds, setThresholds)}
        <div className="grid__item">
          <img src={padImage} className="App-image" alt="pad"/>
        </div>
        {PerArrowSensitivityInput(Arrows.RIGHT, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.DOWN, thresholds, setThresholds)}
        <div className="grid__item" />
      </div>
      <button className="submitButton" onClick={() => handleSubmit(thresholds)}>
        Set Thresholds
      </button>
    </div>
  );
}
export default App;
