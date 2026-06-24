use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use reqwest::Response;
use serde_json::Value;

async fn parse_response(response: Response) -> Result<Value, String> {
    let status = response.status();
    let body = response.text().await.map_err(|error| error.to_string())?;

    if !status.is_success() {
        let message = serde_json::from_str::<Value>(&body)
            .ok()
            .and_then(|json| json.get("message").and_then(Value::as_str).map(str::to_owned))
            .unwrap_or_else(|| {
                if body.trim().is_empty() {
                    status.canonical_reason().unwrap_or("Request failed").to_string()
                } else {
                    body
                }
            });
        return Err(format!("HTTP {}: {}", status.as_u16(), message));
    }

    if body.trim().is_empty() {
        return Ok(Value::Null);
    }

    serde_json::from_str(&body)
        .map_err(|error| format!("HTTP {} returned invalid JSON: {}", status.as_u16(), error))
}

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
    parse_response(response).await
}

// 🔵 READ (GET)
pub async fn get(url: &str, session_token: Option<String>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client.get(url)
        .headers(create_headers(session_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    parse_response(response).await
}

// 🟡 UPDATE (PUT)
pub async fn put(url: &str, session_token: Option<String>, body: Option<Value>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let mut request = client.put(url).headers(create_headers(session_token));

    if let Some(b) = body {
        request = request.json(&b);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;
    parse_response(response).await
}

// 🔴 DELETE (DELETE)
pub async fn delete(url: &str, session_token: Option<String>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client.delete(url)
        .headers(create_headers(session_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    parse_response(response).await
}
