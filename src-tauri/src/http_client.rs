use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::Value;

// Hàm bổ trợ để tạo Header chứa Session Token
fn create_headers(session_token: Option<String>) -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    if let Some(token) = session_token {
        // Hỗ trợ định dạng "Bearer <token>". Nếu API của bạn chỉ cần truyền token thô, hãy sửa lại dòng này
        if let Ok(auth_value) = HeaderValue::from_str(&format!("Bearer {}", token)) {
            headers.insert(AUTHORIZATION, auth_value);
        }
    }
    headers
}

// 🟢 CREATE (POST)
pub async fn post(url: &str, session_token: Option<String>, body: Option<Value>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let mut request = client.post(url).headers(create_headers(session_token));

    if let Some(b) = body {
        request = request.json(&b);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;
    let json_res = response.json::<Value>().await.map_err(|e| e.to_string())?;
    Ok(json_res)
}

// 🔵 READ (GET)
pub async fn get(url: &str, session_token: Option<String>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client.get(url)
        .headers(create_headers(session_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json_res = response.json::<Value>().await.map_err(|e| e.to_string())?;
    Ok(json_res)
}

// 🟡 UPDATE (PUT)
pub async fn put(url: &str, session_token: Option<String>, body: Option<Value>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let mut request = client.put(url).headers(create_headers(session_token));

    if let Some(b) = body {
        request = request.json(&b);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;
    let json_res = response.json::<Value>().await.map_err(|e| e.to_string())?;
    Ok(json_res)
}

// 🔴 DELETE (DELETE)
pub async fn delete(url: &str, session_token: Option<String>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client.delete(url)
        .headers(create_headers(session_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json_res = response.json::<Value>().await.map_err(|e| e.to_string())?;
    Ok(json_res)
}
