import React, { useState, useEffect } from 'react';
import './App.css';
import { DEFAULT_PAD_ID } from './App.constants';
import { getInitialLoad, updateProfile, getPressures, getThresholds, setThresholdsOnPad, createProfile, deleteProfile } from './App.api.handler';
import { Profile, Arrows, ProfileControlStatus } from './App.types';

const ProfileControls = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  profileControlStatus: ProfileControlStatus,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  updatedName: string,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>
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
            setUpdatedName
          )
        }
        {profileControlStatus === ProfileControlStatus.RENAME && 
          ProfileControlsRenameState(
            profiles,setProfiles,
            selectedProfile, setSelectedProfile,
            messages,setMessages,
            setProfileControlStatus,
            updatedName, setUpdatedName
          )
        }
        {profileControlStatus === ProfileControlStatus.CREATE && 
          ProfileControlsCreateState(
            profiles, setProfiles,
            thresholds,
            setSelectedProfile,
            messages,setMessages,
            setProfileControlStatus,
            updatedName, setUpdatedName
          )
        }
        {profileControlStatus === ProfileControlStatus.DELETE && 
          ProfileControlsDeleteState(
            profiles, setProfiles,
            setThresholds,
            selectedProfile, setSelectedProfile,
            messages,setMessages,
            setProfileControlStatus
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
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>
  ) => {  
  return (
    <>
      <select onChange={e => handleProfileSelect(e, profiles, setSelectedProfile, setThresholds)}>
        {profiles.map(profile =>
          <option value={profile.id} selected={profile.id === selectedProfile.id}>
            {profile.name}
          </option>
        )}
      </select>
      <button onClick={() =>
        handleProfileSave(
          profiles, setProfiles,
          selectedProfile, setSelectedProfile, thresholds,
          messages, setMessages
        )}
        disabled={thresholds.toString() === selectedProfile.values.toString()}
      >
        Save to Profile
      </button>
      <button onClick={() => {
        setUpdatedName(selectedProfile.name);
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
      {profiles.length > 1 && 
        <button onClick={() => setProfileControlStatus(ProfileControlStatus.DELETE)}>
          Delete Profile
        </button>
      }
    </>
  )
};

const ProfileControlsRenameState = (
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  updatedName: string,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>
) => {
  return (
    <>
      <input type="text" value={updatedName} onChange={e => setUpdatedName(e.target.value)} />
      <button onClick={() => {
        handleProfileRename(
          selectedProfile, updatedName, setSelectedProfile, 
          profiles, setProfiles,
          messages, setMessages
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
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>,
  updatedName: string,
  setUpdatedName: React.Dispatch<React.SetStateAction<string>>
) => {
  return (
    <>
      <input type="text" value={updatedName} onChange={e => setUpdatedName(e.target.value)} />
      <button onClick={() => {
        handleProfileCreate(
          updatedName, setSelectedProfile,
          profiles, setProfiles,
          thresholds,
          messages, setMessages
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
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>,
  setProfileControlStatus: React.Dispatch<React.SetStateAction<ProfileControlStatus>>
)  => {
  return (
    <>
      Are you sure you want to delete profile {selectedProfile.name}?
      <button onClick={() => {
        handleProfileDelete(
          selectedProfile, setSelectedProfile,
          profiles, setProfiles,
          setThresholds,
          messages, setMessages
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
  selectedProfile: Profile,
  updatedName: string,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const updatedProfile = {...selectedProfile};
  updatedProfile.name = updatedName;
  updateProfile(updatedProfile).then(resp => {
    addMessageToLog(resp.message, messages, setMessages);
  })

  const updatedProfileList = [...profiles];
  const updatedProfileIndex = profiles.findIndex(profile => profile.id === selectedProfile.id)!;
  updatedProfileList.splice(updatedProfileIndex, 1, updatedProfile);
  setProfiles(updatedProfileList);

  setSelectedProfile(updatedProfile);
};

const handleProfileCreate = (
  updatedName: string,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  thresholds: number[],
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const newProfile = new Profile(0, updatedName, thresholds);
  createProfile(newProfile).then(resp => {
    addMessageToLog(resp.message, messages, setMessages);
    if (resp.success) {
      newProfile.id = resp.profile.id;
      const newProfilesList = [...profiles, newProfile];
      newProfilesList.sort((a,b) => a.name < b.name ? -1 : 1);
      setProfiles(newProfilesList);
      setSelectedProfile(newProfile);
    }
  })
};

const handleProfileDelete = (
  selectedProfile: Profile,
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>,
  profiles: Profile[],
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>,
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>
) => {
    deleteProfile(selectedProfile).then(resp => {
      addMessageToLog(resp.message, messages, setMessages);
      if (resp.success) {
        const newProfilesList = profiles.filter(profile => profile.id !== selectedProfile.id);
        setProfiles(newProfilesList);
        setSelectedProfile(newProfilesList[0]);
        setThresholds(newProfilesList[0].values);
      }
  })
};

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
    getPressures().then(resp => 
      addMessageToLog(resp.message, messages, setMessages)
    );
}

const handleGetThresholds = async (
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    getThresholds().then(resp => 
      addMessageToLog(resp.message, messages, setMessages)
    );
}

const handleSetThresholds = async (
  selectedProfile: Profile,
  thresholds: number[],
  messages: string[],
  setMessages: React.Dispatch<React.SetStateAction<string[]>>) => {
    setThresholdsOnPad(DEFAULT_PAD_ID, selectedProfile, thresholds).then(resp =>
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
  const [selectedProfile, setSelectedProfile] = useState<Profile>(new Profile(0, 'Invalid Profile', []));
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileControlStatus, setProfileControlStatus] = useState<ProfileControlStatus>(ProfileControlStatus.NONE);
  const [updatedName, setUpdatedName] = useState<string>("");
 
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
        {PerArrowSensitivityInput(Arrows.UP, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.LEFT, thresholds, setThresholds)}
        {ProfileControls(
          profiles, setProfiles,
          thresholds, setThresholds,
          selectedProfile, setSelectedProfile,
          messages, setMessages,
          profileControlStatus, setProfileControlStatus,
          updatedName, setUpdatedName
        )}
        {PerArrowSensitivityInput(Arrows.RIGHT, thresholds, setThresholds)}
        <div className="grid__item" />
        {PerArrowSensitivityInput(Arrows.DOWN, thresholds, setThresholds)}
        <div className="grid__item" />
      </div>
      <button className="apiButton" onClick={() => handleSetThresholds(selectedProfile, thresholds, messages, setMessages)}>
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
