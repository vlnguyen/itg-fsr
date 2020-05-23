import React, { useState, useEffect } from 'react';
import './App.css';
import { SERVER_URL, SERVER_PORT } from './App.constants';
import { getInitialLoad, updateProfile } from './App.api.handler';
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
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    return (
      <div className="grid__center">
        <select onChange={e => handleProfileSelect(e, profiles, setSelectedProfile, setThresholds)}>
          {profiles.map(profile => 
            <option value={profile.id} selected={profile.id === selectedProfile.id}>
              {profile.name}
            </option>
          )}
        </select>
        <button onClick={_e =>
          handleProfileSave(
            profiles, setProfiles,
            selectedProfile, setSelectedProfile, thresholds, 
            messages, setMessages
          )}
        >
          Save Profile
        </button>
        {/* TODO: Profile rename, new profile. */}
      </div>
    );
}

const handleProfileSelect = (
  e: React.ChangeEvent<HTMLSelectElement>,
  profiles: Profile[],
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>) => {
    const profile = profiles.find(profile => profile.id === parseInt(e.target.value))!;
    setSelectedProfile(profile);
    setThresholds(profile.values);
}

const handleProfileSave = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  thresholds: number[], 
  messages: string[], 
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    const updatedProfile = {...selectedProfile};
    updatedProfile.values = thresholds;

    updateProfile(updatedProfile).then(resp => {
      const updatedProfileList = [...profiles];
      const profileIndex = profiles.findIndex(profile => profile.id === updatedProfile.id)!;
      updatedProfileList.splice(profileIndex, 1, updatedProfile);

      setSelectedProfile(updatedProfile);
      setProfiles(updatedProfileList);
      addMessageToLog(resp.message, messages, setMessages);
    });
}

const PerArrowSensitivityInput = (
  arrow: Arrows, 
  selectedProfile: Profile, 
  thresholds: number[], 
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    return (
      <div className='grid__item'>
        <input
          type="number"
          name={getPerArrowInputName(arrow)}
          value={thresholds[arrow]}
          onChange={e => {
            const newThresholds = [...thresholds];
            newThresholds[arrow] = parseInt(e.target.value);
            setThresholds(newThresholds);
          }}
        />
        {PlusMinusButtons(arrow, thresholds, setThresholds)}
        Current: {selectedProfile.values[arrow]}
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

const getPerArrowInputName = (arrow: Arrows):string => {
  switch(arrow) {
    case Arrows.LEFT:
      return "thresholdLeft";
    case Arrows.DOWN:
      return "thresholdDown";
    case Arrows.UP:
      return "thresholdUp";
    case Arrows.RIGHT:
      return "thresholdRight";
    case Arrows.NONE:
      return "";
  }
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
    getInitialLoad().then(resp => {
      setSelectedProfile(resp.pad.profile);
      setThresholds(resp.pad.profile.values);
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
        {PerArrowSensitivityInput(Arrows.UP, selectedProfile, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.LEFT, selectedProfile, thresholds, setThresholds)}
        {ProfileControls(
          profiles, setProfiles,
          thresholds, setThresholds,
          selectedProfile, setSelectedProfile,
          messages, setMessages
        )}
        {PerArrowSensitivityInput(Arrows.RIGHT, selectedProfile, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.DOWN, selectedProfile, thresholds, setThresholds)}
        <div className="grid__item" />
      </div>
      <button className="apiButton" onClick={() => handleSetThresholds(thresholds, messages, setMessages)}>
         Apply Profile to Pad
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
