#include <stdio.h>
 
#define NUM_PANELS 4
int pins[NUM_PANELS] = {A0, A1, A2, A3};

void setup() 
{
  Serial.begin(9600);
  int i;
  for (i = 0; i < NUM_PANELS; i++)
  {
    pinMode(pins[i], INPUT);
  }
}

void loop() 
{
  unsigned int counter = 0;
  
  int i;
  for (i = 0; i < NUM_PANELS; i++)
  {
    int fsrValue = analogRead(pins[i]);

    char debugMsg[32];
    sprintf(debugMsg, "{ PIN: %d, VALUE: %d }", i, fsrValue);
    Serial.println(debugMsg);
    
  }
  Serial.println("");
  delay(500);
}



