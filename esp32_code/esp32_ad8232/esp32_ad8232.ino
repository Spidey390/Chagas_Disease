#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#define WIFISSID "QWERTY"
#define PASSWORD "1234567890"

const char* serverUrl = "https://chagas-disease-backent.onrender.com/api/ecg-raw";

#define ECG_PIN 34
#define LO_PLUS 32
#define LO_MINUS 33

#define BUFFER_SIZE 200
#define MAX_RETRIES 3

int ecgBuffer[BUFFER_SIZE];

void setup() {
  Serial.begin(115200);

  pinMode(LO_PLUS, INPUT);
  pinMode(LO_MINUS, INPUT);

  WiFi.begin(WIFISSID, PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected");
}

bool postECG() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, serverUrl);
  http.setTimeout(60000);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<3000> doc;
  JsonArray samples = doc.createNestedArray("samples");
  for (int i = 0; i < BUFFER_SIZE; i++) {
    samples.add(ecgBuffer[i]);
  }

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  http.end();

  if (httpResponseCode > 0) {
    Serial.print("HTTP Status: ");
    Serial.println(httpResponseCode);
    return true;
  } else {
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
    return false;
  }
}

void loop() {
  if (digitalRead(LO_PLUS) == 1 || digitalRead(LO_MINUS) == 1) {
    Serial.println("Leads off! Check electrodes.");
    delay(1000);
    return;
  }

  for (int i = 0; i < BUFFER_SIZE; i++) {
    ecgBuffer[i] = analogRead(ECG_PIN);
    delay(4);
  }

  if (WiFi.status() == WL_CONNECTED) {
    bool success = false;
    for (int attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
      if (attempt > 1) {
        Serial.printf("Retry %d/%d - waiting 10s for server to wake...\n", attempt, MAX_RETRIES);
        delay(10000);
      }
      success = postECG();
    }
    if (!success) {
      Serial.println("All retries failed.");
    }
  } else {
    Serial.println("WiFi Disconnected");
    WiFi.reconnect();
  }

  delay(100);
}
