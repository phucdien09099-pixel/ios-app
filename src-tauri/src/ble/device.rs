use std::sync::Arc;
use tokio::sync::Mutex;
use btleplug::platform::Peripheral;
use crate::ble::types::{ConnectionState, ServiceInfo, CharacteristicInfo};

pub struct DeviceHandler {
    pub device_id: String,
    peripheral: Arc<Mutex<Option<Peripheral>>>,
    state: Arc<Mutex<ConnectionState>>,
    services: Arc<Mutex<Vec<ServiceInfo>>>,
}

impl DeviceHandler {
    pub fn new(device_id: String) -> Self {
        Self {
            device_id,
            peripheral: Arc::new(Mutex::new(None)),
            state: Arc::new(Mutex::new(ConnectionState::Disconnected)),
            services: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub async fn set_peripheral(&self, peripheral: Peripheral) {
        let mut p = self.peripheral.lock().await;
        *p = Some(peripheral);
    }

    pub async fn get_peripheral(&self) -> Option<Peripheral> {
        let p = self.peripheral.lock().await;
        p.clone()
    }

    pub async fn update_state(&self, state: ConnectionState) {
        let mut s = self.state.lock().await;
        *s = state;
    }

    pub async fn get_state(&self) -> ConnectionState {
        *self.state.lock().await
    }

    pub async fn is_connected(&self) -> bool {
        matches!(*self.state.lock().await, ConnectionState::Connected)
    }

    pub async fn update_services(&self, services: Vec<ServiceInfo>) {
        let mut s = self.services.lock().await;
        *s = services;
    }

    pub async fn get_services(&self) -> Vec<ServiceInfo> {
        self.services.lock().await.clone()
    }

    pub async fn find_characteristic(
        &self,
        service_uuid: &uuid::Uuid,
        characteristic_uuid: &uuid::Uuid,
    ) -> Option<(ServiceInfo, CharacteristicInfo)> {
        let services = self.services.lock().await;
        for service in services.iter() {
            if service.uuid == *service_uuid {
                for char in &service.characteristics {
                    if char.uuid == *characteristic_uuid {
                        return Some((service.clone(), char.clone()));
                    }
                }
            }
        }
        None
    }
}

impl Clone for DeviceHandler {
    fn clone(&self) -> Self {
        Self {
            device_id: self.device_id.clone(),
            peripheral: self.peripheral.clone(),
            state: self.state.clone(),
            services: self.services.clone(),
        }
    }
}
