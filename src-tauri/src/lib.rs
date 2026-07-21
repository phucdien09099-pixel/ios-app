use serde_json::Value;

mod http_client;

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
        "PATCH" => http_client::patch(&url, session_token, body).await,
        "DELETE" => http_client::delete(&url, session_token).await,
        _ => Err("Method không hợp lệ (Chỉ hỗ trợ GET, POST, PUT, PATCH, DELETE)".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_blec::init());

    #[cfg(target_os = "android")]
    let builder = builder.plugin(tauri_plugin_fcm::init());

    builder
        .invoke_handler(tauri::generate_handler![api_request])
        .setup(|app| {
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
