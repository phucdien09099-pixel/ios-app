use serde_json::Value;
mod http_client;
// use dotenvy::dotenv;
// use std::env;
use dotenvy::from_filename; // Đổi từ 'dotenv' sang 'from_filename'
use std::env;

#[tauri::command]
async fn api_request(
    method: String,
    url: String,
    session_token: Option<String>,
    body: Option<Value>,
) -> Result<Value, String> {
    match method.to_uppercase().as_str() {
        "GET" => http_client::get(&url, session_token).await,
        "POST" => http_client::post(&url, session_token, body).await,
        "PUT" => http_client::put(&url, session_token, body).await,
        "DELETE" => http_client::delete(&url, session_token).await,
        _ => Err("Method không hợp lệ (Chỉ hỗ trợ GET, POST, PUT, DELETE)".to_string()),
    }
}


#[tauri::command]
fn get_mqtt_config(username: Option<String>, password: Option<String>) -> Result<String, String> {
    // Chỉ định chính xác tìm file .env.local ở thư mục gốc
    from_filename(".env.local").ok();

    let host_ip = env::var("HOST_IP")
        .map_err(|_| "Không tìm thấy biến HOST_IP trong file .env.local".to_string())?;
    let mqtt_port = env::var("MQTT_PORT")
        .map_err(|_| "Không tìm thấy biến MQTT_PORT trong file .env.local".to_string())?;

    let clean_ip = host_ip.trim_matches('"');
    let clean_port = mqtt_port.trim_matches('"');

    let broker_url = match (username, password) {
        (Some(u), Some(p)) if !u.is_empty() && !p.is_empty() => {
            format!("mqtt://{}:{}@{}:{}", u, p, clean_ip, clean_port)
        }
        _ => {
            format!("mqtt://{}:{}", clean_ip, clean_port)
        }
    };

    Ok(broker_url)
}
// #[tauri::command]
// fn get_mqtt_config(username: Option<String>, password: Option<String>) -> Result<String, String> {
//     // Load file .env để lấy IP và Port cố định của hệ thống
//     dotenv().ok();

//     let host_ip = env::var("HOST_IP")
//         .map_err(|_| "Không tìm thấy biến HOST_IP trong file .env".to_string())?;
//     let mqtt_port = env::var("MQTT_PORT")
//         .map_err(|_| "Không tìm thấy biến MQTT_PORT trong file .env".to_string())?;

//     let clean_ip = host_ip.trim_matches('"');
//     let clean_port = mqtt_port.trim_matches('"');

//     // Kiểm tra xem user có nhập tài khoản mật khẩu hay không
//     let broker_url = match (username, password) {
//         (Some(u), Some(p)) if !u.is_empty() && !p.is_empty() => {
//             // Nếu có nhập cả 2, ghép dạng: mqtt://user:pass@host:port
//             format!("mqtt://{}:{}@{}:{}", u, p, clean_ip, clean_port)
//         }
//         _ => {
//             // Nếu không nhập hoặc nhập thiếu, ghép dạng không có tài khoản: mqtt://host:port
//             format!("mqtt://{}:{}", clean_ip, clean_port)
//         }
//     };

//     Ok(broker_url)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_blec::init())
        .plugin(tauri_plugin_mqtt::init())
        .invoke_handler(tauri::generate_handler![
            api_request,
            get_mqtt_config
        ])
        .setup(|app| {

            // Khởi chạy file exe Next.js tự động
            // let _sidecar = app.shell()
            //     .sidecar("next-server")?
            //     .env("PORT", "3000") // Đổi port tùy ý tránh trùng port 3000
            //     .spawn()?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
