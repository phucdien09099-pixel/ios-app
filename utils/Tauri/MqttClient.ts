import { invoke } from "@tauri-apps/api/core";

// Hàm này chạy khi User bấm nút "Kết nối" trên giao diện
// async function handleConnectCli(userInputName: string, userInputPass: string) {
//     try {
//         // 1. Gửi user/pass xuống Rust để lấy chuỗi URL đã được giấu IP/Port
//         const secretBrokerUrl = await invoke<string>("get_mqtt_config", {
//             username: userInputName,
//             password: userInputPass
//         });

//         // 2. Thực hiện kết nối thông qua Transport class của bạn
//         await mqttTransport.connect({
//             brokerUrl: secretBrokerUrl,
//             topicsToSubscribe: [{ topic: "device/status", qos: 0 }]
//         });

//         alert("Kết nối MQTT thành công!");
//     } catch (error) {
//         console.error(error);
//         alert("Kết nối thất bại: " + error);
//     }
// }
