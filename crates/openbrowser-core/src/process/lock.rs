use crate::error::{CoreError, Result};
use std::fs::File;
use std::path::{Path, PathBuf};

pub trait ProcessLock: Send + Sync {
    /// Attempt to acquire an exclusive non-blocking lock on the target file
    fn try_lock(&mut self) -> Result<bool>;

    /// Release the file lock
    fn unlock(&mut self) -> Result<()>;

    /// File path being locked
    fn path(&self) -> &Path;
}

pub struct FileLock {
    path: PathBuf,
    file: Option<File>,
    locked: bool,
}

impl FileLock {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self {
            path: path.into(),
            file: None,
            locked: false,
        }
    }
}

#[cfg(unix)]
impl ProcessLock for FileLock {
    fn try_lock(&mut self) -> Result<bool> {
        use std::os::unix::io::AsRawFd;

        if self.locked {
            return Ok(true);
        }

        // Open non-truncating with read/write to preserve existing content
        let file = std::fs::OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(&self.path)
            .map_err(|e| {
                CoreError::ProcessLock(format!("Failed to open lock file {:?}: {}", self.path, e))
            })?;

        let fd = file.as_raw_fd();
        let ret = unsafe { libc::flock(fd, libc::LOCK_EX | libc::LOCK_NB) };
        if ret == 0 {
            self.file = Some(file);
            self.locked = true;
            Ok(true)
        } else {
            let err = std::io::Error::last_os_error();
            if err.raw_os_error() == Some(libc::EWOULDBLOCK)
                || err.raw_os_error() == Some(libc::EAGAIN)
            {
                Ok(false)
            } else {
                Err(CoreError::ProcessLock(format!(
                    "flock failed on {:?}: {}",
                    self.path, err
                )))
            }
        }
    }

    fn unlock(&mut self) -> Result<()> {
        use std::os::unix::io::AsRawFd;

        if let Some(file) = self.file.take() {
            let fd = file.as_raw_fd();
            let ret = unsafe { libc::flock(fd, libc::LOCK_UN) };
            self.locked = false;
            if ret != 0 {
                let err = std::io::Error::last_os_error();
                return Err(CoreError::ProcessLock(format!(
                    "flock unlock failed on {:?}: {}",
                    self.path, err
                )));
            }
        }
        Ok(())
    }

    fn path(&self) -> &Path {
        &self.path
    }
}

#[cfg(windows)]
impl ProcessLock for FileLock {
    fn try_lock(&mut self) -> Result<bool> {
        use std::os::windows::io::AsRawHandle;
        use windows_sys::Win32::Storage::FileSystem::{
            LockFileEx, LOCKFILE_EXCLUSIVE_LOCK, LOCKFILE_FAIL_IMMEDIATELY,
        };

        if self.locked {
            return Ok(true);
        }

        // Non-truncating open with shared read/write support
        let file = match std::fs::OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(&self.path)
        {
            Ok(f) => f,
            Err(e) if e.raw_os_error() == Some(32) => {
                // ERROR_SHARING_VIOLATION: another process has the file opened exclusively
                return Ok(false);
            }
            Err(e) => {
                return Err(CoreError::ProcessLock(format!(
                    "Failed to open lock file {:?}: {}",
                    self.path, e
                )));
            }
        };

        let handle = file.as_raw_handle() as windows_sys::Win32::Foundation::HANDLE;
        let mut overlapped: windows_sys::Win32::System::IO::OVERLAPPED =
            unsafe { std::mem::zeroed() };

        let ret = unsafe {
            LockFileEx(
                handle,
                LOCKFILE_EXCLUSIVE_LOCK | LOCKFILE_FAIL_IMMEDIATELY,
                0,
                // Whole-file lock: u32::MAX in both low and high halves. The
                // old [0,1) range locked a single byte, so a second process
                // opening the file could LockFileEx bytes [1,2) and both
                // believed they held the single-instance guard — semantics
                // Unix flock (whole file) never had. Windows permits byte
                // ranges beyond EOF for exactly this purpose.
                u32::MAX,
                u32::MAX,
                &mut overlapped,
            )
        };

        if ret != 0 {
            self.file = Some(file);
            self.locked = true;
            Ok(true)
        } else {
            let err = std::io::Error::last_os_error();
            // ERROR_LOCK_VIOLATION = 33
            if err.raw_os_error() == Some(33) {
                Ok(false)
            } else {
                Err(CoreError::ProcessLock(format!(
                    "LockFileEx failed on {:?}: {}",
                    self.path, err
                )))
            }
        }
    }

    fn unlock(&mut self) -> Result<()> {
        use std::os::windows::io::AsRawHandle;
        use windows_sys::Win32::Storage::FileSystem::UnlockFileEx;

        if let Some(file) = self.file.take() {
            let handle = file.as_raw_handle() as windows_sys::Win32::Foundation::HANDLE;
            let mut overlapped: windows_sys::Win32::System::IO::OVERLAPPED =
                unsafe { std::mem::zeroed() };
            self.locked = false;
            // Propagate like the Unix path (:80-86): a failed unlock leaves
            // the byte range locked behind us (handle close may or may not
            // release it), which the caller must hear about instead of a
            // bogus Ok(()). The range mirrors the whole-file LockFileEx above.
            let ret = unsafe { UnlockFileEx(handle, 0, u32::MAX, u32::MAX, &mut overlapped) };
            if ret == 0 {
                let err = std::io::Error::last_os_error();
                return Err(CoreError::ProcessLock(format!(
                    "UnlockFileEx failed on {:?}: {}",
                    self.path, err
                )));
            }
        }
        Ok(())
    }

    fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for FileLock {
    fn drop(&mut self) {
        let _ = self.unlock();
    }
}
