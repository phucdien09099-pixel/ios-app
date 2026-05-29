use std::collections::HashMap;
use std::time::Duration;
use futures::stream::StreamExt;
use btleplug::api::{Central, Manager as ApiManager, ScanFilter as BtScanFilter, Peripheral as BtlePeripheral};
use btleplug::platform::{Adapter, Manager, Peripheral};
use log::info;
use chrono::Utc;

use crate::ble::types::{BleDevice, ScanFilter};
use crate::ble::error::{BleResult, BleError};

pub struct BleScanner {
    adapter: Option<Adapter>,
    discovered_devices: HashMap<String, BleDevice>,
}

impl BleScanner {
    pub fn new() -> Self {
        Self {
            adapter: None,
            discovered_devices: HashMap::new(),
        }
    }

    pub async fn init(&mut self) -> BleResult<()> {
        let manager = Manager::new().await?;
        let adapters = manager.adapters().await?;

        self.adapter = adapters.into_iter().next();

        if self.adapter.is_none() {
            return Err(BleError::NoAdapter);
        }

        info!("Scanner initialized with Bluetooth adapter");
        Ok(())
    }

    pub async fn scan(
        &mut self,
        duration_secs: u64,
        filter: Option<ScanFilter>,
    ) -> BleResult<Vec<BleDevice>> {
        let adapter = self.adapter.as_ref().ok_or(BleError::NoAdapter)?;

        self.discovered_devices.clear();

        let mut bt_filter = BtScanFilter::default();
        if let Some(f) = &filter {
            bt_filter.services = f.service_uuids.clone();
        }

        adapter.start_scan(bt_filter).await?;
        info!("Scanning for BLE devices for {} seconds...", duration_secs);

        let mut events = adapter.events().await?;
        let start_time = tokio::time::Instant::now();
        let scan_duration = Duration::from_secs(duration_secs);

        while start_time.elapsed() < scan_duration {
            tokio::select! {
                Some(event) = events.next() => {
                    match event {
                        btleplug::api::CentralEvent::DeviceDiscovered(id) => {
                            // peripheral() returns Peripheral directly, not Option
                            let peripheral = adapter.peripheral(&id).await?;
                            if let Ok(device) = Self::process_peripheral(&peripheral).await {
                                if Self::matches_filter(&device, &filter) {
                                    self.discovered_devices.insert(device.id.clone(), device);

                                    if let Some(max_devices) = filter.as_ref().and_then(|f| f.max_devices) {
                                        if self.discovered_devices.len() >= max_devices {
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        btleplug::api::CentralEvent::DeviceUpdated(id) => {
                            // peripheral() returns Peripheral directly, not Option
                            let peripheral = adapter.peripheral(&id).await?;
                            if let Ok(device) = Self::process_peripheral(&peripheral).await {
                                if Self::matches_filter(&device, &filter) {
                                    self.discovered_devices.insert(device.id.clone(), device);
                                }
                            }
                        }
                        _ => {}
                    }
                }
                _ = tokio::time::sleep(Duration::from_millis(100)) => {}
            }
        }

        adapter.stop_scan().await?;

        let devices: Vec<BleDevice> = self.discovered_devices.values().cloned().collect();
        info!("Scan complete. Found {} devices", devices.len());

        for device in &devices {
            info!("Device: {:?} - RSSI: {:?} - ID: {}", device.name, device.rssi, device.id);
        }
        Ok(devices)
    }

    async fn process_peripheral(peripheral: &Peripheral) -> BleResult<BleDevice> {
        let properties = peripheral.properties().await?;
        let address = peripheral.address();

        let device_id = address.to_string();
        let address_str = address.to_string();
        let name = properties.as_ref().and_then(|p| p.local_name.clone());
        let rssi = properties.as_ref().and_then(|p| p.rssi);

        let mut device = BleDevice::new(device_id, address_str);
        device.name = name;
        device.rssi = rssi;
        device.last_seen = Utc::now();

        if let Some(props) = properties {
            device.tx_power = props.tx_power_level;
            device.manufacturer_data = props.manufacturer_data;
            device.service_uuids = props.services;
            device.service_data = props.service_data;
            device.connectable = true; // Set default as true
        }

        Ok(device)
    }

    fn matches_filter(device: &BleDevice, filter: &Option<ScanFilter>) -> bool {
        if let Some(f) = filter {
            if let Some(name_prefix) = &f.name_prefix {
                if let Some(device_name) = &device.name {
                    if !device_name.starts_with(name_prefix) {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            if let Some(min_rssi) = f.min_rssi {
                if let Some(rssi) = device.rssi {
                    if rssi < min_rssi {
                        return false;
                    }
                }
            }
        }
        true
    }

    pub fn get_discovered_devices(&self) -> Vec<BleDevice> {
        self.discovered_devices.values().cloned().collect()
    }

    pub fn clear_devices(&mut self) {
        self.discovered_devices.clear();
    }
}

impl Default for BleScanner {
    fn default() -> Self {
        Self::new()
    }
}
