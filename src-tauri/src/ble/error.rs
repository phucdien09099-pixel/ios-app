use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum BleError {
    #[error("No Bluetooth adapter found")]
    NoAdapter,

    #[error("Device not found: {0}")]
    DeviceNotFound(String),

    #[error("Device not connected: {0}")]
    DeviceNotConnected(String),

    #[error("Characteristic not found: {0} (service: {1})")]
    CharacteristicNotFound(String, String),

    #[error("Service not found: {0}")]
    ServiceNotFound(String),

    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Connection timeout for device: {0}")]
    ConnectionTimeout(String),

    #[error("Scan timeout")]
    ScanTimeout,

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Invalid data: {0}")]
    InvalidData(String),

    #[error("Operation not supported: {0}")]
    Unsupported(String),

    #[error("Bluetooth disabled")]
    BluetoothDisabled,

    #[error("IO error: {0}")]
    IoError(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<btleplug::Error> for BleError {
    fn from(err: btleplug::Error) -> Self {
        BleError::Internal(err.to_string())
    }
}

pub type BleResult<T> = Result<T, BleError>;
