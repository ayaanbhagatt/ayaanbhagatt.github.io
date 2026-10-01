#include <Stepper.h>

 
const int stepsPerRevolution = 200;


Stepper myStepper(stepsPerRevolution, 8, 9, 10, 11);

const int sweepSteps = 100;

int currentStep = 0;
int direction = 1;

const int trigPin = 5;
const int echoPin = 4;

// How often to measure distance
unsigned long lastScan = 0;
const unsigned long scanInterval = 50;



void setup() {

  myStepper.setSpeed(100);


  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Serial
  Serial.begin(9600);

  // CSV header
  Serial.println("angle,distance");
}

void loop() {

  // Move motor one step
  myStepper.step(direction);

  currentStep++;




  int angle;

  if (direction == 1) {

    // Moving 0 -> 180
    angle = map(currentStep, 0, sweepSteps, 0, 180);

  } else {

    // Moving 180 -> 0
    angle = map(currentStep, 0, sweepSteps, 180, 0);

  }


  if (millis() - lastScan >= scanInterval) {

    lastScan = millis();

    float distance = getDistance();


    if (distance > 0) {



      Serial.print(angle);
      Serial.print("\t");
      Serial.println(distance);
    }
  }



  if (currentStep >= sweepSteps) {

    currentStep = 0;


    direction = -direction;


    delay(200);
  }
}




float getDistance() {


  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);


  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);


  long duration = pulseIn(echoPin, HIGH, 25000);


  if (duration == 0) {
    return -1;
  }


  float distance = duration * 0.0343 / 2.0;

  return distance;
}