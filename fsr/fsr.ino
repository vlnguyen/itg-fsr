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
      size_t bytes_read = Serial.readBytesUntil(
          '\n', buffer_, kBufferSize - 1);
      buffer_[bytes_read] = '\0';

      UpdateThreshold(bytes_read);
    }
  }

  void UpdateThreshold(size_t bytes_read) {
    // Need to specify:
    // Sensor number + Threshold value.
    // {0, 1, 2, 3} + "0"-"1023"
    // e.g. 3180 (fourth FSR, change threshold to 180)
    Serial.println("Updating threshold.");

    if (bytes_read < 2 || bytes_read > 5) { return; }

    size_t sensor_index = buffer_[0] - '0';
    if (sensor_index < 0 || sensor_index > 3) { return; }

    unsigned int newThreshhold = strtoul(buffer_ + 1, nullptr, 10);

    char message[32];
    sprintf(message, "UPDATING PIN %d: %d", sensor_index, newThreshhold);
    Serial.println(message);

    kSensorStates[sensor_index].UpdateThreshold(newThreshhold);
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

