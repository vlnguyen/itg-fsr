import React, { useState, useEffect } from 'react';
import './App.css';
import { DEFAULT_PAD_SIDE } from './App.constants';
import { getInitialLoad, updateProfile, getPressures, getThresholds, setThresholdsOnPad, createProfile, deleteProfile } from './App.api.handler';
import { Profile, Arrows, ProfileControlStatus, PadSide, SelectedProfileState } from './App.types';

const ProfileControls = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  profileControlStatus: ProfileControlStatus,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  updatedName: string,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>,
  selectedPadSide: PadSide
  ) => {    
    return (
      <div className="grid__center">
        {profileControlStatus === ProfileControlStatus.NONE && 
          ProfileControlsDefaultState(
            profiles, setProfiles, 
            thresholds, setThresholds, 
            selectedProfile, setSelectedProfile,
            messages, setMessages, 
            setProfileControlStatus,
            setUpdatedName,
            selectedPadSide
          )
        }
        {profileControlStatus === ProfileControlStatus.RENAME && 
          ProfileControlsRenameState(
            profiles,setProfiles,
            selectedProfile, setSelectedProfile,
            messages,setMessages,
            setProfileControlStatus,
            updatedName, setUpdatedName,
            selectedPadSide
          )
        }
        {profileControlStatus === ProfileControlStatus.CREATE && 
          ProfileControlsCreateState(
            profiles, setProfiles,
            thresholds,
            selectedProfile, setSelectedProfile,
            messages,setMessages,
            setProfileControlStatus,
            updatedName, setUpdatedName,
            selectedPadSide
          )
        }
        {profileControlStatus === ProfileControlStatus.DELETE && 
          ProfileControlsDeleteState(
            profiles, setProfiles,
            setThresholds,
            selectedProfile, setSelectedProfile,
            messages,setMessages,
            setProfileControlStatus,
            selectedPadSide
          )
        }
      </div>
    );
}

const ProfileControlsDefaultState = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>,
  selectedPadSide: PadSide
  ) => {  
  return (
    <>
      <select onChange={e => handleProfileSelect(e, profiles, selectedProfile, setSelectedProfile, setThresholds, selectedPadSide)}>
        {profiles.map(profile =>
          <option value={profile.id} selected={profile.id === selectedProfile[selectedPadSide].id}>
            {profile.name}
          </option>
        )}
      </select>
      <button onClick={() =>
        handleProfileSave(
          profiles, setProfiles,
          selectedProfile, setSelectedProfile, thresholds,
          messages, setMessages,
          selectedPadSide
        )}
        disabled={thresholds.toString() === selectedProfile[selectedPadSide].values.toString()}
      >
        Save to Profile
      </button>
      <button onClick={() => {
        setUpdatedName(selectedProfile[selectedPadSide].name);
        setProfileControlStatus(ProfileControlStatus.RENAME);
      }}>
        Rename Profile
      </button>
      <button onClick={() => {
        setUpdatedName("");
        setProfileControlStatus(ProfileControlStatus.CREATE);
      }}>
        Create Profile
      </button>
      <button 
        onClick={() => setProfileControlStatus(ProfileControlStatus.DELETE)}
        disabled={selectedProfile[selectedPadSide].id === 1 || selectedProfile[selectedPadSide].id === 2}
      >
        Delete Profile
      </button>
      
    </>
  )
};

const ProfileControlsRenameState = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  updatedName: string,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>,
  selectedPadSide: PadSide
) => {
  return (
    <>
      <input type="text" value={updatedName} onChange={e => setUpdatedName(e.target.value)} />
      <button onClick={() => {
        handleProfileRename(
          selectedProfile, updatedName, setSelectedProfile, 
          profiles, setProfiles,
          messages, setMessages,
          selectedPadSide
        );
        setUpdatedName("");
        setProfileControlStatus(ProfileControlStatus.NONE);
      }}>
        Confirm Rename
      </button>
      <button onClick={() => {
        setUpdatedName("");
        setProfileControlStatus(ProfileControlStatus.NONE);
      }}>
        Cancel
      </button>
    </>
  );
};

