#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// ================= WIFI =================
const char* ssid = "MY HOME";
const char* password = "lampriet37";

// ================= MQTT (HIVEMQ) =================
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// ================= PIN =================
#define PIN_DHT 4
#define PIN_GAS 34
#define PIN_TANAH 35

#define PIN_RELAY_PENCACAH 26   // MASIH RELAY

// ===== L298N PENGADUK =====
#define PIN_L298N_IN3 27
#define PIN_L298N_IN4 13

// ================= THRESHOLD =================
float BATAS_SUHU = 100.0;
int BATAS_GAS = 100000;
int BATAS_LEMBAB_TANAH = 150000;

// ================= SENSOR =================
#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// ================= STATUS =================
bool status_pencacah = false;
bool status_pengaduk = false;
bool mode_auto_pengaduk = false;

// ================= DATA SENSOR =================
float data_suhu = 0;
float data_lembab = 0;
int data_gas = 0;
int data_tanah = 0;

// ================= MQTT CALLBACK =================
void callback(char* topic, byte* message, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)message[i];

  Serial.print("Topic: "); Serial.print(topic);
  Serial.print(" | Message: "); Serial.println(msg);

  if (String(topic) == "biocompost/control/pencacah") {
    status_pencacah = (msg == "ON");
  }

  if (String(topic) == "biocompost/control/mode_pengaduk") {
    mode_auto_pengaduk = (msg == "AUTO");
  }

  if (String(topic) == "biocompost/control/pengaduk") {
    if (!mode_auto_pengaduk) {
      status_pengaduk = (msg == "ON");
    }
  }
}

// ================= MQTT RECONNECT =================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke HiveMQ...");
    if (client.connect("ESP32_BioCompost_Daffa")) {
      Serial.println("TERHUBUNG!");
      client.subscribe("biocompost/control/pencacah");
      client.subscribe("biocompost/control/pengaduk");
      client.subscribe("biocompost/control/mode_pengaduk");
    } else {
      delay(5000);
    }
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(PIN_RELAY_PENCACAH, OUTPUT);
  pinMode(PIN_L298N_IN3, OUTPUT);
  pinMode(PIN_L298N_IN4, OUTPUT);

  // ===== KONDISI AWAL =====
  digitalWrite(PIN_RELAY_PENCACAH, HIGH); // relay OFF
  digitalWrite(PIN_L298N_IN3, LOW);
  digitalWrite(PIN_L298N_IN4, LOW);

  dht.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ================= LOOP =================
unsigned long lastMillis = 0;

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  if (millis() - lastMillis > 3000) {
    lastMillis = millis();

    data_gas = analogRead(PIN_GAS);
    data_tanah = analogRead(PIN_TANAH);
    data_suhu = dht.readTemperature();
    data_lembab = dht.readHumidity();

    // ===== MODE AUTO =====
    if (mode_auto_pengaduk) {
      status_pengaduk =
        data_gas > BATAS_GAS ||
        data_suhu > BATAS_SUHU ||
        data_tanah > BATAS_LEMBAB_TANAH;
    }

    // ===== OUTPUT PENCACAH (RELAY AKTIF-LOW) =====
    digitalWrite(PIN_RELAY_PENCACAH, status_pencacah ? LOW : HIGH);

    // ===== OUTPUT PENGADUK (L298N) =====
    if (status_pengaduk) {
      digitalWrite(PIN_L298N_IN3, HIGH);
      digitalWrite(PIN_L298N_IN4, LOW);   // MOTOR MUTAR
    } else {
      digitalWrite(PIN_L298N_IN3, LOW);
      digitalWrite(PIN_L298N_IN4, LOW);   // MOTOR STOP
    }

    // ===== PUBLISH SENSOR =====
    client.publish("biocompost/sensor/suhu", String(data_suhu).c_str());
    client.publish("biocompost/sensor/kelembaban", String(data_lembab).c_str());
    client.publish("biocompost/sensor/gas", String(data_gas).c_str());
    client.publish("biocompost/sensor/tanah", String(data_tanah).c_str());

    // ===== PUBLISH STATUS =====
    client.publish("biocompost/status/pencacah", status_pencacah ? "ON" : "OFF");
    client.publish("biocompost/status/pengaduk", status_pengaduk ? "ON" : "OFF");
  }
}
