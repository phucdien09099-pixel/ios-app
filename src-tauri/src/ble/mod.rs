//! BLE Module for cross-platform Bluetooth Low Energy operations

pub mod error;
pub mod types;
pub mod device;
pub mod scanner;
pub mod connection;
pub mod manager;

// Re-export commonly used types
pub use error::BleError;
pub use types::{
    BleDevice,
    ConnectionConfig,
    WriteType,
    ScanFilter,
    ConnectionState,
};
pub use manager::BleManager;