const ProfileControlsCreateState = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  updatedName: string,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>,
  selectedPadSide: PadSide
) => {
  return (
    <>
      <input type="text" value={updatedName} onChange={e => setUpdatedName(e.target.value)} />
      <button onClick={() => {
        handleProfileCreate(
          updatedName, selectedProfile, setSelectedProfile,
          profiles, setProfiles,
          thresholds,
          messages, setMessages,
          selectedPadSide
        );
        setUpdatedName("");
        setProfileControlStatus(ProfileControlStatus.NONE);
      }}>
        Confirm Create
      </button>
      <button onClick={() => {
        setUpdatedName("");
        setProfileControlStatus(ProfileControlStatus.NONE);
      }}>
        Cancel
      </button>
    </>
  );
};

const ProfileControlsDeleteState = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  selectedPadSide: PadSide
)  => {
  return (
    <>
      Are you sure you want to delete profile {selectedProfile[selectedPadSide].name}?
      <button onClick={() => {
        handleProfileDelete(
          selectedProfile, setSelectedProfile,
          profiles, setProfiles,
          setThresholds,
          messages, setMessages,
          selectedPadSide
        );
        setProfileControlStatus(ProfileControlStatus.NONE);
      }}>
        CONFIRM DELETE
      </button>
      <button onClick={() => setProfileControlStatus(ProfileControlStatus.NONE)}>
        Cancel
      </button>
    </>
  );
}

const handleProfileRename = (
  selectedProfile: SelectedProfileState,
  updatedName: string,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide
) => {
  const updatedProfiles = {...selectedProfile};
  updatedProfiles[selectedPadSide].name = updatedName;
  updateProfile(updatedProfiles[selectedPadSide]).then(resp => {
    addMessageToLog(resp.message, messages, setMessages);
  })

  const updatedProfileList = [...profiles];
  const updatedProfileIndex = profiles.findIndex(profile => profile.id === selectedProfile[selectedPadSide].id)!;
  updatedProfileList.splice(updatedProfileIndex, 1, updatedProfiles[selectedPadSide]);
  setProfiles(updatedProfileList);

  setSelectedProfile(updatedProfiles);
};

const handleProfileCreate = (
  updatedName: string,
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide
) => {
  const newProfile = new Profile(0, updatedName, thresholds);
  createProfile(newProfile).then(resp => {
    addMessageToLog(resp.message, messages, setMessages);
    if (resp.success) {
      newProfile.id = resp.profile.id;
      const newProfilesList = [...profiles, newProfile];
      newProfilesList.sort((a,b) => a.name < b.name ? -1 : 1);

      const updatedSelectedProfiles = {...selectedProfile};
      updatedSelectedProfiles[selectedPadSide] = newProfile;
      setProfiles(newProfilesList);
      setSelectedProfile(updatedSelectedProfiles);
    }
  })
};

const handleProfileDelete = (
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide
) => {
    deleteProfile(selectedProfile[selectedPadSide]).then(resp => {
      addMessageToLog(resp.message, messages, setMessages);
      if (resp.success) {
        const newProfilesList = profiles.filter(profile => profile.id !== selectedProfile[selectedPadSide].id);
        setProfiles(newProfilesList);
        
        /* profile.id = 1 will always exist for P1, profile.id = 2 will always exist for P2 */
        const newSelectedProfile = profiles.find(profile => profile.id == selectedPadSide)!;
        const updatedSelectedProfiles = {...selectedProfile};
        updatedSelectedProfiles[selectedPadSide] = newSelectedProfile;
        setSelectedProfile(updatedSelectedProfiles);
        setThresholds(newSelectedProfile.values);
      }
  })
};

const handleProfileSelect = (
  e: React.ChangeEvent<HTMLSelectElement>,
  profiles: Profile[],
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  selectedPadSide: PadSide) => {
    const profile = profiles.find(profile => profile.id === parseInt(e.target.value))!;
    const newSelectedProfile = {...selectedProfile};
    newSelectedProfile[selectedPadSide] = profile;
    setSelectedProfile(newSelectedProfile);
    setThresholds(profile.values);
}

const handleProfileSave = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  selectedProfile: SelectedProfileState,
  setSelectedProfile: React.Dispatch<React.SetStateAction<SelectedProfileState>>,
  thresholds: number[], 
  messages: string[], 
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide) => {
    const updatedProfiles = {...selectedProfile};
    updatedProfiles[selectedPadSide].values = thresholds;

    updateProfile(updatedProfiles[selectedPadSide]).then(resp => {
      const updatedProfileList = [...profiles];
      const profileIndex = profiles.findIndex(profile => profile.id === updatedProfiles[selectedPadSide].id)!;
      updatedProfileList.splice(profileIndex, 1, updatedProfiles[selectedPadSide]);

      setSelectedProfile(updatedProfiles);
      setProfiles(updatedProfileList);
      addMessageToLog(resp.message, messages, setMessages);
    });
}

