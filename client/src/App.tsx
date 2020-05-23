import React, { useState, useEffect } from 'react';
import './App.css';
import { SERVER_URL, SERVER_PORT } from './App.constants';
import { getInitialLoad } from './App.api.handler';
import { Profile } from './App.types';

enum Arrows {
  NONE = -1,
  LEFT = 0,
  DOWN = 1,
  UP = 2,
  RIGHT = 3
}

const ProfileControls = (
  profiles: Profile[],
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>) => {
    return (
      <div className="grid__item">
        {selectedProfile.name}
      </div>
    );
}

const PerArrowSensitivityInput = (arrow: Arrows, thresholds: number[], setThresholds: React.Dispatch<React.SetStateAction<number[]>>) => {
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

const handleGetPressures = async (
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    fetch(`http://${SERVER_URL}:${SERVER_PORT}/pressures`)
      .then(resp => resp.json())
      .then(data => {
        addMessageToLog(data.message, messages, setMessages);
    });
}

const handleGetThresholds = async (
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    fetch(`http://${SERVER_URL}:${SERVER_PORT}/thresholds`)
      .then(resp => resp.json())
      .then(data => {
        addMessageToLog(data.message, messages, setMessages);
    });
}

const handleSetThresholds = async (
  thresholds:number[], 
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/thresholds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: thresholds })
    })
    .then(resp => resp.json())
    .then(data => {
      addMessageToLog(data.message, messages, setMessages);
    })
}

const addMessageToLog = (
  message: string,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    const newMessages = [...messages];
    newMessages.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
    setMessages(newMessages);
}

function App() {
  const [thresholds, setThresholds] = useState<number[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile>(new Profile(0, 'Invalid Profile', []));
  const [profiles, setProfiles] = useState<Profile[]>([]);
 
  useEffect(() => {
    // TODO: Move fetch to a utility class, create response class.
    getInitialLoad().then(resp => {
      setSelectedProfile(resp.pad.profile);
      setThresholds(resp.thresholds);
      setProfiles(resp.profiles);
    });
  }, []);

  if (thresholds.length === 0 || profiles.length === 0) {
    return (
      <div className="App">
        <p>Loading...</p>
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
        {ProfileControls(profiles, selectedProfile, setSelectedProfile)}
        {PerArrowSensitivityInput(Arrows.RIGHT, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.DOWN, thresholds, setThresholds)}
        <div className="grid__item" />
      </div>
      <button className="apiButton" onClick={() => handleSetThresholds(thresholds, messages, setMessages)}>
        Set Thresholds
      </button>
      <textarea value={messages.join('\n')} readOnly />
      <button className="apiButton" onClick={() => handleGetPressures(messages, setMessages)}>
        Get Pressures
      </button>
      <button className="apiButton" onClick={() => handleGetThresholds(messages, setMessages)}>
        Get Thresholds
      </button>
    </div>
  );
}
export default App;
