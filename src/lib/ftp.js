import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';

// Lấy thư mục gốc từ biến môi trường
export const getBasePath = () => {
    return process.env.UPLOAD_DIR;
};

// Quản lý phiên bản tự động
async function backupExistingFile(fullPath) {
    try {
        await fs.access(fullPath); // Kiểm tra file tồn tại
        const ext = path.extname(fullPath);
        const dir = path.dirname(fullPath);
        const name = path.basename(fullPath, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const basePath = getBasePath();

        // Tính đường dẫn tương đối của thư mục chứa file gốc
        const relativeDir = path.relative(basePath, dir);

        // Gom thư mục .history về 1 mối ở thư mục gốc
        const historyDir = path.join(basePath, '.history', relativeDir);
        await fs.mkdir(historyDir, { recursive: true });

        const backupPath = path.join(historyDir, `${name}_v${timestamp}${ext}`);
        await fs.rename(fullPath, backupPath); // Đẩy file cũ vào lịch sử
    } catch (e) {
        // File không tồn tại, bỏ qua
    }
}

/**
 * Lấy danh sách toàn bộ file đệ quy từ thư mục local
 */
export async function listAllFilesFtp() {
    const basePath = getBasePath();
    const allFiles = [];

    async function scanDir(currentPath, hospitalName = "Tài Liệu Gốc") {
        let entries;
        try {
            entries = await fs.readdir(currentPath, { withFileTypes: true });
        } catch (error) {
            console.error("Lỗi đọc thư mục:", currentPath, error);
            return;
        }

        for (const item of entries) {
            if (item.name.startsWith('~$') || item.name === 'desktop.ini' || item.name === '.history') continue;

            const absolutePath = path.join(currentPath, item.name);

            // Tính toán path tương đối để trả về cho UI
            let relativePath = path.relative(basePath, absolutePath).split(path.sep).join('/');

            if (item.isDirectory()) {
                // Nếu đang ở root, folder này là "Hospital"
                const nextHospital = currentPath === basePath ? item.name : hospitalName;
                
                try {
                   const stat = await fs.stat(absolutePath);
                   allFiles.push({
                       name: item.name,
                       path: relativePath,
                       hospital: hospitalName,
                       isDirectory: true,
                       updatedAt: stat.mtime
                   });
                } catch(e) {}
                
                await scanDir(absolutePath, nextHospital);
            } else {
                try {
                    const stat = await fs.stat(absolutePath);
                    allFiles.push({
                        name: item.name,
                        path: relativePath,
                        hospital: hospitalName,
                        isDirectory: false,
                        size: stat.size,
                        updatedAt: stat.mtime
                    });
                } catch (e) {
                    console.error("Lỗi đọc file stat:", absolutePath, e);
                }
            }
        }
    }

    try {
        await scanDir(basePath);
        return allFiles;
    } catch (error) {
        console.error("Lỗi quét file đệ quy:", error);
        return [];
    }
}

/**
 * Lấy Stream file từ Local
 */
export async function getFtpStream(remotePath) {
    const fullPath = path.join(getBasePath(), remotePath);
    const stream = createReadStream(fullPath);
    return { ftp: { end: () => { } }, stream };
}

/**
 * Lấy Buffer file từ Local
 */
export async function getFileBufferFtp(remotePath) {
    const fullPath = path.join(getBasePath(), remotePath);
    const buffer = await fs.readFile(fullPath);
    return buffer;
}

/**
 * Tải file lên Local
 */
export async function uploadToFtp(localBuffer, remoteFileName, hospital, type) {
    try {
        const basePath = getBasePath();
        const hospitalDir = hospital === '_chung' ? "_chung" : hospital;

        // Cấu trúc thư mục sinh tự động: [hospital]/[Năm]/[Tháng]/[Loại]
        const d = new Date();
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const targetDirPath = path.join(basePath, hospitalDir, year, month, type);

        await fs.mkdir(targetDirPath, { recursive: true });

        const fullPath = path.join(targetDirPath, remoteFileName);

        // Backup nếu file trùng tên
        await backupExistingFile(fullPath);

        await fs.writeFile(fullPath, localBuffer);
        return path.relative(basePath, fullPath).split(path.sep).join('/');
    } catch (error) {
        console.error("Lỗi upload file:", error);
        throw error;
    }
}

/**
 * Xóa file khỏi Local
 */
export async function deleteFromFtp(remotePath) {
    try {
        const fullPath = path.join(getBasePath(), remotePath);
        await backupExistingFile(fullPath); // Dùng cơ chế backup thay vì xóa vĩnh viễn (soft delete)
        return true;
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error("Lỗi xóa file:", error);
            throw error;
        }
        return true;
    }
}

/**
 * Lưu đè nội dung Buffer lên Local
 */
export async function saveToFtp(buffer, remotePath) {
    try {
        const fullPath = path.join(getBasePath(), remotePath);

        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        // Quản lý phiên bản tự động khi lưu (editor)
        await backupExistingFile(fullPath);

        await fs.writeFile(fullPath, buffer);
        return true;
    } catch (error) {
        console.error("Lỗi lưu file:", error);
        throw error;
    }
}
