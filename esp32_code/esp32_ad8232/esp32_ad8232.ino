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

void loop() {
  if (digitalRead(LO_PLUS) == 1 || digitalRead(LO_MINUS) == 1) {
    Serial.println("Leads off! Check electrodes.");
    delay(1000);
    return;
  }

  // Collect 200 samples at ~250Hz (4ms per sample)
  for (int i = 0; i < BUFFER_SIZE; i++) {
    ecgBuffer[i] = analogRead(ECG_PIN);
    delay(4);
  }

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Skip certificate validation for Render HTTPS
    HTTPClient http;
    http.begin(client, serverUrl);
    http.setTimeout(15000);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<3000> doc;
    JsonArray samples = doc.createNestedArray("samples");
    for (int i = 0; i < BUFFER_SIZE; i++) {
      samples.add(ecgBuffer[i]);
    }

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Status: ");
      Serial.println(httpResponseCode);
      Serial.println(http.getString());
    } else {
      Serial.print("Error: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  delay(100);
}
