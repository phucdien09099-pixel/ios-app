use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::timeout;
use btleplug::api::{Central, Manager as ApiManager, Peripheral as BtlePeripheral, WriteType as BtWriteType};
use btleplug::platform::{Adapter, Peripheral, Manager};
use log::{info, debug};

use crate::ble::types::{
    ConnectionConfig, ConnectionState, WriteType,
};
use crate::ble::device::DeviceHandler;
use crate::ble::error::{BleResult, BleError};

pub struct ConnectionManager {
    adapter: Arc<Mutex<Option<Adapter>>>,
    devices: Arc<Mutex<HashMap<String, DeviceHandler>>>,
    config: ConnectionConfig,
}

impl ConnectionManager {
    pub fn new(config: Option<ConnectionConfig>) -> Self {
        Self {
            adapter: Arc::new(Mutex::new(None)),
            devices: Arc::new(Mutex::new(HashMap::new())),
            config: config.unwrap_or_default(),
        }
    }

    pub async fn init(&mut self) -> BleResult<()> {
        let manager = Manager::new().await?;
        let adapters = manager.adapters().await?;

        let adapter = adapters.into_iter().next().ok_or(BleError::NoAdapter)?;

        *self.adapter.lock().await = Some(adapter);

        info!("Connection manager initialized");
        Ok(())
    }

    pub async fn connect(&self, device_id: &str) -> BleResult<()> {
        let adapter_guard = self.adapter.lock().await;
        let adapter = adapter_guard.as_ref().ok_or(BleError::NoAdapter)?;

        // Find peripheral by address
        let peripherals = adapter.peripherals().await?;
        let peripheral = peripherals
            .into_iter()
            .find(|p| p.address().to_string() == device_id)
            .ok_or_else(|| BleError::DeviceNotFound(device_id.to_string()))?;

        // Create handler first, then release lock
        {
            let mut devices = self.devices.lock().await;
            let handler = devices
                .entry(device_id.to_string())
                .or_insert_with(|| DeviceHandler::new(device_id.to_string()));

            handler.update_state(ConnectionState::Connecting).await;
            handler.set_peripheral(peripheral.clone()).await;
        } // devices lock released here

        let connect_result = timeout(
            Duration::from_secs(self.config.connection_timeout_secs),
            peripheral.connect(),
        )
        .await;

        match connect_result {
            Ok(Ok(_)) => {
                info!("Connected to device: {}", device_id);
                let devices = self.devices.lock().await;
                if let Some(handler) = devices.get(device_id) {
                    handler.update_state(ConnectionState::Connected).await;
                }
                Ok(())
            }
            Ok(Err(e)) => {
                let devices = self.devices.lock().await;
                if let Some(handler) = devices.get(device_id) {
                    handler.update_state(ConnectionState::Disconnected).await;
                }
                Err(BleError::ConnectionFailed(e.to_string()))
            }
            Err(_) => {
                let devices = self.devices.lock().await;
                if let Some(handler) = devices.get(device_id) {
                    handler.update_state(ConnectionState::Disconnected).await;
                }
                Err(BleError::ConnectionTimeout(device_id.to_string()))
            }
        }
    }

    pub async fn disconnect(&self, device_id: &str) -> BleResult<()> {
        let mut devices = self.devices.lock().await;

        if let Some(handler) = devices.get(device_id) {
            handler.update_state(ConnectionState::Disconnecting).await;

            if let Some(peripheral) = handler.get_peripheral().await {
                let _ = peripheral.disconnect().await;
            }

            handler.update_state(ConnectionState::Disconnected).await;
            info!("Disconnected from device: {}", device_id);
        }

        devices.remove(device_id);

        Ok(())
    }

    pub async fn disconnect_all(&self) -> BleResult<()> {
        let devices = self.devices.lock().await;
        let device_ids: Vec<String> = devices.keys().cloned().collect();
        drop(devices);

        for device_id in device_ids {
            let _ = self.disconnect(&device_id).await;
        }

        Ok(())
    }

    pub async fn send_data(
        &self,
        device_id: &str,
        service_uuid: uuid::Uuid,
        characteristic_uuid: uuid::Uuid,
        data: Vec<u8>,
        write_type: WriteType,
    ) -> BleResult<()> {
        let devices = self.devices.lock().await;
        let handler = devices
            .get(device_id)
            .ok_or_else(|| BleError::DeviceNotConnected(device_id.to_string()))?;

        if !handler.is_connected().await {
            return Err(BleError::DeviceNotConnected(device_id.to_string()));
        }

        let peripheral = handler
            .get_peripheral()
            .await
            .ok_or_else(|| BleError::DeviceNotConnected(device_id.to_string()))?;

        let chars = peripheral.characteristics();
        let characteristic = chars
            .iter()
            .find(|c| c.service_uuid == service_uuid && c.uuid == characteristic_uuid)
            .ok_or_else(|| {
                BleError::CharacteristicNotFound(
                    characteristic_uuid.to_string(),
                    service_uuid.to_string(),
                )
            })?;

        let bt_write_type = match write_type {
            WriteType::WithResponse => BtWriteType::WithResponse,
            WriteType::WithoutResponse => BtWriteType::WithoutResponse,
        };

        peripheral.write(characteristic, &data, bt_write_type).await?;

        debug!("Sent {} bytes to device {}", data.len(), device_id);

        Ok(())
    }

    pub async fn read_data(
        &self,
        device_id: &str,
        service_uuid: uuid::Uuid,
        characteristic_uuid: uuid::Uuid,
    ) -> BleResult<Vec<u8>> {
        let devices = self.devices.lock().await;
        let handler = devices
            .get(device_id)
            .ok_or_else(|| BleError::DeviceNotConnected(device_id.to_string()))?;

        let peripheral = handler
            .get_peripheral()
            .await
            .ok_or_else(|| BleError::DeviceNotConnected(device_id.to_string()))?;

        let chars = peripheral.characteristics();
        let characteristic = chars
            .iter()
            .find(|c| c.service_uuid == service_uuid && c.uuid == characteristic_uuid)
            .ok_or_else(|| {
                BleError::CharacteristicNotFound(
                    characteristic_uuid.to_string(),
                    service_uuid.to_string(),
                )
            })?;

        let value = peripheral.read(characteristic).await?;

        debug!("Read {} bytes from device {}", value.len(), device_id);

        Ok(value)
    }

    pub async fn is_connected(&self, device_id: &str) -> bool {
        let devices = self.devices.lock().await;
        if let Some(handler) = devices.get(device_id) {
            handler.is_connected().await
        } else {
            false
        }
    }

    pub async fn get_connected_devices(&self) -> Vec<String> {
        let devices = self.devices.lock().await;
        let mut connected = Vec::new();
        for (id, handler) in devices.iter() {
            if handler.is_connected().await {
                connected.push(id.clone());
            }
        }
        connected
    }
}
