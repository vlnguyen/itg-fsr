#include <Joystick.h>
Joystick_ Joystick (
    0x03,
    JOYSTICK_TYPE_JOYSTICK,
    4,
    2,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
);

// Default threshold value for each of the sensors.
const unsigned int kDefaultThreshold = 200;
// Max window size for both of the moving averages classes.
const size_t kWindowSize = 100;

/*===========================================================================*/

// Class containing all relevant information per sensor.
class SensorState {
    public:
        SensorState(unsigned int pin_value, unsigned int offset) :
            pin_value_(pin_value),
            state_(SensorState::OFF),
            user_threshold_(kDefaultThreshold),
            offset_(offset) {}

        // Fetches the sensor value and maybe triggers the button press/release.
        void EvaluateSensor(int joystick_num) {
            cur_value_ = analogRead(pin_value_);
            if (cur_value_ >= user_threshold_ + kPaddingWidth &&
                state_ == SensorState::OFF) {
                Joystick.setButton(joystick_num, 1);
                state_ = SensorState::ON;
            }
            if (cur_value_ < user_threshold_ - kPaddingWidth &&
                state_ == SensorState::ON) {
                Joystick.setButton(joystick_num, 0);
                state_ = SensorState::OFF;
            }
        }

        void UpdateThreshold(unsigned int new_threshold) {
            user_threshold_ = new_threshold;
        }

        int GetCurValue() {
            return cur_value_;
        }

        int GetCurThreshold() {
            return user_threshold_;
        }

        // Delete default constructor. Pin number MUST be explicitly specified.
        SensorState() = delete;

    private:
        // The pin on the Teensy/Arduino corresponding to this sensor.
        unsigned int pin_value_;
        // The current joystick state of the sensor.
        enum State { OFF, ON };
        State state_;
        // The user defined threshold value to activate/deactivate this sensor at.
        int user_threshold_;
        // One-tailed width size to create a window around user_threshold_ to
        // mitigate fluctuations by noise.
        const int kPaddingWidth = 1;

        int cur_value_;

        int offset_;
};

/*===========================================================================*/

// Defines the sensor collections and sets the pins for them appropriately.
/* When setting sensor states, I've made an implication that the pin order
 * will match how the arrows appear on screen (0: Left, 1: Down, 2: Up, 3: Right).
 * This is only important if you intend on using the web app to control the
 * sensor thresholds, which expects the sensor states in that order.
*/
SensorState kSensorStates[] = {
    SensorState(A0, 0),
    SensorState(A1, 0),
    SensorState(A2, 0),
    SensorState(A3, 0),
};
const size_t kNumSensors = sizeof(kSensorStates)/sizeof(SensorState);

/*===========================================================================*/

class SerialProcessor {
    public:
        void Init(unsigned int baud_rate) {
            Serial.begin(baud_rate);
        }

        void CheckAndMaybeProcessData() {
            while (Serial.available() > 0) {
                size_t bytes_read = Serial.readBytesUntil('\n', buffer_, kBufferSize - 1);
                buffer_[bytes_read] = '\0';

                if (strcmp(buffer_, "pressures") == 0) {
                    OutputCurrentPressures();
                    return;
                }
                
                if (strcmp(buffer_, "thresholds") == 0) {
                    OutputCurrentThreshholds();
                    return;
                }

                char* strSens;
                int index;
                for (index = 0; index < kNumSensors; index++) {
                    if (index == 0) {
                        strSens = strtok(buffer_, ",");
                    }
                    else {
                        strSens = strtok(NULL, ",");
                    }
                    
                    unsigned int newThreshhold = strtoul(strSens, nullptr, 10);
                    kSensorStates[index].UpdateThreshold(newThreshhold);
                }
            }
        }

        void OutputCurrentPressures() {
            char message[20];
            sprintf(message, "%d,%d,%d,%d\n", 
                kSensorStates[0].GetCurValue(),
                kSensorStates[1].GetCurValue(),
                kSensorStates[2].GetCurValue(),
                kSensorStates[3].GetCurValue()
            );            
            Serial.print(message);
        }

        void OutputCurrentThreshholds() {
            char message[20];
            sprintf(message, "%d,%d,%d,%d\n", 
                kSensorStates[0].GetCurThreshold(),
                kSensorStates[1].GetCurThreshold(),
                kSensorStates[2].GetCurThreshold(),
                kSensorStates[3].GetCurThreshold()
            );            
            Serial.print(message);
        }

    private:
        static const size_t kBufferSize = 64;
        char buffer_[kBufferSize];
};

/*===========================================================================*/

SerialProcessor kSerialProcessor;

void setup() {
    kSerialProcessor.Init(9600);
    Joystick.begin();
}

void loop() {
    static unsigned int counter = 0;
    if (counter++ % 10 == 0) {
        kSerialProcessor.CheckAndMaybeProcessData();
    }

    for (size_t i = 0; i < kNumSensors; ++i) {
        kSensorStates[i].EvaluateSensor(i);
    }
}
