use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::ble::error::BleResult;
use crate::ble::types::{BleDevice, ScanFilter, ConnectionConfig, WriteType};
use crate::ble::scanner::BleScanner;
use crate::ble::connection::ConnectionManager;
use uuid::Uuid;

pub struct BleManager {
    scanner: Arc<Mutex<BleScanner>>,
    connection_manager: Arc<ConnectionManager>,
}

impl BleManager {
    pub async fn new(config: Option<ConnectionConfig>) -> BleResult<Self> {
        let mut scanner = BleScanner::new();
        scanner.init().await?;

        let mut connection_manager = ConnectionManager::new(config);
        connection_manager.init().await?;

        Ok(Self {
            scanner: Arc::new(Mutex::new(scanner)),
            connection_manager: Arc::new(connection_manager),
        })
    }

    pub async fn scan(
        &self,
        duration_secs: u64,
        filter: Option<ScanFilter>,
    ) -> BleResult<Vec<BleDevice>> {
        let mut scanner = self.scanner.lock().await;
        scanner.scan(duration_secs, filter).await
    }

    pub async fn connect(&self, device_id: &str) -> BleResult<()> {
        self.connection_manager.connect(device_id).await
    }

    pub async fn disconnect(&self, device_id: &str) -> BleResult<()> {
        self.connection_manager.disconnect(device_id).await
    }

    pub async fn disconnect_all(&self) -> BleResult<()> {
        self.connection_manager.disconnect_all().await
    }

    pub async fn send_data(
        &self,
        device_id: &str,
        service_uuid: Uuid,
        characteristic_uuid: Uuid,
        data: Vec<u8>,
        write_type: WriteType,
    ) -> BleResult<()> {
        self.connection_manager
            .send_data(device_id, service_uuid, characteristic_uuid, data, write_type)
            .await
    }

    pub async fn read_data(
        &self,
        device_id: &str,
        service_uuid: Uuid,
        characteristic_uuid: Uuid,
    ) -> BleResult<Vec<u8>> {
        self.connection_manager
            .read_data(device_id, service_uuid, characteristic_uuid)
            .await
    }

    pub async fn send_to_multiple(
        &self,
        device_ids: &[String],
        service_uuid: Uuid,
        characteristic_uuid: Uuid,
        data: Vec<u8>,
        write_type: WriteType,
    ) -> HashMap<String, BleResult<()>> {
        let mut results = HashMap::new();

        for device_id in device_ids {
            let result = self
                .send_data(device_id, service_uuid, characteristic_uuid, data.clone(), write_type)
                .await;
            results.insert(device_id.clone(), result);
        }

        results
    }

    pub async fn is_connected(&self, device_id: &str) -> bool {
        self.connection_manager.is_connected(device_id).await
    }

    pub async fn get_connected_devices(&self) -> Vec<String> {
        self.connection_manager.get_connected_devices().await
    }
}