const PerArrowSensitivityInput = (
  arrow: Arrows,
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
      </div>
    );
};

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

const PadSideSelector = (
  selectedPadSide: PadSide,
  setSelectedPadSide: React.Dispatch<React.SetStateAction<PadSide>>,
  selectedProfile: SelectedProfileState,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>) => {
    return (
      <div className="PadSideSelector">
        <header className="App-header">
          Player {selectedPadSide} Settings
        </header>
        <label>
          <input 
            type="radio" 
            value={PadSide.P1} 
            name="padSide"
            checked={selectedPadSide === PadSide.P1} 
            onChange={e => handlePadSideChange(e, setSelectedPadSide, selectedProfile, setThresholds)}
          /> 
          P1
        </label>
        {" "}
        <label>
          <input 
            type="radio" 
            name="padSide"
            value={PadSide.P2} 
            checked={selectedPadSide === PadSide.P2}
            onChange={e => handlePadSideChange(e, setSelectedPadSide, selectedProfile, setThresholds)}
          /> 
          P2
        </label> 
      </div>
    );
};

const handlePadSideChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setSelectedPadSide: React.Dispatch<React.SetStateAction<PadSide>>,
  selectedProfile: SelectedProfileState,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>) => {
    const newPadSide: PadSide = parseInt(e.target.value)
    setSelectedPadSide(newPadSide);
    setThresholds(selectedProfile[newPadSide].values);
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
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide) => {
    await getPressures(selectedPadSide).then(resp => 
      addMessageToLog(resp.message, messages, setMessages)
    );
}

const handleGetThresholds = async (
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide) => {
    await getThresholds(selectedPadSide).then(resp => 
      addMessageToLog(resp.message, messages, setMessages)
    );
}

const handleSetThresholds = async (
  selectedProfile: Profile,
  thresholds: number[],
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedPadSide: PadSide) => {
    await setThresholdsOnPad(selectedPadSide, selectedProfile, thresholds).then(resp =>
      addMessageToLog(resp.message, messages, setMessages)
    );
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
  const [selectedPadSide, setSelectedPadSide] = useState<PadSide>(DEFAULT_PAD_SIDE);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfileState>(
    new SelectedProfileState(
      new Profile(0, 'Invalid Profile', []), 
      new Profile(0, 'Invalid Profile', [])
    )
  );
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileControlStatus, setProfileControlStatus] = useState<ProfileControlStatus>(ProfileControlStatus.NONE);
  const [updatedName, setUpdatedName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    getInitialLoad().then(resp => {
      setSelectedProfile(new SelectedProfileState(resp.p1.profile, resp.p2.profile));
      setThresholds(resp.p1.profile.values);
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
      {PadSideSelector(selectedPadSide, setSelectedPadSide, selectedProfile, setThresholds)}
      <div className="grid">
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.UP, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.LEFT, thresholds, setThresholds)}
        {ProfileControls(
          profiles, setProfiles,
          thresholds, setThresholds,
          selectedProfile, setSelectedProfile,
          messages, setMessages,
          profileControlStatus, setProfileControlStatus,
          updatedName, setUpdatedName,
          selectedPadSide
        )}
        {PerArrowSensitivityInput(Arrows.RIGHT, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.DOWN, thresholds, setThresholds)}
        <div className="grid__item" />
      </div>
      <button
        className="apiButton"
        onClick={async () => {
          setIsLoading(true);
          await handleSetThresholds(selectedProfile[selectedPadSide], thresholds, messages, setMessages, selectedPadSide);
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
         Apply Profile to Pad
      </button>
      <textarea value={messages.join('\n')} readOnly />
      <button
        className="apiButton"
        onClick={async () => {
          setIsLoading(true);
          await handleGetPressures(messages, setMessages, selectedPadSide);
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
        Get Pressures
      </button>
      <button
        className="apiButton"
        onClick={async () => {
          setIsLoading(true);
          await handleGetThresholds(messages, setMessages, selectedPadSide);
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
        Get Thresholds
      </button>
    </div>
  );
}
export default App;
