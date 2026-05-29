use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct BleDevice {
    pub id: String,
    pub address: String,
    pub name: Option<String>,
    pub rssi: Option<i16>,
    pub tx_power: Option<i16>,
    pub manufacturer_data: HashMap<u16, Vec<u8>>,
    pub service_uuids: Vec<Uuid>,
    pub service_data: HashMap<Uuid, Vec<u8>>,
    pub connectable: bool,
    pub last_seen: DateTime<Utc>,
}

impl BleDevice {
    pub fn new(id: String, address: String) -> Self {
        Self {
            id,
            address,
            name: None,
            rssi: None,
            tx_power: None,
            manufacturer_data: HashMap::new(),
            service_uuids: Vec::new(),
            service_data: HashMap::new(),
            connectable: true,
            last_seen: Utc::now(),
        }
    }

    pub fn has_name(&self) -> bool {
        self.name.is_some()
    }

    pub fn get_display_name(&self) -> String {
        self.name.clone().unwrap_or_else(|| self.address.clone())
    }
}

#[derive(Debug, Clone)]
pub struct BleDeviceInfo {
    pub device_id: String,
    pub name: Option<String>,
    pub rssi: Option<i16>,
    pub services: Vec<ServiceInfo>,
}

#[derive(Debug, Clone)]
pub struct ServiceInfo {
    pub uuid: Uuid,
    pub characteristics: Vec<CharacteristicInfo>,
}

#[derive(Debug, Clone)]
pub struct CharacteristicInfo {
    pub uuid: Uuid,
    pub properties: CharacteristicProperties,
}

#[derive(Debug, Clone)]
pub struct CharacteristicProperties {
    pub read: bool,
    pub write: bool,
    pub write_without_response: bool,
    pub notify: bool,
    pub indicate: bool,
}

#[derive(Debug, Clone)]
pub struct ConnectionConfig {
    pub connection_timeout_secs: u64,
    pub discover_services_timeout_secs: u64,
    pub auto_reconnect: bool,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
}

impl Default for ConnectionConfig {
    fn default() -> Self {
        Self {
            connection_timeout_secs: 10,
            discover_services_timeout_secs: 5,
            auto_reconnect: false,
            max_retries: 3,
            retry_delay_ms: 1000,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WriteType {
    WithResponse,
    WithoutResponse,
}

impl From<WriteType> for btleplug::api::WriteType {
    fn from(wt: WriteType) -> Self {
        match wt {
            WriteType::WithResponse => btleplug::api::WriteType::WithResponse,
            WriteType::WithoutResponse => btleplug::api::WriteType::WithoutResponse,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ScanFilter {
    pub service_uuids: Vec<Uuid>,
    pub name_prefix: Option<String>,
    pub min_rssi: Option<i16>,
    pub max_devices: Option<usize>,
}

impl Default for ScanFilter {
    fn default() -> Self {
        Self {
            service_uuids: Vec::new(),
            name_prefix: None,
            min_rssi: None,
            max_devices: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct DataPacket {
    pub device_id: String,
    pub service_uuid: Uuid,
    pub characteristic_uuid: Uuid,
    pub data: Vec<u8>,
    pub timestamp: DateTime<Utc>,
    pub write_type: WriteType,
}

impl DataPacket {
    pub fn new(
        device_id: String,
        service_uuid: Uuid,
        characteristic_uuid: Uuid,
        data: Vec<u8>,
        write_type: WriteType,
    ) -> Self {
        Self {
            device_id,
            service_uuid,
            characteristic_uuid,
            data,
            timestamp: Utc::now(),
            write_type,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Reconnecting,
}

#[derive(Debug, Clone)]
pub struct Notification {
    pub device_id: String,
    pub service_uuid: Uuid,
    pub characteristic_uuid: Uuid,
    pub value: Vec<u8>,
    pub timestamp: DateTime<Utc>,
}
