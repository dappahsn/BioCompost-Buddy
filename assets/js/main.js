// ================= MQTT HIVE MQ (GLOBAL) =================
const mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

mqttClient.on("connect", function () {
  console.log("MQTT Connected");
  mqttClient.subscribe("biocompost/sensor/#");
  mqttClient.subscribe("biocompost/status/#");
});

// ================= TERIMA DATA =================
mqttClient.on("message", function (topic, message) {
  const data = message.toString();
  console.log(topic, "=>", data);

  if (topic === "biocompost/sensor/suhu") {
    document.getElementById("suhuValue").innerText = data + " °C";
  }
  if (topic === "biocompost/sensor/kelembaban") {
    document.getElementById("kelembabanValue").innerText = data + " %";
  }
  if (topic === "biocompost/sensor/gas") {
    document.getElementById("gasValue").innerText = data + " ppm";
  }

  if (topic === "biocompost/status/pencacah") {
    updateUI("pencacah", data === "ON");
  }

  // PENGADUK: STATUS DARI ESP32 TETAP DIPROSES,
  // TAPI UI KITA SET DEFAULT HIDUP DI AWAL HALAMAN
  if (topic === "biocompost/status/pengaduk") {
    updateUI("pengaduk", data === "ON");
  }
});

// ================= SET KONDISI AWAL UI =================
document.addEventListener("DOMContentLoaded", function () {

  // --- DEFAULT: PENGADUK HIDUP DI WEB ---
  setPengadukUI(false);

  const pencacahBtn = document.getElementById("pencacahBtn");
  const pengadukBtn = document.getElementById("pengadukBtn");

  // ===== PENCACAH (NORMAL) =====
  pencacahBtn.addEventListener("click", function () {
    if (pencacahBtn.classList.contains("off")) {
      mqttClient.publish("biocompost/control/pencacah", "ON");
    } else {
      mqttClient.publish("biocompost/control/pencacah", "OFF");
    }
  });

  // ===== PENGADUK (DIBALIK SESUAI HARDWARE) =====
  pengadukBtn.addEventListener("click", function () {

    // Jika UI sekarang HIDUP (hijau) → saat ditekan jadi MATI
    if (pengadukBtn.classList.contains("on")) {
      // TAMPILAN: MATI
      setPengadukUI(false);

      // KIRIM KE ESP32: MATI
      mqttClient.publish("biocompost/control/mode_pengaduk", "MANUAL");
      mqttClient.publish("biocompost/control/pengaduk", "OFF");

    } else {
      // Jika UI sekarang MATI → saat ditekan jadi HIDUP
      setPengadukUI(true);

      // KIRIM KE ESP32: HIDUP
      mqttClient.publish("biocompost/control/mode_pengaduk", "MANUAL");
      mqttClient.publish("biocompost/control/pengaduk", "ON");
    }
  });

});

// ================= UPDATE UI (DARI MQTT) =================
function updateUI(device, isOn) {

  if (device === "pencacah") {
    const btn = document.getElementById("pencacahBtn");
    const icon = document.getElementById("pencacahIcon");
    const status = document.getElementById("pencacahStatus");

    if (isOn) {
      btn.classList.replace("off", "on");
      icon.classList.add("rotate");
      status.innerText = "Hidup";
    } else {
      btn.classList.replace("on", "off");
      icon.classList.remove("rotate");
      status.innerText = "Mati";
    }
  }

  // PENGADUK: KITA TETAP SINKRON DENGAN ESP32,
  // TAPI LOGIKA UI SUDAH DISESUAIKAN
  if (device === "pengaduk") {
    setPengadukUI(isOn);
  }
}

// ================= HELPER: SET UI PENGADUK =================
function setPengadukUI(isOn) {
  const btn = document.getElementById("pengadukBtn");
  const icon = document.getElementById("pengadukIcon");
  const status = document.getElementById("pengadukStatus");

  if (isOn) {
    // HIJAU + BERPUTAR
    btn.classList.remove("off");
    btn.classList.add("on");
    icon.classList.add("rotate");
    status.innerText = "Hidup";
  } else {
    // MERAH + BERHENTI
    btn.classList.remove("on");
    btn.classList.add("off");
    icon.classList.remove("rotate");
    status.innerText = "Mati";
  }
}
